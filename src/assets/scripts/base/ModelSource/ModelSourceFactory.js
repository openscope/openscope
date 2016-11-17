import _has from 'lodash/has';
import modelSourcePool from './ModelSourcePool';
import { CLASS_MAP } from './modelSourceClassMap';

/**
 *
 *
 * @class ModelSourceFactory
 */
class ModelSourceFactory {
    /**
     *
     *
     * @for ModelSourceFactory
     * @method getModelSourceForType
     * @param type {string}
     * @return modelSource
     */
    getModelSourceForType(type) {
        if (!_has(CLASS_MAP, type)) {
            throw new TypeError(`Unsupported type passed to ModelSourceFactory: ${type}`);
        }

        const modelSource = modelSourcePool.releaseModelFromPool(type);

        return modelSource;
    }

    /**
     *
     *
     * @for ModelSourceFactory
     * @method returnModelToPool
     * @param model
     */
    returnModelToPool(model) {
        if (!_has(CLASS_MAP, model.constructor.name)) {
            throw new TypeError(`Unsupported type passed to ModelSourceFactory: ${model.constructor.name}`);
        }

        modelSourcePool.addModelToPool(model);
    }
}

export default new ModelSourceFactory();
