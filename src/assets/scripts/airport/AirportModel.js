/* eslint-disable no-multi-spaces, func-names, camelcase, no-undef, max-len, object-shorthand */
import $ from 'jquery';
import _forEach from 'lodash/forEach';
import _get from 'lodash/get';
import _has from 'lodash/has';
import _map from 'lodash/map';
import _isEmpty from 'lodash/isEmpty';
import _uniq from 'lodash/uniq';
import Area from '../base/AreaModel';
import PositionModel from '../base/PositionModel';
import RunwayModel from './RunwayModel';
import StandardRouteCollection from './StandardRoute/StandardRouteCollection';
import { ArrivalFactory } from './Arrival/ArrivalFactory';
import { DepartureFactory } from './Departure/DepartureFactory';
import { degreesToRadians, parseElevation } from '../utilities/unitConverters';
import { round, abs, sin, crange } from '../math/core';
import { angle_offset } from '../math/circle';
import { getOffset } from '../math/flightMath';
import { vlen, vsub, vadd, vscale, raysIntersect } from '../math/vector';
import { LOG } from '../constants/logLevel';
import { SELECTORS } from '../constants/selectors';
import { STORAGE_KEY } from '../constants/storageKeys';

// TODO: This function should really live in a different file and have tests.
// what does ra stand for? runway angle? what about n? need better names here.
/**
 * @function ra
 * @param n {numer}
 * @return {number}
 */
const ra = (n) => {
    const deviation = degreesToRadians(10);
    return n + crange(0, Math.random(), 1, -deviation, deviation);
};

const DEFAULT_CTR_RADIUS_NM = 80;
const DEFAULT_CTR_CEILING_FT = 10000;
const DEFAULT_INITIAL_ALTITUDE_FT = 5000;
const DEAFULT_RR_RADIUS_NM = 5;

// TODO: this class contains a lot of .hasOwnProperty() type checks (converted to _has for now). is there a need for
// such defensiveness? or can some of that be accomplished on init and then smiply update the prop if need be?
/**
 * @class AirportModel
 */
export default class AirportModel {
    /**
     * @constructor
     * @param options {object}
     * @param updateRun {function}
     */
    constructor(options = {}, updateRun) {
        this.updateRun = updateRun;
        // FIXME: All properties of this class should be instantiated here, even if they wont have values yet.
        // there is a lot of logic below that can be elimininated by simply instantiating values here.
        this.loaded   = false;
        this.loading  = false;
        this.name     = null;
        this.icao     = null;
        this.radio    = null;
        this.level    = null;

        this.position = null;

        this.runways  = [];
        this.runway   = null;

        this.fixes    = {};
        // TODO: what is the difference between a `real_fix` and `fix`?
        this.real_fixes = {};
        this.sids     = {};
        this.sidCollection = null;
        this.stars    = {};
        this.starCollection = null;
        this.maps     = {};
        this.airways  = {};
        this.restricted_areas = [];
        this.metadata = {
            rwy: {}
        };
        // array of areas under this sector's control. If null, draws circle with diameter of 'ctr_radius'
        this.airspace = null;
        // area outlining the outermost lateral airspace boundary. Comes from this.airspace[0]
        this.perimeter = null;
        this.timeout  = {
            runway: null,
            departure: null
        };
        this.departures = null;
        this.arrivals   = [];

        this.wind  = {
            speed: 10,
            angle: 0
        };

        this.ctr_radius  = 80;
        this.ctr_ceiling = 10000;
        this.initial_alt = 5000;
        this.rr_radius_nm = 0;
        this.rr_center = 0;

        this.parse(options);
    }

    get elevation() {
        return this.position.elevation;
    }

    get magnetic_north() {
        return degreesToRadians(this.position.magnetic_north);
    }

