/* eslint-disable max-len */
import _ceil from 'lodash/ceil';
import _chunk from 'lodash/chunk';
import _clamp from 'lodash/clamp';
import _forEach from 'lodash/forEach';
import _get from 'lodash/get';
import _head from 'lodash/head';
import _map from 'lodash/map';
import AirportController from './AirportController';
import AirspaceModel from './AirspaceModel';
import DynamicPositionModel from '../base/DynamicPositionModel';
import EventBus from '../lib/EventBus';
import GameController from '../game/GameController';
import MapCollection from './MapCollection';
import RunwayCollection from './runway/RunwayCollection';
import StaticPositionModel from '../base/StaticPositionModel';
import TimeKeeper from '../engine/TimeKeeper';
import { isValidGpsCoordinatePair } from '../base/positionModelHelpers';
import { degreesToRadians, parseElevation } from '../utilities/unitConverters';
import {
    sin,
    cos,
    round
} from '../math/core';
import {
    vectorize_2d,
    vlen,
    vsub,
    vadd,
    vscale
} from '../math/vector';
import {
    FLIGHT_CATEGORY,
    PERFORMANCE
} from '../constants/aircraftConstants';
import { ENVIRONMENT } from '../constants/environmentConstants';
import { EVENT } from '../constants/eventNames';
import { STORAGE_KEY } from '../constants/storageKeys';

const DEFAULT_CTR_RADIUS_KM = 80;
const DEFAULT_CTR_CEILING_FT = 10000;
const DEFAULT_INITIAL_ALTITUDE_FT = 5000;
const DEFAULT_RANGE_RINGS = {
    enabled: false,
    radius_nm: 0,
    center: [0, 0]
};

/**
 * @class AirportModel
 */
