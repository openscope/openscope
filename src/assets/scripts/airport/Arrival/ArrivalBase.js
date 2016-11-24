import _get from 'lodash/get';
import _map from 'lodash/map';
import _random from 'lodash/random';
import FixCollection from '../Fix/FixCollection';
import RouteModel from '../Route/RouteModel';
import PositionModel from '../../base/PositionModel';
import {
    airlineNameAndFleetHelper,
    randomAirlineSelectionHelper
} from '../../airline/randomAirlineSelectionHelper';
import { nm, degreesToRadians } from '../../utilities/unitConverters';
import { round, sin, cos } from '../../math/core';
import {
    bearing,
    fixRadialDist,
    isWithinAirspace,
    calculateDistanceToBoundary,
    calculateHeadingFromTwoPositions
} from '../../math/flightMath';
import { FLIGHT_CATEGORY } from '../../aircraft/AircraftInstanceModel';
import { AIRPORT_CONSTANTS } from '../../constants/airportConstants';
import { TIME } from '../../constants/globalConstants';
import { LOG } from '../../constants/logLevel';

/**
 * @property INTERVAL_DELAY_IN_MS
 * @type {number}
 * @final
 */
const INTERVAL_DELAY_IN_MS = TIME.ONE_HOUR_IN_SECONDS;

// TODO: this shouldn't live here. perhaps move to `FixCollection` as an exported function?
/**
 * Encapsulation of a `FixCollection` method.
 *
 * This allows for centralization of this logic, while avoiding the need for
 * another class method.
 *
 * @method getFixPostiion
 * @param fixName {string}
 * @return fix.position {array}
 */
const getFixPosition = (fixName) => {
    const fix = FixCollection.findFixByName(fixName);

    return fix.position;
};

/**
 * Generate arrivals at random, averaging the specified arrival rate
 *
 * @class ArrivalBase
 */
export default class ArrivalBase {
    /**
     * @for ArrivalBase
     * @constructor
     * @param airport {AirportInstanceModel}
     * @param options {object}
     */
    constructor(airport, options) {
        // FIXME: this creates a circular reference and should be refactored
        /**
         * Airport that arrivals belong to
         *
         * @property airport
         * @type {AirportInstanceModel}
         * @default airport
         */
        this.airport = airport;

        /**
         * List of airlines with weight for each
         *
         * @property airlines
         * @type {array[]}
         * @default []
         */
        this.airlines = [];

        // TODO: this needs a better name. this is actually fixes for a route
        /**
         * Set of fixes to traverse (eg. for STARs) as defined in the airport json file.
         *
         * Spawn occurs at first fix listed.
         * This property gets sent to an `AirportInstanceModel` and becomes that aircraft's
         * waypoint list in the fms.
         *
         * @property fixes
         * @type {array}
         * @default []
         */
        this.fixes = [];

        /**
         * Text representation of a `StandardRoute`.
         *
         * `RouteModel` object provides methods for dealing with a route string.
         * Expects string to be in the shape of:
         * - `ORIGIN_FIXNAME.ROUTE_NAME.DESTINATION_FIXNAME`
         *
         * @property activeRouteModel
         * @type {RouteModel}
         * @default null
         */
        this.activeRouteModel = null;

        /**
         * Altitude in feet or min/max range of altitudes
         *
         * Altitude may be passed in as either an array of altitudes [min, max], or as a single number.
         *
         * @property altitude
         * @type {array}
         * @default [AIRPORT_CONSTANTS.DEFAULT_SPAWN_ALTITUDE_MIN, AIRPORT_CONSTANTS.DEFAULT_SPAWN_ALTITUDE_MAX]
         */
        this.altitude = [AIRPORT_CONSTANTS.DEFAULT_SPAWN_ALTITUDE_MIN, AIRPORT_CONSTANTS.DEFAULT_SPAWN_ALTITUDE_MAX];

        /**
         * Initial heading of a spawned aircraft
         *
         * @property heading
         * @type {number}
         * @default null
         */
        this.heading = null;

        /**
         * Bearing from airspace center to spawn point.
         *
         * Shouldn't be used with fixes
         *
         * @property radial
         * @type {number}
         * @default 0
         */
        this.radial = 0;

        /**
         * game time
         *
         * @property cycleStart
         * @type {number}
         * @default 0
         */
        this.cycleStart = 0;

        /**
         * Start at the beginning of the surge
         *
         * @property offset
         * @type {number}
         * @default 0
         */
        this.offset = 0;

        /**
         * 30 minute cycle
         *
         * @property period
         * @type {number}
         * @default 1800
         */
        this.period = TIME.ONE_HOUR_IN_SECONDS / 2;

        /**
         * Initial speed in knots of spawned aircraft.
         *
         * @property speed
         * @type {number}
         * @default AIRPORT_CONSTANTS.DEFAULT_SPAWN_AIRCRAFT_SPEED_KTS
         */
        this.speed = AIRPORT_CONSTANTS.DEFAULT_SPAWN_AIRCRAFT_SPEED_KTS;

        /**
         * Arrival rate along this stream.
         *
         * Number represents aircraft per hour (acph)
         *
         * @property frequency
         * @type {number}
         * @default 0
         */
        this.frequency = 0;

        /**
         * @property timeout
         * @type {function}
         * @default null
         */
        this.timeout = null;

        this.parse(options);
    }

