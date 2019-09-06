import _findIndex from 'lodash/findIndex';
import _floor from 'lodash/floor';
import _isArray from 'lodash/isArray';
import _isNil from 'lodash/isNil';
import _random from 'lodash/random';
import _without from 'lodash/without';
import RouteModel from '../aircraft/FlightManagementSystem/RouteModel';
import { TIME } from '../constants/globalConstants';
import {
    isWithinAirspace,
    calculateDistanceToBoundary
} from '../math/flightMath';
import { nm } from '../utilities/unitConverters';
import { isEmptyObject } from '../utilities/validatorUtilities';

/**
 * Return an array whose indices directly mirror those of `waypointModelList`, except it
 * contains the distances along the route at which each waypoint lies from the spawn point
 *
 * @function _calculateOffsetsToEachWaypointInRoute
 * @param waypointModelList {array<WaypointModel>} array of all waypoints along the route
 * @return {array<number>} offset distance from spawn point to each waypoint
 */
export function _calculateOffsetsToEachWaypointInRoute(waypointModelList) {
    // begin by storing the first fix's offset: a distance of 0 from the spawn point
    const waypointOffsetMap = [0];
    let totalDistanceTraveled = 0;

    // continue with second waypoint, because first is already stored
    for (let i = 1; i < waypointModelList.length; i++) {
        if (waypointModelList[i].isVectorWaypoint || waypointModelList[i - 1].isVectorWaypoint) {
            continue;
        }

        const previousWaypointModel = waypointModelList[i - 1];
        const nextWaypointModel = waypointModelList[i];
        const distanceToNextWaypoint = previousWaypointModel.calculateDistanceToWaypoint(nextWaypointModel);
        totalDistanceTraveled += distanceToNextWaypoint;

        waypointOffsetMap.push(totalDistanceTraveled);
    }

    return waypointOffsetMap;
}

/**
 * Create an array of the various altitude restrictions along the route, and the offset distances at which they exist
 *
 * Note that unlike the `waypointOffsetMap`, the altitude offset array DOES NOT mirror the indices
 * of the `waypointModelList`. Only offsets and altitudes of altitude-restricted waypoints are included.
 *
 * Also note that this is designed to retrieve bottom altitudes used in descent. It could probably
 * be reused for departures, just by doing a Math.max() instead of Math.min() below
 *
 * @function _calculateAltitudeOffsets
 * @param waypointModelList {array<WaypointModel>} array of all waypoints along the route
 * @param waypointOffsetMap {array<number>} offset distance from spawn point to each waypoint
 * @return {array<array<number>>} [[offsetDistance, altitude], [offsetDistance, altitude], ...]
 */
export function _calculateAltitudeOffsets(waypointModelList, waypointOffsetMap) {
    const altitudeOffsets = [];

    for (let i = 0; i < waypointModelList.length; i++) {
        const waypointModel = waypointModelList[i];

        if (!waypointModel.hasAltitudeRestriction) {
            continue;
        }

        const altitudes = _without([waypointModel.altitudeMaximum, waypointModel.altitudeMinimum], -1);

        altitudeOffsets.push([
            waypointOffsetMap[i],
            Math.min(...altitudes)
        ]);
    }

    return altitudeOffsets;
}

/**
 * Calculate the interpolated altitude along the glidepath at the given distance along the route from the spawn point
 *
 * @function _calculateAltitudeAtOffset
 * @param altitudeOffsets {array<array<number>>} information about location of altitude restrictions
 * @param offsetDistance {number} distance along route at which we want to know the ideal spawn altitude
 * @return {number} ideal spawn altitude, in feet (rounded up to nearest thousand)
 */
