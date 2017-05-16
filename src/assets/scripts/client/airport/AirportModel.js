/* eslint-disable no-multi-spaces, func-names, camelcase, max-len, object-shorthand */
import $ from 'jquery';
import _ceil from 'lodash/ceil';
import _forEach from 'lodash/forEach';
import _get from 'lodash/get';
import _head from 'lodash/head';
import _map from 'lodash/map';
import EventBus from '../lib/EventBus';
import AirspaceModel from './AirspaceModel';
import DynamicPositionModel from '../base/DynamicPositionModel';
import RunwayModel from './RunwayModel';
import StaticPositionModel from '../base/StaticPositionModel';
import { isValidGpsCoordinatePair } from '../base/positionModelHelpers';
import { degreesToRadians, parseElevation } from '../utilities/unitConverters';
import { round, abs, sin, extrapolate_range_clamp } from '../math/core';
import { angle_offset } from '../math/circle';
import { getOffset } from '../math/flightMath';
import { vlen, vsub, vadd, vscale, raysIntersect } from '../math/vector';
import {
    FLIGHT_CATEGORY,
    PERFORMANCE
} from '../constants/aircraftConstants';
import { EVENT } from '../constants/eventNames';
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

    return n + extrapolate_range_clamp(0, Math.random(), 1, -deviation, deviation);
};

const DEFAULT_CTR_RADIUS_NM = 80;
const DEFAULT_CTR_CEILING_FT = 10000;
const DEFAULT_INITIAL_ALTITUDE_FT = 5000;

/**
 *
 *
 * @class AirportModel
 */
export default class AirportModel {
    /**
     * @constructor
     * @param options {object}
     * @param updateRun {function}
     * @param onAirportChange {function}  callback method to call onAirportChange
     */
    constructor(options = {}, updateRun, onAirportChange) {
        if (!updateRun || !onAirportChange) {
            console.log('::: ERROR', !updateRun, !onAirportChange);
            return;
        }

        this.eventBus = EventBus;

        this.updateRun = updateRun;
        this.onAirportChange = onAirportChange;
        this.data = {};

        // TODO: All properties of this class should be instantiated here, even if they wont have values yet.
        // there is a lot of logic below that can be elimininated by simply instantiating values here.
        this.arrivalRunway = null;
        this.departureRunway = null;
        this.loaded = false;
        this.loading = false;
        this.name = null;
        this.icao = null;
        this.wip = null;
        this.radio = null;
        this.level = null;
        this._positionModel = null;
        this.runways = [];
        this.maps = {};
        this.airways = {};
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

        this.wind  = {
            speed: 10,
            angle: 0
        };

        this.ctr_radius = 80;
        this.ctr_ceiling = 10000;
        this.initial_alt = 5000;
        this.rr_radius_nm = 0;
        this.rr_center = 0;

        this.parse(options);
    }

    /**
     * @property elevation
     * @return {number}
     */
    get elevation() {
        return this._positionModel.elevation;
    }

    /**
     * Provide read-only public access to this._positionModel
     *
     * @for SpawnPatternModel
     * @property position
     * @type {StaticPositionModel}
     */
    get positionModel() {
        return this._positionModel;
    }

    /**
     * Fascade to access relative position
     *
     * @for AirportModel
     * @property relativePosition
     * @type {array<number>} [kilometersNorth, kilometersEast]
     */
    get relativePosition() {
        return this._positionModel.relativePosition;
    }

    /**
     * Fascade to access the airport's position's magnetic declination value
     *
     * @for AirportModel
     * @property magneticNorth
     * @return {number}
     */
    get magneticNorth() {
        return this._positionModel.magneticNorth;
    }

    /**
     * Minimum altitude an aircraft can be assigned to.
     *
     * @property minAssignableAltitude
     * @return {number}
     */
    get minAssignableAltitude() {
        return _ceil(this.elevation + 1000, -2);
    }

    /**
     * Minimum descent altitude of an instrument approach
     *
     * This is 200 feet AGL but every airport is at a different elevation
     * This provides easy access to the correct value from within an aircraft
     *
     * @property minDescentAltitude
     * @return {number}
     */
    get minDescentAltitude() {
        return Math.floor(this.elevation + PERFORMANCE.INSTRUMENT_APPROACH_MINIMUM_DESCENT_ALTITUDE);
    }

    /**
     * Maximum altitude an aircraft can be assigned to.
     *
     * @property maxAssignableAltitude
     * @return {number}
     */
    get maxAssignableAltitude() {
        return this.ctr_ceiling;
    }

