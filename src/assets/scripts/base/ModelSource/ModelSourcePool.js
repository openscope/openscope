import _find from 'lodash/find';
import _forEach from 'lodash/forEach';
import _has from 'lodash/has';
import _without from 'lodash/without';
import BaseCollection from '../BaseCollection';
import {
    CLASS_MAP,
    CLASS_MAP_LENGTH
} from './modelSourceClassMap';

const MAX_POOL_SIZE_PER_MODEL = 300;

const MAX_POOL_SIZE = MAX_POOL_SIZE_PER_MODEL * CLASS_MAP_LENGTH;

/**
 *
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

        this._maxPoolSizePerModel = MAX_POOL_SIZE;

        return this._hydratePool();
    }

    /**
     *
     *
     * @for ModelSourcePool
     * @method addModelToPool
     * @param modelToAdd
     */
    addModelToPool(modelToAdd) {
        if (!_has(CLASS_MAP, modelToAdd.constructor.name)) {
            throw new TypeError(`Unsupported type passed to ModelSourcePool: ${modelToAdd.constructor.name}`);
        }

        this._items.push(modelToAdd);
    }

    /**
     *
     *
     * @for ModelSourcePool
     * @method releasModelFromPool
     * @param type {string}
     * @return model
     */
    releaseModelFromPool(type) {
        let model = this._findModelOfType(type);

        if (!model) {
            model = new CLASS_MAP[type]();
        }

        return model;
    }

    /**
     *
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
     *
     *
     * @for ModelSourcePool
     * @method _findModelOfType
     * @param type {string}
     * @return model
     */
    _findModelOfType(type) {
        const model = _find(this._items, (model) => model.constructor.name === type);

        if (!model) {
            return null;
        }

        this._removeItem(model);

        return model;
    }

    /**
     *
     *
     * @for ModelSourcePool
     * @method _removeItem
     * @param model
     */
    _removeItem(model) {
        this._items = _without(this._items, model);
    }
}

export default new ModelSourcePool();
