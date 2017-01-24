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

    console.log('OHSHIT');

    return null;
};
