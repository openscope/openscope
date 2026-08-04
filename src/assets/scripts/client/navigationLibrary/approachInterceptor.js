import {
    MAX_INTERCEPT_ANGLE,
    MAX_INTERCEPT_DISTANCE_NM,
    MIN_INTERCEPT_DISTANCE_NM,
    AIRCRAFT_FORWARD_LOOK_NM
} from '../constants/approachConstants';

/**
 * Algorithms for intercepting a non-precision approach procedure.
 *
 * Given an aircraft (position + heading) and a procedure (ordered list of
 * fix names), determine which leg the aircraft can intercept and where.
 *
 * All inputs use degrees (latitude/longitude/heading). The geometry is
 * flat-earth at the procedure's latitude — sufficient for intercepts
 * within {@link MAX_INTERCEPT_DISTANCE_NM}.
 *
 * @module navigationLibrary/approachInterceptor
 */

const NM_PER_DEGREE_LATITUDE = 60;
const INTERSECTION_EPSILON = 1e-12;

/**
 * @typedef {Object} AircraftPosition
 * @property {number} latitude  in degrees, north positive
 * @property {number} longitude in degrees, east positive
 */

/**
 * @typedef {Object} Aircraft
 * @property {AircraftPosition} position
 * @property {number} heading in degrees, 0 = north, 90 = east, clockwise
 */

/**
 * @typedef {Object} InterceptCandidate
 * @property {string} leg              the fix name the aircraft intercepts toward
 *                                     (i.e. the upstream end of the leg)
 * @property {AircraftPosition} interceptPoint
 * @property {number} distance         nm from aircraft to intercept point
 * @property {number} angle            degrees between aircraft heading and leg course, in [0, 180]
 */

/**
 * Find the best (nearest) intercept for an aircraft onto a non-precision
 * approach procedure. Returns null if no leg is interceptable.
 *
 * @param {Aircraft} aircraft
 * @param {Array<string>} procedure    fix names in order, IAF first, MAP last
 * @param {Object<string, AircraftPosition>} fixes  fix name -> position
 * @returns {InterceptCandidate|null}
 */
export function findBestIntercept(aircraft, procedure, fixes) {
    const candidates = findInterceptableLegs(aircraft, procedure, fixes);

    return candidates.length === 0 ? null : candidates[0];
}

/**
 * Find all legs in the procedure that the aircraft can intercept, sorted
 * by distance to intercept point (nearest first).
 *
 * For each leg the algorithm:
 *   1. Constructs the leg line (from the end fix, through the start fix,
 *      extended upstream by {@link MAX_INTERCEPT_DISTANCE_NM}).
 *   2. Constructs the aircraft line (from the aircraft position, forward
 *      by {@link AIRCRAFT_FORWARD_LOOK_NM} in the aircraft's heading).
 *   3. Tests for intersection between the two line segments.
 *   4. Tests the angle between aircraft heading and leg course, clamped
 *      to [0, 180]. Rejects if > {@link MAX_INTERCEPT_ANGLE}.
 *   5. Tests distance from aircraft to intercept point. Rejects if
 *      < {@link MIN_INTERCEPT_DISTANCE_NM}.
 *
 * @param {Aircraft} aircraft
 * @param {Array<string>} procedure
 * @param {Object<string, AircraftPosition>} fixes
 * @returns {Array<InterceptCandidate>} sorted by distance, nearest first
 */
export function findInterceptableLegs(aircraft, procedure, fixes) {
    const candidates = [];

    for (let i = 0; i < procedure.length - 1; i++) {
        const startFixName = procedure[i];
        const endFixName = procedure[i + 1];

        const startFix = fixes[startFixName];
        const endFix = fixes[endFixName];

        if (!startFix || !endFix) {
            continue;
        }

        const candidate = evaluateLeg(aircraft, startFixName, startFix, endFix);

        if (candidate !== null) {
            candidates.push(candidate);
        }
    }

    candidates.sort((a, b) => a.distance - b.distance);

    return candidates;
}

/**
 * Evaluate a single leg for interceptability. Internal.
 *
 * @param {Aircraft} aircraft
 * @param {string} startFixName
 * @param {AircraftPosition} startFix
 * @param {AircraftPosition} endFix
 * @returns {InterceptCandidate|null}
 */
