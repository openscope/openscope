import _findIndex from 'lodash/findIndex';
import _isEmpty from 'lodash/isEmpty';
import _isNil from 'lodash/isNil';
import _map from 'lodash/map';
import _without from 'lodash/without';
import NavigationLibrary from '../../navigationLibrary/NavigationLibrary';
import WaypointModel from './WaypointModel';
import {
    INVALID_INDEX,
    INVALID_NUMBER
} from '../../constants/globalConstants';
import {
    LEG_TYPE,
    PROCEDURE_TYPE,
    PROCEDURE_OR_AIRWAY_SEGMENT_DIVIDER
} from '../../constants/routeConstants';

/**
 * A portion of a navigation route containing one or more `WaypointModel` objects.
 *
 * @class LegModel
 */
export default class LegModel {
    /**
     * @for LegModel
     * @constructor
     * @param routeString {string}
     */
    constructor(routeString) {
        /**
         * Reference to an instance of a `AirwayModel` object (if this is an airway leg)
         *
         * @for LegModel
         * @property _airwayModel
         * @type {AirwayModel|null}
         * @default null
         * @private
         */
        this._airwayModel = null;

        /**
         * Type of leg from list of types defined in `LEG_TYPE`
         *
         * @for LegModel
         * @property _legType
         * @type {string}
         * @default ''
         * @private
         */
        this._legType = '';

        /**
         * Reference to an instance of a `ProcedureModel` object (if this is a procedure leg)
         *
         * @for LegModel
         * @property _procedureModel
         * @type {ProcedureModel|null}
         * @default null
         * @private
         */
        this._procedureModel = null;

        /**
         * Array of `WaypointModel`s that have been passed (or skipped)
         *
         * Aircraft will proceed along the route to each waypoint, and upon passing
         * a waypoint, it will move that waypoint here to the `#_previousWaypointCollection`,
         * and proceed to the next waypoint in the `#_waypointCollection` until no more
         * `WaypointModel`s remain in the leg, at which point, they continue to the next leg.
         *
         * @for LegModel
         * @property _previousWaypointCollection
         * @type {array<WaypointModel>}
         * @default []
         * @private
         */
        this._previousWaypointCollection = [];

        /**
         * Standard-formatted route string for this leg, excluding any special characters
         *
         * @for LegModel
         * @property _routeString
         * @type {string}
         * @default ''
         * @private
         */
        this._routeString = '';

        /**
         * Array of `WaypointModel`s to follow, excluding any waypoints passed (or skipped)
         *
         * Upon completion of a given `WaypointModel` in the `#_waypointCollection`, that
         * waypoint will be moved to the `#_previousWaypointCollection`, and the aircraft will
         * continue to the next `WaypointModel` in the `#_waypointCollection`.
         *
         * @for LegModel
         * @property _waypointCollection
         * @type {array<WaypointModel>}
         * @default []
         * @private
         */
        this._waypointCollection = [];

        this.init(routeString);
    }

    /**
     * Returns the active `WaypointModel`
     *
     * Assumed to always be the first item in the `#waypointCollection`
     *
     * @for LegModel
     * @property currentWaypoint
     * @type {WaypointModel}
     */
    get currentWaypoint() {
        if (this._waypointCollection.length === 0) {
            throw new TypeError('Expected the current leg to contain at least one waypoint');
        }

        return this._waypointCollection[0];
    }

    /**
     * Returns whether this leg is an airway leg
     *
     * @for LegModel
     * @property isAirwayLeg
     * @type {boolean}
     */
    get isAirwayLeg() {
        return this._legType === LEG_TYPE.AIRWAY;
    }

    /**
     * Returns whether this leg is a direct leg
     *
     * @for LegModel
     * @property isDirectLeg
     * @type {boolean}
     */
    get isDirectLeg() {
        return this._legType === LEG_TYPE.DIRECT;
    }

    /**
     * Returns whether this leg is a procedure leg
     *
     * @for LegModel
     * @property isProcedureLeg
     * @type {boolean}
     */
    get isProcedureLeg() {
        return this._legType === LEG_TYPE.PROCEDURE;
    }

    /**
     * Whether this leg is a SID Procedure leg
     *
     * @for RouteModel
     * @property isSidLeg
     * @type {boolean}
     */
    get isSidLeg() {
        return this.isProcedureLeg && this._procedureModel.procedureType === PROCEDURE_TYPE.SID;
    }

