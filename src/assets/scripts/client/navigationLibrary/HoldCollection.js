import _isObject from 'lodash/isObject';
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
     * @param holdJson {object}
     */
    constructor(holdJson) {
        super();

        // holdsJson is permitted to be null/undefined/empty, but if valid must be an object
        if (holdJson != null && !_isObject(holdJson)) {
            throw new TypeError(
                `Invalid holdJson parameter passed to HoldCollection. Expected an object but found ${typeof holdJson}`
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
     * @param holdJson {object}
     */
    _init(holdJson) {
        this.populateHolds(holdJson);
    }

    /**
     * @for HoldCollection
     * @method reset
     */
    reset() {
        this.holds.forEach((item) => item.reset());

        this._items = [];
    }

    // ------------------------------ PUBLIC ------------------------------

    /**
     * Returns a flag indicating whether the `fixName` exists within the collection
     *
     * @for HoldCollection
     * @method containsHoldForFix
     * @param fixName {string}
     * @return {boolean}
     */
    containsHoldForFix(fixName) {
        if (!fixName) {
            return false;
        }

        fixName = fixName.toUpperCase();

        return this._items.some((hold) => hold.fixName === fixName);
    }

    /**
     * Find holdParameters by `fixName` if it exists within the collection
     *
     * @for HoldCollection
     * @method findHoldParametersByFix
     * @param fixName {string}
     * @return {object|null}
     */
    findHoldParametersByFix(fixName) {
        if (!fixName) {
            return null;
        }

        fixName = fixName.toUpperCase();

        const model = this._items.find((hold) => hold.fixName === fixName);

        return model ? model.holdParameters : null;
    }

    /**
     * Populates the hold collection with the specified holds object
     *
     * @for HoldCollection
     * @method populateHolds
     * @param holdJson {object}
     */
    populateHolds(holdJson) {
        if (!holdJson) {
            return;
        }

        // Check for duplicate fixName as multiple collections may have to be combined
        // by the `NavigationLibrary` in the future
        Object.keys(holdJson).forEach((fixName) => {
            if (this.containsHoldForFix(fixName)) {
                return;
            }

            this._items.push(new HoldModel(fixName, holdJson[fixName]));
        });
    }
}
