import _forEach from 'lodash/forEach';
import _isArray from 'lodash/isArray';
import _isNil from 'lodash/isNil';
import _map from 'lodash/map';
import _random from 'lodash/random';
import _uniq from 'lodash/uniq';
import WaypointModel from '../aircraft/FlightManagementSystem/WaypointModel';
import HoldCollection from './HoldCollection';
import { PROCEDURE_TYPE } from '../constants/routeConstants';

/**
 * Generic class for instrument procedures of multiple types, such as SIDs/STARs
 *
 * Used by FMS to generate waypoints from instrument procedures outlined in an
 * airport's JSON file. The FMS is given a route on spawn, or a reroute by a
 * controller, and if it contains a procedure, it will look up the associated
 * `ProcedureModel`, and request the waypoints for that procedure at
 * the planned entry and exit points, which are then consumed by the FMS for
 * navigation purposes.
 *
 * @class ProcedureModel
 */
export default class ProcedureModel {
    /**
     * @for ProcedureModel
     * @constructor
     * @param procedureType {string} must belong to the `PROCEDURE_TYPE` enum
     * @param data {object} JSON data from airport file
     */
    constructor(procedureType, data) {
        if (_isNil(data)) {
            throw new TypeError(`Expected valid procedure data, but received '${data}'`);
        }

        /**
         * Body segment of the procedure
         *
         * All possible routes will contain all waypoints from the body, regardless
         * of where they enter or exit the procedure. Does not necessarily contain
         * any waypoints, provided that no combination of entry/exit would result
         * in fewer than two waypoints.
         *
         * @property _body
         * @type {array<array<string>|<string>>}
         * @default []
         * @private
         */
        this._body = [];

        /**
         * 2D array describing the lines needed to be drawn between fixes in order
         * to properly depict the procedure's path on the scope
         *
         * [
         *     ['FIXXA', 'FIXXB', 'FIXXC'],
         *     ['FIXXA', 'FIXXC']
         * ]
         *
         * @property _draw
         * @type {array<array<string>>}
         * @default []
         * @private
         */
        this._draw = [];

        /**
         * All fixes where aircraft may enter the procedure
         *
         * Each entry fix is a key in this property, whose value is a list of (restrictable)
         * fixes to follow on that entry in order to join the body of the procedure.
         *
         * @property _entryPoints
         * @type {array<array<string>|<string>>}
         * @default {}
         * @private
         */
        this._entryPoints = {};

        /**
         * All fixes where aircraft may exit the procedure
         *
         * Each exit fix is a key in this property, whose value is a list of (restrictable)
         * fixes to follow on that exit in order to leave the procedure.
         *
         * @property _exitPoints
         * @type {array<array<string>|<string>>}
         * @default {}
         * @private
         */
        this._exitPoints = {};

        /**
         * The ICAO identifier for this procedure
         *
         * @property _icao
         * @type {string}
         * @default ''
         * @private
         */
        this._icao = '';

        /**
         * The collection of holds for this procedure
         *
         * @property _holdCollection
         * @type {HoldCollection}
         * @default null
         * @private
         */
        this._holdCollection = null;

        /**
         * The verbally spoken name of the procedure
         *
         * Nonstandard spellings may be used to achieve the desired pronunciations,
         * since this is only used for speech synthesis.
         *
         * @property _name
         * @type {string}
         * @default ''
         * @private
         */
        this._name = '';

        /**
         * The type of instrument procedure (must be one of `PROCEDURE_TYPE`)
         *
         * @property _procedureType
         * @type {string}
         * @default ''
         * @private
         */
        this._procedureType = '';

        /**
         * The initial climb clearance (only for SIDs)
         *
         * @property _altitude
         * @type {number}
         * @default null
         * @private
         */
        this._altitude = null;

        this.init(procedureType, data);
    }

    /**
     * Return value of `#_draw`
     *
     * @for ProcedureModel
     * @property draw
     * @type {array}
     */
    get draw() {
        return this._draw;
    }

    /**
     * Return value of `#_icao`
     *
     * @for ProcedureModel
     * @property icao
     * @type {string}
     */
    get icao() {
        return this._icao;
    }

    /**
     * Return value of `#_name`
     *
     * @for ProcedureModel
     * @property name
     * @type {string}
     */
    get name() {
        return this._name;
    }

    /**
     * Return value of `#_procedureType`
     *
     * @for ProcedureModel
     * @property procedureType
     * @type {string}
     */
    get procedureType() {
        return this._procedureType;
    }

    /**
     * Return value of `#_altitude`
     *
     * @for ProcedureModel
     * @property altitude
     * @type {number}
     */
    get altitude() {
        return this._altitude;
    }

    // ------------------------------ LIFECYCLE ------------------------------

