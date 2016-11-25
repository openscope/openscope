/* eslint-disable no-underscore-dangle, no-unused-vars, no-undef, global-require */
import AircraftConflict from './AircraftConflict';
import AircraftModel from './AircraftModel';
import { speech_say } from '../speech';
import { abs } from '../math/core';
import { distance2d } from '../math/distance';
import { vlen, vradial, vsub } from '../math/vector';
import { kn_ms, radiansToDegrees, degreesToRadians } from '../utilities/unitConverters';
import { calcTurnInitiationDistance } from '../math/flightMath';
import { tau } from '../math/circle';
import { GAME_EVENTS } from '../game/GameController';

// Temporary const declaration here to attach to the window AND use as internal property
const aircraft = {};

// TODO: this should be renamed to `AircraftCollection`
/**
 * @class AircraftController
 */
export default class AircraftController {
    /**
     * @constructor
     */
    constructor() {
        this.aircraft = aircraft;
        this.aircraft.models = {};
        this.aircraft.callsigns = [];
        this.aircraft.list = [];
        this.aircraft.current = null;
        this.aircraft.auto = { enabled: false };
        prop.aircraft = aircraft;
    }

    /**
     * @for AircraftController
     * @method aircraft_auto_toggle
     */
    aircraft_auto_toggle() {
        prop.aircraft.auto.enabled = !this.aircraft.auto.enabled;
    }

    /**
     * @for AircraftController
     * @method addCallsignToList
     * @param callsign {string}
     */
    addCallsignToList(callsign) {
        if (this.aircraft.callsigns.indexOf(callsign) !== -1) {
            return;
        }

        this.aircraft.callsigns.push(callsign);
    }

    /**
     * @for AircraftController
     * @method aircraft_new
     * @param options {object}
     */
    aircraft_new(options) {
        const airline = window.airlineController.airline_get(options.airline);

        return airline.generateAircraft(options);
    }

    /**
     * @for AircraftController
     * @method aircraft_get_nearest
     * @param position
     */
    aircraft_get_nearest(position) {
        let nearest = null;
        let distance = Infinity;

        for (let i = 0; i < this.aircraft.list.length; i++) {
            const aircraft = this.aircraft.list[i];
            const d = distance2d(aircraft.position, position);

            if (d < distance && aircraft.isVisible() && !aircraft.hit) {
                distance = d;
                nearest = i;
            }
        }

        return [this.aircraft.list[nearest], distance];
    }

    /**
     * @for AircraftController
     * @method aircraft_add
     * @param model {AircraftModel|object}
     */
    aircraft_add(model) {
        this.aircraft.models[model.icao.toLowerCase()] = model;
    }

    /**
     * @for AircraftController
     * @method aircraft_visible
     * @param aircraft
     * @param factor
     */
    aircraft_visible(aircraft, factor = 1) {
        return vlen(aircraft.position) < window.airportController.airport_get().ctr_radius * factor;
    }

    /**
     * @for AircraftController
     * @method aircraft_remove_all
     */
    aircraft_remove_all() {
        for (let i = 0; i < this.aircraft.list.length; i++) {
            this.aircraft.list[i].cleanup();
        }

        this.aircraft.list = [];
    }

    /**
     * @for AircraftController
     * @method aircraft_remove
     */
    aircraft_remove(aircraft) {
        this.aircraft.callsigns.splice(this.aircraft.callsigns.indexOf(aircraft.callsign), 1);
        this.aircraft.list.splice(this.aircraft.list.indexOf(aircraft), 1);

        this.update_aircraft_eids();

        aircraft.cleanup();
    }

