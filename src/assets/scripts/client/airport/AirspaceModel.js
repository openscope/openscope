import _isEqual from 'lodash/isEqual';
import _isNumber from 'lodash/isNumber';
import _map from 'lodash/map';
import BaseModel from '../base/BaseModel';
import StaticPositionModel from '../base/StaticPositionModel';
import { INVALID_NUMBER } from '../constants/globalConstants';
import { convertToThousands, nm } from '../utilities/unitConverters';
import { point_in_poly, distance_to_poly } from '../math/vector';

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
         * Relative positions at which to draw airspace labels
         *
         * @for AirspaceModel
         * @property labelRelativePositions
         * @type {array<array<number>>} [ [x,y], [x,y], ... ], in km
         * @default []
         */
        this.labelRelativePositions = [];

        return this._init(data, airportPosition, magneticNorth);
    }

    // ------------------------------ LIFECYCLE ------------------------------

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
        this.poly = this._buildPolyPositionModels(data.poly, airportPosition, magneticNorth);
        this.relativePoly = _map(this.poly, (v) => v.relativePosition);

        this._initLabelPositions(data, airportPosition, magneticNorth);

        return this;
    }

    _initLabelPositions(data, airportPosition, magneticNorth) {
        if (!data.labelPositions) {
            const centerRelativePosition = this._calculateAirspaceCenterRelativePosition();
            this.labelRelativePositions = [centerRelativePosition];

            return;
        }

        const labelRelativePositions = data.labelPositions.map((position) => {
            const labelPositionModel = new StaticPositionModel(position, airportPosition, magneticNorth);

            return labelPositionModel.relativePosition;
        });

        this.labelRelativePositions = labelRelativePositions;
    }

    /**
     * Calculates the relative position of the center of the airspace
     *
     * @for AirspaceModel
     * @method _calculateAirspaceCenterRelativePosition
     * @returns {array} [x,y] coordinates in km
     * @private
     */
    _calculateAirspaceCenterRelativePosition() {
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

    // ------------------------------ PUBLIC ------------------------------

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

    // ------------------------------ PRIVATE ------------------------------

    /**
     * Create a StaticPositionModel for each poly
     *
     * If the last entry is the same as the first, remove it because the path will be closed automatically.
     *
     * @for AirspaceModel
     * @method _buildPolyPositionModels
     * @param polyList {array}
     * @param airportPosition {StaticPositionModel}
     * @param magneticNorth {number}
     * @return polyPositionModels {array}
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
