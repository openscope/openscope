import _drop from 'lodash/drop';
import RouteModel from '../../navigationLibrary/Route/RouteModel';
import WaypointModel from './WaypointModel';
import { extractFixnameFromHoldSegment } from '../../navigationLibrary/Route/routeStringFormatHelper';
import { FLIGHT_CATEGORY } from '../../constants/aircraftConstants';

/**
 * Enum of possible procedure types
 *
 * @property PROCEDURE_TYPE
 * @type {Object}
 * @final
 */
const PROCEDURE_TYPE = {
    SID: 'SID',
    STAR: 'STAR'
};

/**
 * A section of a flight plan containing one to many `WaypointModel` objects.
 *
 * Instantiated from a `routeSegment`
 *
 * A `LegModel` represents each section of a flight plan:
 * - single `WaypointModel` will be built from a `routeSegment` not included in a standard
 *                          procedure and without restrictions
 * - single `WaypointModel` assigned to hold at, which can be a navaid or a position array
 * - standard procedure (sid/star/airway), which may contain many `WaypointModel` objects,
 *   each of which may specify altitude and/or speed restrictions.
 *
 * RouteSegment Examples:
 *  - directRouteSegment: 'COWBY'
 *  - holdRouteSegment: '@COWBY'
 *  - procedureRouteSegment: 'KLAS.COWBY6.DRK'
 *
 * @class LegModel
 */
export default class LegModel {
    /**
     * @constructor
     * @for LegModel
     * @param routeSegment {string}
     * @param runway {string}
     * @param flightPhase {string}
     * @param navigationLibrary {NavigationLibrary}
     * @param holdWaypointProps {object}
     */
    constructor(routeSegment, runway, flightPhase, navigationLibrary, holdWaypointProps = {}) {
        /**
         * NavigationLibrary instance
         *
         * @property _navigationLibrary
         * @type {NavigationLibrary}
         * @default navigationLibrary
         * @private
         */
        this._navigationLibrary = navigationLibrary;

        /**
         * Indicates the leg is for a standardRoute procedure
         *
         * @property _isProcedure
         * @type {boolean}
         * @private
         */
        this._isProcedure = false;

        /**
         * Indicates the leg is for a holding pattern
         *
         * @property _isHold
         * @type {boolean}
         * @private
         */
        this._isHold = false;

        /**
         *
         *
         * @type {string}
         * @default ''
         */
        this.procedureType = '';

        /**
         * String representation of the current routeSegment.
         *
         * A directRoute contains a single WaypointModel and is separated
         * by `..` in the routeString. In this example there are two directRoute
         * segments, thus this routeString will result in two LegModels:
         * - `FIXA..COWBY`
         *
         * A procedureRoute contains many `WaypointModel` objects and describes
         * a standardRoute (sid/star/airway). procedureRoutes are separated by
         * a single '.':
         * - `DAG.KEPEC3.KLAS`
         *
         * @for LegModel
         * @property routeString
         * @type {string}
         */
        this.routeString = '';

        /**
         * List of `WaypointModel` objects defined within a `LegModel`.
         *
         * If this leg represents a `directRoute`, there will only be one
         * `WaypointModel` contained in `#waypointCollection`.
         *
         * @propert waypointCollection
         * @type {array}
         * @default []
         */
        this.waypointCollection = [];

        this.init(routeSegment, runway, flightPhase, holdWaypointProps);
    }

    /**
     * The active `WaypointModel`.
     *
     * Assumed to always be the first item in
     * the `#waypointCollection`
     *
     * @property currentWaypoint
     * @return {WaypointModel}
     */
    get currentWaypoint() {
        return this.waypointCollection[0];
    }

    /**
     * The `WaypointModel` immediately following the `#currentWaypoint`
     * in the flightPlan
     *
     * Used when calculating headings to the next waypoint.
     *
     * @property nextWaypoint
     * @return {WaypointModel}
     */
    get nextWaypoint() {
        return this.waypointCollection[1];
    }

