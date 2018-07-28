import {
    abs,
    sin,
    cos,
    tan
} from './core';
import {
    tau,
    angle_offset
} from './circle';
import { distance2d } from './distance';
import {
    vradial,
    vsub,
    vlen,
    point_in_area,
    distance_to_poly,
    area_to_poly
} from './vector';
import {
    kn_ms,
    degreesToRadians,
    radiansToDegrees
} from '../utilities/unitConverters';
import { PHYSICS_CONSTANTS } from '../constants/globalConstants';

/**
 * Calculate the radius of turn of the aircraft, given its groundspeed
 *
 * Reference:
 * http://www.flightlearnings.com/2009/08/26/radius-of-turn/
 *
 * Possible conversion factor constants:
 *    - 68416 (yields nautical miles)
 *    - 11.26 (yields feet)
 *
 * @function calcTurnRadius
 * @param speed {number} aircraft groundspeed, in knots
 * @param bankAngle {number} bank angle to use, in radians
 * @return {number} radius of turn, in nautical miles
 */
export function calcTurnRadius(speed, bankAngle) {
    const conversionFactor = 68416; // yields radius in nautical miles

    return (speed * speed) / (conversionFactor * Math.tan(bankAngle));
}

/**
 * @function calcTurnInitiationDistanceNm
 * @param speed {number}            currentSpeed of an aircraft
 * @param bankAngle {number}        bank angle of an aircraft
 * @param courseChange {number}     angular difference, in radians
 * @return {number}
 */
export function calcTurnInitiationDistanceNm(speed, bankAngle, courseChange) {
    const turnRadiusNm = calcTurnRadius(speed, bankAngle);
    const halfCourseChange = courseChange / 2;
    const halfPi = Math.PI / 2;

    return turnRadiusNm * halfCourseChange / halfPi;
}

/**
 * Returns the bearing from `startPosition` to `endPosition`
 * @function bearingToPoint
 * @param startPosition {array}     positional array, start point
 * @param endPosition {array}       positional array, end point
 * @return {number}
 */
export function bearingToPoint(startPosition, endPosition) {
    return vradial(vsub(endPosition, startPosition));
}

// TODO: this may be better suited to live in an Aircraft model somewhere.
// TODO: This is goofy like this. Should be changed to accept (PositionModel, PositionModel, heading)
/**
 * Returns an offset array showing how far [fwd/bwd, left/right] 'aircraft' is of 'target'
 *
 * @param aircraft {AircraftModel}      the aircraft in question
 * @param target {array}                        positional array of the targeted position [x,y]
 * @param headingThruTarget {number} (optional) The heading the aircraft should
 *                                              be established on when passing the target.
 *                                              Default value is the aircraft's heading.
 * @returns {array}                             [0] is the lateral offset, in km
 *                                              [1] is the longitudinal offset, in km
 *                                              [2] is the hypotenuse (straight-line distance), in km
 */
export function getOffset(aircraft, target, headingThruTarget = null) {
    if (!headingThruTarget) {
        headingThruTarget = aircraft.heading;
    }

    const offset = [0, 0, 0];
    const vector = vsub(target, aircraft.relativePosition); // vector from aircraft pointing to target
    const bearingToTarget = vradial(vector);

    offset[2] = vlen(vector);
    offset[0] = offset[2] * sin(headingThruTarget - bearingToTarget);
    offset[1] = offset[2] * cos(headingThruTarget - bearingToTarget);

    return offset;
}

/**
 *
 * @function isWithinAirspace
 * @param airport {AirportModel}
 * @param  pos {array}
 * @return {boolean}
 */
export function isWithinAirspace(airport, pos) {
    const perim = airport.perimeter;

    if (perim) {
        return point_in_area(pos, perim);
    }

    return distance2d(pos, airport.relativePosition) <= airport.ctr_radius;
}

/**
 *
 * @function calculateDistanceToBoundary
 * @param airport {AirportModel}
 * @param pos {array}
 * @return {boolean}
 */
export function calculateDistanceToBoundary(airport, pos) {
    const perim = airport.perimeter;

    if (perim) {
        // km
        return distance_to_poly(pos, area_to_poly(perim));
    }

    return abs(distance2d(pos, airport.relativePosition) - airport.ctr_radius);
}


/**
 * @function _calculateNominalNewCourse
 * @param nextWaypointRelativePosition {array}
 * @param currentWaypointRelativePosition {array}
 * @return nominalNewCourse {number}
 * */
function _calculateNominalNewCourse(nextWaypointRelativePosition, currentWaypointRelativePosition) {
    let nominalNewCourse = vradial(vsub(nextWaypointRelativePosition, currentWaypointRelativePosition));

    // normalize angle within 0 to 2pi
    if (nominalNewCourse < 0) {
        nominalNewCourse += tau();
    }

    return nominalNewCourse;
}

/**
 * @function _calculateCourseChangeInRadians
 * @param currentHeading {number}
 * @param nominalNewCourse {number}
 * @return {number}
 */
function _calculateCourseChangeInRadians(currentHeading, nominalNewCourse) {
    let courseChange = abs(radiansToDegrees(currentHeading) - radiansToDegrees(nominalNewCourse));

    if (courseChange > 180) {
        courseChange = 360 - courseChange;
    }

    return degreesToRadians(courseChange);
}

/**
 * Calculate the turn initiation distance for an aircraft to navigate between two fixes.
 *
 * References:
 * - http://www.ohio.edu/people/uijtdeha/ee6900_fms_00_overview.pdf, Fly-by waypoint
 * - The Avionics Handbook, ch 15
 *
 * @function aircraft_turn_initiation_distance
 * @param aircraft {AircraftModel}
 * @param currentWaypointPosition {StaticPositionModel}
 * @return {number} distance before fix to initiate turn to level out on route, in nautical miles
 */
export function calculateTurnInitiaionDistance(aircraft, currentWaypointPosition) {
    let currentHeading = aircraft.heading;
    const nominalBankAngleDegrees = 30;
    const bankAngle = degreesToRadians(nominalBankAngleDegrees);
    const nextWaypointModel = aircraft.fms.nextWaypoint;

    if (!aircraft.fms.hasNextWaypoint() || nextWaypointModel.isVectorWaypoint) {
        return 0;
    }

    if (currentHeading < 0) {
        currentHeading += tau();
    }

    const nominalNewCourse = _calculateNominalNewCourse(
        nextWaypointModel.relativePosition,
        currentWaypointPosition.relativePosition
    );
    const courseChange = _calculateCourseChangeInRadians(currentHeading, nominalNewCourse);
    const turnInitiationDistanceNm = calcTurnInitiationDistanceNm(aircraft.groundSpeed, bankAngle, courseChange);

    return turnInitiationDistanceNm;
}

/**
 * @function calculateCrosswindAngle
 * @param runwayAngle {number}
 * @param windAngle {number}
 * @return {number}
 */
export function calculateCrosswindAngle(runwayAngle, windAngle) {
    return abs(angle_offset(runwayAngle, windAngle));
}