    /**
     * Whether this leg is a STAR Procedure leg
     *
     * @for RouteModel
     * @property isStarLeg
     * @type {boolean}
     */
    get isStarLeg() {
        return this.isProcedureLeg && this._procedureModel.procedureType === PROCEDURE_TYPE.STAR;
    }

    /**
     * Returns the type of this leg
     *
     * @for LegModel
     * @property legType
     * @type {string}
     */
    get legType() {
        return this._legType;
    }

    /**
     * Returns the `WaypointModel` immediately following the `#currentWaypoint`
     *
     * @for LegModel
     * @property nextWaypoint
     * @type {WaypointModel}
     */
    get nextWaypoint() {
        return this._waypointCollection[1];
    }

    /**
     * Returns the route string for this leg
     *
     * @for LegModel
     * @property routeString
     * @type {string}
     */
    get routeString() {
        return this._routeString;
    }

    /**
     * Return the `#_waypointCollection`
     *
     * @for LegModel
     * @property waypoints
     * @type {array<WaypointModel>}
     */
    get waypoints() {
        return this._waypointCollection;
    }

    get altitude() {
        return this._procedureModel.altitude;
    }

    // ------------------------------ LIFECYCLE ------------------------------

    /**
     * Initialize instance properties
     *
     * @for LegModel
     * @method init
     * @param routeString {string}
     * @chainable
     */
    init(routeString) {
        this._routeString = routeString;

        const [entryOrFixName, airwayOrProcedureName, exit] = routeString.split(PROCEDURE_OR_AIRWAY_SEGMENT_DIVIDER);

        this._ensureRouteStringIsSingleSegment(routeString);
        this._legType = this._determineLegType(airwayOrProcedureName);
        this._airwayModel = NavigationLibrary.getAirway(airwayOrProcedureName);
        this._procedureModel = NavigationLibrary.getProcedure(airwayOrProcedureName);
        this._waypointCollection = this._generateWaypointCollection(entryOrFixName, exit);

        return this;
    }

    /**
     * Reset instance properties
     *
     * @for LegModel
     * @method reset
     * @chainable
     */
    reset() {
        this._resetWaypointCollection();

        this._airwayModel = null;
        this._legType = '';
        this._procedureModel = null;
        this._previousWaypointCollection = [];
        this._routeString = '';
        this._waypointCollection = [];

        return this;
    }

    /**
     * Return the type of leg this will be, based on the route string
     *
     * @for LegModel
     * @method _determineLegType
     * @param airwayOrProcedureName {string}
     * @return {string} property of `LEG_TYPE` enum
     */
    _determineLegType(airwayOrProcedureName) {
        if (this._routeString.indexOf('.') === INVALID_NUMBER) {
            return LEG_TYPE.DIRECT;
        }

        if (NavigationLibrary.hasAirway(airwayOrProcedureName)) {
            return LEG_TYPE.AIRWAY;
        }

        if (NavigationLibrary.hasProcedure(airwayOrProcedureName)) {
            return LEG_TYPE.PROCEDURE;
        }

        throw new TypeError(`Expected airway or procedure name, but we can't ' +
            'determine what kind of leg ${airwayOrProcedureName} is`);
    }

    /**
     * Verify that we are not attempting to initialize this `LegModel` with a route
     * string that should have been two separate `LegModels`, and throw errors if
     * we ever DO make such a mistake.
     *
     * @for LegModel
     * @method _ensureRouteStringIsSingleSegment
     * @param routeString {string}
     */
    _ensureRouteStringIsSingleSegment(routeString) {
        if (routeString.indexOf('..') !== INVALID_INDEX) {
            throw new TypeError(`Expected single fix or single procedure route string, but received '${routeString}'`);
        }

        if (routeString.split('.').length > 3) {
            throw new TypeError(`Expected single procedure route string, but received '${routeString}'`);
        }
    }

    /**
     * Generate a `WaypointModel` for the specified data
     *
     * @for LegModel
     * @method _generateWaypoint
     * @param data {string|array<string>}
     * @returns {WaypointModel}
     * @private
     */
    _generateWaypoint(data) {
        const waypoint = new WaypointModel(data);
        const holdParameters = NavigationLibrary.findHoldParametersByFix(waypoint.name);

        if (holdParameters != null) {
            waypoint.setDefaultHoldParameters(holdParameters);
        }

        return waypoint;
    }

