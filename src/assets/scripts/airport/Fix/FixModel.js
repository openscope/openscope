import _cloneDeep from 'lodash/cloneDeep';
import _uniqueId from 'lodash/uniqueId';
import PositionModel from '../../base/PositionModel';

/**
 * @class FixModel
 */
export default class FixModel {
    /**
     * @for FixModel
     * @param fixName {string}
     * @param fixCoordinate {array}
     * @param airportPosition {PositionModel}
     */
    constructor(fixName, fixCoordinate, airportPosition) {
        if (!fixName || !fixCoordinate || !airportPosition) {
            return;
        }

        /**
         * Unigue string id that can be used to differentiate this model instance from another.
         *
         * @property _id
         * @type {string}
         */
        this._id = _uniqueId();

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

        return this._init(fixName, fixCoordinate, airportPosition);
    }

    /**
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
     * @method _init
     * @param fixName {string}
     * @param fixCoordinate {array}
     * @param airportPosition {PositionModel}
     * @private
     */
    _init(fixName, fixCoordinate, airportPosition) {
        this.name = fixName.toUpperCase();
        this._fixPosition = new PositionModel(fixCoordinate, airportPosition, airportPosition.magneticNorthInRadians);

        return this;
    }

    /**
     * Destroy the current instance
     *
     * @for FixModel
     * @method destroy
     */
    destroy() {
        this._id = '';
        this.name = '';
        this._fixPosition = null;

        return this;
    }

    /**
     *
     *
     */
    clonePosition() {
        return _cloneDeep(this._fixPosition);
    }
}
