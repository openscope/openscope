import { PROCEDURE_OR_AIRWAY_SEGMENT_DIVIDER } from '../constants/routeConstants';
import DynamicPositionModel from '../base/DynamicPositionModel';
import StaticPositionModel from '../base/StaticPositionModel';
import { tau } from '../math/circle';

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
 * Provide a set of points located on a circle with given center and radius
 *
 * @function prepareCircularRestrictedArea
 * @param center {array<number>}
 * @param radius {number}   circle radius, in nm
 * @param airportPositionAndDeclination {array}
 * @return {array}
 */
export function getCircularCoordinates(center, radius, airportPositionAndDeclination) {
    const NUM_POINTS = 32;
    const delta = tau() / NUM_POINTS;
    const coords = [];
    const centerPos = new StaticPositionModel(center, ...airportPositionAndDeclination);

    for (let i = 0; i < NUM_POINTS; i++) {
        const bearing = delta * i;
        const rawPoint = centerPos.generateCoordinatesFromBearingAndDistance(bearing, radius);

        coords.push(DynamicPositionModel.calculateRelativePosition(rawPoint, ...airportPositionAndDeclination));
    }

    return coords;
}
