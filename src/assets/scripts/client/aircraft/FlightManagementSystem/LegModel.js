import _isNil from 'lodash/isNil';
import _map from 'lodash/map';
import _without from 'lodash/without';
import ProcedureWaypointModel from '../../navigationLibrary/Procedure/ProcedureWaypointModel';
import {
    INVALID_INDEX,
    INVALID_NUMBER
} from '../../constants/globalConstants';
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
         * Reference to an instance of a `ProcedureDefinitionModel` object (if this is a procedure leg)
         *
         * @for LegModel
         * @property _procedureDefinitionModel
         * @type {ProcedureDefinitionModel|null}
         * @default null
         * @private
         */
        this._procedureDefinitionModel = null;

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

        this.init(navigationLibrary, routeString);
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
        if (this._waypointCollection.length < 1) {
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
     * Returns the type of this leg
     *
     * @for LegModel
     * @property legType
     * @type {string}
     */
    get legType() {
        return this._legType;
    }

    // FIXME: Do we need this?
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

    // ------------------------------ LIFECYCLE ------------------------------

    /**
     * Initialize class properties
     *
     * @for LegModel
     * @method init
     * @param navigationLibrary {NavigationLibrary}
     * @param routeString {string}
     * @chainable
     */
    init(navigationLibrary, routeString) {
        this._routeString = routeString;

        const [entryOrFixName, airwayOrProcedureName, exit] = routeString.split('.');

        this._ensureRouteStringIsSingleSegment(routeString);
        this._legType = this._determineLegType(airwayOrProcedureName, navigationLibrary);
        this._airwayModel = navigationLibrary.getAirway(airwayOrProcedureName);
        this._procedureDefinitionModel = navigationLibrary.getProcedure(airwayOrProcedureName);
        this._waypointCollection = this._generateWaypointCollection(entryOrFixName, exit);

        return this;
    }

    /**
     * Reset class properties
     *
     * @for LegModel
     * @method reset
     * @chainable
     */
    reset() {
        this._resetWaypointCollection();

        this.isProcedure = false;
        this._isHold = false;
        this._legType = '';
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
     * @param navigationLibrary {NavigationLibrary}
     * @return {string} property of `LEG_TYPE` enum
     */
    _determineLegType(airwayOrProcedureName, navigationLibrary) {
        if (this._routeString.indexOf('.') === INVALID_NUMBER) {
            return LEG_TYPE.DIRECT;
        }

        if (navigationLibrary.hasAirway(airwayOrProcedureName)) {
            return LEG_TYPE.AIRWAY;
        }

        return LEG_TYPE.PROCEDURE;
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

    // ------------------------------ PUBLIC ------------------------------

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
     * @method hasWaypoint
     * @param waypointName {string}
     * @return {boolean}
     */
    hasWaypoint(waypointName) {
        // using a for loop instead of `_find()` to maximize performance
        // because this operation could happen quite frequently
        for (let i = 0; i < this._waypointCollection.length; i++) {
            const waypoint = this._waypointCollection[i];

            if (waypointName.toLowerCase() === waypoint.name) {
                return true;
            }
        }

        return false;
    }

    /**
     * Returns the lowest `#altitudeMinimum` of all `WaypointModel`s in this leg
     *
     * @for LegModel
     * @method getProcedureBottomAltitude
     * @return {number}
     */
    getProcedureBottomAltitude() {
        if (!this.isProcedure) {
            return INVALID_NUMBER;
        }

        const minimumAltitudes = _map(this._waypointCollection, (waypoint) => waypoint.altitudeMinimum);
        const positiveValueRestrictionList = _without(minimumAltitudes, INVALID_NUMBER);

        return Math.min(...positiveValueRestrictionList);
    }

    /**
     * Returns the highest `#altitudeMaximum` of all `WaypointModel`s in this leg
     *
     * @for LegModel
     * @method getProcedureTopAltitude
     * @return {number}
     */
    getProcedureTopAltitude() {
        if (!this.isProcedure) {
            return INVALID_NUMBER;
        }

        const maximumAltitudes = _map(this._waypointCollection, (waypoint) => waypoint.altitudeMaximum);

        return Math.max(...maximumAltitudes);
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
     * Move all `WaypointModel`s before the specified index to the `#_previousWaypointCollection`
     *
     * This also results in the waypoint AT the specified index becoming the new `#currentWaypoint`
     *
     * @for LegModel
     * @method skipToWaypointAtIndex
     * @param waypointIndex {number}
     */
    skipToWaypointAtIndex(waypointIndex) {
        const numberOfWaypointsToMove = waypointIndex - 1;
        const waypointModelsToMove = this._waypointCollection.splice(0, numberOfWaypointsToMove);

        this._previousWaypointCollection.push(...waypointModelsToMove);
    }

    // ------------------------------ PRIVATE ------------------------------

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
}
