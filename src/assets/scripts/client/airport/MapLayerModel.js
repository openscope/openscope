import _forEach from 'lodash/forEach';
import _isEqual from 'lodash/isEqual';
import _isNumber from 'lodash/isNumber';
import _map from 'lodash/map';
import BaseModel from '../base/BaseModel';
import DynamicPositionModel from '../base/DynamicPositionModel';
import StaticPositionModel from '../base/StaticPositionModel';

/**
 * A collection of lines that represent a map layer.
 *
 * @class MapLayerModel
 */
export default class MapLayerModel extends BaseModel {
    /**
     * @for MapLayerModel
     * @constructor
     * @param map {object}
     * @param airportPosition {StaticPositionModel}
     * @param magneticNorth {number}
     */
    constructor(map, airportPosition, magneticNorth) {
        super();

        if (!map || !airportPosition || !_isNumber(magneticNorth)) {
            // eslint-disable-next-line max-len
            throw new TypeError('Invalid parameter, expected map, airportPosition and magneticNorth to be defined');
        }

        /**
         * A flag indicating whether the layer should be hidden
         *
         * @for MapLayerModel
         * @property hidden
         * @type {boolean}
         * @default false
         */
        this.hidden = false;

        /**
         * List of lat/long coordinates pairs that define a line
         *
         * @for MapLayerModel
         * @property lines
         * @type {array}
         * @default []
         */
        this.lines = [];

        /**
         * Name of the map layer.
         *
         * @for MapLayerModel
         * @property name
         * @type {string}
         * @default ''
         */
        this.name = '';

        return this._init(map, airportPosition, magneticNorth);
    }

    /**
     * Initialize the model
     *
     * @for MapLayerModel
     * @method _init
     * @param map {object}
     * @param airportPosition {StaticPositionModel}
     * @param magneticNorth {number}
     * @private
     */
    _init(map, airportPosition, magneticNorth) {
        this.hidden = map.hidden === true;
        this.name = map.name;
        this._buildMapLines(map.lines, airportPosition, magneticNorth);

        return this;
    }

    /**
     * Create the array of map lines
     * @for MapLayerModel
     * @method _buildMapLines
     * @param map {object}
     * @param airportPosition {StaticPositionModel}
     * @param magneticNorth {number}
     * @private
     */
    _buildMapLines(lines, airportPosition, magneticNorth) {
        _forEach(lines, (line) => {
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
            const lineVerticesRelativePositions = [...startPosition, ...endPosition];
    
            this.lines.push(lineVerticesRelativePositions);
        });
    }

    /**
     * @for MapLayerModel
     * @method reset
     */
    reset() {
        this.hidden = true;
        this.lines = [];
        this.name = '';
    }
}