    /**
     * Initialize instance properties
     *
     * @for ProcedureModel
     * @method init
     * @param procedureType {string} must belong to the `PROCEDURE_TYPE` enum
     * @param data {object} JSON data from airport file
     * @chainable
     */
    init(procedureType, data) {
        this._body = data.body;
        this._draw = data.draw;
        this._holdCollection = new HoldCollection(data.holds);
        this._icao = data.icao;
        this._name = data.name;
        this._altitude = data.altitude;
        this._procedureType = procedureType;

        if (this._procedureType === PROCEDURE_TYPE.SID) {
            return this._initEntriesAndExitsForSid(data);
        } else if (this._procedureType === PROCEDURE_TYPE.STAR) {
            return this._initEntriesAndExitsForStar(data);
        }

        throw new TypeError('Expected procedure definition with known type, ' +
            `but received unknown type '${this._procedureType}'`);
    }

    /**
     * Reset instance properties
     *
     * @for ProcedureModel
     * @method reset
     * @chainable
     */
    reset() {
        this._body = [];
        this._draw = [];
        this._entryPoints = {};
        this._exitPoints = {};
        this._icao = '';
        this._name = '';
        this._procedureType = '';
        this._altitude = null;

        return this;
    }

    /**
     * Initialize `#_entryPoints` and `#_exitPoints` for 'SID' procedure
     *
     * @for ProcedureModel
     * @method _initEntriesAndExitsForSid
     * @param data {object} JSON data from airport file
     * @private
     * @chainable
     */
    _initEntriesAndExitsForSid(data) {
        this._entryPoints = data.rwy;
        this._exitPoints = data.exitPoints;

        return this;
    }

    /**
     * Initialize `#_entryPoints` and `#_exitPoints` for 'STAR' procedure
     *
     * @for ProcedureModel
     * @method _initEntriesAndExitsForStar
     * @param data {object} JSON data from airport file
     * @private
     * @chainable
     */
    _initEntriesAndExitsForStar(data) {
        this._entryPoints = data.entryPoints;
        this._exitPoints = data.rwy;

        return this;
    }

    // ------------------------------ PUBLIC ------------------------------

    /**
     * Return an array of names of all fixes existing in any segment of this procedure
     *
     * @for ProcedureModel
     * @method getAllFixNamesInUse
     * @return {array<string>}
     */
    getAllFixNamesInUse() {
        if (!_isArray(this._draw[0])) {
            throw new TypeError(`Invalid data set in draw segment of the ${this._icao} procedure. Expected a 2D ` +
                'array: `[[FIXXA, FIXXB*], [FIXXC, FIXXD*]]`. Please see airport documentation for more information ' +
                '(https://github.com/openscope/openscope/blob/develop/documentation/airport-format.md#sids).');
        }

        const entryFixNames = this._getFixNamesFromEntries();
        const bodyFixNames = this._getFixNamesFromBody();
        const exitFixNames = this._getFixNamesFromExits();
        const drawFixNames = this._getFixNamesFromDraw();
        const allFixNames = [...entryFixNames, ...bodyFixNames, ...exitFixNames, ...drawFixNames];
        const uniqueFixNames = _uniq(allFixNames);

        return uniqueFixNames;
    }

    /**
     * Return the name of a randomly selected exit point
     *
     * @for ProcedureModel
     * @method getRandomExitPoint
     * @return {string}
     */
    getRandomExitPoint() {
        const exitNames = Object.keys(this._exitPoints);
        const maxIndex = exitNames.length - 1;
        const randomIndex = _random(0, maxIndex);

        return exitNames[randomIndex];
    }

    /**
     * Return the name of the first entry point in the list
     *
     * NOTE: Since this will return whichever element appears first in the object,
     * it should only really be useful when we are trying to get ANY valid entry point.
     *
     * The above is exactly the use case for which this was created: When given a clearance
     * with a route that is invalid for the planned departure runway, we need to apply that
     * route using ANY runway which is valid. When the aircraft is taxiied to a runway and
     * cleared for takeoff, they will verify the procedure's compatibility with that runway.
     *
     * @for ProcedureModel
     * @method getFirstEntryPoint
     * @return {string}
     */
    getFirstEntryPoint() {
        const entryNames = Object.keys(this._entryPoints);

        if (entryNames.length === 0) {
            return null;
        }

        return entryNames[0];
    }

    /**
     * Return the name of the first entry point if there is exactly one entry point.
     *
     * @for ProcedureModel
     * @method getUniqueEntryPoint
     * @return {string}
     */
    getUniqueEntryPoint() {
        const entryNames = Object.keys(this._entryPoints);

        if (entryNames.length !== 1) {
            return '';
        }

        return entryNames[0];
    }

