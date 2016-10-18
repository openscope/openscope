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

        /**g
         * @property _id
         * @type {string}
         */
        this._id = _uniqueId();

        /**
         * @property name
         * @type {string}
         * @default ''
         */
        this.name = '';

        /**
         * @property position
         * @type {PositionModel}
         * @default null
         */
        this.position = null;

        return this._init(fixName, fixCoordinate, airportPosition);
    }

    /**
     * @for FixModel
     * @method _init
     * @param fixName
     * @param fixCoordinate
     * @param airportPosition {PositionModel}
     */
    _init(fixName, fixCoordinate, airportPosition) {
        this.name = fixName.toUpperCase();
        this.position = new PositionModel(fixCoordinate, airportPosition, airportPosition.magneticNorthInRadians);
    }
}
