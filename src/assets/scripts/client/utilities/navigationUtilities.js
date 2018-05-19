import { PROCEDURE_OR_AIRWAY_SEGMENT_DIVIDER } from '../constants/routeConstants';

export function assembleProceduralRouteString(entryFix, procedureOrAirway, exitFix) {
    return `${entryFix}${PROCEDURE_OR_AIRWAY_SEGMENT_DIVIDER}${procedureOrAirway}` +
        `${PROCEDURE_OR_AIRWAY_SEGMENT_DIVIDER}${exitFix}`;
}