    parse(data) {
        this.setCurrentPosition(data.position, data.magnetic_north);

        this.name = _get(data, 'name', null);
        this.icao = _get(data, 'icao', null);
        this.radio = _get(data, 'radio', null);
        this.has_terrain = _get(data, 'has_terrain', false);
        this.stars = _get(data, 'stars', {});
        this.airways = _get(data, 'airways', {});
        this.ctr_radius = _get(data, 'ctr_radius', DEFAULT_CTR_RADIUS_NM);
        this.ctr_ceiling = _get(data, 'ctr_ceiling', DEFAULT_CTR_CEILING_FT);
        this.initial_alt = _get(data, 'initial_alt', DEFAULT_INITIAL_ALTITUDE_FT);
        this.rr_radius_nm = _get(data, 'rr_radius_nm');
        this.rr_center = _get(data, 'rr_center');
        this.level = _get(data, 'level', null);
        this.sidCollection = new StandardRouteCollection(data.sids);
        this.starCollection = new StandardRouteCollection(data.stars);

        this.loadTerrain();
        this.buildAirportAirspace(data.airspace);
        this.buildAirportRunways(data.runways);
        this.buildFixes(data.fixes);
        this.verifySidFixes(data.sids);
        this.buildAirportMaps(data.maps);
        this.buildRestrictedAreas(data.restricted);
        this.updateCurrentWind(data.wind);
        this.buildAirportDepartures(data.departures);
        this.buildArrivals(data.arrivals);
        this.checkFixes();
        this.buildRunwayMetaData();
    }

    /**
     * @for AirportModel
     * @method setCurrentPosition
     * @param currentPosition {array}
     */
    setCurrentPosition(currentPosition, magneticNorth) {
        if (!currentPosition) {
            return;
        }

        this.position = new PositionModel(currentPosition, null, magneticNorth);
    }

    /**
     * create 3d polygonal airspace
     *
     * @for AirportModel
     * @method buildAirportAirspace
     * @param airspace
     */
    buildAirportAirspace(airspace) {
        if (!airspace) {
            return;
        }

        const areas = [];

        // for each area
        _forEach(airspace, (airspaceSection) => {
            const positions = [];

            // for each point
            _forEach(airspaceSection.poly, (poly) => {
                const polyPosition = new PositionModel(poly, this.position, this.magnetic_north);

                positions.push(polyPosition);
            });

            const positionArea = new Area(
                positions,
                airspaceSection.floor * 100,
                airspaceSection.ceiling * 100,
                airspaceSection.airspace_class
            );

            areas.push(positionArea);
        });

        this.airspace = areas;

        // airspace perimeter (assumed to be first entry in data.airspace)
        this.perimeter = areas[0];

        // change ctr_radius to point along perimeter that's farthest from rr_center
        const pos = new PositionModel(this.perimeter.poly[0].position, this.position, this.magnetic_north);

        this.ctr_radius = Math.max(..._map(
            this.perimeter.poly, (v) => vlen(
                vsub(
                    v.position,
                    new PositionModel(this.rr_center, this.position, this.magnetic_north).position
                )
            )
        ));
    }

    /**
     * @for AirportModel
     * @method buildAirportRunways
     * @param runways {array}
     */
    buildAirportRunways(runways) {
        if (!runways) {
            return;
        }

        _forEach(runways, (runway) => {
            runway.reference_position = this.position;
            runway.magnetic_north = this.magnetic_north;

            // TODO: what do the 0 and 1 mean? magic numbers should be enumerated

            this.runways.push([
                new RunwayModel(runway, 0, this),
                new RunwayModel(runway, 1, this)
            ]);
        });
    }

    /**
     * @for AirportModel
     * @method buildFixes
     * @param fixes {object}
     */
    buildFixes(fixes) {
        if (!fixes) {
            return;
        }

        _forEach(fixes, (fix, key) => {
            const fixName = key.toUpperCase();
            this.fixes[fixName] = new PositionModel(fix, this.position, this.magnetic_north);

            if (fixName.indexOf('_') !== 0) {
                this.real_fixes[fixName] = this.fixes[fixName];
            }
        });
    }

    /**
     * import the sids
     *
     * @for AirportModel
     * @method verifySidFixes
     * @param sids {object}
     */
    verifySidFixes(sids) {
        if (!sids) {
            return;
        }

        this.sids = sids;

        // Check each SID fix and log if not found in the airport fix list
        _forEach(this.sids, (sid) => {
            if (_has(this.sids, sid)) {
                const fixList = this.sids[sid];

                for (let i = 0; i < fixList.length; i++) {
                    const fixname = fixList[i];

                    if (!this.airport.fixes[fixname]) {
                        log(`SID ${sid} fix not found: ${fixname}`, LOG.WARNING);
                    }
                }
            }
        });
    }

