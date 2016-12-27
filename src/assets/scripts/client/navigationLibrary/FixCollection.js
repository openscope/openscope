import _compact from 'lodash/compact';
import _find from 'lodash/find';
import _forEach from 'lodash/forEach';
import _isEmpty from 'lodash/isEmpty';
import _isObject from 'lodash/isObject';
import _map from 'lodash/map';
// import modelSourceFactory from '../base/ModelSource/ModelSourceFactory';
import BaseCollection from '../base/BaseCollection';
import FixModel from './FixModel';
import PositionModel from '../base/PositionModel';

/**
 * A collection of all the `FixModel`s defined in an airport json file.
 *
 * @class FixCollection
 * @extends BaseCollection
 */
export default class FixCollection extends BaseCollection {
    /**
     * @constructor
     * @for FixCollection
     * @param airportJson {object}
     */
    constructor(airportJson) {
        super();

        if (!_isObject(airportJson) || _isEmpty(airportJson)) {
            throw new TypeError('Invalid parameter passed to FixCollection');
        }

        this.referencePosition = new PositionModel(airportJson.position, null, airportJson.magnetic_north);

        this.addItems(airportJson.fixes);
    }

    /**
     * Lifecycle method. Should be run only once on instantiation.
     *
     * @for FixCollection
     * @method addItems
     * @param fixList {object}
     */
    addItems(fixList) {
        this._buildFixModelsFromList(fixList);
    }

    /**
     * Reset the current instance
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
        const fixModel = _find(this._items, { name: fixName.toUpperCase() });

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

        return fixModel.position;
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
    _buildFixModelsFromList(fixList) {
        _forEach(fixList, (fixCoordinates, fixName) => {
            // const fixModel = modelSourceFactory.getModelSourceForType('FixModel', fixName, fixCoordinates, airportPosition);
            const fixModel = new FixModel(fixName, fixCoordinates, this.referencePosition);

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
