import _isArray from 'lodash/isArray';
import _toLower from 'lodash/toLower';
import { AIRLINE_NAME_FLEET_SEPARATOR } from '../constants/airlineConstants';
import { choose_weight } from '../utilities/generalUtilities';

// TODO: this file needs to be renamed to something more generalized.

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
 * Accepts a selected airline name, which may or may not contain the `AIRLINE_NAME_FLEET_SEPARATOR`, and
 * returns the `airlineNameAndFleet` object with updated property values.
 *
 * @function _extractNameAndFleetFromCurrentAirline
 * @param selectedAirline {string}
 * @param airlineNameAndFleet {object}
 * @return airlineNameAndFleet {object}
 */
function _extractNameAndFleetFromCurrentAirline(selectedAirline, airlineNameAndFleet) {
    airlineNameAndFleet.name = _toLower(selectedAirline);

    if (selectedAirline.indexOf(AIRLINE_NAME_FLEET_SEPARATOR) > -1) {
        const nameAndFleet = selectedAirline.split(AIRLINE_NAME_FLEET_SEPARATOR);

        airlineNameAndFleet.name = _toLower(nameAndFleet[FIRST_INDEX]);
        airlineNameAndFleet.fleet = nameAndFleet[SECOND_INDEX];
    }

    return airlineNameAndFleet;
}

// TODO: this method should be able to handle a string value as a parameter
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
 * @function airlineNameAndFleetHelper
 * @param airline {array<string>}
 * @return airlineNameAndFleet {object}
 */
export function airlineNameAndFleetHelper(airline) {
    if (!_isArray(airline)) {
        throw new TypeError(`Invalid parameter. Expected airline to be an array ' +
            'but instead received ${typeof airline}`);
    }

    // this could be a model object, but the values used here are temporary so we just use a constant
    // and update its key values as needed.
    const airlineNameAndFleet = {
        name: '',
        fleet: 'default'
    };

    if (airline.length === 0) {
        return airlineNameAndFleet;
    }

    // we're being sneaky here. the `airlineNameAndFleet` object is created within this function. It then
    // gets sent off to the next function to be modified.
    return _extractNameAndFleetFromCurrentAirline(airline[FIRST_INDEX], airlineNameAndFleet);
}


// @deprecated
/**
 * Accepts a list of airlines, as defined in an airport json file from the `departures` and `arrivals` sections,
 * and returns a consistent object containing an airline name and fleet classification.
 *
 * @function randomAirlineSelectionHelper
 * @param airlineList {array}
 * @return {object}
 */
export function randomAirlineSelectionHelper(airlineList) {
    // TODO: a large portion of this function is duplicated above, refactor
    if (!_isArray(airlineList)) {
        throw new TypeError(`Invalid parameter. Expected airlineList to be an array ' +
            'but instead received ${typeof airlineList}`);
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
}