export function _calculateAltitudeAtOffset(altitudeOffsets, offsetDistance) {
    const indexOfDistance = 0;
    const indexOfAltitude = 1;
    const indexOfNextAltitudeRestriction = _findIndex(altitudeOffsets, (altitudeOffset) => {
        return altitudeOffset[indexOfDistance] >= offsetDistance;
    });
    let indexOfPreviousAltitudeRestriction = indexOfNextAltitudeRestriction - 1;

    if (indexOfPreviousAltitudeRestriction < -1) {
        indexOfPreviousAltitudeRestriction = altitudeOffsets.length - 1;
    }

    if (indexOfNextAltitudeRestriction < 0) { // no restrictions ahead
        if (indexOfPreviousAltitudeRestriction < 0) { // no restrictions ahead or behind
            throw new TypeError('Expected altitude restrictions to calculate appropriate spawn altiude, but none were received.');
        }

        return altitudeOffsets[indexOfPreviousAltitudeRestriction][indexOfAltitude];
    }

    if (indexOfPreviousAltitudeRestriction < 0) { // have restrictions ahead, but none behind
        return _floor(altitudeOffsets[indexOfNextAltitudeRestriction][indexOfAltitude], -3);
    }

    const previousAltitudeRestriction = altitudeOffsets[indexOfPreviousAltitudeRestriction];
    const nextAltitudeRestriction = altitudeOffsets[indexOfNextAltitudeRestriction];
    const distanceBetweenRestrictions = nextAltitudeRestriction[indexOfDistance] - previousAltitudeRestriction[indexOfDistance];
    const altitudeBetweenRestrictions = nextAltitudeRestriction[indexOfAltitude] - previousAltitudeRestriction[indexOfAltitude];
    const distanceFromPreviousRestrictionToOffsetDistance = offsetDistance - previousAltitudeRestriction[indexOfDistance];
    const progressBetweenRestrictions = distanceFromPreviousRestrictionToOffsetDistance / distanceBetweenRestrictions;
    const altitudeChangeFromPreviousRestriction = altitudeBetweenRestrictions * progressBetweenRestrictions;

    return _floor(previousAltitudeRestriction[indexOfAltitude] + altitudeChangeFromPreviousRestriction, -3);
}

/**
 * Calculate the ideal spawn altitude at the given distance along the route from the spawn point
 *
 * @function _calculateIdealSpawnAltitudeAtOffset
 * @param altitudeOffsets {array<array<number>>} information about location of altitude restrictions
 * @param offsetDistance {number} distance along route at which we want to know the ideal spawn altitude
 * @param spawnSpeed {number} airspeed at which to spawn the aircraft
 * @param spawnAltitude {number|array<number>} altitude specified in the spawn pattern json
 * @param totalDistance {number} distance along route from spawn point to airspace boundary
 * @param airspaceCeiling {number} altitude of the top of our airspace
 * @return {number} ideal spawn altitude, in feet (rounded up to nearest thousand)
 */
export function _calculateIdealSpawnAltitudeAtOffset(
    altitudeOffsets,
    offsetDistance,
    spawnSpeed,
    spawnAltitude,
    totalDistance,
    airspaceCeiling
) {
    const indexOfDistance = 0;
    const indexOfAltitude = 1;
    let firstAltitudeRestriction = altitudeOffsets[0];

    if (!firstAltitudeRestriction) { // no altitude restrictions at all
        firstAltitudeRestriction = [totalDistance, airspaceCeiling];
    }

    if (offsetDistance >= firstAltitudeRestriction[indexOfDistance]) {
        return _calculateAltitudeAtOffset(altitudeOffsets, offsetDistance);
    }

    const distanceToFirstAltitudeRestriction = firstAltitudeRestriction[indexOfDistance] - offsetDistance;
    const minutesToFirstAltitudeRestriction = distanceToFirstAltitudeRestriction / spawnSpeed * TIME.ONE_HOUR_IN_MINUTES;
    const assumedDescentRate = 1000;
    const highestAcceptableAltitude = firstAltitudeRestriction[indexOfAltitude] +
        (assumedDescentRate * minutesToFirstAltitudeRestriction);

    if (_isArray(spawnAltitude)) {
        spawnAltitude = _random(spawnAltitude[0] / 1000, spawnAltitude[1] / 1000) * 1000;
    }

    return Math.min(_floor(highestAcceptableAltitude, -3), spawnAltitude);
}

/**
 * Loop through `waypointModelList` and determine where along the route an
 * aircraft should spawn
 *
 * @function _calculateSpawnPositionsAndAltitudes
 * @param waypointModelList {array<WaypointModel>}
 * @param spawnOffsets {array}
 * @param spawnSpeed {number}
 * @param spawnAltitude {number}
 * @param totalDistance {number} distance along route from spawn point to airspace boundary
 * @return spawnPositions {array<number>} distances along route, in nm
 */
