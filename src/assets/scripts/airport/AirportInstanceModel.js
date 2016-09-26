/* eslint-disable no-multi-spaces, func-names, camelcase, no-undef, max-len, object-shorthand */
import $ from 'jquery';
import _has from 'lodash/has';
import _map from 'lodash/map';
import _isEmpty from 'lodash/isEmpty';
import _uniq from 'lodash/uniq';

import PositionModel from '../base/PositionModel';
import Runway from './Runway';
import { ArrivalFactory } from './Arrival/ArrivalFactory';
import { DepartureFactory } from './Departure/DepartureFactory';
import { degreesToRadians } from '../utilities/unitConverters';
import { round, abs, sin } from '../math/core';
import { vlen, vsub } from '../math/vector';
import { LOG } from '../constants/logLevel';
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

// TODO: this class contains a lot of .hasOwnProperty() type checks (converted to _has for now). is there a need for
// such defensiveness? or can some of that be accomplished on init and then smiply update the prop if need be?
/**
 * @class AirportInstance
 * @extends Fiber
 */
export default class AirportInstance {
    constructor(options = {}) {
        // FIXME: All properties of this class should be instantiated here, even if they wont have values yet.
        // there is a lot of logic below that can be elimininated by simply instantiating values here.
        this.loaded   = false;
        this.loading  = false;
        this.name     = null;
        this.icao     = null;
        this.radio    = null;
        this.level    = null;
        this.elevation = 0;
        this.runways  = [];
        this.runway   = null;
        this.fixes    = {};
        this.real_fixes = {};
        this.sids     = {};
        this.stars    = {};
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

        this.wind     = {
            speed: 10,
            angle: 0
        };

        this.ctr_radius  = 80;
        this.ctr_ceiling = 10000;
        this.initial_alt = 5000;

        this.parse(options);
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

    // FIXME: this method is waaaaay to long. there is a lot here that can be abstracted or flat out removed and
    // moved to init(). Other bits could be moved to class methods instead of inline. this function does
    // way too much.  Simplify!
    parse(data) {
        if (data.position) {
            this.position = new PositionModel(data.position);
        }

        if (this.position && (this.position.elevation != null)) {
            this.elevation = this.position.elevation;
        }

        if (data.magnetic_north) {
            this.magnetic_north = degreesToRadians(data.magnetic_north);
        } else {
            // TODO: this else could be plced in init().
            this.magnetic_north = 0;
        }

        // FIXME: the rest of these ifs could bet done with a simple `this.prop = data.prop || null`
        // or any other appropriate invaild value for the data type.
        if (data.name) {
            this.name = data.name;
        }

        if (data.icao) {
            this.icao = data.icao;
        }

        if (data.radio) {
            this.radio = data.radio;
        }

        if (data.ctr_radius) {
            this.ctr_radius = data.ctr_radius;
        }

        if (data.ctr_ceiling) {
            this.ctr_ceiling = data.ctr_ceiling;
        }

        if (data.initial_alt) {
            this.initial_alt = data.initial_alt;
        }

        if (data.rr_radius_nm) {
            this.rr_radius_nm = data.rr_radius_nm;
        }

        if (data.rr_center) {
            this.rr_center = data.rr_center;
        }

        if (data.level) {
            this.level = data.level;
        }

        this.has_terrain = false || data.has_terrain;

        if (this.has_terrain) {
            this.loadTerrain();
        }

        // TODO: this should be its own method, or own group of methods
        // create 3d polygonal airspace
        if (data.airspace) {
            const areas = [];
            // for each area
            for (let i = 0; i < data.airspace.length; i++) {
                const positions = [];

                // for each point
                for (let j = 0; j < data.airspace[i].poly.length; j++) {
                    positions.push(
                        new PositionModel(data.airspace[i].poly[j], this.position, this.magnetic_north)
                    );
                }

                areas.push(new Area(positions, data.airspace[i].floor * 100,
                data.airspace[i].ceiling * 100, data.airspace[i].airspace_class));
            }

            this.airspace = areas;

            // airspace perimeter (assumed to be first entry in data.airspace)
            this.perimeter = areas[0];

            // change ctr_radius to point along perimeter that's farthest from rr_center
            const pos = new PositionModel(this.perimeter.poly[0].position, this.position, this.magnetic_north);
            // FIXME: it doesnt look like this var is being used at all?
            // const len = nm(vlen(vsub(pos.position, this.position.position)));
            // FIXME: this reassignment is not needed
            const apt = this;

            this.ctr_radius = Math.max.apply(
                Math,
                _map(this.perimeter.poly, (v) => vlen(
                    vsub(
                        v.position,
                        new PositionModel(apt.rr_center, apt.position, apt.magnetic_north).position
                    )
                ))
            );
        }

        if (data.runways) {
            for (let i = 0; i < data.runways.length; i++) {
                data.runways[i].reference_position = this.position;
                data.runways[i].magnetic_north = this.magnetic_north;
                // TODO: what do the 0 and 1 mean? magic numbers should be enumerated
                this.runways.push([
                    new Runway(data.runways[i], 0, this),
                    new Runway(data.runways[i], 1, this)
                ]);
            }
        }

        if (data.fixes) {
            for (const fix in data.fixes) {
                const fixName = fix.toUpperCase();

                this.fixes[fixName] = new PositionModel(data.fixes[fix], this.position, this.magnetic_north);

                if (fix.indexOf('_') !== 0) {
                    this.real_fixes[fixName] = this.fixes[fixName];
                }
            }
        }

        // import the sids
        if (data.sids) {
            this.sids = data.sids;

            // Check each SID fix and log if not found in the airport fix list
            for (const sid in this.sids) {
                if (_has(this.sids, sid)) {
                    const fixList = this.sids[sid];

                    for (let i = 0; i < fixList.length; i++) {
                        const fixname = fixList[i];

                        if (!this.airport.fixes[fixname]) {
                            log(`SID ${sid} fix not found: ${fixname}`, LOG.WARNING);
                        }
                    }
                }
            }
        }

        if (data.stars) {
            this.stars = data.stars;
        }

        if (data.airways) {
            this.airways = data.airways;
        }

        if (data.maps) {
            for (const m in data.maps) {
                this.maps[m] = [];
                const lines = data.maps[m];

                // convert GPS coordinates to km-based position rel to airport
                for (const i in lines) {
                    const start = new PositionModel([lines[i][0], lines[i][1]], this.position, this.magnetic_north).position;
                    const end = new PositionModel([lines[i][2], lines[i][3]], this.position, this.magnetic_north).position;

                    this.maps[m].push([start[0], start[1], end[0], end[1]]);
                }
            }
        }

        if (data.restricted) {
            // TODO: need better name than `r`.
            const r = data.restricted;
            // FIXME: this is a big no no. This makes me think there are scoping issues here. with es2015 that
            // shouldnt be as much of a problem now.
            const self = this;

            for (const i in r) {
                // TODO: what is `obj` going to be? need better name.
                const obj = {};
                if (r[i].name) {
                    obj.name = r[i].name;
                }

                obj.height = parseElevation(r[i].height);
                obj.coordinates = $.map(r[i].coordinates, (v) => {
                    return [(new PositionModel(v, self.position, self.magnetic_north)).position];
                });

                // TODO: is this right? max and min are getting set to the same value?
                const coords = obj.coordinates;
                let coords_max = coords[0];
                let coords_min = coords[0];

                for (const i in coords) {
                    const v = coords[i];
                    coords_max = [Math.max(v[0], coords_max[0]), Math.max(v[1], coords_max[1])];
                    coords_min = [Math.min(v[0], coords_min[0]), Math.min(v[1], coords_min[1])];
                }

                obj.center = vscale(vadd(coords_max, coords_min), 0.5);
                self.restricted_areas.push(obj);
            }
        }

        if (data.wind) {
            this.wind = data.wind;
            this.wind.angle = degreesToRadians(this.wind.angle);
        }

        if (data.departures) {
            this.departures = DepartureFactory(this, data.departures);
        }

        if (data.arrivals) {
            for (let i = 0; i < data.arrivals.length; i++) {
                if (!_has(data.arrivals[i], 'type')) {
                    log(`${this.icao} arrival stream #${i} not given type!`, LOG.WARNING);
                } else {
                    this.arrivals.push(ArrivalFactory(this, data.arrivals[i]));
                }
            }
        }

        // verify we know where all the fixes are
        this.checkFixes();

        // ***** Generate Airport Metadata *****

        // Runway Metadata
        for (const rwy1 in this.runways) {
            for (const rwy1end in this.runways[rwy1]) {
                // setup primary runway object
                this.metadata.rwy[this.runways[rwy1][rwy1end].name] = {};

                for (const rwy2 in this.runways) {
                    if (rwy1 === rwy2) {
                        continue;
                    }

                    for (const rwy2end in this.runways[rwy2]) {
                        //setup secondary runway subobject
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

        $('#airport')
            .text(this.icao.toUpperCase())
            .attr('title', this.name);

        prop.canvas.draw_labels = true;
        $('.toggle-labels').toggle(!_isEmpty(this.maps));
        $('.toggle-restricted-areas').toggle((this.restricted_areas || []).length > 0);
        $('.toggle-sids').toggle(!_isEmpty(this.sids));

        prop.canvas.dirty = true;
        $('.toggle-terrain').toggle(!_isEmpty(this.terrain));

        window.gameController.game_reset_score();
        this.start = window.gameController.game_time();
        this.updateRunway();
        this.addAircraft();
        updateRun(true);
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

        for (const i in data.features) {
            const f = data.features[i],
            ele = round(f.properties.elevation / 0.3048, 1000); // m => ft, rounded to 1K (but not divided)

            if (!apt.terrain[ele]) {
                apt.terrain[ele] = [];
            }

            let multipoly = f.geometry.coordinates;
            if (f.geometry.type == 'LineString') {
                multipoly = [[multipoly]];
            }

            if (f.geometry.type == 'Polygon') {
                multipoly = [multipoly];
            }

            $.each(multipoly, function(i, poly) {
                  // multipoly contains several polys
                  // each poly has 1st outer ring and other rings are holes
                apt.terrain[ele].push($.map(poly, function(line_string) {
                    return [
                        $.map(line_string, function(pt) {
                            var pos = new PositionModel(pt, apt.position, apt.magnetic_north);
                            pos.parse4326();
                            return [pos.position];
                        })
                    ];
                }));
            });
        }
    }

    loadTerrain() {
        // TODO: there is a lot of binding here, use => functions and this probably wont be an issue.
        zlsa.atc.loadAsset({
            url: `assets/airports/terrain/${this.icao.toLowerCase()}.geojson`,
            immediate: true
        })
        .done(function(data) {
            try {
                log('Parsing terrain');
                this.parseTerrain(data);
            } catch (e) {
                log(e.message);
            }

            this.loading = false;
            this.loaded = true;
            this.set();
        }.bind(this))
        .fail(function(jqXHR, textStatus, errorThrown) {
            this.loading = false;
            console.error(`Unable to load airport/terrain/${this.icao}: ${textStatus}`);
            prop.airport.current.set();
        }.bind(this));
    }

    // TODO: there is a lot of binding here, use => functions and this probably wont be an issue.
    load() {
        if (this.loaded) {
            return;
        }

        updateRun(false);
        this.loading = true;

        zlsa.atc.loadAsset({
            url: `assets/airports/${this.icao.toLowerCase()}.json`,
            immediate: true
        })
        .done(function(data) {
            this.parse(data);

            if (this.has_terrain) {
                return;
            }

            this.loading = false;
            this.loaded = true;
            this.set();
        }.bind(this))
        .fail(function(jqXHR, textStatus, errorThrown) {
            this.loading = false;
            console.error(`Unable to load airport/${this.icao}: ${textStatus}`);
            prop.airport.current.set();
        }.bind(this));
    }

    getRestrictedAreas() {
        return this.restricted_areas || null;
    }

    getFix(name) {
        if (!name) {
            return null;
        }

        const fixes = window.airportController.airport_get().fixes;

        // FIXME: simplify this
        if (Object.keys(fixes).indexOf(name.toUpperCase()) === -1) {
            return;
        }

        return fixes[name.toUpperCase()].position;
    }

    getSID(id, exit, rwy) {
        if (!(id && exit && rwy)) {
            return null;
        }

        if (Object.keys(this.sids).indexOf(id) === -1) {
            return;
        }

        const fixes = [];
        const sid = this.sids[id];

        // runway portion
        if (_has(sid.rwy, rwy)) {
            for (let i = 0; i < sid.rwy[rwy].length; i++) {
                if (typeof sid.rwy[rwy][i] === 'string') {
                    fixes.push([sid.rwy[rwy][i], null]);
                } else {
                    fixes.push(sid.rwy[rwy][i]);
                }
            }
        }

        // body portion
        if (_has(sid, 'body')) {
            for (let i = 0; i < sid.body.length; i++) {
                if (typeof sid.body[i] === 'string') {
                    fixes.push([sid.body[i], null]);
                } else {
                    fixes.push(sid.body[i]);
                }
            }
        }

        // exit portion
        if (_has(sid, 'exitPoints')) {
            for (let i = 0; i < sid.exitPoints[exit].length; i++) {
                if (typeof sid.exitPoints[exit][i] === 'string') {
                    fixes.push([sid.exitPoints[exit][i], null]);
                } else {
                    fixes.push(sid.exitPoints[exit][i]);
                }
            }
        }

        return fixes;
    }

    getSIDExitPoint(id) {
        // if ends at fix for which the SID is named, return end fix
        if (!_has(this.sids[id], 'exitPoints')) {
            return this.sids[id].icao;
        }

        // if has exitPoints, return a randomly selected one
        const exits = Object.keys(this.sids[id].exitPoints);
        return exits[Math.floor(Math.random() * exits.length)];
    }

    getSIDName(id, rwy) {
        if (_has(this.sids[id], 'suffix')) {
            return `${this.sids[id].name} ${this.sids[id].suffix[rwy]}`;
        }

        return this.sids[id].name;
    }

    getSIDid(id, rwy) {
        if (_has(this.sids[id], 'suffix')) {
            return this.sids[id].icao + this.sids[id].suffix[rwy];
        }

        return this.sids[id].icao;
    }

    /**
      * Return an array of [Waypoint, fixRestrictions] for a given STAR
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
    getSTAR(id, entry, /* optional */ rwy) {
        if (!(id && entry) || Object.keys(this.stars).indexOf(id) === -1) {
            return null;
        }

        const fixes = [];
        const star = this.stars[id];

        // entry portion
        if (_has(star, 'entryPoints')) {
            for (let i = 0; i < star.entryPoints[entry].length; i++) {
                if (typeof star.entryPoints[entry][i] === 'string') {
                    fixes.push([star.entryPoints[entry][i], null]);
                } else {
                    fixes.push(star.entryPoints[entry][i]);
                }
            }
        }

        // body portion
        if (_has(star, 'body')) {
            for (let i = 0; i < star.body.length; i++) {
                if (typeof star.body[i] === 'string') {
                    fixes.push([star.body[i], null]);
                } else {
                    fixes.push(star.body[i]);
                }
            }
        }

        // runway portion
        if (star.rwy && _has(star.rwy, rwy)) {
            for (let i = 0; i < star.rwy[rwy].length; i++) {
                if (typeof star.rwy[rwy][i] === 'string') {
                    fixes.push([star.rwy[rwy][i], null]);
                } else {
                    fixes.push(star.rwy[rwy][i]);
                }
            }
        }

        return fixes;
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
                    for(let i in this.sids[s].draw) {
                        for(let j = 0; j < this.sids[s].draw[i].length; j++) {
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
