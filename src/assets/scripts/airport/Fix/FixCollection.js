import _compact from 'lodash/compact';
import _find from 'lodash/find';
import _forEach from 'lodash/forEach';
import _isArray from 'lodash/isArray';
import _isObject from 'lodash/isObject';
import _map from 'lodash/map';
import _uniqueId from 'lodash/uniqueId';
import FixModel from './FixModel';

/**
 * @class FixCollection
 */
export default class FixCollection {
    /**
     * @for FixCollection
     * @constructor
     * @param fixList {object}
     */
    constructor(fixList, airportPosition) {
        if (typeof fixList === 'undefined' || !_isObject(fixList) || _isArray(fixList)) {
            return null;
        }

        /**
         * Unigue string id that can be used to differentiate this model instance from another.
         *
         * @property _id
         * @type {string}
         */
        this._id = _uniqueId();

        /**
         * Array of `FixModel`s
         *
         * @property _items
         * @type {Array}
         * @default []
         * @private
         */
        this._items = [];

        /**
         * Convenience property to get at the current length of `_items`.
         *
         * @property length
         * @type {number}
         * @default -1
         */
        this.length = -1;

        return this._init(fixList, airportPosition);
    }

    /**
     * Lifecycle method. Should be run only once on instantiation.
     *
     * @for FixCollection
     * @method _init
     * @param fixList {object}
     * @param airportPosition {PositionModel}
     * @private
     */
    _init(fixList, airportPosition) {
        this._buildFixModelsFromList(fixList, airportPosition);
    }

    /**
     * Destroy the current instance
     *
     * @for FixCollection
     * @method destroy
     */
    destroy() {
        this._id = '';
        this._items = [];
        this.length = 0;
    }

    /**
     * Loop through each fix provided in the fix list, create a new `FixModel` instance, then send it off
     * to be added to the collection.
     *
     * @for FixCollection
     * @method _buildFixModelsFromList
     * @param fixList {object}
     * @private
     */
    _buildFixModelsFromList(fixList, airportPosition) {
        _forEach(fixList, (fixCoordinates, fixName) => {
            const fixModel = new FixModel(fixName, fixCoordinates, airportPosition)

            this.addFixToCollection(fixModel);
        });
    }

    /**
     * Add a `FixModel` to the collection and update the length property
     *
     * @for FixCollection
     * @method addFixToCollection
     * @param fixToAdd {FixModel}
     */
    addFixToCollection(fixToAdd) {
        if (!(fixToAdd instanceof FixModel)) {
            throw TypeError('Expected fixToAdd to be an instance of FixModel');
        }

        this._items.push(fixToAdd);
        this.length = this._items.length;
    }

    /**
     * Find a `FixModel` by `name` if it exists within the collection.
     *
     * @for FixCollection
     * @method findFixByName
     * @param fixName {string}
     * @return {FixModel|null}
     */
    findFixByName(fixName) {
        const fixModel = _find(this._items, { name: fixName });

        // if a fix is not found, _find() returns `undefined` so we specifically return null here if a fix is not found
        return fixModel || null;
    }

    /**
     * Find a list of all `FixModel`s within the collection that have a name that does not start with an underscore.
     *
     * @for FixCollection
     * @method findRealFixes
     * @return {array}
     */
    findRealFixes() {
        const realFixList = _map(this._items, (item) => {
            if (item.name.indexOf('_') !== 0) {
                return item;
            }
        });

        return _compact(realFixList);
    }
}
