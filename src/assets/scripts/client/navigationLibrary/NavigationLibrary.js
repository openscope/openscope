import _filter from 'lodash/filter';
import _flatten from 'lodash/flatten';
import _forEach from 'lodash/forEach';
import _isNil from 'lodash/isNil';
import _isEmpty from 'lodash/isEmpty';
import _map from 'lodash/map';
import _without from 'lodash/without';
import _uniq from 'lodash/uniq';
import AirwayModel from './AirwayModel';
import FixCollection from './FixCollection';
import ProcedureModel from './ProcedureModel';
import StaticPositionModel from '../base/StaticPositionModel';
import { PROCEDURE_TYPE } from '../constants/routeConstants';
import { degreesToRadians } from '../utilities/unitConverters';
import { INVALID_INDEX } from '../constants/globalConstants';

/**
 *
 *
 * @class NavigationLibrary
 */
class NavigationLibrary {
    /**
     * @constructor
     * @for NavigationLibrary
     * @param airportJson {object}
     */
    constructor() {
        this._airwayCollection = {};

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

        /**
         *
         *
         * @property _procedureCollection
         * @type {array}
         * @default {}
         */
        this._procedureCollection = {};

        /**
         *
         *
         * @property _referencePosition
         * @type {StaticPositionModel}
         * @default null
         */
        this._referencePosition = null;

        /**
         * additional information to draw the procedures on the screen
         *
         * @property _procedureLines
         * @type {array}
         * @default {}
         */
         this._procedureLines = {};
    }

    /**
     *
     * @property hasSids
     * @return {boolean}
     */
    get hasSids() {
        const sidProcedureModels = _filter(this._procedureCollection, (procedure) => {
            return procedure.procedureType === PROCEDURE_TYPE.SID;
        });

        return sidProcedureModels.length > 0;
    }

