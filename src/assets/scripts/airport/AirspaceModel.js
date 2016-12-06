import _isEqual from 'lodash/isEqual';
import _map from 'lodash/map';
import BaseModel from '../base/BaseModel';
import PositionModel from '../base/PositionModel';
import { convertToThousands } from '../utilities/unitConverters';

/**
 * An enclosed region defined by a series of Position objects and an altitude range
 *
 * @class AirspaceModel
 */
export default class AirspaceModel extends BaseModel {
    /**
     * @for AirspaceModel
     * @constructor
     * @param airspace {object}
     * @param airportPosition {PositionModel}
     * @param magneticNorth {number}
     */
    constructor(airspace, airportPosition, magneticNorth) {
        super();

        if (!airspace || !airportPosition || !magneticNorth) {
            // eslint-disable-next-line max-len
            throw new TypeError('Invalid parameter, expected airspace, airportPosition and magneticNorth to be defined');
        }

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
     * @for AirspaceModel
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
     * @for AirspaceModel
     * @method reset
     */
    reset() {
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
     * @for AirspaceModel
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