    /**
     * Initialize arrival stream
     *
     * @for ArrivalBase
     * @method parse
     * @param options {object}
     * @private
     */
    parse(options) {
        this.airlines = _get(options, 'airlines', this.airlines);
        this.altitude = _get(options, 'altitude', this.altitude);
        this.frequency = _get(options, 'frequency', this.frequency);
        this.speed = _get(options, 'speed', this.speed);

        // Make corrections to data
        if (options.radial) {
            this.radial = degreesToRadians(options.radial);
        }

        if (options.heading) {
            this.heading = degreesToRadians(options.heading);
        }

        // altitude may be passed in as either an array of altitudes [min, max], or as a single number.
        // here we check for the single number and transform it into a [min, max] format.
        if (typeof this.altitude === 'number') {
            this.altitude = [this.altitude, this.altitude];
        }

        if (options.route) {
            this.activeRouteModel = new RouteModel(options.route);
        } else if (options.fixes) {
            // TODO: this may not be needed at all. we could just use `_get()` instead.
            // `this.fixes` eventually makes its way to the `AircraftInstanceModel.fms` via
            // `AircraftInstanceModel.setArrivalWaypoints()`. that method simply builds another object and
            // pulls each item from this array. creating an object here is doesn't appear to serve any real purpose.
            this.fixes = _map(options.fixes, (fix) => {
                return {
                    fix: fix
                };
            });
        }

        this.preloadAirlines();
    }

    /**
     * Loop through each airline provided from an airport json and ensure it had been loaded.
     *
     * @for ArrivalBase
     * @method preloadAirlines
     */
    preloadAirlines() {
        // TODO: this really doesn't belong here and should be moved
        // Pre-load the airlines
        for (let i = 0; i < this.airlines.lenth; i++) {
            const airline = this.airlines[i];
            // reassigns `airline.name` to `airlineName` for readability
            const { name: airlineName } = airlineNameAndFleetHelper(airline);

            window.airlineController.airline_get(airlineName);
        }
    }

    /**
     * Backfill STAR routes with arrivals closer than the spawn point.
     *
     * Should be run only once on airport load.
     *
     * Aircraft spawn at the first point defined in the `arrivals` entry of the airport json file.
     * When that spawn point is very far from the airspace boundary, it obviously takes quite a
     * while for them to reach the airspace. This function spawns (all at once) arrivals along
     * the route, between the spawn point and the airspace boundary, in order to
     * ensure the player is not kept waiting for their first arrival aircraft.
     *
     * @for ArrivalBase
     * @method preSpawn
     */
    preSpawn() {
        // find last fix along STAR that is outside of airspace, ie: next fix is within airspace
        // distance between closest fix outside airspace and airspace border in nm
        let extra = 0;
        let totalDistance = 0;
        const isPreSpawn = true;
        const waypointModelList = this.airport.findWaypointModelsForStar(
            this.activeRouteModel.procedure,
            this.activeRouteModel.entry,
            this.airport.runway,
            isPreSpawn
        );

        for (let i = 0; i < waypointModelList.length; i++) {
            const waypoint = waypointModelList[i];
            const waypointPosition = waypoint.position;
            let previousWaypoint = waypoint;
            let previousPosition = waypoint.position;

            if (i > 0) {
                previousWaypoint = waypointModelList[i - 1];
                previousPosition = previousWaypoint.position;
            }

            if (isWithinAirspace(this.airport, waypointPosition) && i > 0) {
                extra = nm(calculateDistanceToBoundary(this.airport, previousPosition));

                continue;
            }

            totalDistance += waypoint.distanceFromPreviousWaypoint;
        }

        // FIXME: incluing this causes aircraft to spawn within airspace. something goofy is going on here.
        // totalDistance += extra;

        // distance between each arriving aircraft, in nm
        const entrailDistance = this.speed / this.frequency;
        const spawnOffsets = this.assembleSpawnOffsets(entrailDistance, totalDistance);
        const spawnPositions = this.calculateSpawnPositions(waypointModelList, spawnOffsets);

        this.createAircraftAtSpawnPositions(spawnPositions);
    }

