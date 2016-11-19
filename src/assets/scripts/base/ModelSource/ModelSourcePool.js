import _find from 'lodash/find';
import _forEach from 'lodash/forEach';
import _has from 'lodash/has';
import _without from 'lodash/without';
import BaseCollection from '../BaseCollection';
import {
    CLASS_MAP,
    CLASS_MAP_LENGTH
} from './modelSourceClassMap';

/**
 * @property MAX_POOL_SIZE_PER_MODEL
 * @type {number}
 * @final
 */
const MAX_POOL_SIZE_PER_MODEL = 300;

/**
 * @property MAX_POOL_SIZE
 * @type {number}
 * @final
 */
const MAX_POOL_SIZE = MAX_POOL_SIZE_PER_MODEL * CLASS_MAP_LENGTH;

/**
 * A collection of model objects that are not in use.
 *
 * This provides:
 * - a way to instantiate a `MAX_POOL_SIZE_PER_MODEL` number of model objects on app start
 * - a way to release a model for use within the app, and remove it from the pool
 * - a way to return a model after use and add it to the pool
 *
 * This allows for decreased garbage collection because the models being used are the ones that have already
 * been created. The app isn't always creating and destroying classes, instead it is creating, using and
 * re-using the same models.
 *
 * see: (Object Pool)[https://sourcemaking.com/design_patterns/object_pool] on (sourcemaking.com)[sourcemaking.com]
 * for more information.
 *
 * @class ModelSourcePool
 * @extends BaseCollection
 */
class ModelSourcePool extends BaseCollection {
    /**
     * @constructor
     * @for ModelSourcePool
     */
    constructor() {
        super();

        // NOT IN USE
        /**
         * Maximum number of instances per model/reusable allowing in the pool
         *
         * This property is also used for pre-warming the pool on instantiation
         *
         * @property _maxPoolSizePerModel
         * @type {nubmer}
         * @private
         */
        this._maxPoolSizePerModel = MAX_POOL_SIZE;

        return this._hydratePool();
    }

    /**
     * Add a reusable to the pool
     *
     * @for ModelSourcePool
     * @method returnReusable
     * @param modelToAdd {constructor} on of CLASS_MAP
     */
    returnReusable(modelToAdd) {
        if (!_has(CLASS_MAP, modelToAdd.constructor.name)) {
            throw new TypeError(`Unsupported type passed to ModelSourcePool: ${modelToAdd.constructor.name}`);
        }

        this._items.push(modelToAdd);
    }

    // TODO: this method currenty accepts only a string. It may be easier to pass the constructor
    // TODO: accept parameters so the model returned is fully formed. the caller won't need to worry
    //       about `model.init()`
    /**
     * Remove a reusable from the collection and return it for use by the caller
     *
     * @for ModelSourcePool
     * @method releasModelFromPool
     * @param type {string}  constructor name
     * @return model {constructor} on of CLASS_MAP
     */
    releaseReusable(type) {
        let model = this._findModelByConstructorName(type);

        if (!model) {
            model = new CLASS_MAP[type]();
        }

        return model;
    }

    /**
     * On instantiation pre-warm the pool with reusables so they don't need
     * to be created at run time.
     *
     * @for ModelSourcePool
     * @method _hydratePool
     */
    _hydratePool() {
        _forEach(CLASS_MAP, (ModelSource) => {
            for (let i = 0; i < MAX_POOL_SIZE_PER_MODEL; i++) {
                const model = new ModelSource();

                this._items.push(model);
            }
        });
    }

    /**
     * @for ModelSourcePool
     * @method _findModelByConstructorName
     * @param constructorName {string} the name of a constructor
     * @return model {constructor} one of CLASS_MAP
     */
    _findModelByConstructorName(constructorName) {
        const model = _find(this._items, (model) => model.constructor.name === constructorName);

        if (!model) {
            return null;
        }

        this._removeItem(model);

        return model;
    }

    /**
     * Remove a specific instance from the pool
     *
     * When a reusable has been requested, it mush be removed from the pool
     *
     * @for ModelSourcePool
     * @method _removeItem
     * @param model {constructor} on of CLASS_MAP
     */
    _removeItem(model) {
        this._items = _without(this._items, model);
    }
}

export default new ModelSourcePool();
