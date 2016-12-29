import _cloneDeep from 'lodash/cloneDeep';
import BaseModel from '../../base/BaseModel';
import PositionModel from '../../base/PositionModel';

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
     * @param airportPosition {PositionModel}
     */
    constructor(fixName, fixCoordinate, airportPosition) {
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
         * @property _fixPosition
         * @type {PositionModel}
         * @default null
         */
        this._fixPosition = null;

        this.init(fixName, fixCoordinate, airportPosition);
    }

    /**
     * Provides access to the position data of the instance
     *
     * @property position
     * @return {array}
     */
    get position() {
        return this._fixPosition.position;
    }

    /**
     * Lifecycle method. Should be run only once on instantiation.
     *
     * @for FixModel
     * @method init
     * @param fixName {string}
     * @param fixCoordinate {array}
     * @param airportPosition {PositionModel}
     * @chainable
     */
    init(fixName, fixCoordinate, airportPosition) {
        // TODO: should this be a throwing instead of returning early?
        if (!fixName || !fixCoordinate || !airportPosition) {
            return;
        }

        this.name = fixName.toUpperCase();
        this._fixPosition = new PositionModel(fixCoordinate, airportPosition, airportPosition.magneticNorthInRadians);

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
        this._fixPosition = null;

        return this;
    }

    /**
     * Returns a clone of an instance's `_fixPosition` property.
     *
     * It is important to note that this is a _clone_ and not a copy. Once any changes made to this instance will
     * not be reflected in the clone. This creates an entirely new instance of the `_fixPosition` property,
     * and after creation is completely independant of this instance.
     *
     * This is used with `StandardRouteWaypointModel` objects to obtain the position of a fix. This method
     * provides easy access to the `PositionModel` that already exists here.
     *
     * @for FixModel
     * @return {PositionModel}  a clone of the current `_fixPosition` property
     */
    clonePosition() {
        return _cloneDeep(this._fixPosition);
    }
}
