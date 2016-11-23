import _compact from 'lodash/compact';
import _find from 'lodash/find';
import _forEach from 'lodash/forEach';
import _map from 'lodash/map';
import modelSourceFactory from '../../base/ModelSource/ModelSourceFactory';
import BaseCollection from '../../base/BaseCollection';
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
 * @extends BaseCollection
 */
class FixCollection extends BaseCollection {
    /**
     * Lifecycle method. Should be run only once on instantiation.
     *
     * @for FixCollection
     * @method init
     * @param fixList {object}
     * @param airportPosition {PositionModel}
     */
    init(fixList, airportPosition) {
        if (this.length !== 0) {
            // you made it here because an airport has changed.
            // in `AirportModel.parse()` this method is called with the fix data for the new airport. We don't want
            // or need to keep the fixes from a previous airport so if `_items` has a length, we need to reset that
            // property before we begin to add fixes for the new airport.
            this.destroy();
        }

        this._buildFixModelsFromList(fixList, airportPosition);
    }

    /**
     * Destroy the current instance
     *
     * @for FixCollection
     * @method destroy
     */
    destroy() {
        this._resetFixModels();

        this._items = [];
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
        const fixModel = _find(this._items, { name: fixName.toUpperCase() });

        // if a fix is not found, _find() returns `undefined` so we specifically return null here if a fix is not found
        return fixModel || null;
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
            const fixModel = modelSourceFactory.getModelSourceForType('FixModel', fixName, fixCoordinates, airportPosition);

            this.addFixToCollection(fixModel);
        });
    }

    /**
     * @for FixCollection
     * @method _resetFixModels
     * @private
     */
    _resetFixModels() {
        _forEach(this._items, (fixModel) => {
            fixModel.reset();
            modelSourceFactory.returnModelToPool(fixModel);
        });
    }
}

export default new FixCollection();
