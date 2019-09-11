import _forEach from 'lodash/forEach';
import _isEqual from 'lodash/isEqual';
import _isNumber from 'lodash/isNumber';
import _map from 'lodash/map';
import BaseModel from '../base/BaseModel';
import DynamicPositionModel from '../base/DynamicPositionModel';
import StaticPositionModel from '../base/StaticPositionModel';

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

    /**
     * A flag indicating whether the `MapModel` has any lines.
     *
     * @for MapModel
     * @property hasLines
     * @return {boolean}
     */
    get hasLines() {
        return this.lines !== 0;
    }

    /**
     * Initialize the model
     *
     * @for MapModel
     * @method _init
     * @param lines {array}
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
     * Create the array of map lines
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

    /**
     * @for MapModel
     * @method reset
     */
    reset() {
        this.isHidden = false;
        this.lines = [];
        this.name = '';
    }
}
