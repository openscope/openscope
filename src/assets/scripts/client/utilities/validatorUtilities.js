import _isArray from 'lodash/isArray';
import _isEmpty from 'lodash/isEmpty';
import _isObject from 'lodash/isObject';

/**
 * This will return true if it is not an object or it is empty
 *
 * @funtion isNotObjectOrIsEmpty
 * @param value {*}
 * @return {boolean}
 */
export const isEmptyObject = (value) => {
    return _isObject(value) && _isEmpty(value);
};

/**
 * This will return true if it is not an array or it is empty
 *
 * @funtion isNotObjectOrIsEmpty
 * @param value {*}
 * @return {boolean}
 */
export const isEmptyOrNotArray = (value) => {
    return !_isArray(value) || _isEmpty(value);
};
