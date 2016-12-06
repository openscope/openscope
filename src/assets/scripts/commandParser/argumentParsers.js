import {
    convertToThousands,
    convertStringToNumber
} from '../utilities/unitConverters';

/**
 * Converts a flight level altitude to a number in thousands and converts second arg to a boolean
 *
 * @function altitudeParser
 * @param args {array}
 * @return {array<number, boolean>}
 */
export const altitudeParser = (args) => {
    const altitude = convertToThousands(args[0]);
    // the validator will have already caught an invalid value here. if one exists, it is assumed to be valid and
    // thus we return true. other wise its false
    const shouldExpedite = typeof args[1] !== 'undefined';

    return [altitude, shouldExpedite];
};

/**
 * Converts a flight level altitude to a number in thousands and converts second arg to a boolean
 *
 * Returns a consistent array with the same shape no matter the number of arguments received
 *
 * @function headingParser
 * @param args {array}
 * @return {array<string, number, boolean>}
 */
export const headingParser = (args) => {
    const length = args.length;
    let direction;
    let heading;
    let incremental;

    switch (length) {
        case 1:
            direction = '';
            heading = convertStringToNumber(args[0]);
            incremental = false;

            return [direction, heading, incremental];
        case 2:
            direction = args[0];
            if (args[0] === 'l') {
                direction = 'left';
            } else if (args[0] === 'r') {
                direction = 'right';
            }

            heading = convertStringToNumber(args[1]);
            incremental = false;

            return [direction, heading, incremental];
        case 3:
            direction = args[0];
            heading = convertStringToNumber(args[1]);
            incremental = args[2];

            return [direction, heading, incremental];
        default:
            throw new Error('An error ocurred parsing the Heading arguments');
    }
};