    /**
     * Instantiate the class properties
     *
     * @for LegModel
     * @method init
     * @param routeSegment {string}
     * @param runway {string}
     * @param holdWaypointProps {object}
     */
    init(routeSegment, runway, flightPhase, holdWaypointProps) {
        this._isProcedure = RouteModel.isProcedureRouteString(routeSegment);
        // TODO: replace with constant
        this._isHold = RouteModel.isHoldRouteString(routeSegment) || routeSegment === 'GPS';

        this.routeString = routeSegment.toLowerCase();
        this.procedureType = this._buildProcedureType(flightPhase);
        this.waypointCollection = this._buildWaypointCollection(routeSegment, runway, flightPhase, holdWaypointProps);
    }

    /**
     * Reset the model's instance properties
     *
     * @for LegModel
     * @method destroy
     */
    destroy() {
        this._destroyWaypointCollection();

        this._isProcedure = false;
        this._isHold = false;
        this.procedureType = '';
        this.routeString = '';
        this.waypointCollection = [];
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
        this.waypointCollection = _drop(this.waypointCollection, waypointIndex);
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
        this.waypointCollection.shift();
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
        return this.waypointCollection.length > 1;
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
        for (let i = 0; i < this.waypointCollection.length; i++) {
            const waypointModel = this.waypointCollection[i];

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
        if (this._isProcedure) {
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
            return this._buildWaypointForHoldingPatternAtPosition(routeString, holdWaypointProps);
        }

        const isHold = true;
        const holdRouteSegment = extractFixnameFromHoldSegment(routeString);
        const fixModel = this._navigationLibrary.findFixByName(holdRouteSegment);

        return [
            fixModel.toWaypointModel(isHold)
        ];
    }

    /**
     * Create a new `WaypointModel` for a holding pattern at a specific x/y position.
     *
     * @for LegModel
     * @method _buildWaypointForHoldingPatternAtPosition
     * @param routeString {string}
     * @param holdWaypointProps {object}
     * @return {array<WaypointModel>}
     */
    _buildWaypointForHoldingPatternAtPosition(routeString, holdWaypointProps) {
        const holdWaypointPropsWithPositionModel = this._buildHoldAtPositionWaypointProps(holdWaypointProps);
        const waypointModel = new WaypointModel(holdWaypointPropsWithPositionModel);

        return [
            waypointModel
        ];
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
     * Returns a string representing a `procedureType` associated with
     * this `LegModel`, if the Leg is in fact a procedure.
     *
     * @for LegModel
     * @param flightPhase {string}
     * @return {string}
     */
    _buildProcedureType(flightPhase) {
        if (!this._isProcedure) {
            return '';
        }

        let procedureType = PROCEDURE_TYPE.SID;

        if (flightPhase === FLIGHT_CATEGORY.ARRIVAL) {
            procedureType = PROCEDURE_TYPE.STAR;
        }

        return procedureType;
    }

    // FIXME: refactor something somewhere so we don't have to do this! This is naughty!!
    /**
     * Create an object that can be sent to the `WaypointModel`.
     *
     * When setting up a hold at a position, we will not have access to `.toWaypointModel()`
     * from either a `FixModel` or `StandardRouteWaypointModel`. This is becuase we are creating,
     * in essence, a temporary fix for the purposes of a hold.
     *
     * The `WaypointModel` expects a `#position` property that is an instance of a,
     * `PositionModel` though it doesn't actually use the `PositionModel`. We cheat
     * a little bit here so the `WaypointModel` will instantiate correctly.
     *
     * @for LegModel
     * @method _buildHoldAtPositionWaypointProps
     * @return {object}
     * @private
     */
    _buildHoldAtPositionWaypointProps(waypointProps) {
        return Object.assign(
            {},
            waypointProps,
            {
                position: {
                    position: waypointProps.position
                }
            }
        );
    }
}