    /**
     * Generate an array of `WaypointModel`s an aircraft's FMS will need in order to
     * navigate along this leg instance.
     *
     * @for LegModel
     * @param _generateWaypointCollection
     * @param entryOrFixName {string} name of the entry point (if airway/procedure), or fix name
     * @param exit {string} name of exit point (if airway/procedure), or `undefined`
     * @return {array<WaypointModel>}
     */
    _generateWaypointCollection(entryOrFixName, exit) {
        if (this._legType === LEG_TYPE.DIRECT) {
            return [this._generateWaypoint(entryOrFixName)];
        }

        if (this._legType === LEG_TYPE.AIRWAY) {
            this._verifyAirwayAndEntryAndExitAreValid(entryOrFixName, exit);

            return this._airwayModel.getWaypointModelsForEntryAndExit(entryOrFixName, exit);
        }

        this._verifyProcedureAndEntryAndExitAreValid(entryOrFixName, exit);

        return this._procedureModel.getWaypointModelsForEntryAndExit(entryOrFixName, exit);
    }

    // ------------------------------ PUBLIC ------------------------------

    /**
     * Mark the specified waypoint as a hold waypoint
     *
     * @for LegModel
     * @method activateHoldForWaypointName
     * @param waypointName {string} name of waypoint in route
     * @param holdParameters {object}
     * @param fallbackInboundHeading {number} an optional inboundHeading that is used if no default is available
     * @returns {object} The hold parameters set for the `WaypointModel`
     */
    activateHoldForWaypointName(waypointName, holdParameters, fallbackInboundHeading = undefined) {
        if (!this.hasWaypointName(waypointName)) {
            return;
        }

        const waypointIndex = this._findIndexOfWaypointName(waypointName);
        const waypointModel = this._waypointCollection[waypointIndex];

        return waypointModel.setHoldParametersAndActivateHold(holdParameters, fallbackInboundHeading);
    }

    /**
     * Return the identifier of the airway being used in this leg
     *
     * @for LegModel
     * @method getAirwayName
     * @return {string}
     */
    getAirwayName() {
        if (!this.isAirwayLeg) {
            return;
        }

        return this._airwayModel.icao;
    }

    /**
     * Return an array of WaypointModels AFTER (not including) the specified waypoint
     *
     * @for LegModel
     * @method getAllWaypointModelsAfterWaypointName
     * @return {array<WaypointModel>}
     */
    getAllWaypointModelsAfterWaypointName(waypointName) {
        const indexOfWaypointName = this._findIndexOfWaypointName(waypointName);

        return this._waypointCollection.slice().splice(indexOfWaypointName + 1);
    }

    /**
     * Return an array of WaypointModels BEFORE (not including) the specified waypoint
     *
     * @for LegModel
     * @method getAllWaypointModelsBeforeWaypointName
     * @return {array<WaypointModel>}
     */
    getAllWaypointModelsBeforeWaypointName(waypointName) {
        const indexOfWaypointName = this._findIndexOfWaypointName(waypointName);
        const copyOfWaypointCollection = this._waypointCollection.slice();

        copyOfWaypointCollection.splice(indexOfWaypointName);

        return copyOfWaypointCollection;
    }

    /**
     * Return the ICAO identifier for the airport at which this leg will terminate (if
     * it is in fact a STAR leg, of course).
     *
     * @for LegModel
     * @method getArrivalRunwayAirportIcao
     * @return {string}
     */
    getArrivalRunwayAirportIcao() {
        if (!this.isStarLeg) {
            return null;
        }

        const airportAndRunway = this._routeString.split(PROCEDURE_OR_AIRWAY_SEGMENT_DIVIDER)[2];
        const arrivalAirportIcao = airportAndRunway.substr(0, 4);

        return arrivalAirportIcao.toLowerCase();
    }

    /**
     * Return the name of the runway at which this leg will terminate (if it is in fact
     * a STAR leg, of course).
     *
     * @for LegModel
     * @method getArrivalRunwayName
     * @return {string}
     */
    getArrivalRunwayName() {
        if (!this.isStarLeg) {
            return null;
        }

        const airportAndRunway = this._routeString.split(PROCEDURE_OR_AIRWAY_SEGMENT_DIVIDER)[2];
        const arrivalRunwayName = airportAndRunway.substr(4);

        return arrivalRunwayName;
    }

