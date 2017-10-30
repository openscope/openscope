import _each from 'lodash/each';
import _has from 'lodash/has';
import _map from 'lodash/map';
import ProcedureWaypointModel from './ProcedureWaypointModel';
import { PROCEDURE_TYPE } from '../../constants/aircraftConstants';

export default class ProcedureModel {
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

    _init(data) {
        this._draw = data.draw;
        this._icao = data.icao;
        this._name = data.name;

        if (this.procedureType === PROCEDURE_TYPE.SID) {
            return this._initWaypointForSid(data);
        }

        return this._initWaypointsForStar(data);
    }

    _initWaypointForSid(data) {
        this._bodyProcedureWaypoints = this._generateBodyWaypointsFromJson(data.body);
        this._entryProcedureWaypointCollection = this._generateEntryWaypointCollectionFromJson(data.rwy);
        this._exitProcedureWaypointCollection = this._generateExitWaypointCollectionFromJson(data.exitPoints);

        return this;
    }

    _initWaypointsForStar(data) {
        this._bodyProcedureWaypoints = this._generateBodyWaypointsFromJson(data.body);
        this._entryProcedureWaypointCollection = this._generateEntryWaypointCollectionFromJson(data.entryPoints);
        this._exitProcedureWaypointCollection = this._generateExitWaypointCollectionFromJson(data.rwy);

        return this;
    }

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

    _generateBodyWaypointsFromJson(data) {
        return _map(data, (waypoint) => new ProcedureWaypointModel(waypoint));
    }

    _generateEntryWaypointCollectionFromJson(data) {
        const entries = [];

        _each(data, (entryData, entryName) => {
            entries[entryName] = _map(entryData, (waypoint) => new ProcedureWaypointModel(waypoint));
        });

        return entries;
    }

    _generateExitWaypointCollectionFromJson(data) {
        const exits = [];

        _each(data, (exitData, exitName) => {
            exits[exitName] = _map(exitData, (waypoint) => new ProcedureWaypointModel(waypoint));
        });

        return exits;
    }

    _getProcedureWaypointsForEntry(entry) {
        return this._entryProcedureWaypointCollection[entry];
    }

    _getProcedureWaypointsForExit(exit) {
        return this._exitProcedureWaypointCollection[exit];
    }
}
