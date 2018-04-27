import _isNil from 'lodash/isNil';
import _random from 'lodash/random';
import RouteModel from '../aircraft/FlightManagementSystem/RouteModel';
// import { routeStringFormatHelper } from '../navigationLibrary/Route/routeStringFormatHelper';
import {
    isWithinAirspace,
    calculateDistanceToBoundary
} from '../math/flightMath';
import { nm } from '../utilities/unitConverters';
import { isEmptyObject } from '../utilities/validatorUtilities';

/**
 * Loop through `waypointModelList` and determine where along the route an
 * aircraft should spawn
 *
 * @function _calculateSpawnPositions
 * @param waypointModelList {array<StandardWaypointModel>}
 * @param spawnOffsets {array}
 * @return spawnPositions {array<number>} distances along route, in nm
 */
const _calculateSpawnPositions = (waypointModelList, spawnOffsets) => {
    const spawnPositions = [];

    // for each new aircraft
    for (let i = 0; i < spawnOffsets.length; i++) {
        let spawnOffset = spawnOffsets[i];

        // for each fix ahead
        for (let j = 1; j < waypointModelList.length; j++) {
            const previousWaypointModel = waypointModelList[j - 1];
            const nextWaypointModel = waypointModelList[j];
            const distanceToNextWaypoint = previousWaypointModel.calculateDistanceToWaypoint(nextWaypointModel);

            if (distanceToNextWaypoint > spawnOffset) {   // if point before next fix
                // const previousFixPosition = previousWaypointModel.positionModel;
                const heading = previousWaypointModel.calculateBearingToWaypoint(nextWaypointModel);
                const spawnPositionModel = previousWaypointModel.positionModel.generateDynamicPositionFromBearingAndDistance(heading, spawnOffset);

                // TODO: this looks like it should be a model object
                const preSpawnHeadingAndPosition = {
                    heading,
                    positionModel: spawnPositionModel,
                    nextFix: nextWaypointModel.name
                };

                spawnPositions.push(preSpawnHeadingAndPosition);

                break;
            }

            // if point beyond next fix subtract distance from spawnOffset and continue
            spawnOffset -= distanceToNextWaypoint;
        }
    }

    return spawnPositions;
};

/**
 * Calculate distances along spawn pattern route at which to prespawn aircraft
 *
 * To randomize the spawn locations, the interval between aircraft will vary, but should
 * average out to exactly the `entrailDistance`. The exception is if the `entrailDistance`
 * is less than the `smallestIntervalNm` defined below. In that case, aircraft will be
 * spawned at exactly the `entrailDistance` with no variation due to their proximity.
 * 
 * NOTE: Provided there is at least `smallestIntervalNm` distance between them, an aircraft
 * will always be spawned right along the airspace boundary, and another at the first fix.
 *
 * For example, with `smallestIntervalNm = 15`:
 *   - If requesting 8MIT, will spawn exactly 8MIT
 *   - If requesting 30MIT, will spawn each a/c 15MIT-45MIT of the previous arrival
 *
 * @function _assembleSpawnOffsets
 * @param entrailDistance {number}
 * @param totalDistance {number}
 * @return spawnOffsets {array<number>} distances along route, in nm
 */
const _assembleSpawnOffsets = (entrailDistance, totalDistance = 0) => {
    const offsetClosestToAirspace = totalDistance - 3;
    let smallestIntervalNm = 15;
    const largestIntervalNm = entrailDistance + (entrailDistance - smallestIntervalNm);

    // if requesting less than `smallestIntervalNm`, spawn all AT `entrailDistance`
    if (smallestIntervalNm > largestIntervalNm) {
        smallestIntervalNm = largestIntervalNm;
    }

    const spawnOffsets = [offsetClosestToAirspace];
    let offset = offsetClosestToAirspace;

    // distance between successive arrivals in nm
    while (offset > smallestIntervalNm) {
        const interval = _random(smallestIntervalNm, largestIntervalNm, true);
        offset -= interval;

        if (offset < smallestIntervalNm) {
            break;
        }

        spawnOffsets.push(offset);
    }

    // spawn an aircraft at the first fix of the route
    spawnOffsets.push(0);

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

    // Iteration started at index 1 to ensure two elements are available. It is
    // already an expectation that aircraft must have two waypoints, so this
    // should not be a problem here.
    for (let i = 1; i < waypointModelList.length; i++) {
        const waypointModel = waypointModelList[i];
        const previousWaypoint = waypointModelList[i - 1];

        if (waypointModel.isVectorWaypoint || previousWaypoint.isVectorWaypoint) {
            continue;
        }

        if (isWithinAirspace(airport, waypointModel.relativePosition)) {
            distanceFromClosestFixToAirspaceBoundary = nm(calculateDistanceToBoundary(airport, previousWaypoint.relativePosition));
            totalDistance += distanceFromClosestFixToAirspaceBoundary;

            break;
        }

        const distanceBetweenWaypoints = previousWaypoint.calculateDistanceToWaypoint(waypointModel);

        totalDistance += distanceBetweenWaypoints;
    }

    return {
        totalDistance,
        distanceFromClosestFixToAirspaceBoundary
    };
};

/**
 * Calculate heading, nextFix and position data to be used when creating an
 * `AircraftModel` along a route.
 *
 * @function _preSpawn
 * @param spawnPatternJson
 * @param airport
 * @return {array<object>}
 */
const _preSpawn = (spawnPatternJson, airport) => {
    // distance between each arriving aircraft, in nm
    const entrailDistance = spawnPatternJson.speed / spawnPatternJson.rate;
    const routeModel = new RouteModel(spawnPatternJson.route);
    const waypointModelList = routeModel.waypoints;
    const { totalDistance } = _calculateDistancesAlongRoute(waypointModelList, airport);
    // calculate number of offsets
    const spawnOffsets = _assembleSpawnOffsets(entrailDistance, totalDistance);
    // calculate heading, nextFix and position data to be used when creating an `AircraftModel` along a route
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
 * @param spawnPatternJson {object}
 * @param currentAirport {AirportModel}
 * @return {array<object>}
 */
export const buildPreSpawnAircraft = (spawnPatternJson, currentAirport) => {
    if (isEmptyObject(spawnPatternJson)) {
        // eslint-disable-next-line max-len
        throw new TypeError('Invalid parameter passed to buildPreSpawnAircraft. Expected spawnPatternJson to be an object');
    }

    if (_isNil(currentAirport)) {
        // eslint-disable-next-line max-len
        throw new TypeError('Invalid parameter passed to buildPreSpawnAircraft. Expected currentAirport to be defined');
    }

    return _preSpawn(spawnPatternJson, currentAirport);
};