    /**
     * @for AirportModel
     * @method buildAirportMaps
     * @param maps {object}
     */
    buildAirportMaps(maps) {
        if (!maps) {
            return;
        }

        _forEach(maps, (map, key) => {
            this.maps[key] = [];
            const lines = map;

            _forEach(lines, (line) => {
                const start = new PositionModel([line[0], line[1]], this.position, this.magnetic_north).position;
                const end = new PositionModel([line[2], line[3]], this.position, this.magnetic_north).position;

                this.maps[key].push([start[0], start[1], end[0], end[1]]);
            });
        });
    }

    /**
     * @for AirportModel
     * @method buildRestrictedAreas
     * @param restrictedAreas
     */
    buildRestrictedAreas(restrictedAreas) {
        if (!restrictedAreas) {
            return;
        }

        _forEach(restrictedAreas, (area) => {
            // TODO: what is `obj` going to be? need better name.
            const obj = {};
            if (area.name) {
                obj.name = area.name;
            }

            obj.height = parseElevation(area.height);
            obj.coordinates = $.map(area.coordinates, (v) => {
                return [(new PositionModel(v, this.position, this.magnetic_north)).position];
            });

            // TODO: is this right? max and min are getting set to the same value?
            // const coords = obj.coordinates;
            let coords_max = obj.coordinates[0];
            let coords_min = obj.coordinates[0];

            _forEach(obj.coordinates, (v) => {
                coords_max = [
                    Math.max(v[0], coords_max[0]),
                    Math.max(v[1], coords_max[1])
                ];
                coords_min = [
                    Math.min(v[0], coords_min[0]),
                    Math.min(v[1], coords_min[1])
                ];
            });

            obj.center = vscale(vadd(coords_max, coords_min), 0.5);

            this.restricted_areas.push(obj);
        });
    }

    /**
     * @for AirportModel
     * @method updateCurrentWind
     * @param currentWind
     */
    updateCurrentWind(currentWind) {
        if (!currentWind) {
            return;
        }

        this.wind.speed = currentWind.speed;
        this.wind.angle = degreesToRadians(currentWind.angle);
    }

    buildAirportDepartures(departures) {
        if (!departures) {
            return;
        }

        this.departures = DepartureFactory(this, departures);
    }

    /**
     * @for AirportModel
     * @method buildArrivals
     * @param arrivals {array}
     */
    buildArrivals(arrivals) {
        if (!arrivals) {
            return;
        }

        for (let i = 0; i < arrivals.length; i++) {
            if (!_has(arrivals[i], 'type')) {
                log(`${this.icao} arrival stream #${i} not given type!`, LOG.WARNING);
            } else {
                this.arrivals.push(ArrivalFactory(this, arrivals[i]));
            }
        }
    }

    /**
     * @for AirportModel
     * @method buildRunwayMetaData
     */
    buildRunwayMetaData() {
        // TODO: translate these tol _forEach()
        for (const rwy1 in this.runways) {
            for (const rwy1end in this.runways[rwy1]) {
                // setup primary runway object
                this.metadata.rwy[this.runways[rwy1][rwy1end].name] = {};

                for (const rwy2 in this.runways) {
                    if (rwy1 === rwy2) {
                        continue;
                    }

                    for (const rwy2end in this.runways[rwy2]) {
                        // setup secondary runway subobject
                        const r1 = this.runways[rwy1][rwy1end];
                        const r2 = this.runways[rwy2][rwy2end];
                        const offset = getOffset(r1, r2.position, r1.angle);
                        this.metadata.rwy[r1.name][r2.name] = {};

                        // generate this runway pair's relationship data
                        this.metadata.rwy[r1.name][r2.name].lateral_dist = abs(offset[0]);
                        this.metadata.rwy[r1.name][r2.name].straight_dist = abs(offset[2]);
                        this.metadata.rwy[r1.name][r2.name].converging = raysIntersect(r1.position, r1.angle, r2.position, r2.angle);
                        this.metadata.rwy[r1.name][r2.name].parallel = (abs(angle_offset(r1.angle, r2.angle)) < degreesToRadians(10));
                    }
                }
            }
        }
    }

