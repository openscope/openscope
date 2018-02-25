import _uniqueId from 'lodash/uniqueId';

/**
 * Base class from which a collection type class can inherit from.
 *
 * This class is meant to be extended and should never be used directly.
 *
 * @class BaseCollection
 */
export default class BaseCollection {
    /**
     * @constructor
     * @for BaseCollection
     */
    constructor() {
        /**
         * Unigue string id that can be used to differentiate this model instance from another.
         *
         * @property _id
         * @type {string}
         * @private
         */
        this._id = _uniqueId();

        /**
         * @property _items
         * @type {array}
         * @default []
         * @private
         */
        this._items = [];
    }

    /**
     * Current length of the collection
     *
     * @property length
     * @return {number}
     */
    get length() {
        return this._items.length;
    }

    /**
     * Initialize the model properties. Should be run on instantiation and, though not desired,
     * could be run multiple times after instantiation.
     *
     * This method may be called by the constructor or from a public fascade.
     *
     * @for BaseCollection
     * @method _init
     * @private
     */
    _init() {
        throw new TypeError('BaseCollection#_init has not been implemented by the extending class');
    }

    /**
     * Destory the current instance.
     *
     * When implemented by the inheriting class, this method should un-set all instance properties
     * and remove any handlers.
     *
     * @for BaseCollection
     * @method destroy
     */
    destroy() {
        throw new TypeError('BaseCollection#destroy has not been implemented by the extending class');
    }

    // TODO: add additional common collection method
    // reset()
    // addItems()
    // addItem()
    // removeItem()
}