    /**
    * Returns the lowest `#altitudeMinimum` of all `WaypointModel`s in this leg
    *
    * @for LegModel
    * @method getBottomAltitude
    * @return {number}
    */
    getBottomAltitude() {
        if (!this.isProcedureLeg) {
            return INVALID_NUMBER;
        }

        const minimumAltitudes = _map(this._waypointCollection, (waypoint) => waypoint.altitudeMinimum);
        const positiveValueRestrictionList = _without(minimumAltitudes, INVALID_NUMBER);
        const bottomAltitude = Math.min(...positiveValueRestrictionList);

        if (bottomAltitude === Infinity) {
            return INVALID_NUMBER;
        }

        return bottomAltitude;
    }

    /**
    * Return the ICAO identifier for the airport at which this leg originates (if
    * it is in fact a SID leg, of course).
    *
    * @for LegModel
    * @method getDepartureRunwayAirportIcao
    * @return {string}
    */
    getDepartureRunwayAirportIcao() {
        if (!this.isSidLeg) {
            return null;
        }

        const airportAndRunway = this._routeString.split(PROCEDURE_OR_AIRWAY_SEGMENT_DIVIDER)[0];
        const departureAirportIcao = airportAndRunway.substr(0, 4);

        return departureAirportIcao.toLowerCase();
    }

    /**
    * Return the name of the runway at which this leg begins (if it is in fact
    * a SID leg, of course).
    *
    * @for LegModel
    * @method getDepartureRunwayName
    * @return {string}
    */
    getDepartureRunwayName() {
        if (!this.isSidLeg) {
            return null;
        }

        const airportAndRunway = this._routeString.split(PROCEDURE_OR_AIRWAY_SEGMENT_DIVIDER)[0];
        const departureRunwayName = airportAndRunway.substr(4);

        return departureRunwayName;
    }

    /**
     * Return the ICAO identifier for the procedure being used by this leg
     *
     * @for LegModel
     * @method getProcedureIcao
     * @return {string}
     */
    getProcedureIcao() {
        if (!this.isProcedureLeg) {
            return;
        }

        return this._procedureModel.icao;
    }

    /**
     * Return the name of the procedure being used by this leg
     *
     * @for LegModel
     * @method getProcedureName
     * @return {string}
     */
    getProcedureName() {
        if (!this.isProcedureLeg) {
            return;
        }

        return this._procedureModel.name;
    }

    /**
     * Return the name of this leg's exit fix
     *
     * @for LegModel
     * @method getExitFixName
     * @return {string}
     */
    getEntryFixName() {
        if (this.isDirectLeg) {
            return this._routeString;
        }

        const routeStringElements = this._routeString.split(PROCEDURE_OR_AIRWAY_SEGMENT_DIVIDER);

        return routeStringElements[0];
    }

    /**
     * Return the name of this leg's exit fix
     *
     * @for LegModel
     * @method getExitFixName
     * @return {string}
     */
    getExitFixName() {
        if (this.isDirectLeg) {
            return this._routeString;
        }

        const routeStringElements = this._routeString.split(PROCEDURE_OR_AIRWAY_SEGMENT_DIVIDER);

        return routeStringElements[2];
    }

    /**
     * Returns the route string for this leg, removing any airports
     * For example, `KSEA16L.BANGR9.PANGL` --> `BANGR9.PANGL`
     *
     * BE CAREFUL using this method, because technically `BANGR9.PANGL` is not technically a
     * valid route string, as it does not follow the proper format. This method was created
     * as a means to remove the airports from the route strings so we can display a route on
     * the flight strip that excludes the airport, since this is instead shown in a separate
     * section of the flight strip, and should not be included in the route section.
     *
     * @for LegModel
     * @method getRouteStringWithoutAirports
     * @return {string}
     */
    getRouteStringWithoutAirports() {
        const routeString = this._routeString;

        if (this.isSidLeg) {
            const elements = routeString.split(PROCEDURE_OR_AIRWAY_SEGMENT_DIVIDER);
            const procedure = elements[1];
            const exit = elements[2];

            return `${procedure}.${exit}`;
        }

        if (this.isStarLeg) {
            const elements = routeString.split(PROCEDURE_OR_AIRWAY_SEGMENT_DIVIDER);
            const entry = elements[0];
            const procedure = elements[1];

            return `${entry}.${procedure}`;
        }

        return routeString;
    }

