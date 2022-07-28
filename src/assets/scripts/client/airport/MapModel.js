import _isNil from 'lodash/isNil';
import _isNumber from 'lodash/isNumber';
import _isString from 'lodash/isString';
import BaseModel from '../base/BaseModel';
import DynamicPositionModel from '../base/DynamicPositionModel';
import StaticPositionModel from '../base/StaticPositionModel';
import {
    isEmptyOrNotArray,
    isEmptyOrNotObject
} from '../utilities/validatorUtilities';

/**
 * A video map item, containing a collection of map lines
 *
 * Defines a video map layer referenced by an `AirportModel` that
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

        if (_isNil(map) || _isNil(airportPosition) || !_isNumber(magneticNorth)) {
            throw new TypeError('Invalid parameter(s) passed to MapModel constructor. ' +
                'Expected map, airportPosition and magneticNorth to be defined, ' +
                `but received ${typeof map}, ${typeof airportPosition} and ${typeof magneticNorth}`);
        }

        if (isEmptyOrNotObject(map)) {
            throw new TypeError('Invalid map passed to MapModel constructor. ' +
                `Expected a non-empty object, but received ${typeof map}`);
        }

        if (!_isString(map.name)) {
            throw new TypeError('Invalid map passed to MapModel constructor. ' +
                `Expected map.name to be a string, but received ${typeof map.name}`);
        }

        if (isEmptyOrNotArray(map.lines)) {
            throw new TypeError('Invalid map passed to MapModel constructor. ' +
                `Expected map.lines to be a non-empty array, but received ${typeof map.lines}`);
        }

        if (!(airportPosition instanceof StaticPositionModel)) {
            throw new TypeError('Invalid airportPosition passed to MapModel constructor. ' +
                `Expected instance of StaticPositionModel, but received ${typeof airportPosition}`);
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
