import _isEmpty from 'lodash/isEmpty';
import _isNil from 'lodash/isNil';
import _isObject from 'lodash/isObject';
import PositionModel from '../base/PositionModel';
import RouteModel from '../airport/Route/RouteModel';
import {
    fixRadialDist,
    isWithinAirspace,
    calculateDistanceToBoundary,
    bearingToPoint
} from '../math/flightMath';
import { nm } from '../utilities/unitConverters';

/**
 *
 *
 * @function _calculateSpawnPositions
 * @param waypointModelList {array<StandardWaypointModel>}
 * @param spawnOffsets {array}
 * @return spawnPositions {array}
 */
export const _calculateSpawnPositions = (waypointModelList, spawnOffsets, airport) => {
    const spawnPositions = [];

    // for each new aircraft
    for (let i = 0; i < spawnOffsets.length; i++) {
        let spawnOffset = spawnOffsets[i];

        // for each fix ahead
        for (let j = 1; j < waypointModelList.length; j++) {
            const waypoint = waypointModelList[j];

            if (spawnOffset > waypoint.distanceFromPreviousWaypoint) {
                // if point beyond next fix subtract distance from spawnOffset and continue
                spawnOffset -= waypoint.distanceFromPreviousWaypoint;

                continue;
            } else {
                // if point before next fix
                const nextFix = waypoint;
                const previousFix = waypointModelList[j - 1];
                const heading = bearingToPoint(previousFix.gpsXY, nextFix.gpsXY);
                const spawnPoint = fixRadialDist(previousFix.gps, heading, spawnOffset);
                const position = PositionModel.calculatePosition(spawnPoint, airport.position, airport.magnetic_north);
                // TODO: this looks like it should be a model object
                const preSpawnHeadingAndPosition = {
                    heading,
                    position,
                    nextFix: nextFix.name
                };

                spawnPositions.push(preSpawnHeadingAndPosition);

                break;
            }
        }
    }

    return spawnPositions;
};

/**
 *
 *
 * @function _assembleSpawnOffsets
 * @param entrailDistance {number}
 * @param totalDistance {number}
 * @return spawnOffsets {array}
 */
export const _assembleSpawnOffsets = (entrailDistance, totalDistance) => {
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
 * @function _preSpawn
 * @param spawnPatternJson
 * @param navigationLibrary
 * @param airport
 * @return
 */
export const _preSpawn = (spawnPatternJson, navigationLibrary, airport) => {
    // find last fix along STAR that is outside of airspace, ie: next fix is within airspace
    // distance between closest fix outside airspace and airspace border in nm
    let extra = 0;
    let totalDistance = 0;
    const activeRouteModel = new RouteModel(spawnPatternJson.route);
    const isPreSpawn = true;
    const waypointModelList = airport.findWaypointModelsForStar(
        activeRouteModel.procedure,
        activeRouteModel.entry,
        airport.runway,
        isPreSpawn
    );

    for (let i = 0; i < waypointModelList.length; i++) {
        const waypoint = waypointModelList[i];
        const waypointPosition = waypoint.position;
        let previousWaypoint = waypoint;
        let previousPosition = waypoint.position;

        if (i > 0) {
            previousWaypoint = waypointModelList[i - 1];
            previousPosition = previousWaypoint.position;
        }

        if (isWithinAirspace(airport, waypointPosition) && i > 0) {
            extra = nm(calculateDistanceToBoundary(airport, previousPosition));

            continue;
        }

        totalDistance += waypoint.distanceFromPreviousWaypoint;
    }

    // FIXME: incluing this causes aircraft to spawn within airspace. something goofy is going on here.
    // totalDistance += extra;

    // distance between each arriving aircraft, in nm
    const entrailDistance = spawnPatternJson.speed / spawnPatternJson.rate;
    const spawnOffsets = _assembleSpawnOffsets(entrailDistance, totalDistance);
    const spawnPositions = _calculateSpawnPositions(waypointModelList, spawnOffsets, airport);

    // _createAircraftAtSpawnPositions(spawnPositions);
    return spawnPositions;
};

/**
 * Backfill STAR routes with arrivals closer than the spawn point.
 *
 * Should be run only once on airport load.
 *
 * Aircraft spawn at the first point defined in the `arrivals` entry of the airport json file.
 * When that spawn point is very far from the airspace boundary, it obviously takes quite a
 * while for them to reach the airspace. This function spawns (all at once) arrivals along
 * the route, between the spawn point and the airspace boundary, in order to
 * ensure the player is not kept waiting for their first arrival aircraft.
 *
 * @function preSpawn
 * @param spawnPatternJson
 * @param navigationLibrary
 * @param currentAirport
 * @return {array<>}
 */
export const buildPreSpawnAircraft = (spawnPatternJson, navigationLibrary, currentAirport) => {
    if (!_isObject(spawnPatternJson) || _isEmpty(spawnPatternJson)) {
        // eslint-disable-next-line max-len
        throw new TypeError('Invalid parameter passed to buildPreSpawnAircraft. Expected spawnPatternJson to be an object');
    }

    if (_isNil(navigationLibrary) || _isNil(currentAirport)) {
        console.log(typeof spawnPatternJson, typeof navigationLibrary, typeof currentAirport);
        // eslint-disable-next-line max-len
        throw new TypeError('Invalid parameter passed to buildPreSpawnAircraft. Expected navigationLibrary and currentAirport to be defined');
    }

    return _preSpawn(spawnPatternJson, navigationLibrary, currentAirport);
};
