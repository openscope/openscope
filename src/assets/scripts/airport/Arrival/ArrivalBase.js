import $ from 'jquery';
import _forEach from 'lodash/forEach';
import _has from 'lodash/has';
import _random from 'lodash/random';
import RouteModel from '../Route/RouteModel';
import PositionModel from '../../base/PositionModel';
import { nm, degreesToRadians } from '../../utilities/unitConverters';
import { round, sin, cos } from '../../math/core';
import { distance2d } from '../../math/distance';
import { bearing, fixRadialDist, inAirspace, dist_to_boundary } from '../../math/flightMath';
import { vradial, vsub } from '../../math/vector';
import { LOG } from '../../constants/logLevel';

/**
 *  Generate arrivals at random, averaging the specified arrival rate
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
        this.fixes = [];
        // TODO: create RouteModel class to handle storing and transforming the active route
        this.routeModel = null;
        this.route = '';

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

        if (typeof this.altitude === 'number') {
            this.altitude = [this.altitude, this.altitude];
        }

        if (options.route) {
            this.routeModel = new RouteModel(options.route);

            this.route = options.route;
        } else if (options.fixes) {
            for (let i = 0; i < options.fixes.length; i++) {
                this.fixes.push({ fix: options.fixes[i] });
            }
        }

        // Pre-load the airlines
        $.each(this.airlines, (i, data) => {
            window.airlineController.airline_get(data[0].split('/')[0]);
        });
    }

    /**
     * Backfill STAR routes with arrivals closer than the spawn point
     * Aircraft spawn at the first point defined in the route of the entry in
     * "arrivals" in the airport json file. When that spawn point is very far
     * from the airspace boundary, it obviously takes quite a while for them
     * to reach the airspace. This function spawns (all at once) arrivals along
     * the route, between the spawn point and the airspace boundary, in order to
     * ensure the player is not kept waiting for their first arrival aircraft.
     */
    preSpawn() {
        const fixes = this.airport.getSTAR(this.routeModel.base, this.routeModel.origin, this.airport.runway);

        // find last fix along STAR that is outside of airspace, ie: next fix is within airspace

        // distance between closest fix outside a/s and a/s border, nm
        let extra = 0;

        for (const i in fixes) {
            const fix = fixes[i][0];
            const pos = this.airport.fixes[fix].position;
            const fix_prev = (i > 0)
                ? fixes[i - 1][0]
                : fix;
            const pos_prev = (i > 0)
                ? this.airport.fixes[fix_prev].position
                : pos;

            if (inAirspace(this.airport, pos)) {
                if (i >= 1) {
                    extra = nm(dist_to_boundary(this.airport, pos_prev));
                    break;
                }
            } else {
                // calculate distance between fixes
                fixes[i][2] = nm(distance2d(pos_prev, pos));
            }
        }

        // Determine spawn offsets
        const spawn_offsets = [];
        // distance between succ. arrivals, nm
        const entrail_dist = this.speed / this.frequency;
        // TODO: replace with _map
        const dist_total = array_sum($.map(fixes, (v) => {
            return v[2];
        })) + extra;

        for (let i = entrail_dist; i < dist_total; i += entrail_dist) {
            spawn_offsets.push(i);
        }

        // TODO: move to new method
        // Determine spawn points
        const spawn_positions = [];
        // for each new aircraft
        for (const i in spawn_offsets) {
            // for each fix ahead
            for (let j = 1; j < fixes.length; j++) {
                if (spawn_offsets[i] > fixes[j][2]) {
                    // if point beyond next fix
                    spawn_offsets[i] -= fixes[j][2];
                    continue;
                } else {
                    // TODO: set fixes to a const so ther is only one call to `airport_get()`
                    // if point before next fix
                    const next = window.airportController.airport_get().fixes[fixes[j][0]];
                    const prev = window.airportController.airport_get().fixes[fixes[j - 1][0]];
                    const brng = bearing(prev.gps, next.gps);
                    spawn_positions.push({
                        pos: fixRadialDist(prev.gps, brng, spawn_offsets[i]),
                        nextFix: fixes[j][0],
                        heading: brng
                    });
                    break;
                }
            }
        }

        // TODO: move to new method
        // Spawn aircraft along the route, ahead of the standard spawn point
        for (const i in spawn_positions) {
            let airline = choose_weight(this.airlines);
            let fleet = '';

            if (airline.indexOf('/') > -1) {
                fleet = airline.split('/')[1];
                airline = airline.split('/')[0];
            }

            const { heading, pos, nextFix } = spawn_positions[i];
            const { icao, position, magnetic_north } = window.airportController.airport_get();
            window.aircraftController.aircraft_new({
                category: 'arrival',
                destination: icao,
                airline: airline,
                fleet: fleet,
                // TODO: should eventually look up altitude restrictions and try to spawn in an appropriate range
                altitude: 10000,
                heading: heading || this.heading,
                waypoints: this.fixes,
                route: this.route,
                // TODO: this should really use the `PositionModel` instead of just using it to get a position
                // this will take a lot of refactoring, though, as aircraft.position is used all over the app.
                position: new PositionModel(pos, position, magnetic_north, 'GPS').position,
                speed: this.speed,
                nextFix: nextFix
            });
        }
    }

    /**
     * Stop this arrival stream
     */
    stop() {
        if (this.timeout) {
            window.gameController.game_clear_timeout(this.timeout);
        }
    }

    /**
     * Start this arrival stream
     */
    start() {
        // TODO: what do these numbers mean? enumerate the magic numbers.
        const delay = _random(0, 3600 / this.frequency);
        this.timeout = window.gameController.game_timeout(this.spawnAircraft, delay, this, [true, true]);

        if (this.route) {
            this.preSpawn();
        }
    }

    /**
     * Spawn a new aircraft
     */
    spawnAircraft(args) {
        let start_flag = args[0];
        let timeout_flag = args[1] || false;
        let altitude = round(_random(this.altitude[0], this.altitude[1]) / 1000) * 1000;
        let message = !(window.gameController.game_time() - this.airport.start < 2);
        let position;
        let heading;
        let fleet;
        let star;
        let distance;

        // spawn at first fix
        if (this.fixes.length > 1) {
            // spawn at first fix
            position = window.airportController.airport_get().getFixPosition(this.fixes[0].fix);
            heading = vradial(vsub(window.airportController.airport_get().getFixPosition(this.fixes[1].fix), position));
        } else if (this.route) {
            // STAR data is present
            star = window.airportController.airport_get().getSTAR(
                this.route.split('.')[1],
                this.route.split('.')[0],
                window.airportController.airport_get().runway
            );

            position = window.airportController.airport_get().getFixPosition(star[0][0]);
            heading = vradial(vsub(
                window.airportController.airport_get().getFixPosition(star[1][0]),
                position
            ));
        } else {
            // spawn outside the airspace along 'this.radial'
            distance = 2 * this.airport.ctr_radius;
            // TODO: this should be a `PositionModel`, see below.
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

        window.aircraftController.aircraft_new({
            category: 'arrival',
            destination: window.airportController.airport_get().icao,
            airline: airline,
            fleet: fleet,
            altitude: altitude,
            heading: heading,
            waypoints: this.fixes,
            route: this.route,
            message: message,
            // TODO: this should really use the `PositionModel` instead of just using it to get a position
            // this will take a lot of refactoring, though, as aircraft.position is used all over the app.
            position: position,
            speed: this.speed
        });

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
     */
    nextInterval() {
        // TODO: these next 3 vars could easily be moved to a constants file
        // nautical miles
        const min_entrail = 5.5;
        // in seconds
        const min_interval = min_entrail * (3600 / this.speed);
        let tgt_interval = 3600 / this.frequency;

        if (tgt_interval < min_interval) {
            tgt_interval = min_interval;
            log('Requested arrival rate of ' + this.frequency + ' acph overridden to ' +
                'maintain minimum of ' + min_entrail + ' miles entrail on arrival stream ' +
                'following route ' + $.map(this.fixes, (v) => v.fix).join('-'), LOG.INFO);
        }

        const max_interval = tgt_interval + (tgt_interval - min_interval);

        return _random(min_interval, max_interval);
    }
}
