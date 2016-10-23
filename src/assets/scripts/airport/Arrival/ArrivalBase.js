import _forEach from 'lodash/forEach';
import _get from 'lodash/get';
import _map from 'lodash/map';
import _random from 'lodash/random';
import RouteModel from '../Route/RouteModel';
import PositionModel from '../../base/PositionModel';
import { nm, degreesToRadians } from '../../utilities/unitConverters';
import { round, sin, cos } from '../../math/core';
import { bearing, fixRadialDist, isWithinAirspace, calculateDistanceToBoundary } from '../../math/flightMath';
import { vradial, vsub } from '../../math/vector';
import { FLIGHT_CATEGORY } from '../../aircraft/AircraftInstanceModel';
import { LOG } from '../../constants/logLevel';

const MIN_ENTRAIL_DISTANCE_NM = 5.5;
const INTERVAL_DELAY_IN_MS = 3600;

/**
 * Generate arrivals at random, averaging the specified arrival rate
 *
 * @class ArrivalBase
 */
export default class ArrivalBase {
    constructor(airport, options) {
        this.airlines = [];
        // FIXME: this creates a circular reference and should be refactored
        this.airport = airport;
        this.altitude = [1000, 1000];
        this.frequency = 0;
        this.heading = null;
        this.radial = 0;
        this.speed = 250;
        this.timeout = null;
        // TODO: this needs a better name. this is actually fixes for a route
        this.fixes = [];
        // TODO: create RouteModel class to handle storing and transforming the active route
        this.routeModel = null;

        this.parse(options);
    }

    /**
     * Arrival Stream Settings
     * airlines: {array of array} List of airlines with weight for each
     * altitude: {array or integer} Altitude in feet or range of altitudes
     * frequency: {integer} Arrival rate along this stream, in aircraft per hour (acph)
     * heading: {integer} Heading to fly when spawned, in degrees (don't use w/ fixes)
     * fixes: {array} Set of fixes to traverse (eg. for STARs). Spawns at first listed.
     * radial: {integer} bearing from airspace center to spawn point (don't use w/ fixes)
     * speed: {integer} Speed in knots of spawned aircraft
     */
    parse(options) {
        // TODO: replace with _get()
        const params = ['airlines', 'altitude', 'frequency', 'speed'];

        // Populate the data
        for (const i in params) {
            if (options[params[i]]) {
                this[params[i]] = options[params[i]];
            }
        }

        // Make corrections to data
        if (options.radial) {
            this.radial = degreesToRadians(options.radial);
        }

        if (options.heading) {
            this.heading = degreesToRadians(options.heading);
        }

        // TODE: is altitude ever not a number?
        if (typeof this.altitude === 'number') {
            this.altitude = [this.altitude, this.altitude];
        }

        if (options.route) {
            this.routeModel = new RouteModel(options.route);
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
     * Backfill STAR routes with arrivals closer than the spawn point
     *
     * Aircraft spawn at the first point defined in the route of the entry in
     * "arrivals" in the airport json file. When that spawn point is very far
     * from the airspace boundary, it obviously takes quite a while for them
     * to reach the airspace. This function spawns (all at once) arrivals along
     * the route, between the spawn point and the airspace boundary, in order to
     * ensure the player is not kept waiting for their first arrival aircraft.
     *
     * @for ArrivalBase
     * @method preSpawn
     */
    preSpawn() {
        const waypointModelList = this.airport.findWaypointModelsForStar(
            this.routeModel.base,
            this.routeModel.origin,
            this.airport.runway
        );

        // find last fix along STAR that is outside of airspace, ie: next fix is within airspace
        // distance between closest fix outside a/s and a/s border, nm
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

        // incluing this causes aircraft to spawn within airspace. something goody is going on here.
        // totalDistance += extra;

        // distance between each arrival, in nm
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

        // distance between succ. arrivals, nm
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
        for (let i = 0; i < spawnOffsets.length; i++ ) {
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
        // TODO: this should be a standard for loop
        // Spawn aircraft along the route, ahead of the standard spawn point
        for (let i = 0; i < spawnPositions.length; i++) {
            debugger;
            const { heading, pos, nextFix } = spawnPositions[i];
            const { icao, position, magnetic_north } = this.airport;
            const aircraftPosition = new PositionModel(pos, position, magnetic_north, 'GPS').position;
            let airline = choose_weight(this.airlines);
            let fleet = '';

            if (airline.indexOf('/') > -1) {
                fleet = airline.split('/')[1];
                airline = airline.split('/')[0];
            }

            const aircraftToAdd = {
                // TODO: replace with constant
                category: FLIGHT_CATEGORY.ARRIVAL,
                destination: icao,
                airline: airline,
                fleet: fleet,
                // TODO: should eventually look up altitude restrictions and try to spawn in an appropriate range
                // FIXME: this can be done with the `waypointModelList` and `StandardWaypointModel` objects,
                //        in conjuntion with the `RouteModel`.
                altitude: 10000,
                heading: heading || this.heading,
                waypoints: this.fixes,
                route: _get(this, 'routeModel.routeString', ''),
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
        if (this.routeModel) {
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
        // [true, true]
        let start_flag = args[0];
        let timeout_flag = args[1] || false;
        const altitude = round(_random(this.altitude[0], this.altitude[1]) / 1000) * 1000;
        const message = !(window.gameController.game_time() - this.airport.start < 2);
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
        } else if (this.routeModel) {
            const waypointModelList = this.airport.findWaypointModelsForStar(
                this.routeModel.base,
                this.routeModel.origin,
                this.airport.runway
            );

            // grab position of first fix
            position = waypointModelList[0].position
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
            route: _get(this, 'routeModel.routeString', ''),
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
                `following route ${this.routeModel.routeString}`, LOG.INFO);
        }

        const max_interval = tgt_interval + (tgt_interval - min_interval);

        return _random(min_interval, max_interval);
    }
}
