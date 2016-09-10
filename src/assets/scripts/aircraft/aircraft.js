import AircraftConflict from './AircraftConflict';
import AircraftModel from './AircraftModel';
import AircraftFlightManagementSystem from './AircraftFlightManagementSystem';
import { distance2d } from '../math/distance';
import {
    vlen,
    vradial,
    vsub
} from '../math/vector';
import {
    kn_ms,
    radiansToDegrees,
    degreesToRadians
} from '../utilities/unitConverters';
import { calcTurnInitiationDistance } from '../math/flightMath';

/**
 * Main entry point for the aircraft object.
 *
 */
// TODO: remove window instances
window.zlsa.atc.Conflict = AircraftConflict;
window.zlsa.atc.AircraftFlightManagementSystem = AircraftFlightManagementSystem;

/**
 *
 * @function aircraft_init_pre
 * @param aircraft_init_pre
 */
const aircraft_init_pre = () => {
    prop.aircraft = {};
    prop.aircraft.models = {};
    prop.aircraft.callsigns = [];
    prop.aircraft.list = [];
    prop.aircraft.current = null;
    prop.aircraft.auto = {
        enabled: false
    };
};

/**
 * @function aircraft_auto_toggle
 */
const aircraft_auto_toggle = () => {
    prop.aircraft.auto.enabled = !prop.aircraft.auto.enabled;
};

/**
 * @function aircraft_auto_toggle
 * @param airline_name {string}
 * @return {string}
 */
const aircraft_generate_callsign = (airline_name) => {
    const airline = airline_get(airline_name);

    if (!airline) {
        console.warn(`Airline not found: ${airline_name}`);

        return `airline-${airline_name}-not-found`;
    }

    return airline.generateFlightNumber();
};

/**
 * @function aircraft_callsign_new
 * @param airline {string}
 * @raturn callsign {string}
 */
const aircraft_callsign_new = (airline) => {
    // TODO: the logic needs work here. if `callsign` is always initialized as null, one would imagine that
    // this function would always result in the creation of a callsign?
    let callsign = null;

    // TODO: is this while loop needed? there may be a cleaner way to accomplish this.
    while (true) {
        callsign = aircraft_generate_callsign(airline);

        if (prop.aircraft.callsigns.indexOf(callsign) === -1) {
            break;
        }
    }

    // FIXME: this is a global object and needs to be localized
    prop.aircraft.callsigns.push(callsign);

    return callsign;
};

// TODO: is this actually an `aircraft_new` or a `flight_new`?
/**
 * @function aircraft_new
 * @param options
 * @return
 */
const aircraft_new = (options) => {
    const airline = airline_get(options.airline);

    return airline.generateAircraft(options);
};

/**
 * @function aircraft_get_nearest
 * @param position {array}
 * @return {array}
 */
const aircraft_get_nearest = (position) => {
    let nearest = null;
    let distance = Infinity;

    for (let i = 0; i < prop.aircraft.list.length; i++) {
        const aircraft = prop.aircraft.list[i];
        const d = distance2d(aircraft.position, position);

        if (d < distance && aircraft.isVisible() && !aircraft.hit) {
            distance = d;
            nearest = i;
        }
    }

    return [prop.aircraft.list[nearest], distance];
};

/**
 * @function aircraft_add
 * @param model {AircraftModel}
 */
const aircraft_add = (model) => {
    prop.aircraft.models[model.icao.toLowerCase()] = model;
};

/**
 * @function aircraft_visible
 * @param aircraft
 * @param factor {number}
 * @return
 */
const aircraft_visible = (aircraft, factor = 1) => (vlen(aircraft.position) < airport_get().ctr_radius * factor);

/**
 * @function aircraft_remove_all
 */
const aircraft_remove_all = () => {
    for (let i = 0; i < prop.aircraft.list.length; i++) {
        prop.aircraft.list[i].cleanup();
    }

    prop.aircraft.list = [];
};