    set() {
        if (!this.loaded) {
            this.load();

            return;
        }

        localStorage[STORAGE_KEY.ATC_LAST_AIRPORT] = this.icao;
        prop.airport.current = this;

        $(SELECTORS.DOM_SELECTORS.AIRPORT)
            .text(this.icao.toUpperCase())
            .attr('title', this.name);

        prop.canvas.draw_labels = true;
        $(SELECTORS.DOM_SELECTORS.TOGGLE_LABELS).toggle(!_isEmpty(this.maps));
        $(SELECTORS.DOM_SELECTORS.TOGGLE_RESTRICTED_AREAS).toggle((this.restricted_areas || []).length > 0);
        $(SELECTORS.DOM_SELECTORS.TOGGLE_SIDS).toggle(!_isEmpty(this.sids));

        prop.canvas.dirty = true;
        $(SELECTORS.DOM_SELECTORS.TOGGLE_TERRAIN).toggle(!_isEmpty(this.terrain));

        window.gameController.game_reset_score();
        this.start = window.gameController.game_time();
        this.updateRunway();
        this.addAircraft();
        this.updateRun(true);
    }

    unset() {
        for (let i = 0; i < this.arrivals.length; i++) {
            this.arrivals[i].stop();
        }

        this.departures.stop();

        if (this.timeout.runway) {
            window.gameController.game_clear_timeout(this.timeout.runway);
        }
    }

    addAircraft() {
        if (this.departures) {
            this.departures.start();
        }

        if (this.arrivals) {
            for (let i = 0; i < this.arrivals.length; i++) {
                this.arrivals[i].start();
            }
        }
    }

    getWind() {
        // TODO: there are a lot of magic numbers here. What are they for and what do they mean? These should be enumerated.
        const wind = clone(this.wind);
        let s = 1;
        const angle_factor = sin((s + window.gameController.game_time()) * 0.5) + sin((s + window.gameController.game_time()) * 2);
        // TODO: why is this var getting reassigned to a magic number?
        s = 100;
        const speed_factor = sin((s + window.gameController.game_time()) * 0.5) + sin((s + window.gameController.game_time()) * 2);
        wind.angle += crange(-1, angle_factor, 1, degreesToRadians(-4), degreesToRadians(4));
        wind.speed *= crange(-1, speed_factor, 1, 0.9, 1.05);

        return wind;
    }

    updateRunway(length = 0) {
        // TODO: this method contains some ambiguous names. need better names.
        const wind = this.getWind();
        const headwind = {};

        for (let i = 0; i < this.runways.length; i++) {
            const runway = this.runways[i];
            headwind[runway[0].name] = Math.cos(runway[0].angle - ra(wind.angle)) * wind.speed;
            headwind[runway[1].name] = Math.cos(runway[1].angle - ra(wind.angle)) * wind.speed;
        }

        let best_runway = '';
        let best_runway_headwind = -Infinity;
        for (const runway in headwind) {
            if (headwind[runway] > best_runway_headwind && this.getRunway(runway).length > length) {
                best_runway = runway;
                best_runway_headwind = headwind[runway];
            }
        }

        this.runway = best_runway;
        this.timeout.runway = window.gameController.game_timeout(this.updateRunway, Math.random() * 30, this);
    }

    selectRunway(length) {
        return this.runway;
    }

    parseTerrain(data) {
        // terrain must be in geojson format
        const apt = this;
        apt.terrain = {};


        _forEach(data.features, (f) => {
            // const f = data.features[i];
            const ele = round(f.properties.elevation / 0.3048, 1000); // m => ft, rounded to 1K (but not divided)

            if (!apt.terrain[ele]) {
                apt.terrain[ele] = [];
            }

            let multipoly = f.geometry.coordinates;
            // TODO: add enumeration
            if (f.geometry.type === 'LineString') {
                multipoly = [[multipoly]];
            }

            // TODO: add enumeration
            if (f.geometry.type === 'Polygon') {
                multipoly = [multipoly];
            }

            $.each(multipoly, (i, poly) => {
                // multipoly contains several polys
                // each poly has 1st outer ring and other rings are holes
                apt.terrain[ele].push($.map(poly, (line_string) => {
                    return [
                        $.map(line_string, (pt) => {
                            const pos = new PositionModel(pt, apt.position, apt.magnetic_north);
                            pos.parse4326();

                            return [pos.position];
                        })
                    ];
                }));
            });
        });
    }

