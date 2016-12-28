import _isArray from 'lodash/isArray';
import { choose_weight } from '../utilities/generalUtilities';

// TODO: this file needs to be renamed to something more generalized.

/**
 * Symobl that possibly seperates and airline name from its fleet classification
 *
 * @property NAME_FLEET_SEPERATOR
 * @type {string}
 * @final
 */
const NAME_FLEET_SEPERATOR = '/';

/**
 * @property INVALID_INDEX
 * @type {number}
 * @final
 */
const INVALID_INDEX = -1;

/**
 * Enemeration of an index value of `0`
 *
 * @property FIRST_INDEX
 * @type {number}
 * @final
 */
const FIRST_INDEX = 0;

/**
 * Enemeration of an index value of `1`
 *
 * @property SECOND_INDEX
 * @type {number}
 * @final
 */
const SECOND_INDEX = 1;


/**
 * Accepts a selected airline name, which may or may not contain the `NAME_FLEET_SEPERATOR`, and
 * returns the `airlineNameAndFleet` object with updated property values.
 *
 * @function _extractNameAndFleetFromCurrentAirline
 * @param selectedAirline {string}
 * @param airlineNameAndFleet {object}
 * @return airlineNameAndFleet {object}
 */
const _extractNameAndFleetFromCurrentAirline = (selectedAirline, airlineNameAndFleet) => {
    airlineNameAndFleet.name = selectedAirline;

    if (selectedAirline.indexOf(NAME_FLEET_SEPERATOR) > INVALID_INDEX) {
        const nameAndFleet = selectedAirline.split(NAME_FLEET_SEPERATOR);

        airlineNameAndFleet.name = nameAndFleet[FIRST_INDEX];
        airlineNameAndFleet.fleet = nameAndFleet[SECOND_INDEX];
    }

    return airlineNameAndFleet;
};

/**
 * Accepts an airline, as defined in an airport json file from the `departures` and `arrivals` sections,
 * and returns a consistent object containing an airline name and fleet classification.
 *
 * example input:
 * ```
 * - 'aal'
 * - 'ual/long'
 * - 'aal/90long'
 * ```
 *
 * @method airlineNameAndFleetHelper
 * @param airline {array<string>}
 * @return airlineNameAndFleet {object}
 */
export const airlineNameAndFleetHelper = (airline) => {
    if (!_isArray(airline)) {
        throw new TypeError(`Invalid parameter. Expected airline to be an array but instead received ${typeof airline}`);
    }

    // this could be a model object, but the values used here are temporary so we just use a constant
    // and update its key values as needed.
    const airlineNameAndFleet = {
        name: '',
        fleet: ''
    };

    if (airline.length === 0) {
        return airlineNameAndFleet;
    }

    return _extractNameAndFleetFromCurrentAirline(airline[FIRST_INDEX], airlineNameAndFleet);
};

/**
 * Accepts a list of airlines, as defined in an airport json file from the `departures` and `arrivals` sections,
 * and returns a consistent object containing an airline name and fleet classification.
 *
 * @function randomAirlineSelectionHelper
 * @param airlineList {array}
 * @return {object}
 */
export const randomAirlineSelectionHelper = (airlineList) => {
    // TODO: a large portion of this function is duplicated above, refactor
    if (!_isArray(airlineList)) {
        throw new TypeError(`Invalid parameter. Expected airlineList to be an array but instead received ${typeof airlineList}`);
    }

    // this could be a model object, but the values used here are temporary so we just use a constant
    // and update its key values as needed.
    const airlineNameAndFleet = {
        name: '',
        fleet: ''
    };

    if (airlineList.length === 0) {
        return airlineNameAndFleet;
    }

    const selectedAirline = choose_weight(airlineList);

    return _extractNameAndFleetFromCurrentAirline(selectedAirline, airlineNameAndFleet);
};
