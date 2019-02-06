import _find from 'lodash/find';
import _has from 'lodash/has';
import _isNil from 'lodash/isNil';
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
 * - a way to instantiate a `MAX_POOL_SIZE_PER_MODEL` number of model objects
 * - a way to release a model for use within the app and remove it from the pool
 * - a way to return a model after use and add it back into the pool
 *
 * This allows for decreased garbage collection because the model instances being used are already created. The
 * app isn't always creating and destroying classes, instead it is creating, using and re-using the same models.
 *
 * see: (Object Pool)[https://sourcemaking.com/design_patterns/object_pool] on
 * (sourcemaking.com)[https://sourcemaking.com] for more information.
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
         * @type {number}
         * @default MAX_POOL_SIZE
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
     * @param modelToAdd {constructor} one of CLASS_MAP
     */
    returnReusable(modelToAdd) {
        if (!_has(CLASS_MAP, modelToAdd.constructor.name)) {
            throw new TypeError(`Unsupported constructor passed to ModelSourcePool: ${modelToAdd.constructor.name}`);
        }

        this._items.push(modelToAdd);
    }

    /**
     * Remove a reusable from the collection and return it for use by the caller
     *
     * @for ModelSourcePool
     * @method releaseReusable
     * @param constructorName {string}  constructor name
     * @param args {*[]}                parameters used for initializing a `modelSource` instance
     * @return model {constructor}      one of CLASS_MAP
     */
    releaseReusable(constructorName, ...args) {
        let model = this._findModelByConstructorName(constructorName);

        if (!model) {
            model = new CLASS_MAP[constructorName](...args);
        }
        // if (constructorName === 'SpawnPatternModel') {debugger;}
        model.init(...args);

        return model;
    }

    /**
     * On instantiation pre-warm the pool with reusables so they don't need to be created at run time.
     *
     * @for ModelSourcePool
     * @method _hydratePool
     * @private
     */
    _hydratePool() {
        // _forEach(CLASS_MAP, (ModelSource) => {
        //     for (let i = 0; i < MAX_POOL_SIZE_PER_MODEL; i++) {
        //         const model = new ModelSource();
        //
        //         this._items.push(model);
        //     }
        // });
    }

    /**
     * @for ModelSourcePool
     * @method _findModelByConstructorName
     * @param constructorName {string}  the name of a constructor
     * @return model {constructor}      one of CLASS_MAP
     * @private
     */
    _findModelByConstructorName(constructorName) {
        const model = _find(this._items, (model) => model.constructor.name === constructorName);

        if (_isNil(model)) {
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
     * @param model {constructor} one of CLASS_MAP
     * @private
     */
    _removeItem(model) {
        this._items = _without(this._items, model);
    }
}

export default new ModelSourcePool();
