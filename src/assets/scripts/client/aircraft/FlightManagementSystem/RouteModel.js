import _chunk from 'lodash/chunk';
import _first from 'lodash/first';
import _findIndex from 'lodash/findIndex';
import _intersection from 'lodash/intersection';
import _isNil from 'lodash/isNil';
import _isString from 'lodash/isString';
import _last from 'lodash/last';
import _map from 'lodash/map';
import _reduce from 'lodash/reduce';
import _without from 'lodash/without';
import LegModel from './LegModel';
import BaseModel from '../../base/BaseModel';
import AirportController from '../../airport/AirportController';
import RunwayModel from '../../airport/runway/RunwayModel';
import {
    INVALID_INDEX,
    INVALID_NUMBER,
    REGEX
} from '../../constants/globalConstants';
import {
    DIRECT_SEGMENT_DIVIDER,
    PROCEDURE_OR_AIRWAY_SEGMENT_DIVIDER
} from '../../constants/routeConstants';
import { assembleProceduralRouteString } from '../../utilities/navigationUtilities';

/**
 * Representation of an aircraft's flight plan route
 *
 * This object contains all of the legs and waypoints the FMS will use to navigate.
 * Each instance of an Aircraft has an FMS with a `RouteModel`, that it is able
 * to modify, including adding/removing legs/waypoints, adding/removing waypoint
 * restrictions, absorbing another `RouteModel`, etc.
 *
 * @class RouteModel
 */
export default class RouteModel extends BaseModel {
    /**
     * @for RouteModel
     * @constructor
     * @param routeString {string}
     */
    constructor(routeString) {
        super();

        /**
         * Array of `LegModel`s on the route
         *
         * @for RouteModel
         * @property _legCollection
         * @type {array<LegModel>}
         * @private
         */
        this._legCollection = [];

        /**
         * Array of `LegModel`s that have been passed (or skipped)
         *
         * Aircraft will proceed along the route to each waypoint, and upon completion
         * of any given leg, it will move that leg here to the `#_previousLegCollection`,
         * and proceed to the next leg in the `#_legCollection` until no more `LegModel`s
         * exist, at which point they will simply hold their last assigned heading and altitude.
         *
         * @for RouteModel
         * @property _previousLegCollection
         * @type {array<WaypointModel>}
         * @private
         */
        this._previousLegCollection = [];

        this.init(routeString);
    }

    /**
     * Return the current `LegModel`
     *
     * @for RouteModel
     * @property currentLeg
     * @type {LegModel}
     */
    get currentLeg() {
        if (this._legCollection.length < 1) {
            throw new TypeError('Expected the route to contain at least one leg');
        }

        return this._legCollection[0];
    }

    /**
     * Return the current `WaypointModel`
     *
     * @for RouteModel
     * @property currentWaypoint
     * @type {WaypointModel}
     */
    get currentWaypoint() {
        return this.currentLeg.currentWaypoint;
    }

    /**
     * Return the current `#_legCollection`
     *
     * @for RouteModel
     * @property legCollection
     * @type {array<LegModel>}
     */
    get legCollection() {
        return this._legCollection;
    }

    /**
     * Return the next `LegModel`, if it exists
     *
     * @for RouteModel
     * @property nextLeg
     * @type {LegModel}
     */
    get nextLeg() {
        if (!this.hasNextLeg()) {
            return null;
        }

        return this._legCollection[1];
    }

    /**
     * Return the next `WaypointModel`, from current or future leg
     *
     * @for RouteModel
     * @property nextWaypoint
     * @type {WaypointModel}
     */
    get nextWaypoint() {
        if (!this.hasNextWaypoint()) {
            return null;
        }

        if (this.currentLeg.hasNextWaypoint()) {
            return this.currentLeg.nextWaypoint;
        }

        return this.nextLeg.currentWaypoint;
    }

    /**
     * Return an array of all waypoints in all legs of the route
     *
     * @for RouteModel
     * @property waypoints
     * @type {array<WaypointModel>}
     */
    get waypoints() {
        return _reduce(this._legCollection, (waypointList, legModel) => {
            return waypointList.concat(legModel.waypoints);
        }, []);
    }

    // ------------------------------ LIFECYCLE ------------------------------

    /**
     * Initialize instance properties
     *
     * @for RouteModel
     * @method init
     * @param routeString {string}
     * @chainable
     */
    init(routeString) {
        this._legCollection = this._generateLegsFromRouteString(routeString);

        return this;
    }

    /**
     * Reset instance properties
     *
     * @for RouteModel
     * @method reset
     * @chainable
     */
    reset() {
        this._legCollection = [];

        return this;
    }

    // ------------------------------ PUBLIC ------------------------------

    /**
     * Merge the provided route model into this route model, if possible
     *
     * @for RouteModel
     * @method absorbRouteModel
     * @param routeModel {RouteModel}
     * @return {array} [success of operation, response]
     */
    absorbRouteModel(routeModel) {
        const firstWaypointName = _first(routeModel.waypoints).name;
        const lastWaypointName = _last(routeModel.waypoints).name;
        const routesConverge = this.hasWaypointName(lastWaypointName);
        const routesDiverge = this.hasWaypointName(firstWaypointName);

        if (routesConverge && routesDiverge) {
            return this._overwriteRouteBetweenWaypointNames(firstWaypointName, lastWaypointName, routeModel);
        }

        if (routesConverge) {
            return this._prependRouteModelEndingAtWaypointName(lastWaypointName, routeModel);
        }

        if (routesDiverge) {
            return this._appendRouteModelBeginningAtWaypointName(firstWaypointName, routeModel);
        }

        return [false, 'routes do not have continuity!'];
    }

    /**
     * Mark the specified waypoint as a hold waypoint
     *
     * @for RouteModel
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

        const legIndex = this._findIndexOfLegContainingWaypointName(waypointName);
        const legModel = this._legCollection[legIndex];

        // This calculates the inbound heading to the fix from the preceding waypoint,
        // and uses that as the fallbackInboundHeading.
        // If no preceding waypoing exists, then the original fallbackInboundHeading passed is used
        [fallbackInboundHeading] = this.waypoints.reduce((last, wpt) => {
            let [heading] = last;
            const [, lastWpt] = last;

            if (lastWpt !== null && wpt.name === waypointName.toUpperCase()) {
                heading = wpt.positionModel.bearingFromPosition(lastWpt.positionModel);
            }

            return [heading, wpt];
        }, [fallbackInboundHeading, null]);

        return legModel.activateHoldForWaypointName(waypointName, holdParameters, fallbackInboundHeading);
    }

    /**
    * Return an array of waypoints in the flight plan that have altitude restrictions
    *
    * @for RouteModel
    * @method getAltitudeRestrictedWaypoints
    * @return {array<WaypointModel>}
    */
    getAltitudeRestrictedWaypoints() {
        return this.waypoints.filter((waypoint) => waypoint.hasAltitudeRestriction);
    }

    /**
     * Return the ICAO identifier for the airport at whose runway this route will terminate
     *
     * @for LegModel
     * @method getArrivalRunwayAirportIcao
     * @return {string}
     */
    getArrivalRunwayAirportIcao() {
        if (!this.hasStarLeg()) {
            return null;
        }

        const starLegIndex = this._findStarLegIndex();

        return this._legCollection[starLegIndex].getArrivalRunwayAirportIcao();
    }

