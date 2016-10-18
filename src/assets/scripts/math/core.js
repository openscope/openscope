import _isNumber from 'lodash/isNumber';

/**
 * @function round
 * @return {number}
 */
export const round = (n, factor = 1) => {
    return Math.round(n / factor) * factor;
};

/**
 * @function abs
 * @return {number}
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
 * @param n
 * @param c
 * @param r
 * @return {number}
 */
export const within = (n, c, r) => {
    return n > (c + r) || n < (c - r);
};

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

/**
 *
 * @function mod
 * @param firstValue {number}
 * @param secondValue {number}
 * @return {number}
 */
export const mod = (firstValue, secondValue) => {
    return ((firstValue % secondValue) + secondValue) % secondValue;
};

// TODO: find better names/enumerate the params for these next two functions
/**
 * @function trange
 * @param il {number}
 * @param i {number}
 * @param ih {number}
 * @param ol {number}
 * @param oh {number}
 * @return {number}
 */
const trange = (il, i, ih, ol, oh) => {
    return ol + (oh - ol) * (i - il) / (ih - il);
    // i=(i/(ih-il))-il;       // purpose unknown
    // return (i*(oh-ol))+ol;  // purpose unknown
};

/**
 * Clamp a value to be within a certain range
 *
 * @function clamp
 * @param min {number}
 * @param valueToClamp {number}
 * @param max {number} (optional)
 * @return {number}
 */
export const clamp = (min, valueToClamp, max = Infinity) => {
    let temp;

    if (!_isNumber(valueToClamp)) {
        throw new TypeError('Invalid parameter. Expected `valueToClamp` to be a number');
    }

    if (max === Infinity) {
        if (min > valueToClamp) {
            return min;
        }

        return valueToClamp;
    }

    if (min > max) {
        temp = max;
        max = min;
        min = temp;
    }

    if (min > valueToClamp) {
        return min;
    }

    if (max < valueToClamp) {
        return max;
    }

    return valueToClamp;
};

/**
 * @function crange
 * @param il {number}
 * @param i {number}
 * @param ih {number}
 * @param ol {number}
 * @param oh {number}
 * @return {number}
 */
export const crange = (il, i, ih, ol, oh) => {
    return clamp(
        ol,
        trange(il, i, ih, ol, oh),
        oh
    );
};