    /**
     * Returns the highest `#altitudeMaximum` of all `WaypointModel`s in this leg
     *
     * @for LegModel
     * @method getTopAltitude
     * @return {number}
     */
    getTopAltitude() {
        if (!this.isProcedureLeg) {
            return INVALID_NUMBER;
        }

        const maximumAltitudes = _map(this._waypointCollection, (waypoint) => waypoint.altitudeMaximum);
        const positiveValueRestrictionList = _without(maximumAltitudes, INVALID_NUMBER);
        const topAltitude = Math.max(...positiveValueRestrictionList);

        if (topAltitude === -Infinity) {
            return INVALID_NUMBER;
        }

        return topAltitude;
    }

    /**
    * Whether there are any `WaypointModel`s in this leg beyond the `#currentWaypoint`
    *
    * @for LegModel
    * @method hasNextWaypoint
    * @return {boolean}
    */
    hasNextWaypoint() {
        return this._waypointCollection.length > 1;
    }

    /**
    * Whether a `WaypointModel` with the specified name exists within the `#_waypointCollection`
    *
    * Note that this will return false even if the specified fix name IS included
    * in the `#_previousWaypointCollection`.
    *
    * @for LegModel
    * @method hasWaypointName
    * @param waypointName {string}
    * @return {boolean}
    */
    hasWaypointName(waypointName) {
        if (_isEmpty(waypointName)) {
            throw new TypeError(`Expected valid fix name but received '${waypointName}'`);
        }

        waypointName = waypointName.toUpperCase();

        // using a for loop instead of `_find()` to maximize performance
        // because this operation could happen quite frequently
        for (let i = 0; i < this._waypointCollection.length; i++) {
            if (this._waypointCollection[i].name === waypointName) {
                return true;
            }
        }

        return false;
    }

    /**
    * Move the `#currentWaypoint` to the `#_previousWaypointCollection`
    *
    * This also results in the `WaypointModel` previously at index `1` becoming
    * index `0`, thus making it the new `#currentWaypoint`.
    *
    * @for LegModel
    * @method moveToNextWaypoint
    */
    moveToNextWaypoint() {
        const waypointModelToMove = this._waypointCollection.shift();

        this._previousWaypointCollection.push(waypointModelToMove);
    }

    procedureHasEntry(entryName) {
        if (!this.isProcedureLeg) {
            return false;
        }

        return this._procedureModel.hasEntry(entryName);
    }

    procedureHasExit(exitName) {
        if (!this.isProcedureLeg) {
            return false;
        }

        return this._procedureModel.hasExit(exitName);
    }

    /**
     * Move all `WaypointModel`s to the `#_previousWaypointCollection`
     *
     * @for LegModel
     * @method skipAllWaypointsInLeg
     */
    skipAllWaypointsInLeg() {
        this._previousWaypointCollection.push(...this._waypointCollection);

        this._waypointCollection = [];
    }

    /**
     * Move all `WaypointModel`s before the specified waypoint to the `#_previousWaypointCollection`
     *
     * This also results in the waypoint with the specified name becoming the new `#currentWaypoint`
     *
     * @for LegModel
     * @method skipToWaypointName
     * @param waypointName {string}
     * @return {boolean} success of operation
     */
    skipToWaypointName(waypointName) {
        const waypointIndex = this._findIndexOfWaypointName(waypointName);

        if (waypointIndex === INVALID_INDEX) {
            return false;
        }

        const numberOfWaypointsToMove = waypointIndex;
        const waypointModelsToMove = this._waypointCollection.splice(0, numberOfWaypointsToMove);

        this._previousWaypointCollection.push(...waypointModelsToMove);

        return true;
    }

