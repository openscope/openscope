import { choose } from '../utilities/generalUtilities';

const ALPHA = 'abcdefghijklmnopqrstuvwxyz';
const NUMERIC = '0123456789';

/**
 * This picks a random number. If it is the first value within the callsign (ie. i === 0), then it picks a
 * number between 1 and 9. Otherwise, it picks a number between 0 and 9.
*/
const getNumericValue = (i) => {
    let randomNumber = 1;

    switch (i) {
        case 0:
            randomNumber = choose(NUMERIC.substr(1));
            break;
        default:
            randomNumber = choose(NUMERIC);
    }

    return randomNumber;
};

/**
 * Self-explanatory; this function picks a random letter and returns it.
*/
const getAlphaValue = () => {
    return choose(ALPHA);
};

/**
 * Accepts a list of callsign formats, which are defined in the airline files. It randomly selects one of these
 * formats and generates a callsign based off this format.
 *
 * @function generateFlightNumber
 * @param callsignFormats {array}
 * @return {string}
 */
export const flightNumberBuilder = (callsignFormats) => {
    let flightNumber = '';
    const chosenFormat = choose(callsignFormats);

    for (let i = 0; i < chosenFormat.length; i++) {
        switch (chosenFormat[i]) {
            case '#':
                flightNumber += getNumericValue(i);
                break;
            case 'A':
                flightNumber += getAlphaValue();
                break;
            default:
                console.warn(`${this.icao} has an incorrect callsign format, it should only contain 'A' or '#'`);
        }
    }

    return flightNumber;
};
