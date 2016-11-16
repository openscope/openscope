import _uniqueId from 'lodash/uniqueId';

/**
 * @class BaseModel
 */
export default class BaseModel {
    constructor() {
        /**
         * Unigue string id that can be used to differentiate this model instance from another.
         *
         * @property _id
         * @type {string}
         * @private
         */
        this._id = _uniqueId();
    }

    _init() {
        throw new TypeError('._init() method must be implemented by the class extending BaseModel');
    }

    destroy() {
        throw new TypeError('.destroy() method must be implemented by the class extending BaseModel');
    }
}
