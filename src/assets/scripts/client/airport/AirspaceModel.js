import _isNumber from 'lodash/isNumber';
import _map from 'lodash/map';
import BaseModel from '../base/BaseModel';
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
         * @property labelPosition
         * @type {object} x,y in km
         * @default null
         */
        this.labelPosition = null;

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
     * @chainable
     * @private
     */
    _init(airspace, airportPosition, magneticNorth) {
        this.floor = convertToThousands(airspace.floor);
        this.ceiling = convertToThousands(airspace.ceiling);
        this.airspace_class = airspace.airspace_class;
        this.poly = buildPolyPositionModels(airspace.poly, airportPosition, magneticNorth);

        this.transformPoly();

        this.labelPosition = airspace.labelPosition !== undefined ? airspace.labelPosition : this._calculateLabelPosition();

        return this;
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
        let minX = Number.MAX_VALUE;
        let minY = Number.MAX_VALUE;
        let maxX = Number.MIN_VALUE;
        let maxY = Number.MIN_VALUE;

        for (let i = 0; i < this.relativePoly.length; i++) {
            const point = this.relativePoly[i];

            minX = Math.min(minX, point[0]);
            maxX = Math.max(maxX, point[0]);
            minY = Math.min(minY, point[1]);
            maxY = Math.max(maxY, point[1]);
        }

        return {
            x: (minX + maxX) * 0.5,
            y: (minY + maxY) * 0.5
        };
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
     * Transforms the polygon into a relative polygon
     *
     * @for AirspaceModel
     * @method transformPoly
     */
    transformPoly() {
        this.relativePoly = _map(this.poly, (v) => v.relativePosition);
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
