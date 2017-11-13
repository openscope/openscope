import _filter from 'lodash/filter';
import _flatten from 'lodash/flatten';
import _forEach from 'lodash/forEach';
import _isNil from 'lodash/isNil';
import _map from 'lodash/map';
import _uniq from 'lodash/uniq';
import FixCollection from './Fix/FixCollection';
import ProcedureDefinitionModel from './Procedure/ProcedureDefinitionModel';
import StaticPositionModel from '../base/StaticPositionModel';
import { PROCEDURE_TYPE } from '../constants/routeConstants';
import { degreesToRadians } from '../utilities/unitConverters';

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

        // /**
        //  *
        //  *
        //  * @property _sidCollection
        //  * @type {StandardRoute}
        //  * @default null
        //  */
        // this._sidCollection = null;
        //
        // /**
        //  *
        //  *
        //  * @property _starCollection
        //  * @type {StandardRoute}
        //  * @default null
        //  */
        // this._starCollection = null;

        this._procedureCollection = {};

        this.init(airportJson);
    }

    get hasSids() {
        const sidProcedureDefinitionModels = _filter(this._procedureCollection, (procedure) => {
            return procedure.procedureType === PROCEDURE_TYPE.SID;
        });

        return sidProcedureDefinitionModels.length > 0;
    }

    get hasStars() {
        const starProcedureDefinitionModels = _filter(this._procedureCollection, (procedure) => {
            return procedure.procedureType === PROCEDURE_TYPE.STAR;
        });

        return starProcedureDefinitionModels.length > 0;
    }

    // get sidCollection() {
    //     return _filter(this._procedureCollection, (procedure) => procedure.procedureType === PROCEDURE_TYPE.SID);
    // }
    //
    // get starCollection() {
    //     return _filter(this._procedureCollection, (procedure) => procedure.procedureType === PROCEDURE_TYPE.STAR);
    // }

    /**
     *
     * @property realFixes
     * @return {array<FixModel>}
     */
    get realFixes() {
        return FixCollection.findRealFixes();
    }

    // /**
    //  *
    //  * @property sidLines
    //  * @return
    //  */
    // get sidLines() {
    //     return this.sidCollection.draw;
    // }

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

        this._initializeReferencePosition(airportJson);
        this._initializeFixCollection(fixes);
        this._initializeProcedureCollection(sids, stars);
        this._showConsoleWarningForUndefinedFixes();
    }

    _initializeFixCollection(fixes) {
        FixCollection.addItems(fixes, this._referencePosition);
    }

    _initializeProcedureCollection(sids, stars) {
        _forEach(sids, (sid, sidId) => {
            if (sidId in this._procedureCollection) {
                throw new TypeError(`Expected single definition for '${sidId}' procedure, but received multiple`);
            }

            this._procedureCollection[sidId] = new ProcedureDefinitionModel(PROCEDURE_TYPE.SID, sid);
        });

        _forEach(stars, (star, starId) => {
            if (starId in this._procedureCollection) {
                throw new TypeError(`Expected single definition for '${starId}' procedure, but received multiple`);
            }

            this._procedureCollection[starId] = new ProcedureDefinitionModel(PROCEDURE_TYPE.STAR, star);
        });
    }

    _initializeReferencePosition(airportJson) {
        this._referencePosition = new StaticPositionModel(
            airportJson.position,
            null,
            degreesToRadians(airportJson.magnetic_north)
        );
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
        this._procedureCollection = {};
    }

    // /**
    //  * Given a `procedureRouteSegment`, find and assemble a list
    //  * of `WaypointModel` objects to be used with a `LegModel`
    //  * in the Fms.
    //  *
    //  * @for NavigationLibrary
    //  * @method buildWaypointModelsForProcedure
    //  * @param procedureRouteSegment {string}  of the shape `ENTRY.PROCEDURE_NAME.EXIT`
    //  * @param runway {string}                 assigned runway
    //  * @param flightPhase {string}            current phase of flight
    //  * @return {array<WaypointModel>}
    //  */
    // buildWaypointModelsForProcedure(procedureRouteSegment, runway, flightPhase) {
    //     const routeModel = new RouteModel(procedureRouteSegment);
    //     let standardRouteWaypointModelList;
    //
    //     if (this.isGroundedFlightPhase(flightPhase)) {
    //         standardRouteWaypointModelList = this.sidCollection.generateFmsWaypointModelsForRoute(
    //             routeModel.procedure,
    //             runway,
    //             routeModel.exit
    //         );
    //     } else {
    //         standardRouteWaypointModelList = this.starCollection.generateFmsWaypointModelsForRoute(
    //             routeModel.procedure,
    //             routeModel.entry,
    //             runway
    //         );
    //     }
    //
    //     return standardRouteWaypointModelList;
    // }
    //
    // /**
    //  * Find the `StandardRouteWaypointModel` objects for a given route.
    //  *
    //  * @for NavigationLibrary
    //  * @method findWaypointModelsForSid
    //  * @param id {string}
    //  * @param runway {string}
    //  * @param exit {string}
    //  * @return {array<StandardWaypointModel>}
    //  */
    // findWaypointModelsForSid(id, runway, exit) {
    //     return this.sidCollection.findRouteWaypointsForRouteByEntryAndExit(id, runway, exit);
    // }
    //
    // /**
    //  * Find the `StandardRouteWaypointModel` objects for a given route.
    //  *
    //  * @for NavigationLibrary
    //  * @method findWaypointModelsForStar
    //  * @param id {string}
    //  * @param entry {string}
    //  * @param runway {string}
    //  * @param isPreSpawn {boolean} flag used to determine if distances between waypoints should be calculated
    //  * @return {array<StandardWaypointModel>}
    //  */
    // findWaypointModelsForStar(id, entry, runway, isPreSpawn = false) {
    //     return this.starCollection.findRouteWaypointsForRouteByEntryAndExit(id, entry, runway, isPreSpawn);
    // }
    //
    // /**
    //  * Finds the collectionName a given `procedureId` belongs to.
    //  *
    //  * This is useful when trying to find a particular route without
    //  * knowing, first, what collection it may be a part of. Like when
    //  * validating a user entered route.
    //  *
    //  * @for NavigationLibrary
    //  * @method findCollectionNameForProcedureId
    //  * @param procedureId {string}
    //  * @return collectionName {string}
    //  */
    // findCollectionNameForProcedureId(procedureId) {
    //     let collectionName = '';
    //
    //     if (this.sidCollection.hasRoute(procedureId)) {
    //         collectionName = 'sidCollection';
    //     } else if (this.starCollection.hasRoute(procedureId)) {
    //         collectionName = 'starCollection';
    //     }
    //
    //     return collectionName;
    // }

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

    // FIXME: Fill me out when implementing airways!
    getAirway(/* airwayId */) {
        // for now, will return null because we don't support airways yet
        return null;
    }

    getProcedure(procedureId) {
        if (!this.hasProcedure(procedureId)) {
            return null;
        }

        return this._procedureCollection[procedureId];
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

    // /**
    //  * Create a `StaticPositionModel` from a provided lat/long
    //  *
    //  * This allows classes that have access to the `NavigationLibrary` to
    //  * create a `StaticPositionModel` without needing to know about a
    //  * `#referencePosition` or `#magneticNorth`.
    //  *
    //  * @for NavigationLibrary
    //  * @method generateStaticPositionModelForLatLong
    //  * @param latLong {array<number>}
    //  * @return staticPositionModel {StaticPositionModel}
    //  */
    // generateStaticPositionModelForLatLong(latLong) {
    //     const staticPositionModel = new StaticPositionModel(latLong,
    //         this._referencePosition, this._referencePosition.magneticNorth
    //     );
    //
    //     return staticPositionModel;
    // }

    // FIXME: Fill me out when implementing airways!
    hasAirway(/* airwayId */) {
        // for now, will return false because we don't support airways yet
        return false;
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

    hasProcedure(procedureId) {
        return procedureId in this._procedureCollection;
    }

    // /**
    //  * Determine if a procedureRouteString contains a suffix route
    //  *
    //  * Used from the `AircraftCommander` for branching logic that will
    //  * enable updating of a runway for a particular suffix route
    //  *
    //  * @NavigationLibrary
    //  * @method isSuffixRoute
    //  * @param routeString {string}
    //  * @param procedureType {string}
    //  * @return {boolean}
    //  */
    // isSuffixRoute(routeString, procedureType) {
    //     let route;
    //
    //     switch (procedureType) {
    //         case PROCEDURE_TYPE.SID:
    //             route = this.sidCollection.findRouteByIcao(routeString);
    //
    //             break;
    //         case PROCEDURE_TYPE.STAR: {
    //             const { procedure } = new RouteModel(routeString);
    //
    //             route = this.starCollection.findRouteByIcao(procedure);
    //
    //             break;
    //         }
    //         default:
    //             return false;
    //     }
    //
    //     return typeof route !== 'undefined' && route.hasSuffix();
    // }
    //
    // /**
    //  * Encapsulates boolean logic used to determine if a `flightPhase`
    //  * indicates an aircraft is still on the ground or en-route
    //  *
    //  * @for NavigationLibrary
    //  * @method isGroundedFlightPhase
    //  * @param flightPhase {string}
    //  * @return {boolean}
    //  */
    // isGroundedFlightPhase(flightPhase) {
    //     return flightPhase === FLIGHT_PHASE.APRON ||
    //         flightPhase === FLIGHT_PHASE.TAXI ||
    //         flightPhase === FLIGHT_PHASE.WAITING;
    // }

    /**
     * Check all fixes used in procedures, and gather a list of any fixes that are
     * not defined in the `fixes` section of the airport file, then sort and print
     * that list to the console.
     *
     * @for NavigationLibrary
     * @method _showConsoleWarningForUndefinedFixes
     */
    _showConsoleWarningForUndefinedFixes() {
        const allFixNames = this._getAllFixNamesInUse();
        const missingFixes = allFixNames.filter((fix) => !FixCollection.findFixByName(fix));

        if (missingFixes.length < 1) {
            return;
        }

        console.warn(`The following fixes have yet to be defined in the "fixes" section: \n${missingFixes}`);
    }

    /**
     * Gathers a unique, sorted list of all fixes used in all known procedures
     *
     * @for NavigationLibrary
     * @method _getAllFixNamesInUse
     * @return {array<string>} ['fixxa', 'fixxb', 'fixxc', ...]
     * @private
     */
    _getAllFixNamesInUse() {
        const fixGroups = _map(this._procedureCollection, (procedureDefinitionModel) => procedureDefinitionModel.getAllFixNamesInUse());
        const uniqueFixNames = _uniq(_flatten(fixGroups));

        return uniqueFixNames.sort();
    }

}
