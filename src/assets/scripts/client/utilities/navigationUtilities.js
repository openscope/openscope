import { REGEX } from '../constants/globalConstants';
import { PROCEDURE_OR_AIRWAY_SEGMENT_DIVIDER } from '../constants/routeConstants';

/**
 * Combine entry, procedure/airway name, and exit to form a correctly formatted procedural route string
 *
 * @function assembleProceduralRouteString
 * @param entryFix {string} ICAO identifier of fix where we enter the airway/procedure
 * @param procedureOrAirway {string} ICAO identifier of the airway/procedure
 * @param exitFix {string} ICAO identifier of fix where we exit the airway/procedure
 * @return {string} correctly formatted procedural route string
 */
export function assembleProceduralRouteString(entryFix, procedureOrAirway, exitFix) {
    return `${entryFix}${PROCEDURE_OR_AIRWAY_SEGMENT_DIVIDER}${procedureOrAirway}` +
        `${PROCEDURE_OR_AIRWAY_SEGMENT_DIVIDER}${exitFix}`;
}

/**
 * Parses the restriction string using the specfied regular expression
 *
 * @param restrictionText {string}
 * @param regex {RegExp}
 * @param multiplier {number}
 * @returns {array}
 */
function _parseRestriction(restrictionText, regex, multiplier = 1) {
    if (restrictionText == null) {
        return [];
    }

    const match = restrictionText.match(regex);

    if (match === null) {
        return [];
    }

    const [, value, limit] = match;

    return [parseInt(value, 10) * multiplier, limit];
}

/**
 * Parses an altitude restriction string in the form A80+ or A140- or A160
 * into a array containing the altitude and the optional limit symbol
 * eg. A80+  => [8000, '+']
 *     A140- => [14000, '-']
 *     A160  => [16000, '']
 *
 * @param restrictionText {string}
 * @returns {array} or an empty array if not valid
 */
export const parseAltitudeRestriction = (restrictionText) => {
    return _parseRestriction(restrictionText, REGEX.ALTITUDE_RESTRICTION, 100);
};

/**
 * Parses a speed restriction string in the form S250+ or S220-
 * into a array containing the speed and the optional limit symbol
 * eg. S250+ => [250, '+']
 *     S220- => [220, '-']
 *     S230  => [230, '']
 *
 * @param restrictionText {string}
 * @returns {array} or an empty array if not valid
 */
export const parseSpeedRestriction = (restrictionText) => {
    return _parseRestriction(restrictionText, REGEX.SPEED_RESTRICTION);
};
