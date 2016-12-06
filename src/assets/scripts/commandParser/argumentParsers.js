/**
 * Converts a flight level altitude to a number in thousands and converts second arg to a boolean
 *
 * @function altitudeArgumentParser
 * @param args {array}
 * @return {array<number, boolean>}
 */
export const altitudeArgumentParser = (args) => {
    const altitude = parseInt(args[0], 10) * 100;
    // the validator will have already caught an invalid value here. if one exists, it is assumed to be valid and
    // thus we return true. other wise its false
    const shouldExpedite = typeof args[1] !== 'undefined';

    return [altitude, shouldExpedite];
};
