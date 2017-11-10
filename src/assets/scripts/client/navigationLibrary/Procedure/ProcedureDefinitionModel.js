// import _has from 'lodash/has';
// import _flatten from 'lodash/flatten';
import _forEach from 'lodash/forEach';
import _isArray from 'lodash/isArray';
import _map from 'lodash/map';
import _random from 'lodash/random';
import _uniq from 'lodash/uniq';
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
        this._entryPoints = {};
        this._exitPoints = {};
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

    hasEntry(entryName) {
        return entryName in this._entryPoints;
    }

    hasExit(exitName) {
        return exitName in this._exitPoints;
    }

    getAllFixNamesInUse() {
        if (!_isArray(this._draw[0])) {
            throw new TypeError(`Invalid data set in draw segment of the ${this._icao} procedure. Expected a 2D ` +
                'array: `[[FIXXA, FIXXB*], [FIXXC, FIXXD*]]`. Please see airport documentation for more information ' +
                '(https://github.com/openscope/openscope/blob/develop/documentation/airport-format.md#sids).'
            );
        }

        const entryFixNames = this._getFixNamesFromEntries();
        const bodyFixNames = this._getFixNamesFromBody();
        const exitFixNames = this._getFixNamesFromExits();
        const drawFixNames = this._getFixNamesFromDraw();
        const allFixNames = [...entryFixNames, ...bodyFixNames, ...exitFixNames, ...drawFixNames];
        const uniqueFixNames = _uniq(allFixNames);

        return uniqueFixNames;
    }

    getRandomExitPoint() {
        const exitNames = Object.keys(this._exitPoints);
        const maxIndex = exitNames.length - 1;
        const randomIndex = _random(0, maxIndex);

        return exitNames[randomIndex];
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
        if (!(entry in this._entryPoints)) {
            console.error(`Expected valid entry of ${this._icao}, but received ${entry}`);

            return;
        }

        if (!(exit in this._exitPoints)) {
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

    _getFixNamesFromBody() {
        return _map(this._body, (restrictedFix) => {
            return this._getFixNameFromRestrictedFixArray(restrictedFix);
        });
    }

    _getFixNamesFromDraw() {
        const drawFixNames = this._draw.reduce((fixList, lineSegment) => fixList.concat(lineSegment));
        const drawFixNamesWithoutAsterisks = drawFixNames.map((fixName) => fixName.replace('*', ''));

        return drawFixNamesWithoutAsterisks;
    }

    _getFixNamesFromEntries() {
        let fixNames = [];

        _forEach(this._entryPoints, (segment) => {
            const fixesInSegment = _map(segment, (restrictedFix) => {
                return this._getFixNameFromRestrictedFixArray(restrictedFix);
            });

            fixNames = fixNames.concat(fixesInSegment);
        });

        return _uniq(fixNames);
    }

    _getFixNamesFromExits() {
        let fixNames = [];

        _forEach(this._exitPoints, (segment) => {
            const fixesInSegment = _map(segment, (restrictedFix) => {
                return this._getFixNameFromRestrictedFixArray(restrictedFix);
            });

            fixNames = fixNames.concat(fixesInSegment);
        });

        return _uniq(fixNames);
    }

    _getFixNameFromRestrictedFixArray(restrictedFix) {
        if (_isArray(restrictedFix)) {
            restrictedFix = restrictedFix[0];
        }

        if (restrictedFix.indexOf('#') !== -1) {
            return;
        }

        return restrictedFix.replace('^', '').replace('@', '');
    }
}
