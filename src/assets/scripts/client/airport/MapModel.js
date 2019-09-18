import _isArray from 'lodash/isArray';
import _isNumber from 'lodash/isNumber';
import _isString from 'lodash/isString';
import BaseModel from '../base/BaseModel';
import DynamicPositionModel from '../base/DynamicPositionModel';

/**
 * A video map item, containing a collection of map lines
 *
 * Defines a vide omap layer referenced by an `AirportModel` that
 * contains the map lines to be drawn by the `CanvasController`,
 * as well as a name describing the map contents and a flag
 * allowing rendering of the layer to be suppressed.
 *
 * @class MapModel
 */
export default class MapModel extends BaseModel {
    /**
     * @for MapModel
     * @constructor
     * @param map {object}
     * @param airportPosition {StaticPositionModel}
     * @param magneticNorth {number}
     */
    constructor(map, airportPosition, magneticNorth) {
        super();

        if (!map || !airportPosition || !_isNumber(magneticNorth)) {
            throw new TypeError(
                'Invalid parameter, expected map, airportPosition and magneticNorth to be defined'
            );
        } else if (!_isArray(map.lines) || map.lines.length === 0) {
            throw new TypeError(
                'Invalid parameter, map.lines must be an array with at least one element'
            );
        } else if (!_isString(map.name)) {
            throw new TypeError(
                `Invalid parameter, map.name must be a string, but found ${typeof map.name}`
            );
        }

        /**
         * A flag indicating whether the layer should be hidden
         *
         * @for MapModel
         * @property isHidden
         * @type {boolean}
         * @default false
         */
        this.isHidden = false;

        /**
         * List of lat/long coordinates pairs that define a line
         *
         * @for MapModel
         * @property lines
         * @type {array}
         * @default []
         */
        this.lines = [];

        /**
         * Name of the map layer.
         *
         * @for MapModel
         * @property name
         * @type {string}
         * @default ''
         */
        this.name = '';

        return this._init(map, airportPosition, magneticNorth);
    }

    // ------------------------------ LIFECYCLE ------------------------------

    /**
     * Initialize the model
     *
     * @for MapModel
     * @method _init
     * @param map {object}
     * @param airportPosition {StaticPositionModel}
     * @param magneticNorth {number}
     * @private
     */
    _init(map, airportPosition, magneticNorth) {
        this.isHidden = map.isHidden === true;
        this.name = map.name;

        this._buildMapLines(map.lines, airportPosition, magneticNorth);

        return this;
    }

    /**
     * @for MapModel
     * @method reset
     */
    reset() {
        this.isHidden = false;
        this.lines = [];
        this.name = '';
    }

    // ------------------------------ PUBLIC ------------------------------

    // ------------------------------ PRIVATE ------------------------------

    /**
     * Create the array of map lines
     *
     * @for MapModel
     * @method _buildMapLines
     * @param map {object}
     * @param airportPosition {StaticPositionModel}
     * @param magneticNorth {number}
     * @private
     */
    _buildMapLines(lines, airportPosition, magneticNorth) {
        this.lines = lines.map((line) => {
            const airportPositionAndDeclination = [airportPosition, magneticNorth];
            const lineStartCoordinates = [line[0], line[1]];
            const lineEndCoordinates = [line[2], line[3]];
            const startPosition = DynamicPositionModel.calculateRelativePosition(
                lineStartCoordinates,
                ...airportPositionAndDeclination
            );
            const endPosition = DynamicPositionModel.calculateRelativePosition(
                lineEndCoordinates,
                ...airportPositionAndDeclination
            );

            return [...startPosition, ...endPosition];
        });
    }
}
