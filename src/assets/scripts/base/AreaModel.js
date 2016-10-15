import _isEqual from 'lodash/isEqual';
import _map from 'lodash/map';
import _uniqueId from 'lodash/uniqueId';
import PositionModel from './PositionModel';

/**
 * Utility function to convert a number to thousands.
 *
 * Given a flightlevel FL180, this function outs puts 18,000
 *
 * @function covertToThousands
 * @param  {number} value
 * @return {number}
 */
const convertToThousands = (value) => parseInt(value, 10) * 100;

/**
 * An enclosed region defined by a series of Position objects and an altitude range
 *
 * @class AreaModel
 */
export default class AreaModel {
    /**
     * @for AreaModel
     * @constructor
     * @param airspace {object}
     * @param airportPosition {PositionModel}
     * @param magneticNorth {number}
     */
    constructor(airspace, airportPosition, magneticNorth) {
        if (!airspace || !airportPosition || !magneticNorth) {
            throw new TypeError('Invalid parameter, expected airspace, airportPosition and magneticNorth to be defined');
        }

        /**
         * @property _id
         * @type {string}
         */
        this._id = _uniqueId();

        /**
         * List of lat/long coordinates that outline the shape of the area
         *
         * DO NOT repeat the origin to 'close' the shape, this happens programatically
         *
         * @property poly
         * @type {array}
         */
        this.poly = [];

        /**
         * Altitude at bottom of area, in hundreds of feet
         *
         * @property floor
         * @type {number}
         */
        this.floor = -1;

        /**
         * Altitude of top of area, in hundreds of feet
         *
         * @property ceiling
         * @type {number}
         */
        this.ceiling = -1;

        /**
         * FAA airspace classification (A,B,C,D,E,G)
         *
         * @property airspace_class
         * @type {string}
         */
        this.airspace_class = '';

        return this._init(airspace, airportPosition, magneticNorth);
    }

    /**
     * Initialize the model
     *
     * @for AreaModel
     * @method _init
     * @param airspace {array}
     * @param airportPosition {PositionModel}
     * @param magneticNorth {number}
     * @private
     */
    _init(airspace, airportPosition, magneticNorth) {
        this.floor = convertToThousands(airspace.floor);
        this.ceiling = convertToThousands(airspace.ceiling);
        this.airspace_class = airspace.airspace_class;
        this.poly = this._buildPolyPositionModels(airspace.poly, airportPosition, magneticNorth);

        return this;
    }

    /**
     * @for AreaModel
     * @method destroy
     */
    destroy() {
        this._id = '';
        this.poly = [];
        this.floor = -1;
        this.ceiling = -1;
        this.airspace_class = '';
    }

    /**
     * Create a PositionModel for each poly listed in `airspace.poly`.
     *
     * If the last entry is the same as the first, remove it because the path will be closed automatically.
     *
     * @for AreaModel
     * @method _buildPolyPositionModels
     * @param polyList {array}
     * @param airportPosition {PositionModel}
     * @param magneticNorth {number}
     * @return polyPositionModels {array}
     * @private
     */
    _buildPolyPositionModels(polyList, airportPosition, magneticNorth) {
        const polyPositionModels = _map(polyList, (poly) => {
            return new PositionModel(poly, airportPosition, magneticNorth);
        });

        const firstIndex = 0;
        const lastIndex = polyPositionModels.length - 1;

        if (_isEqual(polyPositionModels[firstIndex].position, polyPositionModels[lastIndex].position)) {
            // shape shouldn't fully close; will draw with 'cc.closepath()' so we remove the last item
            polyPositionModels.pop();
        }

        return polyPositionModels;
    }
}
