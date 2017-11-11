import _drop from 'lodash/drop';
import _isNil from 'lodash/isNil';
import _map from 'lodash/map';
import _without from 'lodash/without';
import RouteModel from '../../navigationLibrary/Route/RouteModel';
import WaypointModel from './WaypointModel';
import ProcedureWaypointModel from '../../navigationLibrary/Procedure/ProcedureWaypointModel';
import { extractFixnameFromHoldSegment } from '../../navigationLibrary/Route/routeStringFormatHelper';
import {
    FLIGHT_PHASE,
    PROCEDURE_TYPE
} from '../../constants/aircraftConstants';
import { INVALID_NUMBER } from '../../constants/globalConstants';
import { LEG_TYPE } from '../../constants/navigation/waypointConstants';

/**
 * A portion of a navigation route containing one or more `WaypointModel` objects.
 *
 * @class LegModel
 */
export default class LegModel {
    /**
     * @for LegModel
     * @constructor
     * @param navigationLibrary {NavigationLibrary}
     * @param routeString {string}
     */
    constructor(navigationLibrary, routeString) {
        /**
         * Instance of a `AirwayModel` object (if this is an airway leg)
         *
         * @for LegModel
         * @property _airwayModel
         * @type {AirwayModel|null}
         * @default null
         */
        this._airwayModel = null;

        /**
         * Type of leg from list of types defined in `LEG_TYPE`
         *
         * @for LegModel
         * @property _legType
         * @type {string}
         * @default ''
         */
        this._legType = '';

        /**
        * Instance of a `ProcedureDefinitionModel` object (if this is a procedure leg)
        *
        * @for LegModel
        * @property _procedureDefinitionModel
        * @type {ProcedureDefinitionModel|null}
        * @default null
        */
        this._procedureDefinitionModel = null;

        /**
         * Array of `WaypointModel`s that have been passed (or skipped)
         *
         * @for LegModel
         * @property _previousWaypointCollection
         * @type {array<WaypointModel>}
         * @default []
         */
        this._previousWaypointCollection = [];

        /**
         * Standard format route string for this leg, excluding any special characters
         *
         * @for LegModel
         * @property routeString
         * @type {string}
         * @default ''
         */
        this._routeString = '';

        /**
         * Array of `WaypointModel`s to follow, excluding any waypoints passed (or skipped)
         *
         * @for LegModel
         * @property _waypointCollection
         * @type {array<WaypointModel>}
         * @default []
         */
        this._waypointCollection = [];

        this._init(navigationLibrary, routeString);
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
     * Returns the route string for this leg
     *
     * @for LegModel
     * @property legType
     * @type {string}
     */
    get routeString() {
        return this._routeString;
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
        return this._waypointCollection[0];
    }

    /**
     * The `WaypointModel` immediately following the `#currentWaypoint`
     *
     * @for LegModel
     * @property nextWaypoint
     * @type {WaypointModel}
     */
    get nextWaypoint() {
        // FIXME: Is this a problem when there is only one waypoint in the leg's collection?
        return this._waypointCollection[1];
    }

    /**
     * Instantiate the class properties
     *
     * @for LegModel
     * @method _init
     * @param navigationLibrary {NavigationLibrary}
     * @param routeString {string}
     * @private
     * @chainable
     */
    _init(navigationLibrary, routeString) {
        this._routeString = routeString;

        const [entryOrFixName, airwayOrProcedureName, exit] = routeString.split('.');

        this._ensureRouteStringIsSingleSegment(routeString);
        this._legType = this._determineLegType(airwayOrProcedureName, navigationLibrary);
        this._airwayModel = this._retrieveAirwayModel(airwayOrProcedureName, navigationLibrary);
        this._procedureDefinitionModel = this._retrieveProcedureDefinitionModel(airwayOrProcedureName, navigationLibrary);
        this._waypointCollection = this._generateWaypointCollection(entryOrFixName, exit);

        return this;
    }

    _determineLegType(airwayOrProcedureName, navigationLibrary) {
        if (this._routeString.indexOf('.') === INVALID_NUMBER) {
            return LEG_TYPE.DIRECT;
        }

        if (navigationLibrary.hasAirway(airwayOrProcedureName)) {
            return LEG_TYPE.AIRWAY;
        }

        return LEG_TYPE.PROCEDURE;
    }

    _ensureRouteStringIsSingleSegment(routeString) {
        if (routeString.indexOf('..') !== -1) {
            throw new TypeError(`Expected single fix or single procedure route string, but received '${routeString}'`);
        }

        if (routeString.split('.').length > 3) {
            throw new TypeError(`Expected single procedure route string, but received '${routeString}'`);
        }
    }

    _retrieveAirwayModel(airwayName, navigationLibrary) {
        if (this._legType !== LEG_TYPE.AIRWAY) {
            return null;
        }

        return navigationLibrary.getAirway(airwayName);
    }

    _retrieveProcedureDefinitionModel(procedureName, navigationLibrary) {
        if (this._legType !== LEG_TYPE.PROCEDURE) {
            return null;
        }

        const procedureModel = navigationLibrary.getProcedure(procedureName);

        return procedureModel;
    }

    _generateWaypointCollection(entryOrFixName, exit) {
        if (this._legType === LEG_TYPE.DIRECT) {
            return [new ProcedureWaypointModel(entryOrFixName)];
        }

        if (this._legType === LEG_TYPE.AIRWAY) {
            // FIXME: Uncomment this when implementing airways
            // return this._airwayModel.getWaypointModelsForEntryAndExit(entryOrFixName, exit);
        }

        if (_isNil(this._procedureDefinitionModel)) {
            throw new TypeError('Unable to generate waypoints because the requested procedure does not exist');
        }

        return this._procedureDefinitionModel.getWaypointModelsForEntryAndExit(entryOrFixName, exit);
    }

    /**
     * Reset the model's instance properties
     *
     * @for LegModel
     * @method destroy
     */
    destroy() {
        this._destroyWaypointCollection();

        this.isProcedure = false;
        this._isHold = false;
        this._legType = '';
        this._routeString = '';
        this._waypointCollection = [];
    }

    /**
     * Given an index, drop the `WaypointModel`s before that index and make `waypointIndex`
     * the next `0` index of the array.
     *
     * This is useful for skipping to a specific waypoint in the flightPlan.
     *
     * @for LegModel
     * @method skipToWaypointAtIndex
     * @param waypointIndex {number}
     */
    skipToWaypointAtIndex(waypointIndex) {
        this._waypointCollection = _drop(this._waypointCollection, waypointIndex);
    }

    /**
     * Destroy the current `WaypointModel` and remove it from the
     * `waypointCollection`.
     *
     * This puts the item that previously occupied the `1` index now
     * at `0` making it the `currentWaypoint`.
     *
     * @for LegModel
     * @method moveToNextWaypoint
     */
    moveToNextWaypoint() {
        this.currentWaypoint.destroy();
        // this is mutable
        this._waypointCollection.shift();
    }

    /**
     * Find if a Waypoint exists within `#waypointCollection`
     *
     * @for LegModel
     * @method hasWaypoint
     * @param waypointName {string}
     * @return {boolean}
     */
    hasWaypoint(waypointName) {
        // using a for loop here instead of `_find()` because this operation could happen a lot. a for
        // loop is going to be faster than `_find()` in most cases.
        for (let i = 0; i < this._waypointCollection.length; i++) {
            const waypoint = this._waypointCollection[i];

            if (waypointName.toLowerCase() === waypoint.name) {
                return true;
            }
        }

        return false;
    }

    /**
     * Collects the `#altitudeMaximum` value from each waypoint
     * in the `#waypointCollection`, then finds the highest value
     *
     * @for LegModel
     * @method getProcedureTopAltitude
     * @return {number}
     */
    getProcedureTopAltitude() {
        const isMaximum = true;

        if (!this.isProcedure) {
            return -1;
        }

        return this._findMinOrMaxAltitudeInProcedure(isMaximum);
    }

    /**
     * Collects the `#altitudeMinimum` value from each waypoint
     * in the `#waypointCollection`, then finds the lowest value
     *
     * @for LegModel
     * @method getProcedureBottomAltitude
     * @return {number}
     */
    getProcedureBottomAltitude() {
        const isMaximum = false;

        if (!this.isProcedure) {
            return -1;
        }

        return this._findMinOrMaxAltitudeInProcedure(isMaximum);
    }

    /**
     * Encapsulation of boolean logic used to determine if it is possible
     * to move to a next waypoint.
     *
     * This is used when preparing to move to the next waypoint in the flight plan
     *
     * @for LegModel
     * @method hasNextWaypoint
     * @return {boolean}
     */
    hasNextWaypoint() {
        return this._waypointCollection.length > 1;
    }

    /**
     * Loop through each `WaypointModel` and call `.destroy()`
     *
     * This clears destroys each `WaypointModel` contained in the collection.
     *
     * TODO: implement object pooling with `WaypointModel`, this is the method
     *       where the `WaypointModel` is returned to the pool
     *
     * @for Fms
     * @method _destroyWaypointCollection
     * @private
     */
    _destroyWaypointCollection() {
        for (let i = 0; i < this._waypointCollection.length; i++) {
            const waypointModel = this._waypointCollection[i];

            waypointModel.destroy();
        }
    }

    /**
     * Create the intial `#waypointCollection` from a `routeSegment`
     *
     * Should run only on instantiation
     *
     * @for LegModel
     * @method _buildWaypointCollection
     * @param routeSegment {string}
     * @param runway {string}
     * @param flightPhase {string}
     * @param holdWaypointProps {object}
     * @private
     */
    _buildWaypointCollection(routeSegment, runway, flightPhase, holdWaypointProps) {
        if (this.isProcedure) {
            return this._buildWaypointCollectionForProcedureRoute(routeSegment, runway, flightPhase);
        } else if (this._isHold) {
            return this._buildWaypointForHoldingPattern(routeSegment, holdWaypointProps);
        }

        return this._buildWaypointForDirectRoute(routeSegment);
    }

    /**
     * Given a `directRouteSegment`, generate a `WaypointModel`.
     *
     * Returns an array eventhough there will only ever by one WaypointModel
     * for a directRouteSegment. This is because the `#waypointCollection` is
     * always assumed to be an array and the result of this method is used to
     * set `#waypointCollection`.
     *
     * @for LegModel
     * @method _buildWaypointForDirectRoute
     * @param directRouteSegment {string}
     * @return {array<WaypointModel>}
     * @private
     */
    _buildWaypointForDirectRoute(directRouteSegment) {
        const fixModel = this._navigationLibrary.findFixByName(directRouteSegment);

        return [
            fixModel.toWaypointModel()
        ];
    }

    /**
     * Given an `holdRouteSegment`, generate a `WaypointModel`.
     *
     * Returns an array eventhough there will only ever by one WaypointModel
     * for a directRouteSegment. This is because the `#waypointCollection` is
     * always assumed to be an array and the result of this method is used to
     * set `#waypointCollection`.
     *
     * @for LegModel
     * @method _buildWaypointForHoldingPattern
     * @param routeString {string}
     * @return {array<WaypointModel>}
     * @private
     */
    _buildWaypointForHoldingPattern(routeString, holdWaypointProps) {
        // TODO: replace with constant
        if (routeString === 'GPS') {
            return this._buildWaypointForHoldingPatternAtPosition(holdWaypointProps);
        }

        const isHold = true;
        const holdRouteSegment = extractFixnameFromHoldSegment(routeString);
        const fixModel = this._navigationLibrary.findFixByName(holdRouteSegment);

        if (!fixModel) {
            // TODO: Do something more helpful than this, that ends up telling the user their mistake
            return new Error(`Requested fix of '${holdRouteSegment}' could not be found!`);
        }

        return [
            fixModel.toWaypointModel(isHold, holdWaypointProps)
        ];
    }

    /**
     * Create a new `WaypointModel` for a holding pattern at a specific x/y position.
     *
     * @for LegModel
     * @method _buildWaypointForHoldingPatternAtPosition
     * @param holdWaypointProps {object}
     * @return {array<WaypointModel>}
     */
    _buildWaypointForHoldingPatternAtPosition(holdWaypointProps) {
        const waypointModel = new WaypointModel(holdWaypointProps);

        return [waypointModel];
    }

    /**
     * Given a procedureRouteSegment, find the `StandardRouteWaypointModels` for the
     * route and generate `WaypointModel`s that can be consumed by the Fms.
     *
     * @for LegModel
     * @method _buildWaypointCollectionForProcedureRoute
     * @param procedureRouteSegment {string}
     * @return {array<WaypointModel>}
     * @private
     */
    _buildWaypointCollectionForProcedureRoute(procedureRouteSegment, runway, flightPhase) {
        return this._navigationLibrary.buildWaypointModelsForProcedure(procedureRouteSegment, runway, flightPhase);
    }

    /**
     * Create a `RouteModel` for a procedureRouteString.
     *
     * This allows for easy access to the various parts of a procedureRouteString.
     * Currently these parts are accessed via getters and are used for view logic,
     * namely the `AircraftStripView`.
     *
     * @for Fms
     * @method _buildProcedureRouteModel
     * @param routeSegment {string}  current leg in routeString format
     * @return {RouteModel|null}
     * @private
     */
    _buildProcedureRouteModel(routeSegment) {
        if (!this.isProcedure) {
            return null;
        }

        return new RouteModel(routeSegment);
    }

    /**
     * Returns a string representing a `procedureType` associated with
     * this `LegModel`, if the Leg is in fact a procedure.
     *
     * @for LegModel
     * @param flightPhase {string}
     * @return {string}
     */
    _buildProcedureType(flightPhase) {
        if (!this.isProcedure) {
            return '';
        }

        // TODO: As amended, the following is probably an unsafe assumption, and should be reexamined.
        let procedureType = PROCEDURE_TYPE.STAR;

        if (flightPhase === FLIGHT_PHASE.APRON) {
            procedureType = PROCEDURE_TYPE.SID;
        }

        return procedureType;
    }

    /**
     * Finds the minimum or maximum altitude restriction in the `#waypointCollection`
     *
     * @for LegModel
     * @method _findMinOrMaxAltitudeInProcedure
     * @param isMaximum {boolean}
     * @return {number}
     * @private
     */
    _findMinOrMaxAltitudeInProcedure(isMaximum = false) {
        if (isMaximum) {
            const maximumAltitudes = _map(this._waypointCollection, (waypoint) => waypoint.altitudeMaximum);

            return Math.max(...maximumAltitudes);
        }

        const minimumAltitudes = _map(this._waypointCollection, (waypoint) => waypoint.altitudeMinimum);
        // setting this value here so we run `_without`, which might not be performant, only when we need it
        const positiveValueRestrictionList = _without(minimumAltitudes, -1);

        return Math.min(...positiveValueRestrictionList);
    }
}
