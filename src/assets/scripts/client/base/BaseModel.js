import _uniqueId from 'lodash/uniqueId';
import _isString from 'lodash/isString';

/**
 * Base class for all Model objects to inherit from.
 *
 * This class is meant to be extended and should never be used directly.
 *
 * @class BaseModel
 */
export default class BaseModel {
    constructor(modelName = 'BaseModel') {
        const optionalIdPrefix = this._buildIdPrefix(modelName);

        /**
         * Unigue string id that can be used to differentiate this model instance from another.
         *
         * @property _id
         * @type {string}
         * @private
         */
        this._id = _uniqueId(optionalIdPrefix);
    }

    /**
     * Initialize the model properties. Should be run on instantiation and, though not desired,
     * could be run multiple times after instantiation.
     *
     * This method may be called by the constructor or from a public fascade.
     *
     * @for BaseModel
     * @method _init
     * @private
     */
    _init() {
        throw new TypeError('BaseModel#_init method must be implemented by the class extending BaseModel');
    }

    /**
     * Destory the current instance.
     *
     * When implemented by the inheriting class, this method should un-set all instance properties
     * and remove any handlers.
     *
     * @for BaseModel
     * @method reset
     */
    reset() {
        throw new TypeError('BaseModel#reset method must be implemented by the class extending BaseModel');
    }

    /**
     * This will verify if the given argument is a string otherwise it will return 'Base Model'
     *
     * @for BaseModel
     * @method veriftyModelName
     * @param {string}
     * @private
     */
    _buildIdPrefix(modelName) {
        if (!_isString(modelName)) {
            throw new TypeError('BaseModel#constructor expects a string for its first parameter but a string was not given');
        }

        // Default option since it is an optional parameter
        return `${modelName}-`;
    }
}