function _calculateSpawnPositionsAndAltitudes(
    waypointModelList,
    spawnOffsets,
    spawnSpeed,
    spawnAltitude,
    totalDistance,
    airspaceCeiling
) {
    const spawnPositionsAndAltitudes = [];
    const waypointOffsetMap = _calculateOffsetsToEachWaypointInRoute(waypointModelList);
    const altitudeOffsets = _calculateAltitudeOffsets(waypointModelList, waypointOffsetMap);

    // for each new aircraft
    for (let i = 0; i < spawnOffsets.length; i++) {
        const spawnOffset = spawnOffsets[i];
        const nextWaypointIndex = _findIndex(waypointOffsetMap, (distanceToWaypoint) => {
            // Purposefully using strict comparison:
            // If we return true here when distanceToWaypoint is equal to spawnOffset,
            // the previousWaypointModel and the nextWaypointModel will be the same for
            // the last item (the spawn point) resulting in the incapacity to compute a
            // heading.
            return distanceToWaypoint > spawnOffset;
        });
        const nextWaypointModel = waypointModelList[nextWaypointIndex];
        const previousWaypointIndex = Math.max(0, nextWaypointIndex - 1);
        const previousWaypointModel = waypointModelList[previousWaypointIndex];
        const distanceFromPreviousWaypointToSpawnPoint = spawnOffset - waypointOffsetMap[previousWaypointIndex];
        const heading = previousWaypointModel.calculateBearingToWaypoint(nextWaypointModel);
        const spawnPositionModel = previousWaypointModel.positionModel.generateDynamicPositionFromBearingAndDistance(
            heading,
            distanceFromPreviousWaypointToSpawnPoint
        );
        const altitude = _calculateIdealSpawnAltitudeAtOffset(
            altitudeOffsets,
            spawnOffset,
            spawnSpeed,
            spawnAltitude,
            totalDistance,
            airspaceCeiling
        );

        spawnPositionsAndAltitudes.push({
            altitude,
            heading,
            nextFix: nextWaypointModel.name,
            positionModel: spawnPositionModel
        });
    }

    return spawnPositionsAndAltitudes;
}

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
    let distanceAlongRoute = offsetClosestToAirspace;

    // distance between successive arrivals in nm
    while (distanceAlongRoute > smallestIntervalNm) {
        const interval = _random(smallestIntervalNm, largestIntervalNm, true);
        distanceAlongRoute -= interval;

        if (distanceAlongRoute < smallestIntervalNm) {
            break;
        }

        spawnOffsets.push(distanceAlongRoute);
    }

    // spawn an aircraft at the first fix of the route
    spawnOffsets.push(0);

    return spawnOffsets;
};

/**
 * Returns the total distance from beginning to end of the provided route, along the route's course
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
            distanceFromClosestFixToAirspaceBoundary = nm(calculateDistanceToBoundary(
                airport, previousWaypoint.relativePosition
            ));
            totalDistance += distanceFromClosestFixToAirspaceBoundary;

            break;
        }

        const distanceBetweenWaypoints = previousWaypoint.calculateDistanceToWaypoint(waypointModel);

        totalDistance += distanceBetweenWaypoints;
    }

    return totalDistance;
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
    const airspaceCeiling = airport.maxAssignableAltitude;
    const spawnSpeed = spawnPatternJson.speed;
    const spawnAltitude = spawnPatternJson.altitude;
    const entrailDistance = spawnSpeed / spawnPatternJson.rate;
    const routeModel = new RouteModel(spawnPatternJson.route);
    const waypointModelList = routeModel.waypoints;
    const totalDistance = _calculateDistancesAlongRoute(waypointModelList, airport);
    // calculate number of offsets
    const spawnOffsets = _assembleSpawnOffsets(entrailDistance, totalDistance);
    // calculate heading, nextFix and position data to be used when creating an `AircraftModel` along a route
    const spawnPositions = _calculateSpawnPositionsAndAltitudes(
        waypointModelList,
        spawnOffsets,
        spawnSpeed,
        spawnAltitude,
        totalDistance,
        airspaceCeiling
    );

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
 * @function buildPreSpawnAircraft
 * @param spawnPatternJson {object}
 * @param currentAirport {AirportModel}
 * @return {array<object>}
 */
export const buildPreSpawnAircraft = (spawnPatternJson, currentAirport) => {
    if (isEmptyObject(spawnPatternJson)) {
        throw new TypeError('Invalid parameter passed to buildPreSpawnAircraft. Expected spawnPatternJson to be an object');
    }

    if (_isNil(currentAirport)) {
        throw new TypeError('Invalid parameter passed to buildPreSpawnAircraft. Expected currentAirport to be defined');
    }

    return _preSpawn(spawnPatternJson, currentAirport);
};
