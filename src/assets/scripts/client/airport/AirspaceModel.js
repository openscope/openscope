import _isNumber from 'lodash/isNumber';
import _map from 'lodash/map';
import BaseModel from '../base/BaseModel';
import StaticPositionModel from '../base/StaticPositionModel';
import { INVALID_NUMBER } from '../constants/globalConstants';
import { convertToThousands, nm } from '../utilities/unitConverters';
import { buildPolyPositionModels, point_in_poly, distance_to_poly } from '../math/vector';

/**
 * An enclosed region defined by a series of Position objects and an altitude range
 *
 * @class AirspaceModel
 */
export default class AirspaceModel extends BaseModel {
    /**
     * @for AirspaceModel
     * @constructor
     * @param data {object}
     * @param airportPosition {StaticPositionModel}
     * @param magneticNorth {number}
     */
    constructor(data, airportPosition, magneticNorth) {
        super();

        if (!data || !airportPosition || !_isNumber(magneticNorth)) {
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
         * A transformed version of this.poly
         *
         * @for AirspaceModel
         * @property relativePoly
         * @type {array}
         * @default []
         */
        this.relativePoly = [];

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

        /**
         * Position of the label of the airspace on the screen
         *
         * @for AirspaceModel
         * @property labelPositions
         * @type {object} x,y in km
         * @default null
         */
        this.labelPositions = [];

        return this._init(data, airportPosition, magneticNorth);
    }

    /**
     * Initialize the model
     *
     * @for AirspaceModel
     * @method _init
     * @param data {array}
     * @param airportPosition {StaticPositionModel}
     * @param magneticNorth {number}
     * @chainable
     * @private
     */
    _init(data, airportPosition, magneticNorth) {
        this.floor = convertToThousands(data.floor);
        this.ceiling = convertToThousands(data.ceiling);
        this.airspace_class = data.airspace_class;
        this.poly = buildPolyPositionModels(data.poly, airportPosition, magneticNorth);
        this.relativePoly = _map(this.poly, (v) => v.relativePosition);

        this._initLabelPositions(data, airportPosition, magneticNorth);

        return this;
    }

    _initLabelPositions(data, airportPosition, magneticNorth) {
        if (!data.labelPositions) {
            this.labelPositions = [this._calculateLabelPosition()];

            return;
        }

        this.labelPositions = [];

        for (const position of data.labelPositions) {
            const labelPositionModel = new StaticPositionModel(
                position,
                airportPosition,
                magneticNorth
            );

            this.labelPositions.push(labelPositionModel.relativePosition);
        }
    }

    /**
     * Calculates the center of the airspace
     *
     * @for _calculateLabelPosition
     * @method _calculateLabelPosition
     * @returns {object} {x,y} coordinates in km
     * @private
     */
    _calculateLabelPosition() {
        let [minX, minY] = this.relativePoly[0];
        let [maxX, maxY] = this.relativePoly[0];

        // iterate through all points in the polygon to find the extreme X/Y coordinates
        for (const point of this.relativePoly) {
            minX = Math.min(minX, point[0]);
            maxX = Math.max(maxX, point[0]);
            minY = Math.min(minY, point[1]);
            maxY = Math.max(maxY, point[1]);
        }

        // calculate the center point as the middle of the extremes
        return [
            (minX + maxX) / 2,
            (minY + maxY) / 2
        ];
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
     * Checks if a point (2D position and altitude) is within this airspace
     *
     * @for AirspaceModel
     * @method isPointInside
     * @param point {array} x,y
     * @param altitude {number}
     * @return {boolean}
     */
    isPointInside(point, altitude) {
        if (!this.isPointInside2D(point)) {
            return false;
        }

        return this.floor <= altitude && altitude <= this.ceiling;
    }

    /**
     * Checks if a 2D point is within the 2D projection of the airspace
     *
     * @for AirspaceModel
     * @method isPointInside
     * @param point {array} x,y
     * @return {boolean}
     */
    isPointInside2D(point) {
        return point_in_poly(point, this.relativePoly);
    }

    /**
     * calculates the distance to the airspace in nm
     *
     * @for AirspaceModel
     * @method distanceToBoundary
     * @param point {array} x,y
     * @return {number} in nm
     */
    distanceToBoundary(point) {
        return nm(distance_to_poly(point, this.relativePoly));
    }
}
