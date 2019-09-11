import _forEach from 'lodash/forEach';
import _has from 'lodash/has';
import _isArray from 'lodash/isArray';
import _isObject from 'lodash/isObject';
import BaseCollection from '../base/BaseCollection';
import MapModel from './MapModel';

/**
 * Collection of `MapModel` objects
 *
 * Provides methods to create `MapModel` objects, used by `AirportModel`
 * and to extract video map line data to be rendered by the
 * `CanvasController`
 *
 * @class MapCollection
 * @extends BaseCollection
 */
export default class MapCollection extends BaseCollection {
    /**
     * @constructor
     * @param mapJson {object}
     * @param airportPositionModel {StaticPositionModel}
     * @param magneticNorth {number}
     */
    constructor(mapJson, airportPositionModel, magneticNorth) {
        super();

        if (!_isArray(mapJson) && !_isObject(mapJson)) {
            throw new TypeError(
                `Invalid parameter passed to MapCollection. Expected an array or object but found ${typeof mapJson}`
            );
        }

        /**
         * @inherited
         * @memberof BaseCollection
         * @property _items
         * @type {array<MapModel>}
         * @default []
         */

        /**
         * @inherited
         * @memberof BaseCollection
         * @property length
         * @type {number}
         * @default #_items.length
         */

        this._init(mapJson, airportPositionModel, magneticNorth);
    }

    /**
     * Public fascade for `#_items`
     *
     * @property maps
     * @return {array<MapModel>}
     */
    get maps() {
        return this._items;
    }

    /**
     * @for MapCollection
     * @method getVisibleMapLines
     * @return {array<array<object>>}
     */
    getVisibleMapLines() {
        const filtered = this._items.filter((map) => {
            return !map.isHidden && map.lines.length
        });
        
        return filtered.map((map) => {
            return map.lines;
        });
    }

    /**
     * Initialize the instance
     *
     * @for MapCollection
     * @method _init
     * @param mapJson {object}
     * @param airportPositionModel {StaticPositionModel}
     * @param magneticNorth {number}
     */
    _init(mapJson, airportPositionModel, magneticNorth) {
        this._buildMapModels(mapJson, airportPositionModel, magneticNorth);
    }

    /**
     * Tear down the instance and destroy any instance property values
     *
     * @for MapCollection
     * @method destroy
     */
    destroy() {
    }

    /**
     * @for MapCollection
     * @method _buildMapModels
     * @param mapJson {object}
     * @param airportPositionModel {StaticPositionModel}
     * @param magneticNorth {number}
     */
    _buildMapModels(mapJson, airportPositionModel, magneticNorth) {
        // Need to use forEach, as the value being passed can be either
        // an array of map objects, or a dictionary of key -> object[]
        _forEach(mapJson, (map, key) => {
            if (!_has(map, 'lines')) {
                // Handle the existing map dictionary format too
                map = {
                    name: `Legacy-${key}`,
                    lines: map
                };
            }
            
            this._items.push(new MapModel(map, airportPositionModel, magneticNorth));
        });
    }
}
