import _isArray from 'lodash/isArray';
import HoldModel from './HoldModel';
import BaseCollection from '../base/BaseCollection';

/**
 * Collection of `HoldModel`s
 *
 * Provides methods to create `HoldModel`s, used by `AirportModel`
 * and `WaypointModel` for configuring hold
 *
 * @class HoldCollection
 * @extends BaseCollection
 */
export default class HoldCollection extends BaseCollection {
    /**
     * @constructor
     * @param holdJson {array}
     */
    constructor(holdJson) {
        super();

        // holdsJson is permitted to be null/undefined/empty, but if valid must be an array
        if (holdJson && !_isArray(holdJson)) {
            throw new TypeError(
                `Invalid holdJson parameter passed to HoldCollection. Expected an array but found ${typeof holdJson}`
            );
        }

        /**
         * @inherited
         * @memberof BaseCollection
         * @property _items
         * @type {array<HoldModel>}
         * @default []
         */

        /**
         * @inherited
         * @memberof BaseCollection
         * @property length
         * @type {number}
         * @default #_items.length
         */

        this._init(holdJson);
    }

    /**
     * Public fascade for `#_items`
     *
     * @for HoldCollection
     * @property holds
     * @return {array<HoldModel>}
     */
    get holds() {
        return this._items;
    }

    // ------------------------------ LIFECYCLE ------------------------------

    /**
     * Initialize the instance
     *
     * @for HoldCollection
     * @method _init
     * @param holdJson {array}
     */
    _init(holdJson) {
        if (holdJson) {
            this._items = holdJson.map((hold) => new HoldModel(hold));
        }
    }

    // ------------------------------ PUBLIC ------------------------------

    /**
     * Find a `HoldModel` by `fixName` if it exists within the collection.
     *
     * @for HoldCollection
     * @method findFixByName
     * @param fixName {string}
     * @return {HoldModel|null}
     */
    findFixByName(fixName) {
        if (!fixName) {
            return null;
        }

        // if a fix is not found, _find() returns `undefined` so we specifically return null here if a fix is not found
        return this._items.find((hold) => hold.fixName === fixName.toUpperCase()) || null;
    }
}
