import _isArray from 'lodash/isArray';

/**
 * Helper method to translate a unicode character into a readable string value
 *
 * @method unicodeToString
 * @param char {characterCode}
 * @return {string}
 */
export const unicodeToString = (char) => `\\u${char.charCodeAt(0).toString(16).toUpperCase()}`;

/**
 *
 *
 * @function choose
 * @param list
 * @return
 */
export const choose = (list) => {
    const randomIndexFromLength = Math.floor(Math.random() * list.length);

    return list[randomIndexFromLength];
};

/**
 *
 *
 * @function choose_weight
 */
export const choose_weight = (l) => {
    if (l.length === 0) {
        return;
    }

    if (!_isArray(l[0])) {
        return choose(l);
    }

    // l = [[item, weight], [item, weight] ... ];
    let weight = 0;
    for (let i = 0; i < l.length; i++) {
        weight += l[i][1];
    }

    const randomWeight = Math.random() * weight;
    weight = 0;

    for (let i = 0; i < l.length; i++) {
        weight += l[i][1];

        if (weight > randomWeight) {
            return l[i][0];
        }
    }


    return null;
};

/**
 * Prepends zeros to front of str/num to make it the desired length
 *
 * @function leftPad
 * @param value {number|string}  original value
 * @param length {number}        total character length of return string
 * @return {string}              a string of the desired length prepended with zeros when `value` is < `length`
 */
export const leftPad = (value, length) => {
    if (value.toString().length >= length) {
        return value.toString();
    }

    const x = `0000000000000${value}`;

    return x.substr(x.length - length, length);
};