    /**
     * @for ArrivalBase
     * @method assembleSpawnOffsets
     * @param entrailDistance {number}
     * @param totalDistance {number}
     * @return spawnOffsets {array}
     */
    assembleSpawnOffsets(entrailDistance, totalDistance) {
        const spawnOffsets = [];

        // distance between successive arrivals in nm
        for (let i = entrailDistance; i < totalDistance; i += entrailDistance) {
            spawnOffsets.push(i);
        }

        return spawnOffsets;
    }

    /**
     * @for ArrivalBase
     * @method calculateSpawnPositions
     * @param waypointModelList {array<StandardWaypointModel>}
     * @param spawnOffsets {array}
     * @return spawnPositions {array}
     */
    calculateSpawnPositions(waypointModelList, spawnOffsets) {
        const spawnPositions = [];

        // for each new aircraft
        for (let i = 0; i < spawnOffsets.length; i++) {
            let spawnOffset = spawnOffsets[i];

            // for each fix ahead
            for (let j = 1; j < waypointModelList.length; j++) {
                const waypoint = waypointModelList[j];

                if (spawnOffset > waypoint.distanceFromPreviousWaypoint) {
                    // if point beyond next fix subtract distance from spawnOffset and continue
                    spawnOffset -= waypoint.distanceFromPreviousWaypoint;

                    continue;
                } else {
                    // if point before next fix
                    const nextFix = waypoint;
                    const previousFix = waypointModelList[j - 1];
                    const heading = bearing(previousFix.gps, nextFix.gps);
                    const calculatedRadialDistance = fixRadialDist(previousFix.gps, heading, spawnOffset);

                    // TODO: this looks like it should be a model object
                    spawnPositions.push({
                        heading,
                        pos: calculatedRadialDistance,
                        nextFix: nextFix.name
                    });

                    break;
                }
            }
        }

        return spawnPositions;
    }

    /**
     * Given an array of `spawnPositions`, create new aircraft for each `spawnPosition`
     *
     * @for ArrivalBase
     * @method createAircraftAtSpawnPositions
     * @param spawnPositions {array}
     */
    createAircraftAtSpawnPositions(spawnPositions) {
        // Spawn aircraft along the route, ahead of the standard spawn point
        for (let i = 0; i < spawnPositions.length; i++) {
            const { heading, pos, nextFix } = spawnPositions[i];
            const { icao, position, magnetic_north } = this.airport;
            const aircraftPosition = new PositionModel(pos, position, magnetic_north, 'GPS');
            const airline = randomAirlineSelectionHelper(this.airlines);
            const aircraftToAdd = {
                category: FLIGHT_CATEGORY.ARRIVAL,
                destination: icao,
                airline: airline.name,
                fleet: airline.fleet,
                // TODO: should eventually look up altitude restrictions and try to spawn in an appropriate range
                //       this can be done with the `waypointModelList` and `StandardWaypointModel` objects,
                //       in conjuntion with the `RouteModel`.
                altitude: 10000,
                // TODO: this could be a _get() instead of an || assignment
                heading: heading || this.heading,
                waypoints: this.fixes,
                route: _get(this, 'activeRouteModel.routeString', ''),
                position: aircraftPosition.position,
                speed: this.speed,
                nextFix: nextFix
            };

            window.aircraftController.aircraft_new(aircraftToAdd);
        }
    }

