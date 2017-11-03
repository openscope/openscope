import _each from 'lodash/each';
import _has from 'lodash/has';
import _map from 'lodash/map';
import ProcedureWaypointModel from './ProcedureWaypointModel';
import { PROCEDURE_TYPE } from '../../constants/aircraftConstants';

/**
 * Generic class for instrument procedures of multiple types, such as SIDs/STARs
 *
 * Used by FMS to generate waypoints from procedure definitions outlined in an
 * airport's JSON file. The FMS is given a route on spawn, or a reroute by a
 * controller, and if it contains a procedure, it will look up the associated
 * `ProcedureDefinitionModel`, and request the waypoints for that procedure at
 * the planned entry and exit points, which are then consumed by the FMS for
 * navigation purposes.
 *
 * @class ProcedureDefinitionModel
 */
export default class ProcedureDefinitionModel {
    /**
     * @for ProcedureDefinitionModel
     * @constructor
     * @param procedureType {string} must belong to the `PROCEDURE_TYPE` enum
     * @param data {object} JSON data from airport file
     */
    constructor(procedureType, data) {
        if (typeof data === 'undefined') {
            throw new TypeError(`Expected valid procedure data, but received '${data}'`);
        }

        if (!(procedureType in PROCEDURE_TYPE)) {
            throw new TypeError(`Expected procedure of known type, but received procedure type of '${procedureType}'`);
        }

        this.procedureType = procedureType;
        this._bodyProcedureWaypoints = [];
        this._entryProcedureWaypointCollection = [];
        this._exitProcedureWaypointCollection = [];
        this._draw = [];
        this._icao = '';
        this._name = '';

        this._init(data);
    }

    /**
     * @for ProcedureDefinitionModel
     * @method _init
     * @param data {object} JSON data from airport file
     * @private
     * @chainable
     */
    _init(data) {
        this._draw = data.draw;
        this._icao = data.icao;
        this._name = data.name;

        if (this.procedureType === PROCEDURE_TYPE.SID) {
            return this._initWaypointForSid(data);
        }

        return this._initWaypointsForStar(data);
    }

    /**
     * Initialize waypoint collections as a SID procedure
     *
     * SIDs will have entries from data's `rwy` key, and exits from the `exitPoints` key.
     *
     * @for ProcedureDefinitionModel
     * @method _initWaypointForSid
     * @param data {object} JSON data from airport file
     * @private
     * @chainable
     */
    _initWaypointForSid(data) {
        this._bodyProcedureWaypoints = this._generateBodyWaypointsFromJson(data.body);
        this._entryProcedureWaypointCollection = this._generateEntryWaypointCollectionFromJson(data.rwy);
        this._exitProcedureWaypointCollection = this._generateExitWaypointCollectionFromJson(data.exitPoints);

        return this;
    }

    /**
     * Initialize waypoint collections as a STAR procedure
     *
     * STARs will have entries from data's `entryPoints` key, and exits from the `rwy` key.
     *
     * @for ProcedureDefinitionModel
     * @method _initWaypointsForStar
     * @param data {object} JSON data from airport file
     * @private
     * @chainable
     */
    _initWaypointsForStar(data) {
        this._bodyProcedureWaypoints = this._generateBodyWaypointsFromJson(data.body);
        this._entryProcedureWaypointCollection = this._generateEntryWaypointCollectionFromJson(data.entryPoints);
        this._exitProcedureWaypointCollection = this._generateExitWaypointCollectionFromJson(data.rwy);

        return this;
    }

    /**
     * Given an entry point and exit point, return a list of all applicable waypoints
     *
     * @for ProcedureDefinitionModel
     * @method getWaypointModelsForEntryAndExit
     * @param entry {string} name of the requested entry point
     * @param exit {string} name of the requested exit point
     * @return {array<ProcedureWaypointModel>}
     */
    getWaypointModelsForEntryAndExit(entry, exit) {
        if (!_has(this._entryProcedureWaypointCollection, entry)) {
            console.error(`Expected valid entry of ${this._icao}, but received ${entry}`);

            return;
        }

        if (!_has(this._exitProcedureWaypointCollection, exit)) {
            console.error(`Expected valid exit of ${this._icao}, but received ${exit}`);

            return;
        }

        const entryWaypointModels = this._getProcedureWaypointsForEntry(entry);
        const bodyWaypointModels = this._bodyProcedureWaypoints;
        const exitWaypointModels = this._getProcedureWaypointsForExit(exit);

        return [...entryWaypointModels, ...bodyWaypointModels, ...exitWaypointModels];
    }

    /**
     * Generate waypoint collection for body portion of procedure
     *
     * @for ProcedureDefinitionModel
     * @method _generateBodyWaypointsFromJson
     * @param data {object} body portion of procedure from airport JSON file
     * @return {array<ProcedureWaypointModel>}
     */
    _generateBodyWaypointsFromJson(data) {
        return _map(data, (waypoint) => new ProcedureWaypointModel(waypoint));
    }

    /**
     * Generate waypoint collection for entry portion of procedure
     *
     * @for ProcedureDefinitionModel
     * @method _generateEntryWaypointCollectionFromJson
     * @param data {object} entry portion of procedure from airport JSON file
     * @return {array<ProcedureWaypointModel>}
     */
    _generateEntryWaypointCollectionFromJson(data) {
        const entries = [];

        _each(data, (entryData, entryName) => {
            entries[entryName] = _map(entryData, (waypoint) => new ProcedureWaypointModel(waypoint));
        });

        return entries;
    }

    /**
     * Generate waypoint collection for exit portion of procedure
     *
     * @for ProcedureDefinitionModel
     * @method _generateExitWaypointCollectionFromJson
     * @param data {object} exit portion of procedure from airport JSON file
     * @return {array<ProcedureWaypointModel>}
     */
    _generateExitWaypointCollectionFromJson(data) {
        const exits = [];

        _each(data, (exitData, exitName) => {
            exits[exitName] = _map(exitData, (waypoint) => new ProcedureWaypointModel(waypoint));
        });

        return exits;
    }

    /**
     * Retrieve the array of `ProcedureWaypointModel`s in the specified entry of this procedure
     *
     * @for ProcedureDefinitionModel
     * @method _getProcedureWaypointsForEntry
     * @param entry {string} name of the requested entry point
     * @return {array<ProcedureWaypointModel>}
     */
    _getProcedureWaypointsForEntry(entry) {
        return this._entryProcedureWaypointCollection[entry];
    }

    /**
     * Retrieve the array of `ProcedureWaypointModel`s in the specified exit of this procedure
     *
     * @for ProcedureDefinitionModel
     * @method _getProcedureWaypointsForExit
     * @param exit {string} name of the requested exit point
     * @param  {[type]} exit [description]
     * @return {[type]}      [description]
     */
    _getProcedureWaypointsForExit(exit) {
        return this._exitProcedureWaypointCollection[exit];
    }
}