    /**
     * @for AirportModel
     * @method parse
     * @param data {object}
     */
    parse(data) {
        this.name = _get(data, 'name', this.name);
        this.icao = _get(data, 'icao', this.icao).toLowerCase();
        this.level = _get(data, 'level', this.level);
        this.wip = _get(data, 'wip', this.wip);
        // exit early if `position` doesn't exist in data. on app initialiazation, we loop through every airport
        // in the `airportLoadList` and instantiate a model for each but wont have the full data set until the
        // airport json file is loaded.
        if (!data.position) {
            return;
        }

        this.setCurrentPosition(data.position, degreesToRadians(data.magnetic_north));

        this.radio = _get(data, 'radio', this.radio);
        this.has_terrain = _get(data, 'has_terrain', false);
        this.airways = _get(data, 'airways', {});
        this.ctr_radius = _get(data, 'ctr_radius', DEFAULT_CTR_RADIUS_NM);
        this.ctr_ceiling = _get(data, 'ctr_ceiling', DEFAULT_CTR_CEILING_FT);
        this.initial_alt = _get(data, 'initial_alt', DEFAULT_INITIAL_ALTITUDE_FT);
        this.rr_radius_nm = _get(data, 'rr_radius_nm');
        this.rr_center = _get(data, 'rr_center');

        this.loadTerrain();
        this.buildAirportAirspace(data.airspace);
        this.buildAirportRunways(data.runways);
        this.setActiveRunwaysFromNames(data.arrivalRunway, data.departureRunway);
        this.buildAirportMaps(data.maps);
        this.buildRestrictedAreas(data.restricted);
        this.updateCurrentWind(data.wind);
        this.buildRunwayMetaData();
        // this.updateRunway();
        // this.setRunwayTimeout();
    }

