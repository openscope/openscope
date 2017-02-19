import _uniqueId from 'lodash/uniqueId';

/**
 * Base class for all Model objects to inherit from.
 *
 * This class is meant to be extended and should never be used directly.
 *
 * @class BaseModel
 */
export default class BaseModel {
    constructor(modelName = 'BaseModel') {
        /**
         * Unigue string id that can be used to differentiate this model instance from another.
         *
         * @property _id
         * @type {string}
         * @private
         */
        this._id = this.veriftyModelName(modelName) + _uniqueId();
        console.log(this._id);
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
     * When implemented by the inheriting class, this method should un-set all class properties
     * and remove any handlers.
     *
     * @for BaseModel
     * @method reset
     */
    reset() {
        throw new TypeError('BaseModel#reset method must be implemented by the class extending BaseModel');
    }

    /**
     * This will verify if the given argument is a string and will return a modified pre-value for the _id
     *
     * @for BaseModel
     * @method veriftyModelName
     * @param {string / Object}
     */
    veriftyModelName(modelName) {
        if (typeof modelName === 'string') {
            return `${modelName}-`;
        }

        if (modelName.name === undefined) {
            modelName.name = '';
        }

        return `BaseModel-${modelName.name}-`;
    }

}