    /**
     * Return the `AirportModel` at whose runway this route will terminate
     *
     * @for RouteModel
     * @method getArrivalRunwayAirportModel
     * @return {AirportModel}
     */
    getArrivalRunwayAirportModel() {
        const airportIcao = this.getArrivalRunwayAirportIcao();

        if (!airportIcao) {
            return null;
        }

        return AirportController.airport_get(airportIcao);
    }

    /**
     * Return the name of the runway at which this route will terminate
     *
     * @for LegModel
     * @method getArrivalRunwayName
     * @return {string}
     */
    getArrivalRunwayName() {
        if (!this.hasStarLeg()) {
            return null;
        }

        const starLegIndex = this._findStarLegIndex();

        return this._legCollection[starLegIndex].getArrivalRunwayName();
    }

    /**
     * Return the `RunwayModel` at which this route will terminate
     *
     * @for RouteModel
     * @method getArrivalRunwayModel
     * @return {RunwayModel}
     */
    getArrivalRunwayModel() {
        const arrivalRunwayName = this.getArrivalRunwayName();

        if (!arrivalRunwayName) {
            return null;
        }

        return this.getArrivalRunwayAirportModel().getRunway(arrivalRunwayName);
    }

    /**
    * Return the ICAO identifier for the airport at whose runway this route originates
    *
    * @for LegModel
    * @method getDepartureRunwayAirportIcao
    * @return {string}
    */
    getDepartureRunwayAirportIcao() {
        if (!this.hasSidLeg()) {
            return null;
        }

        const sidLegModel = this._findSidLeg();

        return sidLegModel.getDepartureRunwayAirportIcao();
    }

    /**
     * Return the `AirportModel` for the airport at whose runway this route originates
     *
     * @for RouteModel
     * @method getDepartureRunwayAirportModel
     * @return {AirportModel}
     */
    getDepartureRunwayAirportModel() {
        const airportIcao = this.getDepartureRunwayAirportIcao();

        if (!airportIcao) {
            return null;
        }

        return AirportController.airport_get(airportIcao);
    }

    /**
    * Return the name of the runway at which this route originates
    *
    * @for LegModel
    * @method getDepartureRunwayName
    * @return {string}
    */
    getDepartureRunwayName() {
        if (!this.hasSidLeg()) {
            return null;
        }

        const sidLegModel = this._findSidLeg();

        return sidLegModel.getDepartureRunwayName();
    }

    /**
     * Return the `RunwayModel` at which this route originates
     *
     * @for RouteModel
     * @method getDepartureRunwayModel
     * @return {RunwayModel}
     */
    getDepartureRunwayModel() {
        const departureRunwayName = this.getDepartureRunwayName();

        if (!departureRunwayName) {
            return null;
        }

        return this.getDepartureRunwayAirportModel().getRunway(departureRunwayName);
    }

    /**
    * Returns the lowest bottom altitude of any `LegModel` in the `#_legCollection`
    *
    * @for RouteModel
    * @method getBottomAltitude
    * @return {number}
    */
    getBottomAltitude() {
        const minAltitudesFromLegs = _without(
            _map(this._legCollection, (leg) => leg.getBottomAltitude()),
            INVALID_NUMBER
        );
        const bottomAltitude = Math.min(...minAltitudesFromLegs);

        if (bottomAltitude === Infinity) {
            return INVALID_NUMBER;
        }

        return bottomAltitude;
    }

    /**
     * Generate a route string for all legs in the `#_previousLegCollection` an `#_legCollection`
     *
     * @for RouteModel
     * @method getRouteString
     * @return {string}
     */
    getFullRouteString() {
        const pastAndPresentLegModels = this._getPastAndPresentLegModels();
        const pastAndPresentLegRouteStrings = _map(pastAndPresentLegModels, (legModel) => legModel.routeString);

        return this._combineRouteStrings(pastAndPresentLegRouteStrings);
    }

    /**
    * Returns the full route string, with airports removed
    *
    * Example:
    * - `KSEA16L.BANGR9.PANGL` --> `BANGR9.PANGL`
    *
    * @for RouteModel
    * @method getFullRouteStringWithoutAirportsWithSpaces
    * @return {string}
    */
    getFullRouteStringWithoutAirportsWithSpaces() {
        const pastAndPresentLegModels = this._getPastAndPresentLegModels();
        const legRouteStringsWithoutAirports = _map(pastAndPresentLegModels, (legModel) => {
            return legModel.getRouteStringWithoutAirports();
        });

        return this._combineRouteStrings(legRouteStringsWithoutAirports)
            .replace(REGEX.DOUBLE_DOT, ' ')
            .replace(REGEX.SINGLE_DOT, ' ');
    }

    /**
     * Return `#fullRouteString` with spaces between elements instead of dot notation
     *
     * Example:
     * - `KSEA16L.BANGR9.PANGL` --> `KSEA16L BANGR9 PANGL`
     *
     * Used mostly for representing the route string in the view, like
     * an aircraft strip, etc.
     *
     * @for RouteModel
     * @method getFullRouteStringWithSpaces
     * @return {string}
     */
    getFullRouteStringWithSpaces() {
        const routeString = this.getFullRouteString();

        return routeString.replace(REGEX.DOUBLE_DOT, ' ').replace(REGEX.SINGLE_DOT, ' ');
    }

    /**
     * Generate a route string for all legs in the `#_legCollection`
     *
     * @for RouteModel
     * @method getRouteString
     * @return {string}
     */
    getRouteString() {
        const legRouteStrings = _map(this._legCollection, (legModel) => legModel.routeString);

        return this._combineRouteStrings(legRouteStrings);
    }

    /**
     * Return `#routeString` with spaces between elements instead of dot notation
     *
     * Example:
     * - `KSEA16L.BANGR9.PANGL..TOU` --> `BANGR9 PANGL TOU`
     *
     * @for RouteModel
     * @method getRouteStringWithSpaces
     * @return {string}
     */
    getRouteStringWithSpaces() {
        const routeString = this.getRouteString();

        return routeString.replace(REGEX.DOUBLE_DOT, ' ').replace(REGEX.SINGLE_DOT, ' ');
    }

    /**
     * Returns exit waypoint for a departure aircraft, to be used in datablock
     *
     * When a SID procedure is defined, this will return the exit waypoint
     * Example:
     * - `KLAS07R.BOACH6.TNP` -> `TNP`
     *
     * When no SID procedure is defined, this will return the first fix in the route
     * Example:
     * - `OAL..MLF..PGS` -> `OAL`
     *
     * @for RouteModel
     * @method getFlightPlanEntry
     * @returns {string} First fix in flightPlan or exit fix of SID
     */
    getFlightPlanEntry() {
        if (!this.hasSidLeg()) {
            return this.getFullRouteString().split('..')[0];
        }

        const sidLegModel = this._findSidLeg();

        return sidLegModel.getExitFixName();
    }

