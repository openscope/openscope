import _isArray from 'lodash/isArray';

/**
 *
 * @function choose
 */
export const choose = (l) => {
    return l[Math.floor(Math.random() * l.length)];
};

/**
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
