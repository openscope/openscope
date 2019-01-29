// istanbul ignore
import _difference from 'lodash/difference';
import _has from 'lodash/has';
import _keys from 'lodash/keys';

const ACCEPTED_KEYS = [
    'destination',
    'origin',
    'category',
    'route',
    'altitude',
    'method',
    'rate',
    'speed',
    'airlines'
];

const ACCEPTED_OPTIONAL_KEYS = [
    'offset',
    'period',
    'variation'
];

const ALL_KEYS = [
    ...ACCEPTED_KEYS,
    ...ACCEPTED_OPTIONAL_KEYS
];

/**
 * Validates the presence of correct `SpawnPatternModel` keys.
 *
 * Expects a shape of one the following:
 *
 * ```javascript
 * // Departures
 * {
 *      "origin": "KLAS",
 *      "destination": "",
 *      "category": "departure",
 *      "route": "KLAS.BOACH6.HEC",
 *      "altitude": "",
 *      "speed": ""
 *      "method": "random",
 *      "rate": 5,
 *      "airlines": [
 *          ["aal", 10],
 *          ["ual", 10],
 *          ["ual/long", 3]
 *      ]
 *  }
 *
 *  // Arrivals
 *  {
 *      "origin": "",
 *      "destination": "KLAS",
 *      "category": "arrival",
 *      "route": "BETHL.GRNPA1.KLAS",
 *      "altitude": [30000, 40000],
 *      "speed": 320,
 *      "method": "cyclic",
 *      "rate": 17.5,
 *      "period": 75,
 *      "offset": 25,
 *      "airlines": [
 *          ["aal", 10],
 *          ["ual", 10],
 *          ["ual/long", 3]
 *      ]
 *  }
 *  ```
 *
 * @function spawnPatternModelJsonValidator
 * @param json {object}
 * @return isValid {boolean}
 */
// istanbul ignore next
export const spawnPatternModelJsonValidator = (json) => {
    let isValid = true;

    for (let i = 0; i < ACCEPTED_KEYS.length; i++) {
        const key = ACCEPTED_KEYS[i];

        if ((key === 'altitude' || key === 'speed') && json.category === 'departure') {
            continue;
        }

        if (key === 'origin' && json.category === 'arrival') {
            continue;
        }

        if (!_has(json, key) && !_has(ACCEPTED_OPTIONAL_KEYS, key)) {
            console.warn(`spawnPattern is missing a required key: ${key}`);

            isValid = false;
        }
    }

    const jsonKeys = _keys(json);
    const unsupportedKeys = _difference(jsonKeys, ALL_KEYS);

    if (unsupportedKeys.length > 0) {
        console.warn(`Unsupported key(s) found in spawnPattern: ${unsupportedKeys.join(', ')}`);
    }

    return isValid;
};