/**
 * @function aircraft_update
 */
const aircraft_update = () => {
    // for (let i=0; i < prop.aircraft.list.length; i++) {
    //     prop.aircraft.list[i].update();
    // }

    for (let i = 0; i < prop.aircraft.list.length; i++) {
        prop.aircraft.list[i].update();
        prop.aircraft.list[i].updateWarning();

        // TODO: move this InnerLoop thing to a function so we can get rid of the continue InnerLoop thing.
        for (let j = i + 1; j < prop.aircraft.list.length; j++) {
            // TODO: need better names here. what is `that`?  what is `other`?
            const aircraft = prop.aircraft.list[i];
            const otherAircraft = prop.aircraft.list[j];

            if (aircraft.checkConflict(otherAircraft)) {
                continue;
            }

            // Fast 2D bounding box check, there are no conflicts over 8nm apart (14.816km)
            // no violation can occur in this case.
            // Variation of:
            // http://gamedev.stackexchange.com/questions/586/what-is-the-fastest-way-to-work-out-2d-bounding-box-intersection
            const dx = Math.abs(aircraft.position[0] - otherAircraft.position[0]);
            const dy = Math.abs(aircraft.position[1] - otherAircraft.position[1]);

            // TODO: move this value to a constant
            // TODO: this if/else doesn't make sense
            if ((dx > 14.816) || (dy > 14.816)) {
                continue;
            } else {
                // TODO: this should go somewhere and not just be instantiated
                new AircraftConflict(aircraft, otherAircraft);
            }
        }
    }

    for (let i = prop.aircraft.list.length - 1; i >= 0; i--) {
        let remove = false;
        const aircraft = prop.aircraft.list[i];
        // let is_visible = aircraft_visible(aircraft);

        if (aircraft.isStopped() && aircraft.category === 'arrival') {
            prop.game.score.windy_landing += aircraft.scoreWind('landed');

            ui_log(`${aircraft.getCallsign()} switching to ground, good day`);
            speech_say([
                { type: 'callsign', content: aircraft },
                { type: 'text', content: ', switching to ground, good day' }
            ]);

            prop.game.score.arrival += 1;
            remove = true;
        }

        if (aircraft.hit && aircraft.isLanded()) {
            ui_log(`Lost radar contact with ${aircraft.getCallsign()}`);
            speech_say([
                { type: 'callsign', content: aircraft },
                { type: 'text', content: ', radar contact lost' }
            ]);

            remove = true;
        }

        // Clean up the screen from aircraft that are too far
        if (
            (!aircraft_visible(aircraft, 2) && !aircraft.inside_ctr) &&
            aircraft.fms.currentWaypoint().navmode === 'heading'
        ) {
            if (aircraft.category === 'arrival' || aircraft.category === 'departure') {
                remove = true;
            }
        }

        if (remove) {
            aircraft_remove(aircraft);
            i -= 1;
        }
    }
};

/**
 * Calculate the turn initiation distance for an aircraft to navigate between two fixes.
 * References:
 * - http://www.ohio.edu/people/uijtdeha/ee6900_fms_00_overview.pdf, Fly-by waypoint
 * - The Avionics Handbook, ch 15
 *
 * @function aircraft_turn_initiation_distance
 * @param aircraft {AircraftInstanceModel}
 * @param fix
 * @return {number}
 */
