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
     * A flag indicating whether the `MapCollection` has any maps.
     *
     * @for MapCollection
     * @property hasMaps
     * @return {boolean}
     */
    get hasMaps() {
        return this.length !== 0;
    }

    /**
     * A flag indicating whether the `MapCollection` has any visible maps.
     *
     * @for MapCollection
     * @property hasMaps
     * @return {boolean}
     */
    get hasVisibleMaps() {
        // for means we can return on finding the first match, rather
        // than walking the whole array
        for (let i = 0; i < this.length; i++) {
            const map = this._items[i];

            if (!map.isHidden && map.hasLines) {
                return true;
            }
        }

        return false;
    }

    /**
     * Public fascade for `#_items`
     *
     * @for MapCollection
     * @property maps
     * @return {array<MapModel>}
     */
    get maps() {
        return this._items;
    }

    /**
     * A list of all the map lines for the visible maps in the `MapCollection`
     *
     * @for MapCollection
     * @method getVisibleMapLines
     * @return {array<object>}
     */
    getVisibleMapLines() {
        return this._items.reduce((sum, map) => {
            if (map.isHidden || !map.hasLines) {
                return sum;
            }
        
            return [
                ...map.lines,
                ...sum
            ];
        }, []);
    }

    /**
     * A list of all the `MapModel` names in the `MapCollection`
     *
     * @for MapCollection
     * @method getMapNames
     * @returns {array<string>}
     */
    getMapNames() {
        return this._items.map((map) => {
            return map.name;
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