    /**
    * If applicable, make the SID entry match the specified departure runway
    *
    * @for LegModel
    * @method updateSidLegForDepartureRunwayModel
    * @param runwayModel {RunwayModel}
    */
    updateSidLegForDepartureRunwayModel(runwayModel) {
        if (!this.isSidLeg) {
            return;
        }

        const routeStringComponents = this._routeString.split(PROCEDURE_OR_AIRWAY_SEGMENT_DIVIDER);
        const currentEntryName = routeStringComponents[0];
        const currentExitName = routeStringComponents[2];
        // assumed first four characters of exit name to be airport ICAO
        const currentRunwayName = currentEntryName.substr(4);
        const nextRunwayName = runwayModel.name;
        const nextEntryName = currentEntryName.substr(0, 4).concat(nextRunwayName);

        if (runwayModel.name === currentRunwayName) {
            return;
        }


        if (!this._procedureModel.hasEntry(nextEntryName)) {
            return;
        }

        this._waypointCollection = this._generateWaypointCollection(nextEntryName, currentExitName);
    }

    /**
     * If applicable, make the STAR exit match the specified arrival runway model
     *
     * @for LegModel
     * @method updateStarLegForArrivalRunwayModel
     * @param runwayModel {RunwayModel}
     */
    updateStarLegForArrivalRunwayModel(runwayModel) {
        if (!this.isStarLeg) {
            return;
        }

        const routeStringComponents = this._routeString.split(PROCEDURE_OR_AIRWAY_SEGMENT_DIVIDER);
        const currentEntryName = routeStringComponents[0];
        const currentExitName = routeStringComponents[2];
        // assumed first four characters of exit name to be airport ICAO
        const currentRunwayName = currentExitName.substr(4);
        const nextRunwayName = runwayModel.name;
        const nextExitName = currentExitName.substr(0, 4).concat(nextRunwayName);

        if (runwayModel.name === currentRunwayName) {
            return;
        }

        if (!this._procedureModel.hasExit(nextExitName)) {
            return;
        }

        this._waypointCollection = this._generateWaypointCollection(currentEntryName, nextExitName);
    }

    // ------------------------------ PRIVATE ------------------------------

    _findIndexOfWaypointName(waypointName) {
        return _findIndex(this._waypointCollection, (waypointModel) => {
            return waypointModel.name === waypointName.toUpperCase();
        });
    }

    /**
     * Reset all waypoints and move them to the `#_previousWaypointCollection`
     *
     * TODO: implement object pooling with `WaypointModel`, this is the method
     *       where the `WaypointModel` is returned to the pool
     *
     * @for LegModel
     * @method _resetWaypointCollection
     * @private
     */
    _resetWaypointCollection() {
        this.skipAllWaypointsInLeg();

        for (let i = 0; i < this._previousWaypointCollection.length; i++) {
            this._previousWaypointCollection[i].reset();
        }
    }

    /**
     * Ensure that the airway, entry, and exit are all valid and can be used to generate waypoints
     *
     * Note that this should only be run on AIRWAY legs!
     *
     * @for LegModel
     * @method _verifyAirwayAndEntryAndExitAreValid
     * @private
     */
    _verifyAirwayAndEntryAndExitAreValid(entryName, exitName) {
        if (_isNil(this._airwayModel)) {
            throw new TypeError('Unable to generate waypoints because the requested airway does not exist');
        }

        const airwayIcao = this._airwayModel.icao;

        if (!this._airwayModel.hasFixName(entryName)) {
            throw new TypeError(`Expected valid entry of ${airwayIcao}, but received ${entryName}`);
        }

        if (!this._airwayModel.hasFixName(exitName)) {
            throw new TypeError(`Expected valid exit of ${airwayIcao}, but received ${exitName}`);
        }
    }

    /**
     * Ensure that the procedure, entry, and exit are all valid and can be used to generate waypoints
     *
     * Note that this should only be run on PROCEDURE legs!
     *
     * @for LegModel
     * @method _verifyProcedureAndEntryAndExitAreValid
     * @private
     */
    _verifyProcedureAndEntryAndExitAreValid(entryName, exitName) {
        if (_isNil(this._procedureModel)) {
            throw new TypeError('Unable to generate waypoints because the requested procedure does not exist');
        }

        const procedureIcao = this._procedureModel.icao;

        if (!this._procedureModel.hasEntry(entryName)) {
            throw new TypeError(`Expected valid entry of ${procedureIcao}, but received ${entryName}`);
        }

        if (!this._procedureModel.hasExit(exitName)) {
            throw new TypeError(`Expected valid exit of ${procedureIcao}, but received ${exitName}`);
        }
    }
}
