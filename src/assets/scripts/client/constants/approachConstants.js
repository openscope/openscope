/**
 * Constants for non-precision approach intercept logic.
 *
 * @module constants/approachConstants
 */

/**
 * Maximum angle (in degrees) between the aircraft's heading and the leg's
 * inbound course for the leg to be considered interceptable. 45° is the ICAO
 * allowance; FAA radar-vectoring norm is 30°.
 *
 * @property MAX_INTERCEPT_ANGLE
 * @type {number}
 * @final
 */
export const MAX_INTERCEPT_ANGLE = 45;

/**
 * Maximum distance (in nm) upstream of a leg's start fix to extend the leg
 * line for intercept checking. Aircraft further than this from the leg
 * cannot intercept it.
 *
 * @property MAX_INTERCEPT_DISTANCE_NM
 * @type {number}
 * @final
 */
export const MAX_INTERCEPT_DISTANCE_NM = 30;

/**
 * Minimum distance (in nm) from the aircraft to the intercept point.
 * Aircraft closer than this to a fix are considered already established
 * on the leg; the candidate is rejected to avoid weird entry choices.
 *
 * @property MIN_INTERCEPT_DISTANCE_NM
 * @type {number}
 * @final
 */
export const MIN_INTERCEPT_DISTANCE_NM = 1.5;

/**
 * Distance (in nm) the aircraft's forward path is extended for the
 * intercept check. Determines how far ahead of the aircraft the algorithm
 * looks for an intersection with a leg line.
 *
 * @property AIRCRAFT_FORWARD_LOOK_NM
 * @type {number}
 * @final
 */
export const AIRCRAFT_FORWARD_LOOK_NM = 7.5;
