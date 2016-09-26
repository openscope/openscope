import _isNumber from 'lodash/isNumber';

/**
  * @function ceil
  */
export const ceil = (n, factor = 1) => {
    return Math.ceil(n / factor) * factor;
};

/**
 * @function round
 */
export const round = (n, factor = 1) => {
    return Math.round(n / factor) * factor;
};

/**
 * @function abs
 */
export const abs = (n) => {
    return Math.abs(n);
};

/**
 * @function sin
 * @return {number}
 */
export const sin = (a) => {
    return Math.sin(a);
};

/**
 * @function cos
 * @return {number}
 */
export const cos = (a) => {
    return Math.cos(a);
};

/**
 * @function tan
 * @return {number}
 */
export const tan = (a) => {
    return Math.tan(a);
};

// TODO: rename to floor,
/**
 * @function fl
 * @return {number}
 */
export const fl = (n, number = 1) => {
    return Math.floor(n / number) * number;
};

// TODO: rename to randomInteger
/**
 * @function randint
 * @return {number}
 */
export const randint = (low, high) => {
    return Math.floor(Math.random() * (high - low + 1)) + low;
};

// TODO: rename to pluralize
/**
 * @function s
 * @return {number}
 */
export const s = (i) => {
    return (i === 1) ? '' : 's';
};

// TODO: rename to isWithin
/**
 * @function within
 * @return {number}
 */
export const within = (n, c, r) => {
    return n > (c + r) || n < (c - r);
};


// TODO: update references to use exports instead of functions attached to window
// window.randint = randint;
// window.s = s;
// window.within = within;

// TODO: add a divisor paramater that dfaults to `2`
/**
 * Given a number, find the middle value.
 *
 * @method calculateMiddle
 * @param  {number} value
 * @return {number}
 */
export const calculateMiddle = (value = 0) => {
    if (!_isNumber(value)) {
        throw new TypeError(`Invalid parameter, expected a number but found ${typeof value}`);
    }

    return round(value / 2);
};