// TODO: this function is ripe for refactor. there is a lot of inline logic that can be abstracted
const aircraft_turn_initiation_distance = (aircraft, fix) => {
    const index = aircraft.fms.indexOfCurrentWaypoint().wp;
    if (index >= aircraft.fms.waypoints().length - 1) {
        // if there are no subsequent fixes, fly over 'fix'
        return 0;
    }

    // convert knots to m/s
    const speed = kn_ms(aircraft.speed);
    // assume nominal bank angle of 25 degrees for all aircraft
    const bank_angle = degreesToRadians(25);

    // TODO: is there a getNextWaypoint() function?
    const nextfix = aircraft.fms.waypoint(aircraft.fms.indexOfCurrentWaypoint().wp + 1).location;
    if (!nextfix) {
        return 0;
    }

    let nominal_new_course = vradial(vsub(nextfix, fix));
    if (nominal_new_course < 0) {
        // TODO: what is this doing? this should go in a new method.
        nominal_new_course += Math.PI * 2;
    }

    let current_heading = aircraft.heading;
    if (current_heading < 0) {
        current_heading += Math.PI * 2;
    }

    // TODO: move to function
    let course_change = Math.abs(radiansToDegrees(current_heading) - radiansToDegrees(nominal_new_course));
    if (course_change > 180) {
        course_change = 360 - course_change;
    }

    course_change = degreesToRadians(course_change);
    // meters, bank establishment in 1s
    const turn_initiation_distance = calcTurnInitiationDistance(speed, bank_angle, course_change);

    return turn_initiation_distance / 1000; // convert m to km
};

/**
 * Get aircraft by entity id
 *
 * @function aircraft_get
 * @param eid {}
 * @return {|null}
 */
const aircraft_get = (eid) => {
    if (eid === null) {
        return null;
    }

    // prevent out-of-range error
    if (prop.aircraft.list.length > eid && eid >= 0) {
        return prop.aircraft.list[eid];
    }

    return null;
};

/**
 * Get aircraft by callsign
 *
 * @function aircraft_get_by_callsign
 * @param callsign
 * @return {|null}
 */
const aircraft_get_by_callsign = (callsign) => {
    callsign = String(callsign);

    for (let i = 0; i < prop.aircraft.list.length; i++) {
        if (prop.aircraft.list[i].callsign === callsign.toLowerCase()) {
            return prop.aircraft.list[i];
        }
    }

    return null;
};

/**
 * Get aircraft's eid by callsign
 *
 * @function aircraft_get_eid_by_callsign
 * @param callsign {string}
 * @return {|null}
 */
const aircraft_get_eid_by_callsign = (callsign) => {
    for (let i = 0; i < prop.aircraft.list.length; i++) {
        if (prop.aircraft.list[i].callsign === callsign.toLowerCase()) {
            return prop.aircraft.list[i].eid;
        }
    }

    return null;
};

/**
 * @function aircraft_model_get
 * @param icao
 * @return
 */
const aircraft_model_get = (icao) => {
    if (!(icao in prop.aircraft.models)) {
        const model = new AircraftModel({
            icao: icao,
            url: `assets/aircraft/${icao}.json`
        });

        prop.aircraft.models[icao] = model;
    }

    return prop.aircraft.models[icao];
};


// attach methods to the window, for now.
// going forward there shouldn't ever be anything attached to the window.  Ever. we're leaving these here
// for now so things dont break. eventually this functions will probably live inside a class
//  or set of helpers somewhere else.
window.aircraft_init_pre = aircraft_init_pre;
window.aircraft_init = () => {};
window.aircraft_generate_callsign = aircraft_generate_callsign;
window.aircraft_auto_toggle = aircraft_auto_toggle;
window.aircraft_callsign_new = aircraft_callsign_new;
window.aircraft_new = aircraft_new;
window.aircraft_get_nearest = aircraft_get_nearest;
window.aircraft_add = aircraft_add;
window.aircraft_visible = aircraft_visible;
window.aircraft_remove_all = aircraft_remove_all;
window.aircraft_update = aircraft_update;
window.aircraft_turn_initiation_distance = aircraft_turn_initiation_distance;
window.aircraft_get = aircraft_get;
window.aircraft_get_by_callsign = aircraft_get_by_callsign;
window.aircraft_get_eid_by_callsign = aircraft_get_eid_by_callsign;
window.aircraft_model_get = aircraft_model_get;
