import { choose } from '../utilities/generalUtilities';

const ALPHA = 'abcdefghijklmnopqrstuvwxyz';
const NUMERIC = '0123456789';

/**
 * This picks a random number. If it is the first value within the callsign (ie. i === 0), then it picks a
 * number between 1 and 9. Otherwise, it picks a number between 0 and 9.
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
 * @function _generateRandomLetter
 * @return ALPHA {string}
*/
function _generateRandomLetter() {
    return choose(ALPHA);
}

/**
 * Accepts a list of callsign formats, which are defined in the airline files. It randomly selects one of these
 * formats and generates a callsign based off this format.
 *
 * @function buildFlightNumber
 * @param callsignFormats {array}
 * @return {string}
*/
export function buildFlightNumber(callsignFormats) {
    let flightNumber = '';
    const chosenFormat = choose(callsignFormats);

    for (let i = 0; i < chosenFormat.length; i++) {
        switch (chosenFormat[i]) {
            case '#':
                flightNumber += _generateRandomDigit(i);
                break;
            case '@':
                flightNumber += _generateRandomLetter();
                break;
            default:
                flightNumber += chosenFormat[i];
        }
    }

    return flightNumber;
}
