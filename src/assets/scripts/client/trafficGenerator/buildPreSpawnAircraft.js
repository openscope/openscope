import _isEmpty from 'lodash/isEmpty';
import _isNil from 'lodash/isNil';
import _isObject from 'lodash/isObject';
import RouteModel from '../navigationLibrary/Route/RouteModel';
import { routeStringFormatHelper } from '../navigationLibrary/Route/routeStringFormatHelper';
import {
    fixRadialDist,
    isWithinAirspace,
    calculateDistanceToBoundary,
    bearingToPoint
} from '../math/flightMath';
import { nm } from '../utilities/unitConverters';

/**
 * Loop through `waypointModelList` and determine where along the route an
 * aircraft should spawn
 *
 * @function _calculateSpawnPositions
 * @param waypointModelList {array<StandardWaypointModel>}
 * @param spawnOffsets {array}
 * @return spawnPositions {array}
 */
const _calculateSpawnPositions = (waypointModelList, spawnOffsets) => {
    const spawnPositions = [];

    // for each new aircraft
    for (let i = 0; i < spawnOffsets.length; i++) {
        // TODO: Are these spawn offsets in nm or km? If not nm, the position generated below
        // will be wrong because it expects nautical miles.
        let spawnOffset = spawnOffsets[i];

        // for each fix ahead
        for (let j = 1; j < waypointModelList.length; j++) {
            const nextWaypoint = waypointModelList[j];

            if (nextWaypoint.distanceFromPreviousWaypoint > spawnOffset) {   // if point before next fix
                const previousFixPosition = waypointModelList[j - 1].positionModel;
                const heading = previousFixPosition.bearingToPosition(nextWaypoint.positionModel);
                const positionModel = previousFixPosition.generateDynamicPositionFromBearingAndDistance(heading, spawnOffset);

                // TODO: this looks like it should be a model object
                const preSpawnHeadingAndPosition = {
                    heading,
                    positionModel,
                    nextFix: nextWaypoint.name
                };

                spawnPositions.push(preSpawnHeadingAndPosition);

                break;
            }

            // if point beyond next fix subtract distance from spawnOffset and continue
            spawnOffset -= nextWaypoint.distanceFromPreviousWaypoint;
        }
    }

    return spawnPositions;
};

/**
 * Calculate distance(s) from center where an aircraft should exist onload or airport change
 *
 * @function _assembleSpawnOffsets
 * @param entrailDistance {number}
 * @param totalDistance {number}
 * @return spawnOffsets {array<number>}
 */
const _assembleSpawnOffsets = (entrailDistance, totalDistance = 0) => {
    const spawnOffsets = [];

    // distance between successive arrivals in nm
    for (let i = entrailDistance; i < totalDistance; i += entrailDistance) {
        spawnOffsets.push(i);
    }

    return spawnOffsets;
};

/**
 *
 *
 * @function _calculateDistancesAlongRoute
 * @param waypointModelList {array<StandardRouteWaypointModel>}
 * @param airport {AirportModel}
 * @return {object}
 */
const _calculateDistancesAlongRoute = (waypointModelList, airport) => {
    // find last fix along STAR that is outside of airspace, ie: next fix is within airspace
    // distance between closest fix outside airspace and airspace border in nm
    let distanceFromClosestFixToAirspaceBoundary = 0;
    let totalDistance = 0;

    for (let i = 0; i < waypointModelList.length; i++) {
        const waypoint = waypointModelList[i];
        const waypointPosition = waypoint.relativePosition;
        let previousWaypoint = waypoint;
        let previousPosition = waypoint.relativePosition;

        if (i > 0) {
            previousWaypoint = waypointModelList[i - 1];
            previousPosition = previousWaypoint.relativePosition;
        }

        if (isWithinAirspace(airport, waypointPosition) && i > 0) {
            distanceFromClosestFixToAirspaceBoundary = nm(calculateDistanceToBoundary(airport, previousPosition));

            continue;
        }

        // this will only work for `StandardRouteWaypointModel` objects. _buildWaypointModelListFromRoute may also return
        // `FixModels`, in which case this line will return `NaN`
        totalDistance += waypoint.distanceFromPreviousWaypoint;
    }

    return {
        totalDistance,
        distanceFromClosestFixToAirspaceBoundary
    };
};

/**
 *
 *
 * @function _buildWaypointModelListFromRoute
 * @return {array}
 * @private
 */
const _buildWaypointModelListFromRoute = (spawnPatternJson, navigationLibrary, airport) => {
    const formattedRoute = routeStringFormatHelper(spawnPatternJson.route);

    if (!RouteModel.isProcedureRouteString(formattedRoute[0])) {
        const initialWaypoint = navigationLibrary.findFixByName(formattedRoute[0]);
        const nextWaypoint = navigationLibrary.findFixByName(formattedRoute[1]);

        return [initialWaypoint, nextWaypoint];
    }

    const activeRouteModel = new RouteModel(spawnPatternJson.route);
    const isPreSpawn = true;
    const waypointModelList = navigationLibrary.findWaypointModelsForStar(
        activeRouteModel.procedure,
        activeRouteModel.entry,
        airport.arrivalRunway.name,
        isPreSpawn
    );

    return waypointModelList;
};

/**
 * Calculate heading, nextFix and position data to be used when creating an
 * `AircraftInstanceModel` along a route.
 *
 * @function _preSpawn
 * @param spawnPatternJson
 * @param navigationLibrary
 * @param airport
 * @return {array<object>}
 */
const _preSpawn = (spawnPatternJson, navigationLibrary, airport) => {
    // distance between each arriving aircraft, in nm
    const entrailDistance = spawnPatternJson.speed / spawnPatternJson.rate;
    const waypointModelList = _buildWaypointModelListFromRoute(spawnPatternJson, navigationLibrary, airport);
    const { totalDistance, distanceFromClosestFixToAirspaceBoundary } = _calculateDistancesAlongRoute(waypointModelList, airport);
    // calculate nubmer of offsets
    const spawnOffsets = _assembleSpawnOffsets(entrailDistance, totalDistance);
    // calculate heading, nextFix and position data to be used when creating an `AircraftInstanceModel` along a route
    const spawnPositions = _calculateSpawnPositions(waypointModelList, spawnOffsets, airport);

    return spawnPositions;
};

/**
 * Backfill STAR routes with arrivals closer than the spawn point.
 *
 * Should be run only once on airport load.
 *
 * Aircraft spawn at the first point defined in the `arrivals` entry of the airport json file.
 * When that spawn point is very far from the airspace boundary, it obviously takes quite a
 * while for them to reach the airspace. This function spawns arrivals along the route, between
 * the spawn point and the airspace boundary, in order to ensure the player is not kept waiting
 * for their first arrival aircraft.
 *
 * @function preSpawn
 * @param spawnPatternJson
 * @param navigationLibrary
 * @param currentAirport
 * @return {array<object>}
 */
export const buildPreSpawnAircraft = (spawnPatternJson, navigationLibrary, currentAirport) => {
    if (!_isObject(spawnPatternJson) || _isEmpty(spawnPatternJson)) {
        // eslint-disable-next-line max-len
        throw new TypeError('Invalid parameter passed to buildPreSpawnAircraft. Expected spawnPatternJson to be an object');
    }

    if (_isNil(navigationLibrary) || _isNil(currentAirport)) {
        // eslint-disable-next-line max-len
        throw new TypeError('Invalid parameter passed to buildPreSpawnAircraft. Expected navigationLibrary and currentAirport to be defined');
    }

    return _preSpawn(spawnPatternJson, navigationLibrary, currentAirport);
};