    /**
     * @for AirportModel
     * @method setCurrentPosition
     * @param gpsCoordinates {array<number>} [latitude, longitude]
     * @param magneticNorth {number} magnetic declination (variation), in radians
     */
    setCurrentPosition(gpsCoordinates, magneticNorth) {
        if (!isValidGpsCoordinatePair(gpsCoordinates)) {
            return;
        }
        this._positionModel = new StaticPositionModel(gpsCoordinates, null, magneticNorth);
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

        // for each area
        this.airspace = _map(airspace, (airspaceSection) => {
            return new AirspaceModel(
                airspaceSection,
                this._positionModel,
                this._positionModel.magneticNorth
            );
        });

        // airspace perimeter (assumed to be first entry in data.airspace)
        this.perimeter = _head(this.airspace);

        this.ctr_radius = Math.max(..._map(
            this.perimeter.poly, (vertexPosition) => vlen(
                vsub(
                    vertexPosition.relativePosition,
                    DynamicPositionModel.calculateRelativePosition(this.rr_center, this._positionModel, this.magneticNorth)
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

        // TODO: move this to a `RunwayCollection` class
        _forEach(runways, (runway) => {
            // TODO: This should not be happening here, but rather during creation of the runway's `StaticPositionModel`
            runway.relative_position = this._positionModel;
            runway._magneticNorth = this.magneticNorth;

            // TODO: what do the 0 and 1 mean? magic numbers should be enumerated

            this.runways.push([
                new RunwayModel(runway, 0, this),
                new RunwayModel(runway, 1, this)
            ]);
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
            const outputMap = this.maps[key];
            const lines = map;

            _forEach(lines, (line) => {
                const airportPositionAndDeclination = [this.positionModel, this.magneticNorth];
                const lineStartCoordinates = [line[0], line[1]];
                const lineEndCoordinates = [line[2], line[3]];
                const startPosition = DynamicPositionModel.calculateRelativePosition(lineStartCoordinates, ...airportPositionAndDeclination);
                const endPosition = DynamicPositionModel.calculateRelativePosition(lineEndCoordinates, ...airportPositionAndDeclination);
                const lineVerticesRelativePositions = [...startPosition, ...endPosition];
                outputMap.push(lineVerticesRelativePositions);
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
            // TODO: Remove _map, move relativePosition value to const, then return that const
            obj.coordinates = $.map(area.coordinates, (v) => {
                return [(DynamicPositionModel.calculateRelativePosition(v, this._positionModel, this.magneticNorth))];
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

    /**
     * @for AirportModel
     * @method buildRunwayMetaData
     */
    buildRunwayMetaData() {
        // TODO: move this logic to a `RunwayController` class
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
                        const offset = getOffset(r1, r2.relativePosition, r1.angle);
                        this.metadata.rwy[r1.name][r2.name] = {};

                        // generate this runway pair's relationship data
                        this.metadata.rwy[r1.name][r2.name].lateral_dist = abs(offset[0]);
                        this.metadata.rwy[r1.name][r2.name].straight_dist = abs(offset[2]);
                        this.metadata.rwy[r1.name][r2.name].converging = raysIntersect(r1.relativePosition, r1.angle, r2.relativePosition, r2.angle);
                        this.metadata.rwy[r1.name][r2.name].parallel = (abs(angle_offset(r1.angle, r2.angle)) < degreesToRadians(10));
                    }
                }
            }
        }
    }

    /**
     * @for AirportModel
     * @method set
     */
    set(airportJson) {
        if (!this.loaded) {
            this.load(airportJson);

            return;
        }

        localStorage[STORAGE_KEY.ATC_LAST_AIRPORT] = this.icao;

        // TODO: this should live elsewhere and be called by a higher level controller
        window.gameController.game_reset_score_and_events();

        this.start = window.gameController.game_time();

        this.updateRun(true);
    }

    /**
     * Set the airport's active arrival runway
     *
     * @for AirportModel
     * @method setArrivalRunway
     * @param runwayModel {RunwayModel}
     */
    setArrivalRunway(runwayModel) {
        this.arrivalRunway = runwayModel;
    }

    /**
     * Set active arrival/departure runways from the runway names
     *
     * @for AirportModel
     * @method setActiveRunwaysFromNames
     * @param arrivalRunwayName {string}
     * @param departureRunwayName {string}
     */
    setActiveRunwaysFromNames(arrivalRunwayName, departureRunwayName) {
        const arrivalRunwayModel = this.getRunway(arrivalRunwayName);
        const departureRunwayModel = this.getRunway(departureRunwayName);

        this.setArrivalRunway(arrivalRunwayModel);
        this.setDepartureRunway(departureRunwayModel);
    }

    /**
     * Set the airport's active departure runway
     *
     * @for AirportModel
     * @method setDepartureRunway
     * @param runwayModel {RunwayModel}
     */
    setDepartureRunway(runwayModel) {
        this.departureRunway = runwayModel;
    }

    /**
     * Get RunwayModel in use for 'arrival' or 'departure', as specified in call
     *
     * @for AirportModel
     * @method getActiveRunwayForCategory
     * @param category {string} whether the arrival or departure runway is being queried
     * @return {RunwayModel}
     */
    getActiveRunwayForCategory(category) {
        if (category === FLIGHT_CATEGORY.ARRIVAL) {
            return this.arrivalRunway;
        }

        if (category === FLIGHT_CATEGORY.DEPARTURE) {
            return this.departureRunway;
        }

        console.warn('Did not expect a query for runway that applies to aircraft of category ' +
            `'${category}'! Returning the arrival runway (${this.arrivalRunway.name})`);

        return this.arrivalRunway;
    }

    /**
     * @for AirportModel
     * @method getWind
     * @return wind {number}
     */
    getWind() {
        return this.wind;

        // TODO: what does this method do and why do we need it?
        // TODO: there are a lot of magic numbers here. What are they for and what do they mean? These should be enumerated.
        const wind = Object.assign({}, this.wind);
        let s = 1;
        const angle_factor = sin((s + window.gameController.game_time()) * 0.5) + sin((s + window.gameController.game_time()) * 2);
        // TODO: why is this var getting reassigned to a magic number?
        s = 100;
        const speed_factor = sin((s + window.gameController.game_time()) * 0.5) + sin((s + window.gameController.game_time()) * 2);
        wind.angle += extrapolate_range_clamp(-1, angle_factor, 1, degreesToRadians(-4), degreesToRadians(4));
        wind.speed *= extrapolate_range_clamp(-1, speed_factor, 1, 0.9, 1.05);

        return wind;
    }

    // TODO: Implement changing winds, then bring this method back to life
    /**
     * @for AirportModel
     * @method updateRunway
     * @deprecated
     */
    updateRunway(length = 0) {
        // // TODO: this method contains some ambiguous names. need better names.
        // const wind = this.getWind();
        // const headwind = {};
        //
        // for (let i = 0; i < this.runways.length; i++) {
        //     const runway = this.runways[i];
        //     headwind[runway[0].name] = Math.cos(runway[0].angle - ra(wind.angle)) * wind.speed;
        //     headwind[runway[1].name] = Math.cos(runway[1].angle - ra(wind.angle)) * wind.speed;
        // }
        //
        // let best_runway = '';
        // let best_runway_headwind = -Infinity;
        // for (const runway in headwind) {
        //     if (headwind[runway] > best_runway_headwind && this.getRunway(runway).length > length) {
        //         best_runway = runway;
        //         best_runway_headwind = headwind[runway];
        //     }
        // }
        //
        // this.runway = best_runway;
    }

    parseTerrain(data) {
        // TODO: reassignment of this to apt is not needed here. change apt to this.
        // terrain must be in geojson format
        const apt = this;
        apt.terrain = {};

        _forEach(data.features, (f) => {
            // const f = data.features[i];
            // m => ft, rounded to 1K (but not divided)
            const ele = round(f.properties.elevation / 0.3048, 1000);

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
                            pt.reverse();   // `StaticPositionModel` requires [lat,lon] order
                            const pos = new StaticPositionModel(pt, apt.positionModel, apt.magneticNorth);

                            return [pos.relativePosition];
                        })
                    ];
                }));
            });
        });
    }

    /**
     * @for AirportModel
     * @method loadTerrain
     */
    loadTerrain() {
        if (!this.has_terrain) {
            return;
        }

        // TODO: there is a lot of binding here, use => functions and this probably wont be an issue.
        // eslint-disable-next-line no-undef
        zlsa.atc.loadAsset({
            url: `assets/airports/terrain/${this.icao.toLowerCase()}.geojson`,
            immediate: true
        })
        // TODO: change to onSuccess and onError handler abstractions
        .done((data) => {
            try {
                // eslint-disable-next-line no-undef
                this.parseTerrain(data);
            } catch (e) {
                throw new Error(e.message);
            }
        })
        .fail((jqXHR, textStatus, errorThrown) => {
            console.error(`Unable to load airport/terrain/${this.icao}: ${textStatus}`);

            this.loading = false;
            this.airport.current.set();
        });
    }

    /**
     * Stop the game loop and Load airport json asyncronously
     *
     * @for AirportModel
     * @method load
     * @param airportJson {object}
     */
    load(airportJson = null) {
        if (this.loaded) {
            return;
        }

        this.updateRun(false);
        this.loading = true;

        if (airportJson) {
            this.onLoadIntialAirportFromJson(airportJson);

            return;
        }

        // eslint-disable-next-line no-undef
        zlsa.atc.loadAsset({
            url: `assets/airports/${this.icao.toLowerCase()}.json`,
            immediate: true
        })
        .done((response) => this.onLoadAirportSuccess(response))
        .fail((...args) => this.onLoadAirportError(...args));
    }

    /**
     * @method onLoadAirportSuccess
     * @param response {object}
     */
    onLoadAirportSuccess = (response) => {
        // cache of airport.json data to be used to hydrate other classes on airport change
        this.data = response;
        this.loading = false;
        this.loaded = true;

        this.parse(response);
        this.eventBus.trigger(EVENT.AIRPORT_CHANGE, this.data);
        this.set();
    };

    /**
     * @for AirportModel
     * @method onLoadAirportError
     * @param textStatus {string}
     */
    onLoadAirportError = ({ textStatus }) => {
        console.error(`Unable to load airport/${this.icao}: ${textStatus}`);

        this.loading = false;
        this.airport.current.set();
    }

    /**
     * Provides a way to get data into the instance with passed in
     * data and without running `.load()`
     *
     * Data received here is identical to data that would be received
     * when changing airports.
     *
     * @for AirportModel
     * @method onLoadIntialAirportFromJson
     * @param response {object}
     */
    onLoadIntialAirportFromJson(response) {
        // TODO: this is extremely similar to `onLoadAirportSuccess()`, consolidate these two methods
        // cache of airport.json data to be used to hydrate other classes on airport change
        this.data = response;
        this.loading = false;
        this.loaded = true;
        this.parse(response);
        this.set();
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
     * Return the RunwayModel with the provided name
     *
     * @for AirportModel
     * @method getRunway
     * @param name {string} name of the runway, eg '28R'
     * @return {RunwayModel}
     */
    getRunway(name) {
        if (!name) {
            return null;
        }

        // TODO: move below to a `RunwayCollection` class
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
}