function evaluateLeg(aircraft, startFixName, startFix, endFix) {
    const legCourse = bearing(startFix, endFix);

    // Leg line: from extended point upstream of start fix, through start fix, to end fix
    const legLineStart = projectPosition(startFix, legCourse + 180, MAX_INTERCEPT_DISTANCE_NM);
    const legLineEnd = endFix;

    // Aircraft line: from aircraft, forward in heading direction
    const aircraftLineEnd = projectPosition(aircraft.position, aircraft.heading, AIRCRAFT_FORWARD_LOOK_NM);

    const interceptPoint = lineSegmentIntersection(
        aircraft.position,
        aircraftLineEnd,
        legLineStart,
        legLineEnd
    );

    if (interceptPoint === null) {
        return null;
    }

    const angle = angularDifference(aircraft.heading, legCourse);

    if (angle > MAX_INTERCEPT_ANGLE) {
        return null;
    }

    const distance = distanceNm(aircraft.position, interceptPoint);

    if (distance < MIN_INTERCEPT_DISTANCE_NM) {
        return null;
    }

    return {
        leg: startFixName,
        interceptPoint,
        distance,
        angle
    };
}

/**
 * Project a position by a heading and distance (in nm). Flat-earth.
 *
 * @param {AircraftPosition} position
 * @param {number} headingDegrees
 * @param {number} distanceNm
 * @returns {AircraftPosition}
 */
function projectPosition(position, headingDegrees, distanceNm) {
    const headingRad = degreesToRadians(headingDegrees);
    const distanceDeg = distanceNm / NM_PER_DEGREE_LATITUDE;
    const cosLat = Math.cos(degreesToRadians(position.latitude));

    return {
        latitude: position.latitude + distanceDeg * Math.cos(headingRad),
        longitude: position.longitude + (distanceDeg * Math.sin(headingRad)) / cosLat
    };
}

/**
 * Compute the bearing (initial heading) from one position to another, in degrees.
 *
 * @param {AircraftPosition} from
 * @param {AircraftPosition} to
 * @returns {number} heading in [0, 360)
 */
function bearing(from, to) {
    const lat1 = degreesToRadians(from.latitude);
    const lat2 = degreesToRadians(to.latitude);
    const dLon = degreesToRadians(to.longitude - from.longitude);

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    return normalizeHeading(radiansToDegrees(Math.atan2(y, x)));
}

/**
 * Normalize a heading to [0, 360).
 *
 * @param {number} heading
 * @returns {number}
 */
function normalizeHeading(heading) {
    const h = heading % 360;

    return h < 0 ? h + 360 : h;
}

/**
 * Absolute angular difference between two headings, clamped to [0, 180].
 *
 * @param {number} h1
 * @param {number} h2
 * @returns {number}
 */
function angularDifference(h1, h2) {
    const diff = Math.abs(normalizeHeading(h1) - normalizeHeading(h2));

    return diff > 180 ? 360 - diff : diff;
}

/**
 * Great-circle-ish distance in nm between two positions. Flat-earth with
 * a mid-latitude longitude correction.
 *
 * @param {AircraftPosition} p1
 * @param {AircraftPosition} p2
 * @returns {number} distance in nm
 */
function distanceNm(p1, p2) {
    const midLat = degreesToRadians((p1.latitude + p2.latitude) / 2);
    const dLat = p2.latitude - p1.latitude;
    const dLon = (p2.longitude - p1.longitude) * Math.cos(midLat);

    return Math.sqrt(dLat * dLat + dLon * dLon) * NM_PER_DEGREE_LATITUDE;
}

/**
 * 2D line segment intersection in flat-earth coordinates.
 * Returns the intersection point or null if the segments do not cross.
 *
 * @param {AircraftPosition} p1  segment 1 start
 * @param {AircraftPosition} p2  segment 1 end
 * @param {AircraftPosition} p3  segment 2 start
 * @param {AircraftPosition} p4  segment 2 end
 * @returns {AircraftPosition|null}
 */
function lineSegmentIntersection(p1, p2, p3, p4) {
    // Project to local flat-earth x/y using a single cos(lat) factor
    const avgLat = degreesToRadians(
        (p1.latitude + p2.latitude + p3.latitude + p4.latitude) / 4
    );
    const cosLat = Math.cos(avgLat);

    const x1 = p1.longitude * cosLat;
    const y1 = p1.latitude;
    const x2 = p2.longitude * cosLat;
    const y2 = p2.latitude;
    const x3 = p3.longitude * cosLat;
    const y3 = p3.latitude;
    const x4 = p4.longitude * cosLat;
    const y4 = p4.latitude;

    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

    if (Math.abs(denom) < INTERSECTION_EPSILON) {
        return null;
    }

    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;

    if (t < 0 || t > 1 || u < 0 || u > 1) {
        return null;
    }

    return {
        latitude: y1 + t * (y2 - y1),
        longitude: (x1 + t * (x2 - x1)) / cosLat
    };
}

function degreesToRadians(deg) {
    return deg * Math.PI / 180;
}

function radiansToDegrees(rad) {
    return rad * 180 / Math.PI;
}
