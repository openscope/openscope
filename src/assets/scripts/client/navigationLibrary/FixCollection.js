import _find from 'lodash/find';
import _forEach from 'lodash/forEach';
// TODO: Start using the model source factory again!
// import modelSourceFactory from '../base/ModelSource/ModelSourceFactory';
import BaseCollection from '../base/BaseCollection';
import { distance2d } from '../math/distance';
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
     * @method addItems
     * @param fixList {object}
     * @param referencePosition {StaticPositionModel}
     */
    addItems(fixList, referencePosition) {
        if (this.length !== 0) {
            // you made it here because an airport has changed.
            // in `AirportModel.init()` this method is called with the fix data for the new airport. We don't want
            // or need to keep the fixes from a previous airport so if `_items` has a length, we need to reset that
            // property before we begin to add fixes for the new airport.
            this.removeItems();
        }

        this._buildFixModelsFromList(fixList, referencePosition);
    }

    /**
     * Destroy the current instance
     *
     * @for FixCollection
     * @method removeItems
     */
    removeItems() {
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
        if (!fixName) {
            return null;
        }

        const fixModel = _find(this._items, { name: fixName.toUpperCase() });

        // if a fix is not found, _find() returns `undefined` so we specifically return null here if a fix is not found
        return fixModel || null;
    }

    /**
     * @for FixCollection
     * @method getFixRelativePosition
     * @param fixName {string}
     * @return {array<number>}
     */
    getFixRelativePosition(fixName) {
        const fixModel = this.findFixByName(fixName);

        if (!fixModel) {
            return null;
        }

        return fixModel.relativePosition;
    }

    /**
     * Returns the nearest fix to the specified position
     *
     * @for FixCollection
     * @method getNearestFix
     * @param position {array<number>} These are x, y canvas units (km)
     * @param hiddenFixes {boolean} A flag indicating whether hidden fixes should be used
     */
    getNearestFix(position, hiddenFixes = false) {
        return this._items.reduce((lastResult, fix) => {
            let [nearest, distance] = lastResult;
            const d = distance2d(fix.relativePosition, position);

            if ((fix.isRealFix || hiddenFixes) && d < distance) {
                nearest = fix;
                distance = d;
            }

            return [nearest, distance];
        }, [null, Infinity]);
    }

    /**
     * Return the position model for the specified fix, if that fix exists
     *
     * @for FixCollection
     * @method getPositionModelForFixName
     * @param fixName {string}
     * @return {StaticPositionModel}
     */
    getPositionModelForFixName(fixName) {
        const fixModel = this.findFixByName(fixName);

        if (!fixModel) {
            return null;
        }

        return fixModel.positionModel;
    }

    /**
     * Find a list of all `FixModel`s within the collection that have a name that does not start with an underscore.
     *
     * @for FixCollection
     * @method findRealFixes
     * @return {array<FixModel>}
     */
    findRealFixes() {
        return this._items.filter((fix) => fix.isRealFix);
    }

    /**
     * Loop through each fix provided in the fix list, create a new `FixModel` instance, then send it off
     * to be added to the collection.
     *
     * @for FixCollection
     * @method _buildFixModelsFromList
     * @param fixList {object}
     * @param referencePosition {StaticPositionModel}
     * @private
     */
    _buildFixModelsFromList(fixList, referencePosition) {
        _forEach(fixList, (fixCoordinates, fixName) => {
            const fixModel = new FixModel(fixName, fixCoordinates, referencePosition);
            // const fixModel = modelSourceFactory.getModelSourceForType('FixModel', fixName, fixCoordinates, referencePosition);

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
            // modelSourceFactory.returnModelToPool(fixModel);
        });
    }
}

export default new FixCollection();