    /**
    * Given an entry point and exit point, return a list of all applicable waypoints
    *
    * @for ProcedureModel
    * @method getWaypointModelsForEntryAndExit
    * @param entry {string} name of the requested entry point
    * @param exit {string} name of the requested exit point
    * @return {array<WaypointModel>}
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
     * Return whether this procedure contains an entry point with the specified name
     *
     * @for ProcedureModel
     * @method hasEntry
     * @return {boolean}
     */
    hasEntry(entryName) {
        return entryName in this._entryPoints;
    }

    /**
     * Return whether this procedure contains an exit point with the specified name
     *
     * @for ProcedureModel
     * @method hasExit
     * @return {boolean}
     */
    hasExit(exitName) {
        return exitName in this._exitPoints;
    }

    /**
     * Returns whether this procedure is a SID
     *
     * @for ProcedureModel
     * @method isSid
     * @return {Boolean}
     */
    isSid() {
        return this._procedureType === PROCEDURE_TYPE.SID;
    }

    /**
     * Returns whether this procedure is a STAR
     *
     * @for ProcedureModel
     * @method isStar
     * @return {Boolean}
     */
    isStar() {
        return this._procedureType === PROCEDURE_TYPE.STAR;
    }

    // ------------------------------ PRIVATE ------------------------------

    /**
     * Generate a `WaypointModel` for the specified data
     *
     * @for ProcedureModel
     * @method _generateWaypoint
     * @param data {string|array<string>}
     * @returns {WaypointModel}
     * @private
     */
    _generateWaypoint(data) {
        const waypoint = new WaypointModel(data);

        const holdParameters = this._holdCollection.findHoldParametersByFix(waypoint.name);

        if (holdParameters != null) {
            waypoint.setDefaultHoldParameters(holdParameters);
        }

        return waypoint;
    }

    /**
    * Generate new `WaypointModel`s for the body portion of the procedure
    *
    * @for ProcedureModel
    * @method _generateWaypointsForBody
    * @return {array<WaypointModel>}
    * @private
    */
    _generateWaypointsForBody() {
        return _map(this._body, (waypoint) => this._generateWaypoint(waypoint));
    }

    /**
    * Generate new `WaypointModel`s for the specified entry
    *
    * @for ProcedureModel
    * @method _generateWaypointsForEntry
    * @param entryPoint {string} name of the requested entry point
    * @return {array<WaypointModel>}
    * @private
    */
    _generateWaypointsForEntry(entryPoint) {
        if (!(entryPoint in this._entryPoints)) {
            throw new TypeError(`Expected valid entry of ${this._icao}, but received ${entryPoint}`);
        }

        return _map(this._entryPoints[entryPoint], (waypoint) => this._generateWaypoint(waypoint));
    }

    /**
    * Generate new `WaypointModel`s for the specified exit
    *
    * @for ProcedureModel
    * @method _generateWaypointsForEntry
    * @param exitPoint {string} name of the requested exit point
    * @return {array<WaypointModel>}
    * @private
    */
    _generateWaypointsForExit(exitPoint) {
        if (!(exitPoint in this._exitPoints)) {
            throw new TypeError(`Expected valid exit of ${this._icao}, but received ${exitPoint}`);
        }

        return _map(this._exitPoints[exitPoint], (waypoint) => this._generateWaypoint(waypoint));
    }

    /**
     * Return an array containing names of all fixes existing in the body
     *
     * @for ProcedureModel
     * @method _getFixNamesFromBody
     * @return {array<string>}
     * @private
     */
    _getFixNamesFromBody() {
        return _map(this._body, (restrictedFix) => {
            return this._getFixNameFromRestrictedFixArray(restrictedFix);
        });
    }

    /**
     * Return an array containing names of all fixes existing in the draw array
     *
     * @for ProcedureModel
     * @method _getFixNamesFromDraw
     * @return {array<string>}
     * @private
     */
    _getFixNamesFromDraw() {
        const drawFixNames = this._draw.reduce((fixList, lineSegment) => fixList.concat(lineSegment));
        const drawFixNamesWithoutAsterisks = drawFixNames.map((fixName) => fixName.replace('*', ''));

        return drawFixNamesWithoutAsterisks;
    }

    /**
     * Return an array containing names of all fixes existing in any entry
     *
     * @for ProcedureModel
     * @method _getFixNamesFromEntries
     * @return {array<string>}
     * @private
     */
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

    /**
     * Return an array containing names of all fixes existing in any exit
     *
     * @for ProcedureModel
     * @method _getFixNamesFromExits
     * @return {array<string>}
     * @private
     */
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

    /**
     * Return the name of a fix from a restrited-fix array
     *
     * Ex:    ['FIXXA', 'A100']    -->    'FIXXA'
     *
     * @for ProcedureModel
     * @method _getFixNameFromRestrictedFixArray
     * @param restrictedFix {array<string>}
     * @return {string}
     * @private
     */
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
