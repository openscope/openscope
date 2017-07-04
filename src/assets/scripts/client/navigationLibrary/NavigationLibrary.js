import _isNil from 'lodash/isNil';
import _uniq from 'lodash/uniq';
import StaticPositionModel from '../base/StaticPositionModel';
import RouteModel from './Route/RouteModel';
import FixCollection from './Fix/FixCollection';
import StandardRouteCollection from './StandardRoute/StandardRouteCollection';
import { degreesToRadians } from '../utilities/unitConverters';
import {
    FLIGHT_PHASE,
    PROCEDURE_TYPE
} from '../constants/aircraftConstants';
import { VECTOR_WAYPOINT_PREFIX } from '../constants/navigation/routeConstants';
import { INVALID_INDEX } from '../constants/globalConstants';

/**
 *
 *
 * @class NavigationLibrary
 */
export default class NavigationLibrary {
    /**
     * @constructor
     * @for NavigationLibrary
     * @param airportJson {object}
     */
    constructor(airportJson) {
        /**
         *
         *
         * @property _referencePosition
         * @type {StaticPositionModel}
         * @default null
         */
        this._referencePosition = null;

        /**
         *
         *
         * @property _sidCollection
         * @type {StandardRoute}
         * @default null
         */
        this._sidCollection = null;

        /**
         *
         *
         * @property _starCollection
         * @type {StandardRoute}
         * @default null
         */
        this._starCollection = null;

        this.init(airportJson);
    }

    /**
     *
     * @property realFixes
     * @return {array<FixModel>}
     */
    get realFixes() {
        return FixCollection.findRealFixes();
    }

    /**
     *
     * @property sidLines
     * @return
     */
    get sidLines() {
        return this._sidCollection.draw;
    }

    /**
     *
     * @property sidCollection
     * @return
     */
    get sidCollection() {
        return this._sidCollection;
    }

    /**
     *
     * @property starCollection
     * @return
     */
    get starCollection() {
        return this._starCollection;
    }

    /**
     * Set initial class properties
     *
     * May be run multiple times on an instance. Subsequent calls to this method
     * should happen only after a call to `.reset()`
     *
     * @for NavigationLibrary
     * @method init
     */
    init(airportJson) {
        const { fixes, sids, stars } = airportJson;

        this._referencePosition = new StaticPositionModel(
            airportJson.position,
            null,
            degreesToRadians(airportJson.magnetic_north)
        );

        FixCollection.addItems(fixes, this._referencePosition);

        this._sidCollection = new StandardRouteCollection(sids, PROCEDURE_TYPE.SID);
        this._starCollection = new StandardRouteCollection(stars, PROCEDURE_TYPE.STAR);

        this.showConsoleWarningForUndefinedFixes();
    }

    /**
     * Tear down the instance
     *
     * @for NavigationLibrary
     * @method reset
     */
    reset() {
        FixCollection.removeItems();

        this._referencePosition = null;
        this._sidCollection = null;
        this._starCollection = null;
    }

    /**
     * Provides a way to check the `FixCollection` for the existence
     * of a specific `fixName`.
     *
     * @for NavigationLibrary
     * @method hasFix
     * @param fixName {string}
     * @return {boolean}
     */
    hasFix(fixName) {
        const fixOrNull = this.findFixByName(fixName);

        return !_isNil(fixOrNull);
    }

    /**
     * Fascade Method
     *
     * @for NavigationLibrary
     * @method findFixByName
     * @param fixName {string}
     * @return {FixModel|undefined}
     */
    findFixByName(fixName) {
        return FixCollection.findFixByName(fixName);
    }

    /**
     * Fascade Method
     *
     * @for NavigationLibrary
     * @method getFixRelativePosition
     * @param fixName {string}
     * @return {array<number>}
     */
    getFixRelativePosition(fixName) {
        return FixCollection.getFixRelativePosition(fixName);
    }

    /**
     * Find the `StandardRouteWaypointModel` objects for a given route.
     *
     * @for NavigationLibrary
     * @method findWaypointModelsForSid
     * @param id {string}
     * @param runway {string}
     * @param exit {string}
     * @return {array<StandardWaypointModel>}
     */
    findWaypointModelsForSid(id, runway, exit) {
        return this._sidCollection.findRouteWaypointsForRouteByEntryAndExit(id, runway, exit);
    }

    /**
     * Find the `StandardRouteWaypointModel` objects for a given route.
     *
     * @for NavigationLibrary
     * @method findWaypointModelsForStar
     * @param id {string}
     * @param entry {string}
     * @param runway {string}
     * @param isPreSpawn {boolean} flag used to determine if distances between waypoints should be calculated
     * @return {array<StandardWaypointModel>}
     */
    findWaypointModelsForStar(id, entry, runway, isPreSpawn = false) {
        return this._starCollection.findRouteWaypointsForRouteByEntryAndExit(id, entry, runway, isPreSpawn);
    }

