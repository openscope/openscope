import _isEqual from 'lodash/isEqual';
import _isNumber from 'lodash/isNumber';
import _map from 'lodash/map';
import BaseModel from '../base/BaseModel';
import StaticPositionModel from '../base/StaticPositionModel';
import { INVALID_NUMBER } from '../constants/globalConstants';
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
     * @param airportPosition {StaticPositionModel}
     * @param magneticNorth {number}
     */
    constructor(airspace, airportPosition, magneticNorth) {
        super();

        if (!airspace || !airportPosition || !_isNumber(magneticNorth)) {
            // eslint-disable-next-line max-len
            throw new TypeError('Invalid parameter, expected airspace, airportPosition and magneticNorth to be defined');
        }

        /**
         * List of lat/long coordinates that outline the shape of the area
         *
         * DO NOT repeat the origin to 'close' the shape, this happens programatically
         *
         * @for AirspaceModel
         * @property poly
         * @type {array}
         * @default []
         */
        this.poly = [];

        /**
         * Altitude at bottom of area, in hundreds of feet
         *
         * @for AirspaceModel
         * @property floor
         * @type {number}
         * @default INVALID_NUMBER
         */
        this.floor = INVALID_NUMBER;

        /**
         * Altitude of top of area, in hundreds of feet
         *
         * @for AirspaceModel
         * @property ceiling
         * @type {number}
         * @default INVALID_NUMBER
         */
        this.ceiling = INVALID_NUMBER;

        /**
         * FAA airspace classification (A,B,C,D,E,G)
         *
         * @for AirspaceModel
         * @property airspace_class
         * @type {string}
         * @default ''
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
     * @param airportPosition {StaticPositionModel}
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
        this.floor = INVALID_NUMBER;
        this.ceiling = INVALID_NUMBER;
        this.airspace_class = '';
    }

    /**
     * Create a StaticPositionModel for each poly listed in `airspace.poly`.
     *
     * If the last entry is the same as the first, remove it because the path will be closed automatically.
     *
     * @for AirspaceModel
     * @method _buildPolyPositionModels
     * @param polyList {array}
     * @param airportPosition {StaticPositionModel}
     * @param magneticNorth {number}
     * @return polyPositionModels {array}
     * @private
     */
    _buildPolyPositionModels(polyList, airportPosition, magneticNorth) {
        const polyPositionModels = _map(polyList, (poly) => {
            return new StaticPositionModel(poly, airportPosition, magneticNorth);
        });

        // TODO: Though its reusability is not real likely, this might as well be made into an external helper
        // shape shouldn't fully close; will draw with 'cc.closepath()' so we remove the last item
        const firstIndex = 0;
        const lastIndex = polyPositionModels.length - 1;
        const firstIndexRelativePosition = polyPositionModels[firstIndex].relativePosition;
        const lastIndexRelativePosition = polyPositionModels[lastIndex].relativePosition;
        if (_isEqual(firstIndexRelativePosition, lastIndexRelativePosition)) {
            polyPositionModels.pop();
        }

        return polyPositionModels;
    }
}