    /**
     * Return the ICAO identifier of the SID in use (if any)
     *
     * @for RouteModel
     * @method getSidIcao
     * @return {string}
     */
    getSidIcao() {
        if (!this.hasSidLeg()) {
            return;
        }

        const sidLegModel = this._findSidLeg();

        return sidLegModel.getProcedureIcao();
    }

    /**
     * Return the name of the SID in use (if any)
     *
     * @for RouteModel
     * @method getSidName
     * @return {string}
     */
    getSidName() {
        if (!this.hasSidLeg()) {
            return;
        }

        const sidLegModel = this._findSidLeg();

        return sidLegModel.getProcedureName();
    }

    /**
     * Return the initial altitude of the SID or the airport
     *
     * @for RouteModel
     * @method getInitialClimbClearance
     * @return {number}
     */
    getInitialClimbClearance() {
        const sidLegModel = this._findSidLeg();

        if (sidLegModel && sidLegModel.altitude) {
            return sidLegModel.altitude;
        }

        const airport = AirportController.airport_get();

        return airport.initial_alt;
    }

    /**
     * Return the ICAO identifier of the STAR in use (if any)
     *
     * @for RouteModel
     * @method getStarIcao
     * @return {string}
     */
    getStarIcao() {
        if (!this.hasStarLeg()) {
            return;
        }

        const starLegModel = this._legCollection[this._findStarLegIndex()];

        return starLegModel.getProcedureIcao();
    }

    /**
     * Return the name of the STAR in use (if any)
     *
     * @for RouteModel
     * @method getStarName
     * @return {string}
     */
    getStarName() {
        if (!this.hasStarLeg()) {
            return;
        }

        const starLegModel = this._legCollection[this._findStarLegIndex()];

        return starLegModel.getProcedureName();
    }

    /**
     * Returns the highest top altitude of any `LegModel` in the `#_legCollection`
    *
    * @for RouteModel
    * @method getTopAltitude
    * @return {number}
    */
    getTopAltitude() {
        const maxAltitudesFromLegs = _without(
            _map(this._legCollection, (leg) => leg.getTopAltitude()),
            INVALID_NUMBER
        );
        const topAltitude = Math.max(...maxAltitudesFromLegs);

        if (topAltitude === -Infinity) {
            return INVALID_NUMBER;
        }

        return topAltitude;
    }

    /**
     * Whether the route has another leg after the current one
     *
     * @for RouteModel
     * @method hasNextLeg
     * @return {boolean}
     */
    hasNextLeg() {
        return this._legCollection.length > 1;
    }

    /**
     * Whether the route has another waypoint after the current one
     *
     * This includes waypoints in the current and future legs
     *
     * @for RouteModel
     * @method hasNextWaypoint
     * @return {boolean}
     */
    hasNextWaypoint() {
        if (this.currentLeg.hasNextWaypoint()) {
            return true;
        }

        if (!this.hasNextLeg()) {
            return false;
        }

        return !_isNil(this.nextLeg.currentWaypoint);
    }

    /**
     * Return whether the route has a SID leg
     *
     * @for RouteModel
     * @method hasSidLeg
     * @return {boolean}
     */
    hasSidLeg() {
        return this._findSidLegIndex() !== INVALID_INDEX;
    }

    /**
     * Return whether the route has a STAR leg
     *
     * @for RouteModel
     * @method hasStarLeg
     * @return {boolean}
     */
    hasStarLeg() {
        return this._findStarLegIndex() !== INVALID_INDEX;
    }