    /**
     * Stop this arrival stream
     *
     * @for ArrivalBase
     * @method stop
     */
    stop() {
        if (this.timeout) {
            window.gameController.game_clear_timeout(this.timeout);
        }
    }

    /**
     * Start this arrival stream
     *
     * @for ArrivalBase
     * @method start
     */
    start() {
        // TODO: what do these numbers mean? enumerate the magic numbers.
        const delay = _random(0, TIME.ONE_HOUR_IN_SECONDS / this.frequency);
        this.timeout = window.gameController.game_timeout(this.spawnAircraft, delay, this, [true, true]);

        if (this.activeRouteModel) {
            this.preSpawn();
        }
    }

    // TODO: this method should accept explicit arguments
    /**
     * Spawn a new aircraft
     *
     * @for ArrivalBase
     * @method spawnAircraft
     */
    spawnAircraft(args) {
        let position;
        let heading;
        let distance;
        // args = [boolean, boolean]
        const altitude = round(_random(this.altitude[0], this.altitude[1]) / 1000) * 1000;
        const message = !(window.gameController.game_time() - this.airport.start < 2);
        const airline = randomAirlineSelectionHelper(this.airlines);
        // What is this next variable for, why is it here and can it be removed?
        // FIXME: this is not used
        const start_flag = args[0];
        const timeout_flag = args[1] || false;

        // spawn at first fix
        if (this.fixes.length > 1) {
            // calculate heading to next fix
            position = getFixPosition(this.fixes[0].fix);
            const nextPosition = getFixPosition(this.fixes[1].fix);
            heading = calculateHeadingFromTwoPositions(nextPosition, position);
        } else if (this.activeRouteModel) {
            const isPreSpawn = false;
            const waypointModelList = this.airport.findWaypointModelsForStar(
                this.activeRouteModel.procedure,
                this.activeRouteModel.entry,
                this.airport.runway,
                isPreSpawn
            );

            // grab position of first fix
            position = waypointModelList[0].position;
            // calculate heading from first waypoint to second waypoint
            heading = calculateHeadingFromTwoPositions(waypointModelList[1].position, position);
        } else {
            // spawn outside the airspace along 'this.radial'
            distance = 2 * this.airport.ctr_radius;
            // TODO: this should really use `PositionModel`
            position = [
                sin(this.radial) * distance,
                cos(this.radial) * distance
            ];
            heading = this.heading || this.radial + Math.PI;
        }

        const aircraftToAdd = {
            altitude,
            heading,
            message,
            position,
            category: FLIGHT_CATEGORY.ARRIVAL,
            destination: this.airport.icao,
            airline: airline.name,
            fleet: airline.fleet,
            waypoints: this.fixes,
            route: _get(this, 'activeRouteModel.routeString', ''),
            // TODO: this should use a `PositionModel` instead of just using it to get a position
            // this will take a lot of refactoring, though, as aircraft.position is used all over the app.
            speed: this.speed
        };

        window.aircraftController.aircraft_new(aircraftToAdd);

        if (timeout_flag) {
            this.timeout = window.gameController.game_timeout(
                this.spawnAircraft,
                this.nextInterval(),
                this,
                [null, true]
            );
        }
    }

    /**
     * Determine delay until next spawn
     *
     * @for ArrivalBase
     * @method nextInterval
     * @return {number}
     */
    nextInterval() {
        const min_interval = AIRPORT_CONSTANTS.MIN_ENTRAIL_DISTANCE_NM * (INTERVAL_DELAY_IN_MS / this.speed);
        let tgt_interval = INTERVAL_DELAY_IN_MS / this.frequency;

        if (tgt_interval < min_interval) {
            tgt_interval = min_interval;

            log(`Requested arrival rate of ${this.frequency} acph overridden to ` +
                `maintain minimum of ${AIRPORT_CONSTANTS.MIN_ENTRAIL_DISTANCE_NM} miles entrail on arrival stream ` +
                `following route ${this.activeRouteModel.routeString}`, LOG.INFO);
        }

        const max_interval = tgt_interval + (tgt_interval - min_interval);

        return _random(min_interval, max_interval);
    }
}