export default class AirportModel {
    /**
     * @constructor
     * @param options {object}
     */
    // istanbul ignore next
    constructor(options = {}) {
        /**
         * @property EventBus
         * @type {EventBus}
         */
        this.eventBus = EventBus;

        /**
         * cache of airport json data
         *
         * used externally when changing airports
         *
         * @property data
         * @type {object}
         * @default {}
         */
        this.data = {};

        /**
         * @property arrivalRunwayModel
         * @type {RunwayModel}
         * @default null
         */
        this.arrivalRunwayModel = null;

        /**
         * @property departureRunwayModel
         * @type {RunwayModel}
         * @default null
         */
        this.departureRunwayModel = null;

        /**
         * Flag for is an airport has been loaded successfully
         *
         * @property loaded
         * @type {boolean}
         * @default false
         */
        this.loaded = false;

        /**
         * Flag for if an airport is in the process of loading
         *
         * @property loading
         * @type {boolean}
         * @default false
         */
        this.loading = false;

        /**
         * Name of the airport
         *
         * @property name
         * @type {string}
         * @default null
         */
        this.name = null;

        /**
         * ICAO identifier of the airport
         *
         * @property icao
         * @type {string}
         * @default null
         */
        this.icao = null;

        /**
         * AIRAC cycle from which data for the airport was taken
         *
         * @property airac
         * @type {number}
         * @default null
        */
        this.airac = null;

        /**
         * @property radio
         * @type
         * @default null
         */
        this.radio = null;

        /**
         * @property level
         * @type
         * @default null
         */
        this.level = null;

        /**
         * @property _positionModel
         * @type {StaticPositionModel}
         * @default null
         */
        this._positionModel = null;

        /**
         * Collection of all airport `RunwayModel` objects
         *
         * @property _runwayCollection
         * @type {RunwayCollection}
         * @default null
         */
        this._runwayCollection = null;

        /**
         * Collection of all `MapModel`s available to be displayed on the scope
         *
         * @property mapCollection
         * @type {MapCollection}
         * @default null
         */
        this.mapCollection = null;

        /**
         * @property restricted_areas
         * @type {array}
         * @default []
         */
        this.restricted_areas = [];

        /**
         * areas under this sector's control. If null, draws circle with diameter of 'ctr_radius'
         *
         * @property airspace
         * @type {object}
         * @default null
         */
        this.airspace = null;

        // TODO: this should really be its own class possibly separate from the `AirportModel`
        /**
         * Container for airport terrain definition
         *
         * @property terrain
         * @type {object}
         * @default {}
         */
        this.terrain = {};

        /**
         * area outlining the outermost lateral airspace boundary. Comes from this.airspace[0]
         *
         * @property perimeter
         * @type {object}
         * @default null
         */
        this.perimeter = null;

        /**
         * @property timeout
         * @type {object}
         */
        this.timeout = {
            runway: null,
            departure: null
        };

        /**
         * default wind settings for an airport
         *
         * @property wind
         * @type {object}
         */
        this.wind = {
            speed: 10,
            angle: 0
        };

        /**
         * @for AirportModel
         * @property ctr_radius
         * @type {nunmber}
         */
        this.ctr_radius = null;

        /**
         * @for AirportModel
         * @property ctr_ceiling
         * @type {nunmber}
         */
        this.ctr_ceiling = null;

        /**
         * @for AirportModel
         * @property initial_alt
         * @type {nunmber}
         */
        this.initial_alt = null;

        /**
         * @for AirportModel
         * @property rangeRings
         * @type {object}
         */
        this.rangeRings = null;

        this.init(options);
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
     * This will return an array of two-value arrays containing a `RunwayModel`
     * for each end of a runway.
     *
     * This should only be used by the `CanvasController` for drawing runways.
     * This returns data in this shape in an effort to maintain a previous api.
     *
     * @property runways
     * @return {array<array<RunwayModel>>}
     */
    get runways() {
        return _chunk(this._runwayCollection.runways, 2);
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
     * @method init
     * @param data {object}
     */
    init(data) {
        this.name = _get(data, 'name', this.name);
        this.icao = _get(data, 'icao', this.icao).toLowerCase();
        this.level = _get(data, 'level', this.level);
        // exit early if `position` doesn't exist in data. on app initialiazation, we loop through every airport
        // in the `airportLoadList` and instantiate a model for each but wont have the full data set until the
        // airport json file is loaded.
        if (!data.position) {
            return;
        }

        this.setCurrentPosition(data.position, degreesToRadians(data.magnetic_north));

        this.airac = _get(data, 'airac', this.airac);
        this.radio = _get(data, 'radio', this.radio);
        this.has_terrain = _get(data, 'has_terrain', false);
        this.ctr_radius = _get(data, 'ctr_radius', DEFAULT_CTR_RADIUS_KM);
        this.ctr_ceiling = _get(data, 'ctr_ceiling', DEFAULT_CTR_CEILING_FT);
        this.initial_alt = _get(data, 'initial_alt', DEFAULT_INITIAL_ALTITUDE_FT);
        this.rangeRings = _get(data, 'rangeRings', DEFAULT_RANGE_RINGS);
        this._runwayCollection = new RunwayCollection(data.runways, this._positionModel);
        this.mapCollection = new MapCollection(data.maps, data.defaultMaps, this.positionModel, this.magneticNorth);

        this.loadTerrain();
        this.buildAirportAirspace(data.airspace);
        this.setActiveRunwaysFromNames(data.arrivalRunway, data.departureRunway);
        this.buildRestrictedAreas(data.restricted);
        this.updateCurrentWind(data.wind);
    }

    /**
     * @for AirportModel
     * @method setCurrentPosition
     * @param gpsCoordinates {array<number>}  [latitude, longitude]
     * @param magneticNorth {number}          magnetic declination (variation), in radians
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
        this.ctr_radius = Math.max(
            ..._map(this.perimeter.poly, (vertexPosition) => vlen(
                vsub(
                    vertexPosition.relativePosition,
                    DynamicPositionModel.calculateRelativePosition(
                        this.rangeRings.center,
                        this._positionModel,
                        this.magneticNorth
                    )
                )
            ))
        );
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
            // TODO: find a better name for `obj`
            const obj = {};

            if (area.name) {
                obj.name = area.name;
            }

            obj.height = parseElevation(area.height);
            obj.coordinates = _map(
                area.coordinates,
                (v) => DynamicPositionModel.calculateRelativePosition(v, this._positionModel, this.magneticNorth)
            );

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
     * Return an altitude clamped within the min/max assignable altitudes for this airport
     *
     * @for AirportModel
     * @method clampWithinAssignableAltitudes
     * @param altitude
     * @return {number}
     */
    clampWithinAssignableAltitudes(altitude) {
        return _clamp(altitude, this.minAssignableAltitude, this.maxAssignableAltitude);
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
     * @method set
     * @param airportJson {object}
     */
    set(airportJson) {
        if (!this.loaded) {
            this.load(airportJson);

            return;
        }

        localStorage[STORAGE_KEY.ATC_LAST_AIRPORT] = this.icao;

        // TODO: this should live elsewhere and be called by a higher level controller
        GameController.game_reset_score_and_events();

        this.start = TimeKeeper.accumulatedDeltaTime;

        this.eventBus.trigger(EVENT.PAUSE_UPDATE_LOOP, true);
    }

    /**
     * Get the wind at the specified altitude.
     * When the altitude is not specified, the airport's surface wind is given.
     *
     * @for AirportModel
     * @method getWindAtAltitude
     * @param {number} altitude
     * @returns {object<angle, speed>}
     */
    getWindAtAltitude(altitude = this.elevation) {
        const windTravelSpeedAtSurface = this.wind.speed;
        const altitudeAboveSurface = altitude - this.elevation;
        const windIncreaseFactor = altitudeAboveSurface * ENVIRONMENT.WIND_INCREASE_FACTOR_PER_FT;
        const windTravelSpeedAtAltitude = windTravelSpeedAtSurface * (1 + windIncreaseFactor);
        const wind = {
            angle: this.wind.angle,
            speed: windTravelSpeedAtAltitude
        };

        return wind;
    }

    /**
     * @for AirportModel
     * @method getWindForRunway
     * @param runway {runwayModel}
     * @return {object} headwind and crosswind
     */
    getWindForRunway(runway) {
        const crosswindAngle = runway.calculateCrosswindAngleForRunway(this.wind.angle);

        return {
            cross: sin(crosswindAngle) * this.wind.speed,
            head: cos(crosswindAngle) * this.wind.speed
        };
    }

    /**
     * Generates a vector representation of the wind at a given altitude.
     * When the altitude is not specified, the airport elevation is used as the assumed altitude.
     *
     * @for AirportModel
     * @method getWindVectorAtAltitude
     * @param {number} altitude
     * @returns {array<number, number>}
     */
    getWindVectorAtAltitude(altitude) {
        const { angle, speed } = this.getWindAtAltitude(altitude);
        const windTravelDirection = angle + Math.PI;
        const windVector = vscale(vectorize_2d(windTravelDirection), speed);

        return windVector;
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
     * Set the airport's active arrival runway
     *
     * @for AirportModel
     * @method setArrivalRunway
     * @param runwayModel {RunwayModel}
     */
    setArrivalRunway(runwayModel) {
        this.arrivalRunwayModel = runwayModel;
    }

    /**
     * Set the airport's active departure runway
     *
     * @for AirportModel
     * @method setDepartureRunway
     * @param runwayModel {RunwayModel}
     */
    setDepartureRunway(runwayModel) {
        this.departureRunwayModel = runwayModel;
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
            return this.arrivalRunwayModel;
        }

        if (category === FLIGHT_CATEGORY.DEPARTURE) {
            return this.departureRunwayModel;
        }

        if (category === FLIGHT_CATEGORY.OVERFLIGHT) {
            return;
        }

        console.warn('Did not expect a query for runway that applies to aircraft of category ' +
            `'${category}'! Returning the arrival runway (${this.arrivalRunwayModel.name})`);

        return this.arrivalRunwayModel;
    }

    /**
     * Return a `RunwayRelationshipModel` given two runway names
     *
     * @for AirportModel
     * @method getRunwayRelationshipForRunwayNames
     * @param  primaryRunwayName {string}
     * @param  comparatorRunwayName {string}
     * @return {RunwayRelationshipModel|undefined}
     */
    getRunwayRelationshipForRunwayNames(primaryRunwayName, comparatorRunwayName) {
        return this._runwayCollection.getRunwayRelationshipForRunwayNames(primaryRunwayName, comparatorRunwayName);
    }

    // TODO: Implement changing winds, then bring this method back to life
    /**
     * @for AirportModel
     * @method updateRunway
     */
    updateRunway() {
        // const bestRunwayForWind = this._runwayCollection.findBestRunwayForWind(this.getWind);
        //
        // this.setArrivalRunway(bestRunwayForWind);
        // this.setDepartureRunway(bestRunwayForWind);
    }

    // TODO: leaving this here for when we implement variable winds
    // /**
    //  * @for AirportModel
    //  * @method setRunwayTimeout
    //  */
    // setRunwayTimeout() {
    //     this.timeout.runway = GameController.game_timeout(this.updateRunway, Math.random() * 30, this);
    // }

    /**
     * Return a `RunwayModel` for the provided name
     *
     * @for AirportModel
     * @method getRunway
     * @param name {string} name of the runway, eg '28R'
     * @return {RunwayModel|null}
     */
    getRunway(name) {
        return this._runwayCollection.findRunwayModelByName(name);
    }

    /**
     * Remove an aircraft from all runway queues
     *
     * @for AirportModel
     * @method removeAircraftFromAllRunwayQueues
     * @param  aircraft {AircraftModel}
     */
    removeAircraftFromAllRunwayQueues(aircraftId) {
        return this._runwayCollection.removeAircraftFromAllRunwayQueues(aircraftId);
    }

    /**
     * @for AirportModel
     * @method parseTerrain
     * @param  data {object}
     */
    parseTerrain(data) {
        const GEOMETRY_TYPE = {
            LINE_STRING: 'LineString',
            POLYGON: 'Polygon'
        };

        // reassigning `this` to maintain correct scope wen working in multiple nested `_forEach()` and `_map()` loops
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
            if (f.geometry.type === GEOMETRY_TYPE.LINE_STRING) {
                multipoly = [[multipoly]];
            }

            if (f.geometry.type === GEOMETRY_TYPE.POLYGON) {
                multipoly = [multipoly];
            }

            _forEach(multipoly, (poly) => {
                // multipoly contains several polys
                // each poly has 1st outer ring and other rings are holes
                const terrainAtElevation = _map(poly, (line_string) => {
                    return _map(line_string, (point) => {
                        // `StaticPositionModel` requires [lat,lon] order
                        const latLongPoint = point.slice().reverse();
                        const pos = new StaticPositionModel(latLongPoint, apt.positionModel, apt.magneticNorth);

                        return pos.relativePosition;
                    });
                });

                apt.terrain[ele].push(terrainAtElevation);
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

        // eslint-disable-next-line no-undef
        zlsa.atc.loadAsset({
            url: `assets/airports/terrain/${this.icao.toLowerCase()}.geojson`,
            immediate: true
        }).done((data) => { // TODO: change to onSuccess and onError handler abstractions
            try {
                // eslint-disable-next-line no-undef
                this.parseTerrain(data);
            } catch (e) {
                throw new Error(e.message);
            }
        }).fail((jqXHR, textStatus, errorThrown) => {
            console.error(`Unable to load airport/terrain/${this.icao}: ${textStatus}`);

            this.loading = false;
            AirportController.current.set();
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

        this.loading = true;
        this.eventBus.trigger(EVENT.PAUSE_UPDATE_LOOP, false);

        if (airportJson && airportJson.icao.toLowerCase() === this.icao) {
            this.onLoadIntialAirportFromJson(airportJson);

            return;
        }

        // eslint-disable-next-line no-undef
        zlsa.atc.loadAsset({
            url: `assets/airports/${this.icao.toLowerCase()}.json`,
            immediate: true
        }).done((response) => this.onLoadAirportSuccess(response))
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

        this.init(response);
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
        AirportController.current.set();
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

        this.init(response);
        this.set();
    }
}
