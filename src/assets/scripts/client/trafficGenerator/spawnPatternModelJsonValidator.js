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
    'period'
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
 *      "destination": "",
 *      "origin": "KLAS",
 *      "category": "departure",
 *      "route": "KLAS.BOACH6.HEC",
 *      "altitude": "",
 *      "method": "random",
 *      "rate": 5,
 *      "speed": ""
 *      "airlines": [
 *          ["aal", 10],
 *          ["ual", 10],
 *          ["ual/long", 3]
 *      ]
 *  }
 *
 *  // Arrivals
 *  {
 *      "destination": "KLAS",
 *      "origin": "",
 *      "category": "arrival",
 *      "route": "BETHL.GRNPA1.KLAS",
 *      "altitude": [30000, 40000],
 *      "method": "cyclic",
 *      "rate": 17.5,
 *      "period": 75,
 *      "offset": 25,
 *      "speed": 320
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
            console.log(`spawnPattern is missing a required key: ${key}`);

            isValid = false;
        }
    }

    const jsonKeys = _keys(json);
    const unsupportedKeys = _difference(jsonKeys, ALL_KEYS);

    if (unsupportedKeys.length > 0) {
        console.warn(`Unsupported key(s) found in spawnPattern: ${unsupportedKeys.join(', ')}`);

        isValid = false;
    }

    return isValid;
};
