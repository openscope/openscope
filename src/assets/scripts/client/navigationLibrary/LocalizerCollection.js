import BaseCollection from '../base/BaseCollection';
import LocalizerModel from './LocalizerModel';

/**
 * A collection of all the `LocalizerModel`s defined in an airport json file.
 *
 * This is built as a static class, so there is only ever once instance.
 * We use a static class here because the methods contained herein are needed by several
 * different classes. This provides a single source of truth for all the `LocalizerModel`s
 * belonging to an Airport.
 *
 * @class LocalizerCollection
 * @extends BaseCollection
 */
class LocalizerCollection extends BaseCollection {
    /**
     * Lifecycle method. Should be run only once on instantiation.
     *
     * @for LocalizerCollection
     * @method addItems
     * @param localizerList {object}
     * @param referencePosition {StaticPositionModel}
     */
    addItems(localizerList, referencePosition) {
        if (this.length !== 0) {
            // you made it here because an airport has changed.
            // in `AirportModel.init()` this method is called with the loc data for the new airport. We don't want
            // or need to keep the loces from a previous airport so if `_items` has a length, we need to reset that
            // property before we begin to add loces for the new airport.
            this.removeItems();
        }

        this._buildLocalizerModelsFromList(localizerList, referencePosition);
    }

    /**
     * Destroy the current instance
     *
     * @for LocalizerCollection
     * @method removeItems
     */
    removeItems() {
        this._resetLocalizerModels();

        this._items = [];
    }

    /**
     * Add a `LocalizerModel` to the collection
     *
     * @for LocalizerCollection
     * @method addLocalizerToCollection
     * @param locToAdd {LocalizerModel}
     */
    addLocalizerToCollection(locToAdd) {
        if (!(locToAdd instanceof LocalizerModel)) {
            throw new TypeError('Expected locToAdd to be an instance of LocalizerModel');
        }

        this._items.push(locToAdd);
    }

    /**
     * Find a `LocalizerModel` by `name` if it exists within the collection.
     *
     * @for LocalizerCollection
     * @method findLocalizerByName
     * @param locName {string}
     * @return {LocalizerModel|null}
     */
    findLocalizerByName(locName) {
        if (!locName) {
            return null;
        }

        const locModel = this._items.find((l) => l.name === locName.toUpperCase());

        // if a loc is not found, .find() returns `undefined` so we specifically return null here if a loc is not found
        return locModel || null;
    }

    /**
     * @for LocalizerCollection
     * @method getLocalizerRelativePosition
     * @param locName {string}
     * @return {array<number>}
     */
    getLocalizerRelativePosition(locName) {
        const locModel = this.findLocalizerByName(locName);

        if (!locModel) {
            return null;
        }

        return locModel.relativePosition;
    }

    /**
     * Return the position model for the specified loc, if that loc exists
     *
     * @for LocalizerCollection
     * @method getPositionModelForLocalizerName
     * @param locName {string}
     * @return {StaticPositionModel}
     */
    getPositionModelForLocalizerName(locName) {
        const locModel = this.findLocalizerByName(locName);

        if (!locModel) {
            return null;
        }

        return locModel.positionModel;
    }

    /**
     * Loop through each loc provided in the loc list, create a new `LocalizerModel` instance, then send it off
     * to be added to the collection.
     *
     * @for LocalizerCollection
     * @method _buildLocalizerModelsFromList
     * @param locList {object}
     * @param referencePosition {StaticPositionModel}
     * @private
     */
    _buildLocalizerModelsFromList(locList, referencePosition) {
        Object.entries(locList).forEach((entry) => {
            const [locName, locData] = entry;
            const locModel = new LocalizerModel(locName, locData, referencePosition);

            this.addLocalizerToCollection(locModel);
        });
    }

    /**
     * @for LocalizerCollection
     * @method _resetLocalizerModels
     * @private
     */
    _resetLocalizerModels() {
        this._items.forEach((locModel) => {
            locModel.reset();
        });
    }
}

export default new LocalizerCollection();
