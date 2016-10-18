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
 * Takes a value's position relative to a given range, and extrapolates to another range.
 * Note: Return will be outside range2 if target_val is outside range1.
 *       If you wish to clamp it within range2, use extrapolate_range_clamp.
 * @function extrapolate_range
 * @param  {number} range1_min minimum value of range 1
 * @param  {number} target_val target value within range 1
 * @param  {number} range1_max maximum value of range 1
 * @param  {number} range2_min minimum value of range 2
 * @param  {number} range2_max maximum value of range 2
 * @return {number}            target value wihtin range 2
 */
const extrapolate_range = (range1_min, target_val, range1_max, range2_min, range2_max) => {
    return range2_min + (range2_max - range2_min) * (target_val - range1_min) / (range1_max - range1_min);
};

/**
 * Takes a value's position relative to a given range, and extrapolates to (and clamps within) another range.
 * Note: Return will be clamped within range2, even if target_val is outside range1.
 *       If you wish to allow extrapolation beyond the bounds of range2, us extrapolate_range.
 * @function extrapolate_range_clamp
 * @param  {number} range1_min minimum value of range1
 * @param  {number} target_val target value relative to range1
 * @param  {number} range1_max maximum value of range1
 * @param  {number} range2_min minimum value of range2
 * @param  {number} range2_max maximum value of range2
 * @return {number}            target value within range2
 */
export const extrapolate_range_clamp = (range1_min, target_val, range1_max, range2_min, range2_max) => {
    const extrapolation_result = extrapolate_range(range1_min, target_val, range1_max, range2_min, range2_max);

    return clamp(extrapolation_result, range2_min, range2_max);
};
