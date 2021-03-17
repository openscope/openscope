import _cloneDeep from 'lodash/cloneDeep';
import BaseModel from '../base/BaseModel';
import StaticPositionModel from '../base/StaticPositionModel';
import { RNAV_WAYPOINT_PREFIX } from '../constants/waypointConstants';

/**
 * Defines a navigational `FixModel`
 *
 * A `FixModel` can be used as part of a `StandardRoute` or as a naviagtional aid.
 * Not all `FixModel`s are a part of a `StandardRoute`.
 *
 * @class FixModel
 */
export default class FixModel extends BaseModel {
    /**
     * @for FixModel
     * @constructor
     * @param fixName {string}
     * @param fixCoordinate {array}
     * @param referencePosition {StaticPositionModel}
     */
    constructor(fixName, fixCoordinate, referencePosition) {
        super();

        /**
         * Name of the Fix
         *
         * @property name
         * @type {string}
         * @default ''
         */
        this.name = '';

        /**
         * Coordinates of the fix
         *
         * @property _positionModel
         * @type {StaticPositionModel}
         * @default null
         */
        this._positionModel = null;

        this.init(fixName, fixCoordinate, referencePosition);
    }

    /**
     * Indicates whether the fix is a real fix, not an RNAV fix
     * (prefixed with an underscore)
     *
     * @property isRealFix
     * @return {boolean}
     */
    get isRealFix() {
        return this.name[0] !== RNAV_WAYPOINT_PREFIX;
    }

    /**
     * Provides access to the position data of the instance
     *
     * @property positionModel
     * @return {array}
     */
    get positionModel() {
        return this._positionModel;
    }

    /**
     * Fascade to access relative position
     *
     * @for FixModel
     * @return {array<number>} [kilometersNorth, kilometersEast]
     */
    get relativePosition() {
        return this._positionModel.relativePosition;
    }

    /**
     * Lifecycle method. Should be run only once on instantiation.
     *
     * @for FixModel
     * @method init
     * @param fixName {string}
     * @param fixCoordinate {array}
     * @param referencePosition {StaticPositionModel}
     * @chainable
     */
    init(fixName, fixCoordinate, referencePosition) {
        // TODO: should this be a throwing instead of returning early?
        if (!fixName || !fixCoordinate || !referencePosition) {
            return;
        }

        this.name = fixName.toUpperCase();
        this._positionModel = new StaticPositionModel(fixCoordinate, referencePosition, referencePosition.magneticNorth);

        return this;
    }

    /**
     * reset the current instance
     *
     * @for FixModel
     * @method reset
     * @chainable
     */
    reset() {
        this.name = '';
        this._positionModel = null;

        return this;
    }

    /**
     * Returns a clone of an instance's `_positionModel` property.
     *
     * It is important to note that this is a _clone_ and not a copy. Any changes made to this instance will
     * not be reflected in the clone. This creates an entirely new instance of the `_positionModel` property,
     * and after creation is completely independant of this instance.
     *
     * This is used with `StandardRouteWaypointModel` objects to obtain the position of a fix. This method
     * provides easy access to the `StaticPositionModel` that already exists here.
     *
     * @for FixModel
     * @return {StaticPositionModel}  a clone of the current `_positionModel` property
     */
    clonePosition() {
        return _cloneDeep(this._positionModel);
    }
}
