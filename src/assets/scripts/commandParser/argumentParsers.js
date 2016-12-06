import { convertToThousands } from '../utilities/unitConverters';

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
 * @function headingParser
 * @param args {array}
 * @return {array<string, number, boolean>}
 */
export const headingParser = (args) => {
    const length = args.length;

    let direction = args[0];
    let heading = args[1];
    let incremental = args[2];

    return [
        direction,
        heading,
        incremental
    ];
};
