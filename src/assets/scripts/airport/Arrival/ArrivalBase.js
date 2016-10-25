import _forEach from 'lodash/forEach';
import _get from 'lodash/get';
import _map from 'lodash/map';
import _random from 'lodash/random';
import RouteModel from '../Route/RouteModel';
import PositionModel from '../../base/PositionModel';
import { choose, choose_weight } from '../../utilities/generalUtilities';
import { nm, degreesToRadians } from '../../utilities/unitConverters';
import { round, sin, cos } from '../../math/core';
import { bearing, fixRadialDist, isWithinAirspace, calculateDistanceToBoundary } from '../../math/flightMath';
import { vradial, vsub } from '../../math/vector';
import { FLIGHT_CATEGORY } from '../../aircraft/AircraftInstanceModel';
import { LOG } from '../../constants/logLevel';

/**
 * @property DEFAULT_SPAWN_ALTITUDE_MIN
 * @type {number}
 * @final
 */
const DEFAULT_SPAWN_ALTITUDE_MIN = 10000;

/**
 * @property DEFAULT_SPAWN_ALTITUDE_MAX
 * @type {number}
 * @final
 */
const DEFAULT_SPAWN_ALTITUDE_MAX = 10000;

/**
 * @property DEFAULT_SPAWN_AIRCRAFT_SPEED_KTS
 * @type {number}
 * @final
 */
const DEFAULT_SPAWN_AIRCRAFT_SPEED_KTS = 250;

/**
 * @property MIN_ENTRAIL_DISTANCE_NM
 * @type {number}
 * @final
 */
const MIN_ENTRAIL_DISTANCE_NM = 5.5;

/**
 * @property INTERVAL_DELAY_IN_MS
 * @type {number}
 * @final
 */
