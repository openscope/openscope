import _isArray from 'lodash/isArray';
import MapModel from './MapModel';
import BaseCollection from '../base/BaseCollection';

/**
 * Collection of `MapModel`s available to be displayed on the scope
 *
 * Provides methods to create `MapModel`s, used by `AirportModel`
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
     * @param defaultMaps {array<string>}
     * @param airportPositionModel {StaticPositionModel}
     * @param magneticNorth {number}
     */
    constructor(mapJson, defaultMaps, airportPositionModel, magneticNorth) {
        super();

        if (!_isArray(mapJson)) {
            throw new TypeError(
                `Invalid mapJson parameter passed to MapCollection. Expected an array but found ${typeof mapJson}`
            );
        } else if (!_isArray(defaultMaps)) {
            throw new TypeError(
                `Invalid defaultMaps parameter passed to MapCollection. Expected an array but found ${typeof defaultMaps}`
            );
        } else if (defaultMaps.length === 0) {
            throw new TypeError(
                'Invalid defaultMaps parameter passed to MapCollection. Expected an array with at least one element'
            );
        } else if (mapJson.length === 0) {
            throw new TypeError(
                'Invalid mapJson parameter passed to MapCollection. Expected an array with at least one element'
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

        this._init(mapJson, defaultMaps, airportPositionModel, magneticNorth);
    }

    /**
     * A flag indicating whether the `MapCollection` has any visible maps.
     *
     * @for MapCollection
     * @property hasVisibleMaps
     * @return {boolean}
     */
    get hasVisibleMaps() {
        return this._items.some((map) => !map.isHidden);
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

    // ------------------------------ LIFECYCLE ------------------------------

    /**
     * Initialize the instance
     *
     * @for MapCollection
     * @method _init
     * @param mapJson {object}
     * @param defaultMaps {array<string>}
     * @param airportPositionModel {StaticPositionModel}
     * @param magneticNorth {number}
     */
    _init(mapJson, defaultMaps, airportPositionModel, magneticNorth) {
        this._items = this._buildMapModels(mapJson, defaultMaps, airportPositionModel, magneticNorth);
    }

    // ------------------------------ PUBLIC ------------------------------

    /**
     * A list of all the map lines for the visible maps in the `MapCollection`
     *
     * @for MapCollection
     * @method getVisibleMapLines
     * @return {array<object>}
     */
    getVisibleMapLines() {
        return this._items.reduce((sum, map) => {
            if (map.isHidden) {
                return sum;
            }

            return [
                ...map.lines,
                ...sum
            ];
        }, []);
    }

    /**
     * A list of names of all the visible maps in the `MapCollection`
     *
     * @for MapCollection
     * @method getVisibleMapNames
     * @return {array<object>}
     */
    getVisibleMapNames() {
        return this._items.reduce((sum, map) => {
            if (map.isHidden) {
                return sum;
            }

            return [
                ...sum,
                map.name
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
        return this._items.map((map) => map.name);
    }

    /**
     * Sets which maps should be rendered on the `CanvasController`
     *
     * @for MapCollection
     * @method setVisibleMaps
     * @param names {array<string>}
     */
    setVisibleMaps(names) {
        this._items.forEach((map) => {
            map.isHidden = !names.includes(map.name);
        });
    }

    // ------------------------------ PRIVATE ------------------------------

    /**
     * @for MapCollection
     * @method _buildMapModels
     * @param mapJson {object}
     * @param defaultMaps {array<string>}
     * @param airportPositionModel {StaticPositionModel}
     * @param magneticNorth {number}
     * @returns {array<MapModel>}
     */
    _buildMapModels(mapJson, defaultMaps, airportPositionModel, magneticNorth) {
        return mapJson.map((item) => {
            const map = new MapModel(item, airportPositionModel, magneticNorth);

            map.isHidden = !defaultMaps.includes(map.name);

            return map;
        });
    }
}