    loadTerrain() {
        if (!this.has_terrain) {
            return;
        }

        // TODO: there is a lot of binding here, use => functions and this probably wont be an issue.
        zlsa.atc.loadAsset({
            url: `assets/airports/terrain/${this.icao.toLowerCase()}.geojson`,
            immediate: true
        })
        // TODO: change to onSuccess and onError handler abstractions
        .done((data) => {
            try {
                log('Parsing terrain');
                this.parseTerrain(data);
            } catch (e) {
                log(e.message);
            }

            this.loading = false;
            this.loaded = true;
            this.set();
        })
        .fail((jqXHR, textStatus, errorThrown) => {
            this.loading = false;
            console.error(`Unable to load airport/terrain/${this.icao}: ${textStatus}`);
            prop.airport.current.set();
        });
    }

    load() {
        if (this.loaded) {
            return;
        }

        this.updateRun(false);
        this.loading = true;

        zlsa.atc.loadAsset({
            url: `assets/airports/${this.icao.toLowerCase()}.json`,
            immediate: true
        })
        // TODO: change to onSuccess and onError handler abstractions
        .done((data) => {
            this.parse(data);

            if (this.has_terrain) {
                return;
            }

            this.loading = false;
            this.loaded = true;
            this.set();
        })
        .fail((jqXHR, textStatus, errorThrown) => {
            this.loading = false;
            console.error(`Unable to load airport/${this.icao}: ${textStatus}`);
            prop.airport.current.set();
        });
    }

    /**
     * @for AirportModel
     * @method getRestrictedAreas
     * @return {array|null}
     */
    getRestrictedAreas() {
        return _get(this, 'restricted_areas', null);
    }

    /**
     * @for AirportModel
     * @method getFixPosition
     * @param name {string}
     * @return {array}
     */
    getFixPosition(name) {
        if (!name || !_has(this.fixes, name)) {
            return null;
        }

        // TODO: this may be overly defensive
        const fixName = name.toUpperCase();

        return this.fixes[fixName].position;
    }

    /**
     *
     */
    getSID(id, exit, rwy) {
        return this.sidCollection.findFixesForSidByRunwayAndExit(id, exit, rwy);
    }

    /**
     * @for AirportModel
     * @method getSIDExitPoint
     * @param icao {string}  Name of SID
     * @return {string}  Name of Exit fix in SID
     */
    getSIDExitPoint(icao) {
        return this.sidCollection.findRandomExitPointForSIDIcao(icao);
    }

    // FIXME: possibly unused
    getSIDName(id, rwy) {
        console.warn('AirportModel.getSIDName() IS IN USE: ', id, rwy);

        if (_has(this.sids[id], 'suffix')) {
            return `${this.sids[id].name} ${this.sids[id].suffix[rwy]}`;
        }

        return this.sids[id].name;
    }

    // FIXME: possibly unused
    getSIDid(id, rwy) {
        console.warn('AirportModel.getSIDid IS IN USE: ', id, rwy);

        if (_has(this.sids[id], 'suffix')) {
            return this.sids[id].icao + this.sids[id].suffix[rwy];
        }

        return this.sids[id].icao;
    }

    /**
      * Return an array of [Waypoint, fixRestrictions] for a given STAR
      *
      * @param {string} id - the identifier for the STAR (eg 'LENDY6')
      * @param {string} entry - the entryPoint from which to join the STAR
      * @param {string} rwy - (optional) the planned arrival runway
      * Note: Passing a value for 'rwy' will help the fms distinguish between
      *       different branches of a STAR, when it splits into different paths
      *       for landing on different runways (eg 'HAWKZ4, landing south' vs
      *       'HAWKZ4, landing north'). Not strictly required, but not passing
      *       it will cause an incomplete route in many cases (depends on the
      *       design of the actual STAR in the airport's json file).
     */
    getSTAR(id, entry, rwy) {
        return this.starCollection.findFixesForStarByEntryAndRunway(id, entry, rwy);
    }

    getRunway(name) {
        if (!name) {
            return null;
        }

        name = name.toLowerCase();

        for (let i = 0; i < this.runways.length; i++) {
            if (this.runways[i][0].name.toLowerCase() === name) {
                return this.runways[i][0];
            }
            if (this.runways[i][1].name.toLowerCase() === name) {
                return this.runways[i][1];
            }
        }

        return null;
    }

