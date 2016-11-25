import _has from 'lodash/has';
import modelSourcePool from './ModelSourcePool';
import { CLASS_MAP } from './modelSourceClassMap';

/**
 * Provides a pulic gateway to the `modelSourcePool`.
 *
 * This class has only one concern, brokering changes to the `modelSourcePool`.
 *
 * @class ModelSourceFactory
 */
class ModelSourceFactory {
    /**
     * Given a model type, retrieve a model from the `modelSourcePool`.
     *
     * @for ModelSourceFactory
     * @method getModelSourceForType
     * @param type {string}                 constructor name. must be incldued in `CLASS_MAP` dictonary
     * @param args {*[]}                    parameters used for initializing a `modelSource` instance
     * @return modelSource {constructor}    one of CLASS_MAP
     */
    getModelSourceForType(type, ...args) {
        if (!_has(CLASS_MAP, type)) {
            throw new TypeError(`Unsupported type passed to ModelSourceFactory: ${type}`);
        }

        const modelSource = modelSourcePool.releaseReusable(type, ...args);

        return modelSource;
    }

    /**
     * Return a model back to the `modelSourcePool`.
     *
     * @for ModelSourceFactory
     * @method returnModelToPool
     * @param model {constructor}  one of CLASS_MAP
     */
    returnModelToPool(model) {
        if (!_has(CLASS_MAP, model.constructor.name)) {
            throw new TypeError(`Unsupported type passed to ModelSourceFactory: ${model.constructor.name}`);
        }

        modelSourcePool.returnReusable(model);
    }
}

export default new ModelSourceFactory();