    /**
     * @for AircraftController
     * @method aircraft_update
     */
    aircraft_update() {
        // TODO: change to _forEach()
        for (let i = 0; i < this.aircraft.list.length; i++) {
            this.aircraft.list[i].update();
            this.aircraft.list[i].updateWarning();

            // TODO: move this InnerLoop thing to a function so we can get rid of the continue InnerLoop thing.
            for (let j = i + 1; j < this.aircraft.list.length; j++) {
                // TODO: need better names here. what is `that`?  what is `other`?
                const aircraft = this.aircraft.list[i];
                const otherAircraft = this.aircraft.list[j];

                if (aircraft.checkConflict(otherAircraft)) {
                    continue;
                }

                // Fast 2D bounding box check, there are no conflicts over 8nm apart (14.816km)
                // no violation can occur in this case.
                // Variation of:
                // http://gamedev.stackexchange.com/questions/586/what-is-the-fastest-way-to-work-out-2d-bounding-box-intersection
                const dx = abs(aircraft.position[0] - otherAircraft.position[0]);
                const dy = abs(aircraft.position[1] - otherAircraft.position[1]);

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

        for (let i = this.aircraft.list.length - 1; i >= 0; i--) {
            let remove = false;
            const aircraft = this.aircraft.list[i];
            // let is_visible = aircraft_visible(aircraft);

            if (aircraft.isStopped() && aircraft.category === 'arrival') {
                aircraft.scoreWind('landed');

                window.uiController.ui_log(`${aircraft.getCallsign()} switching to ground, good day`);
                speech_say([
                    { type: 'callsign', content: aircraft },
                    { type: 'text', content: ', switching to ground, good day' }
                ]);

                window.gameController.events_recordNew(GAME_EVENTS.ARRIVAL);
                remove = true;
            }

            if (aircraft.hit && aircraft.wow()) {
                window.uiController.ui_log(`Lost radar contact with ${aircraft.getCallsign()}`);
                speech_say([
                    { type: 'callsign', content: aircraft },
                    { type: 'text', content: ', radar contact lost' }
                ]);

                remove = true;
            }

            // Clean up the screen from aircraft that are too far
            if (
                (!this.aircraft_visible(aircraft, 2) && !aircraft.inside_ctr) &&
                aircraft.fms.currentWaypoint.navmode === 'heading'
            ) {
                if (aircraft.category === 'arrival' || aircraft.category === 'departure') {
                    remove = true;
                }
            }

            if (remove) {
                this.aircraft_remove(aircraft);
                i -= 1;
            }
        }
    }

    /**
     * Calculate the turn initiation distance for an aircraft to navigate between two fixes.
     *
     * References:
     * - http://www.ohio.edu/people/uijtdeha/ee6900_fms_00_overview.pdf, Fly-by waypoint
     * - The Avionics Handbook, ch 15
     *
     * @for AircraftController
     * @method aircraft_turn_initiation_distance
     * @param aircraft {AircraftInstanceModel}
     * @param fix
     */
    aircraft_turn_initiation_distance(aircraft, fix) {
        // TODO: this function is ripe for refactor. there is a lot of inline logic that can be abstracted and/or pulled out
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
            nominal_new_course += tau();
        }

        let current_heading = aircraft.heading;
        if (current_heading < 0) {
            current_heading += tau();
        }

        // TODO: move to function
        let course_change = abs(radiansToDegrees(current_heading) - radiansToDegrees(nominal_new_course));
        if (course_change > 180) {
            course_change = 360 - course_change;
        }

        course_change = degreesToRadians(course_change);
        // meters, bank establishment in 1s
        const turn_initiation_distance = calcTurnInitiationDistance(speed, bank_angle, course_change);

        return turn_initiation_distance / 1000; // convert m to km
    }

    /**
     * @for AircraftController
     * @method aircraft_get
     * @param eid
     */
    aircraft_get(eid = null) {
        if (eid === null) {
            return null;
        }

        // prevent out-of-range error
        if (this.aircraft.list.length > eid && eid >= 0) {
            return this.aircraft.list[eid];
        }

        return null;
    }

    /**
     * @for AircraftController
     * @method aircraft_get_by_callsign
     * @param callsign {string}
     */
    aircraft_get_by_callsign(callsign) {
        callsign = String(callsign);

        for (let i = 0; i < this.aircraft.list.length; i++) {
            if (this.aircraft.list[i].callsign === callsign.toLowerCase()) {
                return this.aircraft.list[i];
            }
        }

        return null;
    }

    /**
     * @for AircraftController
     * @method aircraft_get_eid_by_callsign
     * @param callsign {string}
     */
    aircraft_get_eid_by_callsign(callsign) {
        for (let i = 0; i < this.aircraft.list.length; i++) {
            const aircraft = this.aircraft.list[i];

            if (aircraft.callsign === callsign.toLowerCase()) {
                return aircraft.eid;
            }
        }

        return null;
    }

    /**
     * @for AircraftController
     * @method aircraft_model_get
     * @param icao {string}
     */
    aircraft_model_get(icao) {
        if (!(this.aircraft.models[icao])) {
            const model = new AircraftModel({
                icao,
                url: `assets/aircraft/${icao}.json`
            });

            this.aircraft.models[icao] = model;
        }

        return this.aircraft.models[icao];
    }

    // TODO: what is an `eid` and why would it beed to be updated?
    /**
     * Adjust all aircraft's eid values
     *
     * @for AircraftController
     * @method update_aircraft_eids
     */
    update_aircraft_eids() {
        for (let i = 0; i < this.aircraft.list.length; i++) {
            // update eid in aircraft
            this.aircraft.list[i].eid = i;
            // update eid in aircraft's fms
            this.aircraft.list[i].fms.my_aircrafts_eid = i;
        }
    }
}