    /**
     * Finds the collectionName a given `procedureId` belongs to.
     *
     * This is useful when trying to find a particular route without
     * knowing, first, what collection it may be a part of. Like when
     * validating a user entered route.
     *
     * @for NavigationLibrary
     * @method findCollectionNameForProcedureId
     * @param procedureId {string}
     * @return collectionName {string}
     */
    findCollectionNameForProcedureId(procedureId) {
        let collectionName = '';

        if (this._sidCollection.hasRoute(procedureId)) {
            collectionName = 'sidCollection';
        } else if (this._starCollection.hasRoute(procedureId)) {
            collectionName = 'starCollection';
        }

        return collectionName;
    }

    /**
     * Given a `procedureRouteSegment`, find and assemble a list
     * of `WaypointModel` objects to be used with a `LegModel`
     * in the Fms.
     *
     * @for NavigationLibrary
     * @method buildWaypointModelsForProcedure
     * @param procedureRouteSegment {string}  of the shape `ENTRY.PROCEDURE_NAME.EXIT`
     * @param runway {string}                 assigned runway
     * @param flightPhase {string}            current phase of flight
     * @return {array<WaypointModel>}
     */
    buildWaypointModelsForProcedure(procedureRouteSegment, runway, flightPhase) {
        const routeModel = new RouteModel(procedureRouteSegment);
        let standardRouteWaypointModelList;

        if (this.isGroundedFlightPhase(flightPhase)) {
            standardRouteWaypointModelList = this._sidCollection.generateFmsWaypointModelsForRoute(
                routeModel.procedure,
                runway,
                routeModel.exit
            );
        } else {
            standardRouteWaypointModelList = this._starCollection.generateFmsWaypointModelsForRoute(
                routeModel.procedure,
                routeModel.entry,
                runway
            );
        }

        return standardRouteWaypointModelList;
    }

    /**
     * Create a `StaticPositionModel` from a provided lat/long
     *
     * This allows classes that have access to the `NavigationLibrary` to
     * create a `StaticPositionModel` without needing to know about a
     * `#referencePosition` or `#magneticNorth`.
     *
     * @for NavigationLibrary
     * @method generateStaticPositionModelForLatLong
     * @param latLong {array<number>}
     * @return staticPositionModel {StaticPositionModel}
     */
    generateStaticPositionModelForLatLong(latLong) {
        const staticPositionModel = new StaticPositionModel(latLong,
            this._referencePosition, this._referencePosition.magneticNorth
        );

        return staticPositionModel;
    }

    /**
     * Determine if a procedureRouteString contains a suffix route
     *
     * Used from the `AircraftCommander` for branching logic that will
     * enable updating of a runway for a particular suffix route
     *
     * @NavigationLibrary
     * @method isSuffixRoute
     * @param routeString {string}
     * @param procedureType {string}
     * @return {boolean}
     */
    isSuffixRoute(routeString, procedureType) {
        let route;

        switch (procedureType) {
            case PROCEDURE_TYPE.SID:
                route = this._sidCollection.findRouteByIcao(routeString);

                break;
            case PROCEDURE_TYPE.STAR:
                const { procedure } = new RouteModel(routeString);

                route = this._starCollection.findRouteByIcao(procedure);

                break;
            default:
                return false;
        }

        return typeof route !== 'undefined' && route.hasSuffix();
    }

    /**
     * Encapsulates boolean logic used to determine if a `flightPhase`
     * indicates an aircraft is still on the ground or en-route
     *
     * @for NavigationLibrary
     * @method isGroundedFlightPhase
     * @param flightPhase {string}
     * @return {boolean}
     */
    isGroundedFlightPhase(flightPhase) {
        return flightPhase === FLIGHT_PHASE.APRON ||
            flightPhase === FLIGHT_PHASE.TAXI ||
            flightPhase === FLIGHT_PHASE.WAITING;
    }

    /**
     * Check all fixes used in procedures, and gather a list of any fixes that are
     * not defined in the `fixes` section of the airport file, then sort and print
     * that list to the console.
     *
     * @for NavigationLibrary
     * @method showConsoleWarningForUndefinedFixes
     */
    showConsoleWarningForUndefinedFixes() {
        const allFixNames = this._getAllFixNames();
        const missingFixes = allFixNames.filter((fix) => !FixCollection.findFixByName(fix));

        if (missingFixes.length < 1) {
            return;
        }

        console.warn(`The following fixes have yet to be defined in the "fixes" section: ${missingFixes}`);
    }

    /**
     * Gathers a unique, sorted list of all fixes used in all known procedures
     *
     * @for NavigationLibrary
     * @method _getAllFixNames
     * @return {array<string>} ['fixxa', 'fixxb', 'fixxc', ...]
     * @private
     */
    _getAllFixNames() {
        const sidFixes = this.sidCollection.getAllFixNames();
        const starFixes = this.starCollection.getAllFixNames();
        const allFixNames = _uniq(sidFixes.concat(starFixes)).sort();
        const allNonVectorFixes = allFixNames.filter((fix) => fix.indexOf(VECTOR_WAYPOINT_PREFIX) === INVALID_INDEX);

        return allNonVectorFixes;
    }

}
