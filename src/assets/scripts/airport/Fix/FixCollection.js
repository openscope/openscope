import _compact from 'lodash/compact';
import _find from 'lodash/find';
import _forEach from 'lodash/forEach';
import _map from 'lodash/map';
import _uniqueId from 'lodash/uniqueId';
import FixModel from './FixModel';

/**
 * A collection of all the `FixModel`s defined in an airport json file.
 *
 * This is built as a static class, so there is only ever once instance.
 * We use a static class here because the methods contained herein are needed by several
 * different classes. This provides a single source of truth for all the `FixModel`s
 * belonging to an Airport.
 *
 * @class FixCollection
 */
class FixCollection {
    /**
     * @for FixCollection
     * @constructor
     */
    constructor() {
        /**
         * Unigue string id that can be used to differentiate this model instance from another.
         *
         * @property _id
         * @type {string}
         * @default ''
         * @private
         */
        this._id = '';

        /**
         * Array of `FixModel`s
         *
         * @property _items
         * @type {array<FixModel>}
         * @default []
         * @private
         */
        this._items = [];
    }

    /**
     * Convenience property to get at the current length of `_items`.
     *
     * @property length
     * @type {number}
     */
    get length() {
        return this._items.length;
    }

    /**
     * Lifecycle method. Should be run only once on instantiation.
     *
     * @for FixCollection
     * @method init
     * @param fixList {object}
     * @param airportPosition {PositionModel}
     */
    init(fixList, airportPosition) {
        this._id = _uniqueId();

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
            const fixModel = new FixModel(fixName, fixCoordinates, airportPosition);

            this.addFixToCollection(fixModel);
        });
    }

    /**
     * Add a `FixModel` to the collection
     *
     * @for FixCollection
     * @method addFixToCollection
     * @param fixToAdd {FixModel}
     */
    addFixToCollection(fixToAdd) {
        if (!(fixToAdd instanceof FixModel)) {
            throw new TypeError('Expected fixToAdd to be an instance of FixModel');
        }

        this._items.push(fixToAdd);
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
     * @for FixCollection
     * @method getFixPositionCoordinates
     * @param fixName {string}
     * @return {array<number>}
     */
    getFixPositionCoordinates(fixName) {
        const fixModel = this.findFixByName(fixName);

        if (!fixModel) {
            // error
            return null;
        }

        return fixModel.position
    }

    /**
     * Find a list of all `FixModel`s within the collection that have a name that does not start with an underscore.
     *
     * @for FixCollection
     * @method findRealFixes
     * @return {array<FixModel>}
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

export default new FixCollection();