    // TODO: this method has A LOT of nested for loops. perhaps some of this logic could be abstracted
    // to several smaller methods?
    /**
     * Verifies all fixes used in the airport also have defined positions
     *
     * @for AirportModel
     * @method checkFixes
     */
    checkFixes() {
        const fixes = [];

        // Gather fixes used by SIDs
        if (_has(this, 'sids')) {
            for (const s in this.sids) {
                // runway portion
                if (_has(this.sids[s], 'rwy')) {
                    for (const r in this.sids[s].rwy) {
                        for (const i in this.sids[s].rwy[r]) {
                            if (typeof this.sids[s].rwy[r][i] === 'string') {
                                fixes.push(this.sids[s].rwy[r][i]);
                            } else {
                                fixes.push(this.sids[s].rwy[r][i][0]);
                            }
                        }
                    }
                }

                // body portion
                if (_has(this.sids[s], 'body')) {
                    for (let i in this.sids[s].body) {
                        if (typeof this.sids[s].body[i] === 'string') {
                            fixes.push(this.sids[s].body[i]);
                        } else {
                            fixes.push(this.sids[s].body[i][0]);
                        }
                    }
                }

                // exitPoints portion
                if (_has(this.sids[s], 'exitPoints')) {
                    for (let t in this.sids[s].exitPoints) {
                        for (let i in this.sids[s].exitPoints[t]) {
                            if (typeof this.sids[s].exitPoints[t][i] === 'string') {
                                fixes.push(this.sids[s].exitPoints[t][i]);
                            } else {
                                fixes.push(this.sids[s].exitPoints[t][i][0]);
                            }
                        }
                    }
                }

                // draw portion
                if (_has(this.sids[s], 'draw')) {
                    for (let i in this.sids[s].draw) {
                        for (let j = 0; j < this.sids[s].draw[i].length; j++) {
                            fixes.push(this.sids[s].draw[i][j].replace('*', ''));
                        }
                    }
                }
            }
        }

        // Gather fixes used by STARs
        if (_has(this, 'stars')) {
            for (const s in this.stars) {
                // entryPoints portion
                if (_has(this.stars[s], 'entryPoints')) {
                    for (const t in this.stars[s].entryPoints) {
                        for (const i in this.stars[s].entryPoints[t]) {
                            if (typeof this.stars[s].entryPoints[t][i] === 'string') {
                                fixes.push(this.stars[s].entryPoints[t][i]);
                            } else {
                                fixes.push(this.stars[s].entryPoints[t][i][0]);
                            }
                        }
                    }
                }

                // body portion
                if (_has(this.stars[s], 'body')) {
                    for (const i in this.stars[s].body) {
                        if (typeof this.stars[s].body[i] === 'string') {
                            fixes.push(this.stars[s].body[i]);
                        } else {
                            fixes.push(this.stars[s].body[i][0]);
                        }
                    }
                }

                // runway portion
                if (_has(this.stars[s], 'rwy')) {
                    for (const r in this.stars[s].rwy) {
                        for (const i in this.stars[s].rwy[r]) {
                            if (typeof this.stars[s].rwy[r][i] === 'string') {
                                fixes.push(this.stars[s].rwy[r][i]);
                            } else {
                                fixes.push(this.stars[s].rwy[r][i][0]);
                            }
                        }
                    }
                }

                // draw portion
                if (_has(this.stars[s], 'draw')) {
                    for (const i in this.stars[s].draw) {
                        for (const j in this.stars[s].draw[i]) {
                            fixes.push(this.stars[s].draw[i][j].replace('*', ''));
                        }
                    }
                }
            }
        }

        // Gather fixes used by airways
        if (_has(this, 'airways')) {
            for (const a in this.airways) {
                for (const i in this.airways[a]) {
                    fixes.push(this.airways[a][i]);
                }
            }
        }

        // Get (unique) list of fixes used that are not in 'this.fixes'
        // FIXME: this reassignment is propably not needed anymore.
        const apt = this;
        // TODO: this could also be done with _sortedUniq
        const missing = _uniq(fixes.filter((f) => !apt.fixes.hasOwnProperty(f)).sort());

        // there are some... yell at the airport designer!!! :)
        if (missing.length > 0) {
            log(`${this.icao} uses the following fixes which are not listed in ${airport.fixes}: ${missing.join(' ')}`, LOG.WARNING);
        }
    }
}
