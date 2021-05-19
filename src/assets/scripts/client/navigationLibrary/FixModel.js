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
     * @param fixData {array or object}
     * @param referencePosition {StaticPositionModel}
     */
    constructor(fixName, fixData, referencePosition) {
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
         * Pronunciation of the fix name
         *
         * @property _spoken
         * @type {string}
         * @default ''
         */
        this._spoken = '';

        /**
         * Coordinates of the fix
         *
         * @property _positionModel
         * @type {StaticPositionModel}
         * @default null
         */
        this._positionModel = null;

        this.init(fixName, fixData, referencePosition);
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
     * Facade to access relative position
     *
     * @for FixModel
     * @return {array<number>} [kilometersNorth, kilometersEast]
     */
    get relativePosition() {
        return this._positionModel.relativePosition;
    }

    /**
     * Facade to access spoken name
     *
     * @for FixModel
     * @return {string}
     */
    get spoken() {
        return this._spoken;
    }

    /**
     * Lifecycle method. Should be run only once on instantiation.
     *
     * @for FixModel
     * @method init
     * @param fixName {string}
     * @param fixData {array or object}
     * @param referencePosition {StaticPositionModel}
     * @chainable
     */
    init(fixName, fixData, referencePosition) {
        if (!fixName || !fixData || !referencePosition) {
            throw new TypeError(`Expected FixModel ${fixName} to receive name, data, and referencePosition, but ` +
                `received ${typeof fixName}, ${typeof fixData}, ${typeof referencePosition}`);
        }

        const [lat, lon, spoken] = fixData;
        this.name = fixName.toUpperCase();
        this._positionModel = new StaticPositionModel([lat, lon], referencePosition, referencePosition.magneticNorth);

        if (typeof spoken === 'undefined') {
            this._spoken = fixName.toLowerCase();
        } else {
            this._spoken = spoken.toLowerCase();
        }

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
        this._spoken = '';
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