    /**
     * Return whether the route contains a waypoint with the specified name
     *
     * @for RouteModel
     * @method hasWaypointName
     * @param waypointName {string}
     * @return {boolean}
     */
    hasWaypointName(waypointName) {
        for (let i = 0; i < this._legCollection.length; i++) {
            if (this._legCollection[i].hasWaypointName(waypointName)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Returns whether the specified runway is valid for this route's SID leg (if it has one)
     *
     * If there is no SID, there is no issue with changing runways, so we would treat this as "valid"
     *
     * @for RouteModel
     * @method isRunwayModelValidForSid
     * @param runwayModel {RunwayModel}
     * @return {boolean}
     */
    isRunwayModelValidForSid(runwayModel) {
        if (!(runwayModel instanceof RunwayModel)) {
            return false;
        }

        const sidLegModel = this._findSidLeg();

        if (!sidLegModel) {
            return true;
        }

        const departureAirportIcao = this.getDepartureRunwayAirportIcao().toUpperCase();
        const entryName = `${departureAirportIcao}${runwayModel.name}`;

        return sidLegModel.procedureHasEntry(entryName);
    }

    /**
     * Returns whether the specified runway is valid for this route's STAR leg (if it has one)
     *
     * If there is no STAR, there is no issue with changing runways, so we would treat this as "valid"
     *
     * @for RouteModel
     * @method isRunwayModelValidForStar
     * @param runwayModel {RunwayModel}
     * @return {boolean}
     */
    isRunwayModelValidForStar(runwayModel) {
        if (!(runwayModel instanceof RunwayModel)) {
            return false;
        }

        const starLegIndex = this._findStarLegIndex();
        const starLegModel = this._legCollection[starLegIndex];

        if (!starLegModel) {
            return true;
        }

        const arrivalAirportIcao = this.getArrivalRunwayAirportIcao().toUpperCase();
        const exitName = `${arrivalAirportIcao}${runwayModel.name}`;

        return starLegModel.procedureHasExit(exitName);
    }

    /**
     * Skip ahead to the next waypoint
     *
     * If there are no more waypoints in the `#currentLeg`, this will also cause
     * us to skip to the next leg.
     *
     * @for RouteModel
     * @method moveToNextWaypoint
     */
    moveToNextWaypoint() {
        if (!this.currentLeg.hasNextWaypoint()) {
            return this.moveToNextLeg();
        }

        this.currentLeg.moveToNextWaypoint();
    }

    /**
     * Replace the arrival procedure leg with a new one (if it exists in the route)
     *
     * Create a new STAR leg from the specified route string. If a STAR leg already
     * exists, replace that leg with the new one. Else, add the new one at the end
     * of the #_legCollection.
     *
     * @for RouteModel
     * @method replaceArrivalProcedure
     * @param routeString {string}
     * @return {boolean} whether operation was successful
     */
    replaceArrivalProcedure(routeString) {
        let starLegModel;

        try {
            starLegModel = new LegModel(routeString);
        } catch (error) {
            console.error(error);

            return false;
        }

        // if no STAR leg exists, insert the new one as the new last leg
        if (!this.hasStarLeg()) {
            this._legCollection.push(starLegModel);

            return true;
        }

        this._legCollection[this._findStarLegIndex()] = starLegModel;

        return true;
    }

    /**
     * Replace the departure procedure leg with a new one (if it exists in the route)
     *
     * Create a new SID leg from the specified route string. If a SID leg already
     * exists, replace that leg with the new one. Else, add the new one at the
     * beginning of the #_legCollection.
     *
     * @for RouteModel
     * @method replaceDepartureProcedure
     * @param routeString {string}
     * @return {array} [success of operation, response]
     */
    replaceDepartureProcedure(routeString) {
        let routeModel;

        try {
            routeModel = new RouteModel(routeString);
        } catch (error) {
            console.error(error);

            return [false, `requested route of "${routeString.toUpperCase()}" is invalid`];
        }

        return this.absorbRouteModel(routeModel);
    }

    /**
     * Move the current leg into the `#_previousLegCollection`
     *
     * This also results in the `#nextLeg` becoming the `#currentLeg`
     *
     * @for RouteModel
     * @method moveToNextLeg
     */
    moveToNextLeg() {
        if (!this.hasNextLeg()) {
            return;
        }

        const legToMove = this._legCollection.splice(0, 1);

        this._previousLegCollection.push(...legToMove);
    }

    /**
     * Skip ahead to the waypoint with the specified name, if it exists
     *
     * @for RouteModel
     * @method skipToWaypointName
     * @param waypointName {string}
     * @return {boolean} success of operation
     */
    skipToWaypointName(waypointName) {
        if (!this.hasWaypointName(waypointName)) {
            return false;
        }

        if (this.currentLeg.hasWaypointName(waypointName)) {
            return this.currentLeg.skipToWaypointName(waypointName);
        }

        const legIndex = _findIndex(this._legCollection, (legModel) => legModel.hasWaypointName(waypointName));
        const legModelsToMove = this._legCollection.splice(0, legIndex);

        this._previousLegCollection.push(...legModelsToMove);

        return this.currentLeg.skipToWaypointName(waypointName);
    }

    /**
     * Ensure the SID leg has the specified departure runway as the entry point
     *
     * @for RouteModel
     * @method updateSidLegForDepartureRunwayModel
     * @param runwayModel {RunwayModel}
     */
    updateSidLegForDepartureRunwayModel(runwayModel) {
        if (!this.hasSidLeg()) {
            return;
        }

        const sidLegModel = this._findSidLeg();

        sidLegModel.updateSidLegForDepartureRunwayModel(runwayModel);
    }

    /**
    * Ensure the STAR leg has the specified arrival runway as the exit point
    *
    * @for RouteModel
    * @method updateStarLegForArrivalRunwayModel
    * @param runwayModel {RunwayModel}
    */
    updateStarLegForArrivalRunwayModel(runwayModel) {
        if (!this.hasStarLeg()) {
            return;
        }

        if (!this.isRunwayModelValidForStar(runwayModel)) {
            console.error(`Received Runway ${runwayModel.name}, which is not valid for the assigned STAR. ` +
                'The runway should have been validated before passing it to this method!');

            return;
        }

        const originalCurrentWaypointName = this.currentWaypoint.name;
        const nextExitName = `${this.getArrivalRunwayAirportIcao().toUpperCase()}${runwayModel.name}`;
        const starLegIndex = this._findStarLegIndex();
        const amendedStarLegModel = this._createAmendedStarLegUsingDifferentExitName(nextExitName, starLegIndex);
        this._legCollection[starLegIndex] = amendedStarLegModel;

        this.skipToWaypointName(originalCurrentWaypointName);
    }

    // ------------------------------ PRIVATE ------------------------------

    /**
     * Append a provided route model onto the end of this RouteModel
     *
     * This method only serves to call the method that contains the appropriate logic
     * based on the type of leg in which the divergent waypoint resides, since this
     * heavily weighs in to how the merging of the routes should be done. Note that
     * the #_legCollection will be mutated in this process.
     *
     * @for RouteModel
     * @method _appendRouteModelBeginningAtWaypointName
     * @param divergentWaypointName {string} name of waypoint at which the two routes have continuity
     * @param routeModel {RouteModel} the RouteModel to be absorbed into this
     * @return {array} [success of operation, readback]
     */
    _appendRouteModelBeginningAtWaypointName(divergentWaypointName, routeModel) {
        const indexOfDivergentLeg = this._findIndexOfLegContainingWaypointName(divergentWaypointName);
        const divergentLeg = this._legCollection[indexOfDivergentLeg];

        if (divergentLeg.isAirwayLeg) {
            return this._appendRouteModelOutOfAirwayLeg(divergentWaypointName, routeModel);
        }

        if (divergentLeg.isDirectLeg) {
            return this._appendRouteModelOutOfDirectLeg(divergentWaypointName, routeModel);
        }

        if (divergentLeg.isSidLeg) {
            return this._appendRouteModelOutOfSidLeg(divergentWaypointName, routeModel);
        }

        if (divergentLeg.isStarLeg) {
            return this._appendRouteModelOutOfStarLeg(divergentWaypointName, routeModel);
        }

        throw new TypeError(`Expected known leg type, but received "${divergentLeg.legType}" ` +
            'type leg, preventing ability to determine the appropriate route merging strategy!');
    }

    /**
     * Append a provided route model into this RouteModel when the divergent waypoint is in an airway leg
     *
     * This should only ever be called by `._appendRouteModelBeginningAtWaypointName()`
     *
     * @for RouteModel
     * @method _appendRouteModelOutOfAirwayLeg
     * @param divergentWaypointName {string} name of waypoint at which the two routes have continuity
     * @param routeModel {RouteModel} the RouteModel to be absorbed into this
     * @return {array} [success of operation, readback]
     */
    _appendRouteModelOutOfAirwayLeg(divergentWaypointName, routeModel) {
        const indexOfDivergentLeg = this._findIndexOfLegContainingWaypointName(divergentWaypointName);
        const amendedAirwayLeg = this._createAmendedAirwayLegUsingDifferentExitName(
            divergentWaypointName,
            indexOfDivergentLeg
        );

        this._legCollection.splice(indexOfDivergentLeg);

        this._legCollection = [
            ...this._legCollection,
            amendedAirwayLeg,
            ...routeModel.legCollection
        ];

        const readback = {};
        readback.log = `rerouting to: ${this.getRouteStringWithSpaces()}`;
        readback.say = 'rerouting as requested';

        return [true, readback];
    }

    /**
     * Append a provided route model into this RouteModel when the divergent waypoint is in a direct leg
     *
     * This should only ever be called by `._appendRouteModelBeginningAtWaypointName()`
     *
     * @for RouteModel
     * @method _appendRouteModelOutOfDirectLeg
     * @param divergentWaypointName {string} name of waypoint at which the two routes have continuity
     * @param routeModel {RouteModel} the RouteModel to be absorbed into this
     * @return {array} [success of operation, readback]
     */
    _appendRouteModelOutOfDirectLeg(divergentWaypointName, routeModel) {
        const indexOfDivergentLeg = this._findIndexOfLegContainingWaypointName(divergentWaypointName);

        this._legCollection.splice(indexOfDivergentLeg);
        this._legCollection = this._legCollection.concat(routeModel.legCollection);

        const readback = {};
        readback.log = `rerouting to: ${this.getRouteStringWithSpaces()}`;
        readback.say = 'rerouting as requested';

        return [true, readback];
    }

    /**
     * Append a provided route model into this RouteModel when the divergent waypoint is in a SID leg
     *
     * This should only ever be called by `._appendRouteModelBeginningAtWaypointName()`
     *
     * @for RouteModel
     * @method _appendRouteModelOutOfSidLeg
     * @param divergentWaypointName {string} name of waypoint at which the two routes have continuity
     * @param routeModel {RouteModel} the RouteModel to be absorbed into this
     * @return {array} [success of operation, readback]
     */
    _appendRouteModelOutOfSidLeg(divergentWaypointName, routeModel) {
        const indexOfDivergentLeg = this._findIndexOfLegContainingWaypointName(divergentWaypointName);
        const remainingLegWaypointsAsLegs = this._createLegsFromSidWaypointsBeforeWaypointName(
            divergentWaypointName,
            indexOfDivergentLeg
        );

        this._legCollection.splice(indexOfDivergentLeg);

        this._legCollection = [
            ...this._legCollection,
            ...remainingLegWaypointsAsLegs,
            ...routeModel.legCollection
        ];

        const readback = {};
        readback.log = `rerouting to: ${this.getRouteStringWithSpaces()}`;
        readback.say = 'rerouting as requested';

        return [true, readback];
    }

    /**
     * Append a provided route model into this RouteModel when the divergent waypoint is in a STAR leg
     *
     * This should only ever be called by `._appendRouteModelBeginningAtWaypointName()`
     *
     * @for RouteModel
     * @method _appendRouteModelOutOfSidLeg
     * @param divergentWaypointName {string} name of waypoint at which the two routes have continuity
     * @param routeModel {RouteModel} the RouteModel to be absorbed into this
     * @return {array} [success of operation, readback]
     */
    _appendRouteModelOutOfStarLeg(divergentWaypointName, routeModel) {
        const indexOfDivergentLeg = this._findIndexOfLegContainingWaypointName(divergentWaypointName);
        const divergentLegModel = this._legCollection[indexOfDivergentLeg];

        if (divergentLegModel.procedureHasExit(divergentWaypointName)) {
            const amendedStarLeg = this._createAmendedStarLegUsingDifferentExitName(
                divergentWaypointName,
                indexOfDivergentLeg
            );

            this._legCollection.splice(indexOfDivergentLeg);

            this._legCollection = [
                ...this._legCollection,
                amendedStarLeg,
                ...routeModel.legCollection
            ];

            const readback = {};
            readback.log = `rerouting to: ${this.getRouteStringWithSpaces()}`;
            readback.say = 'rerouting as requested';

            return [true, readback];
        }

        const remainingLegWaypointsAsLegs = this._createLegsFromStarWaypointsBeforeWaypointName(
            divergentWaypointName,
            indexOfDivergentLeg
        );

        this._legCollection.splice(indexOfDivergentLeg);

        this._legCollection = [
            ...this._legCollection,
            ...remainingLegWaypointsAsLegs,
            ...routeModel._legCollection
        ];

        const readback = {};
        readback.log = `rerouting to: ${this.getRouteStringWithSpaces()}`;
        readback.say = 'rerouting as requested';

        return [true, readback];
    }

    /**
    * Combine all provided route strings
    *
    * This enables us to get a route string for a SPECIFIABLE series of legs, which
    * may be a portion of the `#_legCollection` or of the `#_previousLegCollection`,
    * or any combination thereof, including manipulated route strings.
    *
    * @for RouteModel
    * @method _combineRouteStrings
    * @param legRouteStrings {array<string>}
    * @return {string}
    */
    _combineRouteStrings(legRouteStrings) {
        const directRouteSegments = [_first(legRouteStrings)];

        for (let i = 1; i < legRouteStrings.length; i++) {
            const exitOfPreviousLeg = _last(legRouteStrings[i - 1].split(PROCEDURE_OR_AIRWAY_SEGMENT_DIVIDER));
            const leg = legRouteStrings[i];
            const legEntry = _first(leg.split(PROCEDURE_OR_AIRWAY_SEGMENT_DIVIDER));

            if (legEntry === exitOfPreviousLeg) {
                const indexOfPreviousLeg = directRouteSegments.length - 1;
                const legRouteStringWithoutEntry = leg.replace(legEntry, '');
                directRouteSegments[indexOfPreviousLeg] += legRouteStringWithoutEntry;

                continue;
            }

            directRouteSegments.push(leg);
        }

        return directRouteSegments.join(DIRECT_SEGMENT_DIVIDER);
    }

    /**
     * Create an airway leg based on the provided one, except with the new specified entry
     *
     * NOTE: this assumes the entry fix provided has already been verified as valid for this airway
     *
     * We know that `_createAmendedConvergentLeg()` and `_prependRouteModelIntoAirwayLeg()` both
     * are called only in situations where a requested route amendment ends at a fix that was already
     * included in the #_waypointCollection of an airway leg of the previous route. If this method is
     * called by either of them, we can be confident that the `entryFixName` is on the airway.
     *
     * @for RouteModel
     * @method _createAmendedAirwayLegUsingDifferentEntryName
     * @param entryFixName {string} name of airway entry to use for the new airway leg
     * @param legIndex {number} index of leg in the #_legCollection
     * @return {LegModel}
     */
    _createAmendedAirwayLegUsingDifferentEntryName(entryFixName, legIndex) {
        const convergentLegModel = this._legCollection[legIndex];
        const airwayName = convergentLegModel.getAirwayName();
        const exitFixName = convergentLegModel.getExitFixName();
        const amendedAirwayRouteString = assembleProceduralRouteString(entryFixName, airwayName, exitFixName);
        const amendedAirwayLeg = new LegModel(amendedAirwayRouteString);

        return amendedAirwayLeg;
    }

    /**
     * Create an airway leg based on the provided one, except with the new specified exit
     *
     * NOTE: this assumes the exit fix provided has already been verified as valid for this airway
     *
     * @for RouteModel
     * @method _createAmendedAirwayLegUsingDifferentExitName
     * @param exitFixName {string} name of airway exit to use for the new airway leg
     * @param legIndex {number} index of leg in the #_legCollection
     * @return {LegModel}
     */
    _createAmendedAirwayLegUsingDifferentExitName(exitFixName, legIndex) {
        const divergentLeg = this._legCollection[legIndex];
        const airwayName = divergentLeg.getAirwayName();
        const entryFixName = divergentLeg.getEntryFixName();
        const amendedAirwayRouteString = assembleProceduralRouteString(entryFixName, airwayName, exitFixName);
        const amendedAirwayLeg = new LegModel(amendedAirwayRouteString);

        return amendedAirwayLeg;
    }

    /**
     * Amend the leg from #_legCollection at which a provided RouteModel converges with this model, such
     * that the amended leg begins at the point of convergence.
     *
     * @for RouteModel
     * @method _createAmendedConvergentLeg
     * @param indexOfConvergentLegModel {number} index of leg which intersects with the provided RouteModel
     * @param endWaypointName {string} name of the waypoint within that leg at which the routes converge
     * @return {array<LegModel>}
     */
    _createAmendedConvergentLeg(indexOfConvergentLegModel, endWaypointName) {
        const convergentLegModel = this._legCollection[indexOfConvergentLegModel];

        if (convergentLegModel.isAirwayLeg) {
            return [this._createAmendedAirwayLegUsingDifferentEntryName(endWaypointName, indexOfConvergentLegModel)];
        }

        if (convergentLegModel.isDirectLeg) {
            return [];
        }

        if (convergentLegModel.isSidLeg) {
            const firstWaypointName = _first(convergentLegModel.waypoints).name;

            if (firstWaypointName === endWaypointName) {
                return [convergentLegModel];
            }

            return this._createLegsFromSidWaypointsAfterWaypointName(endWaypointName, indexOfConvergentLegModel);
        }

        if (convergentLegModel.isStarLeg) {
            const firstWaypointName = _first(convergentLegModel.waypoints).name;

            if (firstWaypointName === endWaypointName) {
                return [convergentLegModel];
            }

            if (convergentLegModel.procedureHasEntry(endWaypointName)) {
                return [this._createAmendedStarLegUsingDifferentEntryName(endWaypointName, indexOfConvergentLegModel)];
            }

            return this._createLegsFromStarWaypointsAfterWaypointName(endWaypointName, indexOfConvergentLegModel);
        }

        throw new TypeError(`Expected known leg type, but received type "${convergentLegModel.legType}"`);
    }

    /**
     * Amend the leg from #_legCollection at which a provided RouteModel diverges from this model, such
     * that the amended leg ends at the point of divergence.
     *
     * @for RouteModel
     * @method _createAmendedDivergentLeg
     * @param indexOfDivergentLegModel {number} index of leg which intersects with the provided RouteModel
     * @param startWaypointName {string} name of the waypoint within that leg at which the routes diverge
     * @return {array<LegModel>}
     */
    _createAmendedDivergentLeg(indexOfDivergentLegModel, startWaypointName) {
        const divergentLegModel = this._legCollection[indexOfDivergentLegModel];

        if (divergentLegModel.isAirwayLeg) {
            return [this._createAmendedAirwayLegUsingDifferentExitName(startWaypointName, indexOfDivergentLegModel)];
        }

        if (divergentLegModel.isDirectLeg) {
            return [];
        }

        if (divergentLegModel.isSidLeg) {
            const endingWaypointName = _last(divergentLegModel.waypoints).name;

            if (endingWaypointName === startWaypointName) {
                return [divergentLegModel];
            }

            return this._createLegsFromSidWaypointsBeforeWaypointName(startWaypointName, indexOfDivergentLegModel);
        }

        if (divergentLegModel.isStarLeg) {
            const endingWaypointName = _last(divergentLegModel.waypoints).name;

            if (endingWaypointName === startWaypointName) {
                return [divergentLegModel];
            }

            if (divergentLegModel.procedureHasExit(startWaypointName)) {
                return [this._createAmendedStarLegUsingDifferentExitName(startWaypointName, indexOfDivergentLegModel)];
            }

            return this._createLegsFromStarWaypointsBeforeWaypointName(startWaypointName, indexOfDivergentLegModel);
        }

        throw new TypeError(`Expected known leg type, but received type "${divergentLegModel.legType}"`);
    }

    /**
     * Accept a SID leg, and explode it into direct legs, including only waypoints before the specified one
     *
     * @for RouteModel
     * @method _createLegsFromSidWaypointsBeforeWaypointName
     * @param waypointName {string} name of waypoint where we begin to discard waypoints
     * @param legIndex {number} index of leg in the #_legCollection
     * @return {array<LegModel>}
     */
    _createLegsFromSidWaypointsBeforeWaypointName(waypointName, legIndex) {
        const divergentLeg = this._legCollection[legIndex];
        const waypointModels = divergentLeg.getAllWaypointModelsBeforeWaypointName(waypointName);
        const remainingLegWaypointsAsLegs = this._createLegModelsFromWaypointModels(waypointModels);

        return remainingLegWaypointsAsLegs;
    }

    /**
     * Accept a STAR leg, and explode it into direct legs, including only waypoints after the specified one
     *
     * @for RouteModel
     * @method _createLegsFromStarWaypointsAfterWaypointName
     * @param waypointName {string} name of waypoint after which we begin to keep waypoints
     * @param legIndex {number} index of leg in the #_legCollection
     * @return {array<LegModel>}
     */
    _createLegsFromStarWaypointsAfterWaypointName(waypointName, legIndex) {
        const convergentLegModel = this._legCollection[legIndex];
        const waypointModels = convergentLegModel.getAllWaypointModelsAfterWaypointName(waypointName);
        const remainingLegWaypointsAsLegs = this._createLegModelsFromWaypointModels(waypointModels);

        return remainingLegWaypointsAsLegs;
    }

    /**
     * Accept a STAR leg, and explode it into direct legs, including only waypoints before the specified one
     *
     * @for RouteModel
     * @method _createLegsFromStarWaypointsBeforeWaypointName
     * @param waypointName {string} name of waypoint where we begin to discard waypoints
     * @param legIndex {number} index of leg in the #_legCollection
     * @return {array<LegModel>}
     */
    _createLegsFromStarWaypointsBeforeWaypointName(waypointName, legIndex) {
        const divergentLegModel = this._legCollection[legIndex];
        const waypointModels = divergentLegModel.getAllWaypointModelsBeforeWaypointName(waypointName);
        const remainingLegWaypointsAsLegs = this._createLegModelsFromWaypointModels(waypointModels);

        return remainingLegWaypointsAsLegs;
    }

    /**
     * Return a STAR leg based on the provided leg, except with the new specified entry
     *
     * @for RouteModel
     * @method _createAmendedStarLegUsingDifferentEntryName
     * @param entryFixName {string} name of STAR entry to use for the new STAR leg
     * @param legIndex {number} index of leg in the #_legCollection
     * @return {LegModel}
     */
    _createAmendedStarLegUsingDifferentEntryName(entryFixName, legIndex) {
        const convergentLegModel = this._legCollection[legIndex];
        const procedureIcao = convergentLegModel.getProcedureIcao();
        const exitFixName = convergentLegModel.getExitFixName();
        const amendedStarRouteString = assembleProceduralRouteString(entryFixName, procedureIcao, exitFixName);
        const amendedStarLeg = new LegModel(amendedStarRouteString);

        return amendedStarLeg;
    }

    /**
     * Return a STAR leg based on the provided leg, except with the new specified exit
     *
     * @for RouteModel
     * @method _createAmendedStarLegUsingDifferentExitName
     * @param exitFixName {string} name of STAR exit to use for the new STAR leg
     * @param legIndex {number} index of leg in the #_legCollection
     * @return {LegModel}
     */
    _createAmendedStarLegUsingDifferentExitName(exitFixName, legIndex) {
        const divergentLegModel = this._legCollection[legIndex];
        const procedureIcao = divergentLegModel.getProcedureIcao();
        const entryFixName = divergentLegModel.getEntryFixName();
        const amendedStarRouteString = assembleProceduralRouteString(entryFixName, procedureIcao, exitFixName);
        const amendedStarLeg = new LegModel(amendedStarRouteString);

        return amendedStarLeg;
    }

    /**
     * Accept a SID leg, and explode it into direct legs, including only waypoints after the specified one
     *
     * @for RouteModel
     * @method _createLegsFromSidWaypointsAfterWaypointName
     * @param waypointName {string} name of waypoint where we begin to keep waypoints
     * @param legIndex {number} index of leg in the #_legCollection
     * @return {array<LegModel>}
     */
    _createLegsFromSidWaypointsAfterWaypointName(waypointName, legIndex) {
        const convergentLeg = this._legCollection[legIndex];
        const waypointModels = convergentLeg.getAllWaypointModelsAfterWaypointName(waypointName);
        const remainingLegWaypointsAsLegs = this._createLegModelsFromWaypointModels(waypointModels);

        return remainingLegWaypointsAsLegs;
    }

    // TODO: Also add support for preserving waypoint data (restrictions, hold instructions, etc)
    /**
     * Return an array of direct LegModels, one for each of the proided WaypointModels
     *
     * @for RouteModel
     * @method _createLegModelsFromWaypointModels
     * @param waypointModels {array<WaypointModel>} waypoint models to convert to direct legs
     * @return {array<LegModel>}
     */
    _createLegModelsFromWaypointModels(waypointModels) {
        return _map(waypointModels, (waypointModel) => new LegModel(waypointModel.name));
    }

    /**
     * Divide a long route string into segments that can be individually represented by a `LegModel`
     *
     * @for RouteModel
     * @method _divideRouteStringIntoSegments
     * @param routeString {string}
     * @return {array<string>}
     * @private
     */
    _divideRouteStringIntoSegments(routeString) {
        if (!_isString(routeString)) {
            throw new TypeError(`Expected routeString's type to be string, but received '${typeof routeString}'`);
        }

        if (routeString.indexOf(' ') !== INVALID_INDEX) {
            throw new TypeError(`Expected a route string that does not contain spaces, but received '${routeString}'`);
        }

        const chainedRouteStrings = routeString.split(DIRECT_SEGMENT_DIVIDER);
        const segmentRouteStrings = [];

        // deal with chained route strings (eg 'KSFO28R.OFFSH9.SXC.V458.IPL')
        for (let i = 0; i < chainedRouteStrings.length; i++) {
            const chainedRouteString = chainedRouteStrings[i];
            const elementsInChain = chainedRouteString.split(PROCEDURE_OR_AIRWAY_SEGMENT_DIVIDER);
            const firstSegment = elementsInChain.splice(0, 3);
            const segments = [
                firstSegment,
                ..._chunk(elementsInChain, 2)
            ];

            segmentRouteStrings.push(firstSegment.join(PROCEDURE_OR_AIRWAY_SEGMENT_DIVIDER));

            for (let j = 1; j < segments.length; j++) {
                const exitOfPreviousSegment = _last(segments[j - 1]);
                const procedureAndExitOfSegment = segments[j].join(PROCEDURE_OR_AIRWAY_SEGMENT_DIVIDER);

                segmentRouteStrings.push(`${exitOfPreviousSegment}.${procedureAndExitOfSegment}`);
            }
        }

        return segmentRouteStrings;
    }

    /**
    * Return the name of the first waypoint at which this route and the specified route converge
    * For routes that do not have continuity, this function will return undefined.
    *
    * @for RouteModel
    * @method _findConvergentWaypointNameWithRouteModel
    * @param routeModel {RouteModel}
    * @return {string} name of the first waypoint where the routes converge
    */
    _findConvergentWaypointNameWithRouteModel(routeModel) {
        const currentRouteWaypointNames = _map(this.waypoints, (waypointModel) => waypointModel.name);
        const nextRouteWaypointNames = _map(routeModel.waypoints, (waypointModel) => waypointModel.name);

        return _first(_intersection(currentRouteWaypointNames, nextRouteWaypointNames));
    }

    /**
     * Return the index of the leg in the #_legCollection that contains the specified waypoint name
     *
     * @for RouteModel
     * @method _findIndexOfLegContainingWaypointName
     * @return {number}
     */
    _findIndexOfLegContainingWaypointName(waypointName) {
        return _findIndex(this._legCollection, (legModel) => legModel.hasWaypointName(waypointName));
    }

    /**
     * Return the index of the SID leg
     *
     * If for some reason there are multiple, this returns the first one.
     * This search does NOT include legs in the `#_previousLegCollection`.
     *
     * @for RouteModel
     * @method _findSidLegIndex
     * @return {number}
     * @private
     */
    _findSidLegIndex() {
        return _findIndex(this._legCollection, (legModel) => legModel.isSidLeg);
    }

    /**
     * Return the SID leg
     *
     * If for some reason there are multiple, this returns the first one.
     * This search does NOT include legs in the `#_previousLegCollection`.
     *
     * @for RouteModel
     * @method findSidLeg
     * @return {ProcedureModel}
     */
    _findSidLeg() {
        return this._legCollection.find((legModel) => legModel.isSidLeg);
    }

    /**
     * Return the index of the STAR leg within the `#_legCollection`
     *
     * If for some reason there are multiple, this returns the first one.
     * This search does NOT include legs in the `#_previousLegCollection`.
     *
     * @for RouteModel
     * @method _findStarLegIndex
     * @return {number}
     * @private
     */
    _findStarLegIndex() {
        return _findIndex(this._legCollection, (legModel) => legModel.isStarLeg);
    }

    /**
     * Generate an array of `LegModel`s according to the provided route string
     *
     * @for RouteModel
     * @method _generateLegsFromRouteString
     * @param routeString {string}
     * @return {array<LegModel>}
     * @private
     */
    _generateLegsFromRouteString(routeString) {
        const segments = this._divideRouteStringIntoSegments(routeString);
        const legs = _map(segments, (segmentRouteString) => {
            return new LegModel(segmentRouteString);
        });

        return legs;
    }

    /**
     * Return a single continuous array containing the #_previousLegCollection AND #_legCollection
     *
     * @for RouteModel
     * @method _getPastAndPresentLegModels
     * @return {array<LegModel>}
     */
    _getPastAndPresentLegModels() {
        return [
            ...this._previousLegCollection,
            ...this._legCollection
        ];
    }

    /**
     * Remove portions of the route between the specified waypoint names, and insert the provided RouteModel
     *
     * This will also result in amending (or exploding into direct legs) any leg with which
     * the provided RouteModel intersects in the middle. For example, if the provided RouteModel
     * intersects an airway leg at a waypoint somewhere other than the entry or exit of that airway
     * leg, this method will change the entry/exit of the airway leg such that it aligns with the
     * provided RouteModel.
     *
     * @for RouteModel
     * @method _overwriteRouteBetweenWaypointNames
     * @param startWaypointName {string}
     * @param endWaypointName {string}
     * @param routeModel {RouteModel}
     * @return {array} [success of operation, readback]
     */
    _overwriteRouteBetweenWaypointNames(startWaypointName, endWaypointName, routeModel) {
        const legCollection = this._legCollection.slice(0);
        const indexOfDivergentLegModel = this._findIndexOfLegContainingWaypointName(startWaypointName);
        const indexOfConvergentLegModel = this._findIndexOfLegContainingWaypointName(endWaypointName);
        const amendedDivergentLegModels = this._createAmendedDivergentLeg(indexOfDivergentLegModel, startWaypointName);
        const amendedConvergentLegModels = this._createAmendedConvergentLeg(indexOfConvergentLegModel, endWaypointName);
        const endingLegCollection = legCollection.splice(indexOfConvergentLegModel + 1);

        legCollection.splice(indexOfDivergentLegModel);

        const beginningLegCollection = legCollection;

        this._legCollection = [
            ...beginningLegCollection,
            ...amendedDivergentLegModels,
            ...routeModel.legCollection,
            ...amendedConvergentLegModels,
            ...endingLegCollection
        ];

        const readback = {};
        readback.log = `rerouting to: ${this.getRouteStringWithSpaces()}`;
        readback.say = 'rerouting as requested';

        return [true, readback];
    }

    /**
     * Prepend a provided route model into this RouteModel
     *
     * This method only serves to call the method that contains the appropriate logic
     * based on the type of leg in which the convergent waypoint resides, since this
     * heavily weighs in to how the merging of the routes should be done.
     *
     * @for RouteModel
     * @method _prependRouteModelEndingAtWaypointName
     * @param convergentWaypointName {string} name of waypoint at which the two routes have continuity
     * @param routeModel {RouteModel} the RouteModel to be absorbed into this
     */
    _prependRouteModelEndingAtWaypointName(convergentWaypointName, routeModel) {
        const indexOfConvergentLegModel = this._findIndexOfLegContainingWaypointName(convergentWaypointName);
        const convergentLegModel = this._legCollection[indexOfConvergentLegModel];

        if (convergentLegModel.isAirwayLeg) {
            return this._prependRouteModelIntoAirwayLeg(convergentWaypointName, routeModel);
        }

        if (convergentLegModel.isDirectLeg) {
            return this._prependRouteModelIntoDirectLeg(convergentWaypointName, routeModel);
        }

        if (convergentLegModel.isSidLeg) {
            return this._prependRouteModelIntoSidLeg(convergentWaypointName, routeModel);
        }

        if (convergentLegModel.isStarLeg) {
            return this._prependRouteModelIntoStarLeg(convergentWaypointName, routeModel);
        }

        throw new TypeError(`Expected known leg type, but received "${convergentLegModel.legType}" ` +
            'type leg, preventing ability to determine the appropriate route merging strategy!');
    }

    /**
     * Prepend a provided route model into this RouteModel when the convergent waypoint is in an airway leg
     *
     * This should only ever be called by `._prependRouteModelEndingAtWaypointName()`
     *
     * @for RouteModel
     * @method _prependRouteModelIntoAirwayLeg
     * @param convergentWaypointName {string} name of waypoint at which the two routes have continuity
     * @param routeModel {RouteModel} the RouteModel to be absorbed into this
     */
    _prependRouteModelIntoAirwayLeg(convergentWaypointName, routeModel) {
        const indexOfConvergentLegModel = this._findIndexOfLegContainingWaypointName(convergentWaypointName);
        const amendedAirwayLeg = this._createAmendedAirwayLegUsingDifferentEntryName(
            convergentWaypointName,
            indexOfConvergentLegModel
        );

        this._legCollection = [
            ...routeModel.legCollection,
            amendedAirwayLeg,
            ...this._legCollection.splice(indexOfConvergentLegModel + 1)
        ];

        const readback = {};
        readback.log = `rerouting to: ${this.getRouteStringWithSpaces()}`;
        readback.say = 'rerouting as requested';

        return [true, readback];
    }

    /**
     * Prepend a provided route model into this RouteModel when the convergent waypoint is in a direct leg
     *
     * This should only ever be called by `._prependRouteModelEndingAtWaypointName()`
     *
     * @for RouteModel
     * @method _prependRouteModelIntoDirectLeg
     * @param convergentWaypointName {string} name of waypoint at which the two routes have continuity
     * @param routeModel {RouteModel} the RouteModel to be absorbed into this
     */
    _prependRouteModelIntoDirectLeg(convergentWaypointName, routeModel) {
        const indexOfConvergentLegModel = this._findIndexOfLegContainingWaypointName(convergentWaypointName);

        this._legCollection = [
            ...routeModel.legCollection,
            ...this._legCollection.splice(indexOfConvergentLegModel + 1)
        ];

        const readback = {};
        readback.log = `rerouting to: ${this.getRouteStringWithSpaces()}`;
        readback.say = 'rerouting as requested';

        return [true, readback];
    }

    /**
     * Prepend a provided route model into this RouteModel when the convergent waypoint is in a SID leg
     *
     * This should only ever be called by `._prependRouteModelEndingAtWaypointName()`
     *
     * @for RouteModel
     * @method _prependRouteModelIntoSidLeg
     * @param convergentWaypointName {string} name of waypoint at which the two routes have continuity
     * @param routeModel {RouteModel} the RouteModel to be absorbed into this
     */
    _prependRouteModelIntoSidLeg(convergentWaypointName, routeModel) {
        const indexOfConvergentLegModel = this._findIndexOfLegContainingWaypointName(convergentWaypointName);
        const remainingLegWaypointsAsLegs = this._createLegsFromSidWaypointsAfterWaypointName(
            convergentWaypointName,
            indexOfConvergentLegModel
        );

        this._legCollection = [
            ...routeModel.legCollection,
            ...remainingLegWaypointsAsLegs,
            ...this._legCollection.splice(indexOfConvergentLegModel + 1)
        ];

        const readback = {};
        readback.log = `rerouting to: ${this.getRouteStringWithSpaces()}`;
        readback.say = 'rerouting as requested';

        return [true, readback];
    }

    /**
     * Prepend a provided route model into this RouteModel when the convergent waypoint is in a STAR leg
     *
     * This should only ever be called by `._prependRouteModelEndingAtWaypointName()`
     *
     * @for RouteModel
     * @method _prependRouteModelIntoStarLeg
     * @param convergentWaypointName {string} name of waypoint at which the two routes have continuity
     * @param routeModel {RouteModel} the RouteModel to be absorbed into this
     */
    _prependRouteModelIntoStarLeg(convergentWaypointName, routeModel) {
        const indexOfConvergentLegModel = this._findIndexOfLegContainingWaypointName(convergentWaypointName);
        const convergentLegModel = this._legCollection[indexOfConvergentLegModel];

        if (convergentLegModel.procedureHasEntry(convergentWaypointName)) {
            const amendedStarLeg = this._createAmendedStarLegUsingDifferentEntryName(
                convergentWaypointName,
                indexOfConvergentLegModel
            );

            this._legCollection = [
                ...routeModel.legCollection,
                amendedStarLeg,
                ...this._legCollection.splice(indexOfConvergentLegModel + 1)
            ];

            const readback = {};
            readback.log = `rerouting to: ${this.getRouteStringWithSpaces()}`;
            readback.say = 'rerouting as requested';

            return [true, readback];
        }

        const remainingLegWaypointsAsLegs = this._createLegsFromStarWaypointsAfterWaypointName(
            convergentWaypointName,
            indexOfConvergentLegModel
        );

        this._legCollection = [
            ...routeModel.legCollection,
            ...remainingLegWaypointsAsLegs,
            ...this._legCollection.splice(indexOfConvergentLegModel + 1)
        ];

        const readback = {};
        readback.log = `rerouting to: ${this.getRouteStringWithSpaces()}`;
        readback.say = 'rerouting as requested';

        return [true, readback];
    }
}
