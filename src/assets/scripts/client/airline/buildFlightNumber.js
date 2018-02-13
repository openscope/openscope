import { choose } from '../utilities/generalUtilities';
import {
    DEFAULT_CALLSIGN_FORMAT,
    CALLSIGN_RANDOM_DIGIT_CHARACTER,
    CALLSIGN_RANDOM_LETTER_CHARACTER
} from '../constants/airlineConstants';

const ALPHA = 'abcdefghijklmnopqrstuvwxyz';
const NUMERIC = '0123456789';
const defaultCallsignFormats = [DEFAULT_CALLSIGN_FORMAT];

/**
 * This picks a random number. If it is the first value within the callsign (ie. i === 0), then it picks a
 * number between 1 and 9. Otherwise, it picks a number between 0 and 9.
 *
 * @function _generateRandomDigit
 * @param i {number}
 * @return NUMERIC {string}
*/
function _generateRandomDigit(i) {
    if (i === 0) {
        return choose(NUMERIC.substr(1));
    }

    return choose(NUMERIC);
}

/**
 * This function picks a random letter and returns it.
 *
 * @function _generateRandomLetter
 * @return ALPHA {string}
*/
function _generateRandomLetter() {
    return choose(ALPHA);
}

/**
 * This function takes a list of callsignFormats, validates them (ie. ensures that no callsignFormat has a leading 0)
 * then returns a list of validated callsignFormats or the default callsignFormat if there are no valid callsignFormats
 *
 * @function _validateCallsignFormats
 * @param callsignFormat {array<string>}
 * @return validatedFormats {array<string>}
*/
function _validateCallsignFormats(callsignFormats) {
    const validatedFormats = [];

    for (let i = 0; i < callsignFormats.length; i++) {
        if (callsignFormats[i].charAt(0) === '0') {
            console.warn(`Format ${callsignFormats[i]} is invalid as it has a leading zero!`);
            continue;
        }

        validatedFormats.push(callsignFormats[i]);
    }

    if (validatedFormats.length === 0) {
        return defaultCallsignFormats;
    }

    return validatedFormats;
}

/**
 * Accepts a list of callsign formats, which are defined in the airline files. It randomly selects one of these
 * formats and generates a callsign based off this format.
 *
 * @function buildFlightNumber
 * @param callsignFormats {array<string>}
 * @return {string}
*/
export function buildFlightNumber(callsignFormats) {
    let flightNumber = '';

    const validatedFormats = _validateCallsignFormats(callsignFormats);
    const chosenFormat = choose(validatedFormats);

    for (let i = 0; i < chosenFormat.length; i++) {
        switch (chosenFormat[i]) {
            case CALLSIGN_RANDOM_DIGIT_CHARACTER:
                flightNumber += _generateRandomDigit(i);
                break;
            case CALLSIGN_RANDOM_LETTER_CHARACTER:
                flightNumber += _generateRandomLetter();
                break;
            default:
                flightNumber += chosenFormat[i];
        }
    }

    return flightNumber;
}
