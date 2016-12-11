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
    // thus we return true. otherwise its false
    const shouldExpedite = typeof args[1] !== 'undefined';

    return [altitude, shouldExpedite];
};

/**
 * Accepts a direction string:
 * - `left / l / right / r`
 *
 * and returns `left / right`
 *
 * @function directionNormalizer
 * @param direction {string}
 * @return normalizedDirection {string}
 */
const directionNormalizer = (direction) => {
    let normalizedDirection = direction;

    if (direction === 'l') {
        normalizedDirection = 'left';
    } else if (direction === 'r') {
        normalizedDirection = 'right';
    }

    return normalizedDirection;
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
    let direction;
    let heading;
    let isIncremental = false;

    switch (args.length) {
        case 1:
            // existing api is expeting undefined values to be exactly null
            direction = null;
            heading = convertStringToNumber(args[0]);

            return [direction, heading, isIncremental];
        case 2:
            isIncremental = args[1].length === 2;
            direction = directionNormalizer(args[0]);
            heading = convertStringToNumber(args[1]);

            return [direction, heading, isIncremental];
        default:
            throw new Error('An error ocurred parsing the Heading arguments');
    }
};

/**
 *
 * @function holdParser
 * @param args {array}
 * @return {array<>}
 */
export const holdParser = (args) => {
    // existing api is expeting undefined values to be exactly null
    let turnDirection = null;
    let legLength = null;
    let fixName;

    switch (args.length) {
        case 1:
            fixName = args[0];

            return [turnDirection, legLength, fixName];
        case 3:
            fixName = args[0];
            turnDirection = args[1];
            legLength = args[2];

            return [turnDirection, legLength, fixName];
        default:
            throw new Error('An error ocurred parsing the Hold arguments');
    }
};