const INTERVAL_DELAY_IN_MS = 3600;

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
         * Spawn occurs at first listed.
         *
         * @property fixes
         * @type {array}
         * @default []
         */
        this.fixes = [];

        /**
         * @property activeRouteModel
         * @type {RouteModel}
         * @default null
         */
        this.activeRouteModel = null;

        /**
         * Altitude in feet or min/max range of altitudes
         *
         * @property altitude
         * @type {array}
         * @default [DEFAULT_SPAWN_ALTITUDE_MIN, DEFAULT_SPAWN_ALTITUDE_MAX]
         */
        this.altitude = [DEFAULT_SPAWN_ALTITUDE_MIN, DEFAULT_SPAWN_ALTITUDE_MAX];

        /**
         * @property heading
         * @type {number}
         * @default null
         */
        this.heading = null;

        /**
         * Bearing from airspace center to spawn point.
         *
         * Don't use with fixes
         *
         * @property radial
         * @type {number}
         * @default 0
         */
        this.radial = 0;

        /**
         * Speed in knots of spawned aircraft.
         *
         * @property speed
         * @type {number}
         * @default DEFAULT_SPAWN_AIRCRAFT_SPEED_KTS
         */
        this.speed = DEFAULT_SPAWN_AIRCRAFT_SPEED_KTS;

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

        // TODO: is altitude ever not a number?
        if (typeof this.altitude === 'number') {
            this.altitude = [this.altitude, this.altitude];
        }

        if (options.route) {
            this.activeRouteModel = new RouteModel(options.route);
        } else if (options.fixes) {
            this.fixes = _map(options.fixes, (fix) => {
                return {
                    fix: fix
                };
            });
        }

        // TODO: this really doesn't belong here and should be moved
        // TODO: this should be a for loop
        // Pre-load the airlines
        _forEach(this.airlines, (data, i) => {
            window.airlineController.airline_get(data[0].split('/')[0]);
        });
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
        const waypointModelList = this.airport.findWaypointModelsForStar(
            this.activeRouteModel.base,
            this.activeRouteModel.origin,
            this.airport.runway
        );

        // find last fix along STAR that is outside of airspace, ie: next fix is within airspace
        // distance between closest fix outside airspace and airspace border in nm
        let extra = 0;
        let totalDistance = 0;

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

        // distance between each arrival, in nm
        const entrailDistance = this.speed / this.frequency;
        const spawnOffsets = this.assembleSpawnOffsets(entrailDistance, totalDistance);
        const spawnPositions = this.calculateSpawnPositions(waypointModelList, spawnOffsets);

        this.createAircraftAtSpawnPositions(spawnPositions);
    }

    /**
     *
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
                    // if point beyond next fix
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
                        pos: calculatedRadialDistance,
                        nextFix: nextFix.name,
                        heading: heading
                    });

                    break;
                }
            }
        }

        return spawnPositions;
    }

    /**
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
            const aircraftPosition = new PositionModel(pos, position, magnetic_north, 'GPS').position;

            // TODO: this should be a helper method/function and shouldn't live here
            let airline = choose_weight(this.airlines);
            let fleet = '';

            if (airline.indexOf('/') > -1) {
                fleet = airline.split('/')[1];
                airline = airline.split('/')[0];
            }

            const aircraftToAdd = {
                category: FLIGHT_CATEGORY.ARRIVAL,
                destination: icao,
                airline: airline,
                fleet: fleet,
                // TODO: should eventually look up altitude restrictions and try to spawn in an appropriate range
                //       this can be done with the `waypointModelList` and `StandardWaypointModel` objects,
                //       in conjuntion with the `RouteModel`.
                altitude: 10000,
                heading: heading || this.heading,
                waypoints: this.fixes,
                route: _get(this, 'activeRouteModel.routeString', ''),
                position: aircraftPosition,
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
        const delay = _random(0, 3600 / this.frequency);
        this.timeout = window.gameController.game_timeout(this.spawnAircraft, delay, this, [true, true]);

        // TODO: what is this actually doing?
        if (this.activeRouteModel) {
            this.preSpawn();
        }
    }

    /**
     * Spawn a new aircraft
     *
     * @for ArrivalBase
     * @method spawnAircraft
     */
    spawnAircraft(args) {
        // args = [boolean, boolean]
        const altitude = round(_random(this.altitude[0], this.altitude[1]) / 1000) * 1000;
        const message = !(window.gameController.game_time() - this.airport.start < 2);
        let start_flag = args[0];
        let timeout_flag = args[1] || false;
        let position;
        let heading;
        let fleet;
        let distance;

        // spawn at first fix
        if (this.fixes.length > 1) {
            // TODO: this should use the FixCollection to find a fix
            // spawn at first fix
            position = this.airport.getFixPosition(this.fixes[0].fix);
            // TODO: this should probably be a helper function, `.calculateHeadingFromTwoPositions()`
            heading = vradial(vsub(this.airport.getFixPosition(this.fixes[1].fix), position));
        } else if (this.activeRouteModel) {
            const waypointModelList = this.airport.findWaypointModelsForStar(
                this.activeRouteModel.base,
                this.activeRouteModel.origin,
                this.airport.runway
            );

            // grab position of first fix
            position = waypointModelList[0].position;
            // calculate heading from first waypoint to second waypoint
            heading = vradial(vsub(
                waypointModelList[1].position,
                position
            ));
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

        // TODO: this should be a helper method/function and shouldn't live here
        let airline = choose_weight(this.airlines);

        if (airline.indexOf('/') > -1) {
            fleet = airline.split('/')[1];
            airline = airline.split('/')[0];
        }

        const aircraftToAdd = {
            category: FLIGHT_CATEGORY.ARRIVAL,
            destination: this.airport.icao,
            airline: airline,
            fleet: fleet,
            altitude: altitude,
            heading: heading,
            waypoints: this.fixes,
            route: _get(this, 'activeRouteModel.routeString', ''),
            message: message,
            // TODO: this should really use the `PositionModel` instead of just using it to get a position
            // this will take a lot of refactoring, though, as aircraft.position is used all over the app.
            position: position,
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
        const min_interval = MIN_ENTRAIL_DISTANCE_NM * (INTERVAL_DELAY_IN_MS / this.speed);
        let tgt_interval = INTERVAL_DELAY_IN_MS / this.frequency;

        if (tgt_interval < min_interval) {
            tgt_interval = min_interval;

            log(`Requested arrival rate of ${this.frequency} acph overridden to ` +
                `maintain minimum of ${MIN_ENTRAIL_DISTANCE_NM} miles entrail on arrival stream ` +
                `following route ${this.activeRouteModel.routeString}`, LOG.INFO);
        }

        const max_interval = tgt_interval + (tgt_interval - min_interval);

        return _random(min_interval, max_interval);
    }
}
