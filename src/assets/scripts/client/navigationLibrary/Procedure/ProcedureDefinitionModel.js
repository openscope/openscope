// import _each from 'lodash/each';
// import _has from 'lodash/has';
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
        this._body = [];
        this._draw = [];
        this._entryPoints = [];
        this._exitPoints = [];
        this._icao = '';
        this._name = '';

        this._init(data);
    }

    /**
     * Populate properties from JSON data
     *
     * @for ProcedureDefinitionModel
     * @method _init
     * @private
     * @chainable
     */
    _init(data) {
        this._body = data.body;
        this._draw = data.draw;
        this._icao = data.icao;
        this._name = data.name;

        if (this.procedureType === PROCEDURE_TYPE.SID) {
            this._initEntriesAndExitsForSid(data);

            return this;
        }

        this._initEntriesAndExitsForStar(data);

        return this;
    }

    /**
     * Initialize `#entries` and `#exits` for 'SID' procedure
     *
     * @for ProcedureDefinitionModel
     * @method _initEntriesAndExitsForSid
     * @param data {object} JSON data from airport file
     * @private
     */
    _initEntriesAndExitsForSid(data) {
        this._entryPoints = data.rwy;
        this._exitPoints = data.exitPoints;
    }

    /**
     * Initialize `#entries` and `#exits` for 'STAR' procedure
     *
     * @for ProcedureDefinitionModel
     * @method _initEntriesAndExitsForStar
     * @param data {object} JSON data from airport file
     * @private
     */
    _initEntriesAndExitsForStar(data) {
        this._entryPoints = data.entryPoints;
        this._exitPoints = data.rwy;
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
        if (!(entry in this._entries)) {
            console.error(`Expected valid entry of ${this._icao}, but received ${entry}`);

            return;
        }

        if (!(exit in this._exits)) {
            console.error(`Expected valid exit of ${this._icao}, but received ${exit}`);

            return;
        }

        const entryWaypointModels = this._generateWaypointsForEntry(entry);
        const bodyWaypointModels = this._generateWaypointsForBody();
        const exitWaypointModels = this._generateWaypointsForExit(exit);

        return [...entryWaypointModels, ...bodyWaypointModels, ...exitWaypointModels];
    }

    /**
     * Generate new `WaypointModel`s for the body portion of the procedure
     *
     * @for ProcedureDefinitionModel
     * @method _generateWaypointsForBody
     * @return {array<ProcedureWaypointModel>}
     * @private
     */
    _generateWaypointsForBody() {
        return _map(this._body, (waypoint) => new ProcedureWaypointModel(waypoint));
    }

    /**
     * Generate new `WaypointModel`s for the specified entry
     *
     * @for ProcedureDefinitionModel
     * @method _generateWaypointsForEntry
     * @param entryPoint {string} name of the requested entry point
     * @return {array<ProcedureWaypointModel>}
     * @private
     */
    _generateWaypointsForEntry(entryPoint) {
        if (!(entryPoint in this._entryPoints)) {
            throw new TypeError(`Expected valid entry of ${this._icao}, but received ${entryPoint}`);
        }

        return _map(this._entryPoints[entryPoint], (waypoint) => new ProcedureWaypointModel(waypoint));
    }

    /**
     * Generate new `WaypointModel`s for the specified exit
     *
     * @for ProcedureDefinitionModel
     * @method _generateWaypointsForEntry
     * @param exitPoint {string} name of the requested exit point
     * @return {array<ProcedureWaypointModel>}
     * @private
     */
    _generateWaypointsForExit(exitPoint) {
        if (!(exitPoint in this._exitPoints)) {
            throw new TypeError(`Expected valid exit of ${this._icao}, but received ${exitPoint}`);
        }

        return _map(this._exitPoints[exitPoint], (waypoint) => new ProcedureWaypointModel(waypoint));
    }

    // /**
    //  * Generate waypoint collection for body portion of procedure
    //  *
    //  * @for ProcedureDefinitionModel
    //  * @method _generateBodyWaypointsFromJson
    //  * @param data {object} body portion of procedure from airport JSON file
    //  * @return {array<ProcedureWaypointModel>}
    //  */
    // _generateBodyWaypointsFromJson(data) {
    //     return _map(data, (waypoint) => new ProcedureWaypointModel(waypoint));
    // }
    //
    // /**
    //  * Generate waypoint collection for entry portion of procedure
    //  *
    //  * @for ProcedureDefinitionModel
    //  * @method _generateEntryWaypointCollectionFromJson
    //  * @param data {object} entry portion of procedure from airport JSON file
    //  * @return {array<ProcedureWaypointModel>}
    //  */
    // _generateEntryWaypointCollectionFromJson(data) {
    //     const entries = [];
    //
    //     _each(data, (entryData, entryName) => {
    //         entries[entryName] = _map(entryData, (waypoint) => new ProcedureWaypointModel(waypoint));
    //     });
    //
    //     return entries;
    // }
    //
    // /**
    //  * Generate waypoint collection for exit portion of procedure
    //  *
    //  * @for ProcedureDefinitionModel
    //  * @method _generateExitWaypointCollectionFromJson
    //  * @param data {object} exit portion of procedure from airport JSON file
    //  * @return {array<ProcedureWaypointModel>}
    //  */
    // _generateExitWaypointCollectionFromJson(data) {
    //     const exits = [];
    //
    //     _each(data, (exitData, exitName) => {
    //         exits[exitName] = _map(exitData, (waypoint) => new ProcedureWaypointModel(waypoint));
    //     });
    //
    //     return exits;
    // }
    //
    // /**
    //  * Retrieve the array of `ProcedureWaypointModel`s in the specified entry of this procedure
    //  *
    //  * @for ProcedureDefinitionModel
    //  * @method _getProcedureWaypointsForEntry
    //  * @param entryName {string} name of the requested entry point
    //  * @return {array<ProcedureWaypointModel>}
    //  */
    // _getProcedureWaypointsForEntry(entryName) {
    //     if (this.procedureType === PROCEDURE_TYPE.SID) {
    //         this._ return this._generateEntryWaypointCollectionFromJson(data.rwy);
    //     }
    //
    //     // assuming procedure must be a STAR
    //     return this._gener
    // }
    //
    // /**
    //  * Retrieve the array of `ProcedureWaypointModel`s in the specified exit of this procedure
    //  *
    //  * @for ProcedureDefinitionModel
    //  * @method _getProcedureWaypointsForExit
    //  * @param exitName {string} name of the requested exit point
    //  * @return {array<ProcedureWaypointModel>}
    //  */
    // _getProcedureWaypointsForExit(exitName) {
    //     if (this.procedureType === PROCEDURE_TYPE.SID) {
    //         return this._generateExitWaypointCollectionFromJson(data.exitPoints);
    //     }
    //
    //     // assuming procedure must be a STAR
    //     return;
    // }
}
