// istanbul ignore
import _has from 'lodash/has';

/**
 * Validates the presence of `SpawnPatternModel` keys
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
 *      "method": "random",
 *      "rate": 10,
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
 * @return {boolean}
 */
// istanbul ignore next
export const spawnPatternModelJsonValidator = (json) => {
    let isValid = true;

    if (!_has(json, 'destination')) {
        console.warn('spawnPatternModel is missing a required key: destination');
        isValid = false;
    }

    if (!_has(json, 'origin')) {
        console.warn('spawnPatternModel is missing a required key: origin');
        isValid = false;
    }

    if (!_has(json, 'category')) {
        console.warn('spawnPatternModel is missing a required key: category');
        isValid = false;
    }

    if (!_has(json, 'route')) {
        console.warn('spawnPatternModel is missing a required key: route');
        isValid = false;
    }

    if (!_has(json, 'altitude') && json.category !== 'departure') {
        console.warn('spawnPatternModel is missing a required key: altitude');
        isValid = false;
    }

    if (!_has(json, 'method')) {
        console.warn('spawnPatternModel is missing a required key: method');
        isValid = false;
    }

    if (!_has(json, 'rate')) {
        console.warn('spawnPatternModel is missing a required key: rate');
        isValid = false;
    }

    if (!_has(json, 'speed') && json.category !== 'departure') {
        console.warn('spawnPatternModel is missing a required key: speed');
        isValid = false;
    }

    if (!_has(json, 'airlines')) {
        console.warn('spawnPatternModel is missing a required key: airlines');
        isValid = false;
    }

    return isValid;
};
