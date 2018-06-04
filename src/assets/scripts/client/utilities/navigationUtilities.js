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