    /**
     *
     * @property hasStars
     * @return {boolean}
     */
    get hasStars() {
        const starProcedureModels = _filter(this._procedureCollection, (procedure) => {
            return procedure.procedureType === PROCEDURE_TYPE.STAR;
        });

        return starProcedureModels.length > 0;
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

    /**
     * Set initial instance properties
     *
     * May be run multiple times on an instance. Subsequent calls to this method
     * should happen only after a call to `.reset()`
     *
     * @for NavigationLibrary
     * @method init
     */
    init(airportJson) {
        const { airways, fixes, sids, stars } = airportJson;

        this._initializeReferencePosition(airportJson);
        this._initializeFixCollection(fixes);
        this._initializeAirwayCollection(airways);
        this._initializeProcedureCollection(sids, stars);
        this._initializeSidLines();
        this._initializeStarLines();
        this._showConsoleWarningForUndefinedFixes();
    }

    /**
     *
     * @for NavigationLibrary
     * @method _initializeAirwayCollection
     */
    _initializeAirwayCollection(airways) {
        _forEach(airways, (fixNames, airwayName) => {
            if (airwayName in this._airwayCollection) {
                throw new TypeError(`Expected single definition for "${airwayName}" airway, but received multiple`);
            }

            this._airwayCollection[airwayName] = new AirwayModel(airwayName, fixNames, this);
        });
    }

    /**
     *
     * @for NavigationLibrary
     * @method _initializeFixCollection
     */
    _initializeFixCollection(fixes) {
        FixCollection.addItems(fixes, this._referencePosition);
    }

    /**
     *
     * @for NavigationLibrary
     * @method _initializeProcedureCollection
     */
    _initializeProcedureCollection(sids, stars) {
        _forEach(sids, (sid, sidId) => {
            if (sidId in this._procedureCollection) {
                throw new TypeError(`Expected single definition for '${sidId}' procedure, but received multiple`);
            }

            this._procedureCollection[sidId] = new ProcedureModel(PROCEDURE_TYPE.SID, sid);
        });

        _forEach(stars, (star, starId) => {
            if (starId in this._procedureCollection) {
                throw new TypeError(`Expected single definition for '${starId}' procedure, but received multiple`);
            }

            this._procedureCollection[starId] = new ProcedureModel(PROCEDURE_TYPE.STAR, star);
        });
    }

    /**
     *
     * @for NavigationLibrary
     * @method _initializeReferencePosition
     */
    _initializeReferencePosition(airportJson) {
        this._referencePosition = new StaticPositionModel(
            airportJson.position,
            null,
            degreesToRadians(airportJson.magnetic_north)
        );
    }

    /**
     * Generate lines for SIDs and add them to the procedure lines
     *
     * @for NavigationLibrary
     * @method _initializeSidLines
     */
    _initializeSidLines() {
        const sids = this.getProceduresByType(PROCEDURE_TYPE.SID);
        const sidLines = [];
        let mostRecentFixName = '';

        // TODO: simplify/rector these nested loops.
        for (let i = 0; i < sids.length; i++) {
            const sid = sids[i];
            const lines = [];
            const exits = [];

            for (let j = 0; j < sid.draw.length; j++) {
                const fixList = sid.draw[j];
                const positions = [];

                for (let k = 0; k < fixList.length; k++) {
                    const fixName = fixList[k];
                    mostRecentFixName = fixName;

                    if (fixName.indexOf('*') !== INVALID_INDEX) {
                        mostRecentFixName = fixName.replace('*', '');
                        exits.push(mostRecentFixName);
                    }

                    const fixPosition = this.getFixRelativePosition(mostRecentFixName);

                    if (!fixPosition) {
                        console.warn(`Unable to draw line to '${fixName}' because its position is not defined!`);
                        continue;
                    }

                    positions.push(fixPosition);
                }

                if (positions.length > 1) {
                    lines.push(positions);
                }
            }

            sidLines.push({
                identifier: sid.icao,
                lines: lines,
                lastFixName: mostRecentFixName,
                exits: exits
            });
        }

        this._procedureLines[PROCEDURE_TYPE.SID] = sidLines;
    }

    /**
     * Generate lines for STARs and add them to the procedure lines
     *
     * @for NavigationLibrary
     * @method _initializeStarLines
     */
    _initializeStarLines() {
        const stars = this.getProceduresByType(PROCEDURE_TYPE.STAR);
        const starLines = [];

        // TODO: simplify/rector these nested loops.
        for (let i = 0; i < stars.length; i++) {
            const star = stars[i];
            const lines = [];
            let mostRecentFixName = '';

            for (let j = 0; j < star.draw.length; j++) {
                const fixList = star.draw[j];
                const positions = [];

                for (let k = 0; k < fixList.length; k++) {
                    // TODO: is asterisk valid for STARs?
                    mostRecentFixName = fixList[k].replace('*', '');
                    const fixPosition = this.getFixRelativePosition(mostRecentFixName);

                    if (!fixPosition) {
                        console.warn(`Unable to draw line to '${fixList[k]}' because its position is not defined!`);
                        continue;
                    }

                    positions.push(fixPosition);
                }

                if (positions.length > 1) {
                    lines.push(positions);
                }
            }

            starLines.push({
                identifier: star.icao,
                lines: lines,
                lastFixName: mostRecentFixName,
                exits: null
            });
        }

        this._procedureLines[PROCEDURE_TYPE.STAR] = starLines;
    }

    /**
     * Tear down the instance
     *
     * @for NavigationLibrary
     * @method reset
     */
    reset() {
        FixCollection.removeItems();

        this._airwayCollection = {};
        this._procedureCollection = {};
        this._referencePosition = null;
        this._procedureLines = {};
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

    /**
     * Return the corresponding AirwayModel with the specified identifier
     *
     * @for NavigationLibrary
     * @method getAirway
     * @return {AirwayModel}
     */
    getAirway(airwayId) {
        if (!this.hasAirway(airwayId)) {
            return null;
        }

        return this._airwayCollection[airwayId];
    }

    /**
     * Return the corresponding ProcedureModel with the specified identifier
     *
     * @for NavigationLibrary
     * @method getProcedure
     * @param procedureId {string}
     * @return {ProcedureModel}
     */
    getProcedure(procedureId) {
        if (!this.hasProcedure(procedureId)) {
            return null;
        }

        return this._procedureCollection[procedureId];
    }

    /**
    * Return a list of ProcedureModel with the specified procedure type
    *
    * @for NavigationLibrary
    * @method getProceduresByType
    * @param procedureType {string}
    * @return {array<ProcedureModel>}
    */
    getProceduresByType(procedureType) {
        return _filter(this._procedureCollection, (procedureModel) =>
            !_isEmpty(procedureModel) && procedureModel.procedureType === procedureType
        );
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
     *
     *
     * @for NavigationLibrary
     * @method getProcedureLines
     * @param procedureId {string}
     * @return {array}
     */
     getProcedureLines(procedureId) {
         return this._procedureLines[procedureId];
     }

    /**
     * Return whether the specified airway identifier is listed in the #_airwayCollection
     *
     * @for NavigationLibrary
     * @method hasAirway
     * @param airwayId {string}
     * @return {boolean}
     */
    hasAirway(airwayId) {
        return airwayId in this._airwayCollection;
    }

    /**
    * Provides a way to check the `FixCollection` for the existence
    * of a specific `fixName`.
    *
    * @for NavigationLibrary
    * @method hasFixName
    * @param fixName {string}
    * @return {boolean}
    */
    hasFixName(fixName) {
        const fixOrNull = this.findFixByName(fixName);

        return !_isNil(fixOrNull);
    }

    /**
    * Provides a way to check for the existence
    * of a specific `procedureId`.
    *
    * @for NavigationLibrary
    * @method hasProcedure
    * @param procedureId {string}
    * @return {boolean}
    */
    hasProcedure(procedureId) {
        return procedureId in this._procedureCollection;
    }

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
        const airwayFixes = _map(this._airwayCollection, (airwayModel) => airwayModel.fixNameCollection);
        const fixGroups = _map(this._procedureCollection, (procedureModel) => procedureModel.getAllFixNamesInUse());
        const uniqueFixNames = _without(_uniq(_flatten([...airwayFixes, ...fixGroups])), undefined);

        return uniqueFixNames.sort();
    }
}

export default new NavigationLibrary();
