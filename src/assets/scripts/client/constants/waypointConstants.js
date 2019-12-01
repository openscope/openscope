/**
 * Symbol denoting a greater than restriction
 *
 * @enum ABOVE_SYMBOL
 * @type {string}
 * @final
 */
export const ABOVE_SYMBOL = '+';

/**
 * Character prefix indicating the subsequent value is an altitude restriction
 *
 * @enum ALTITUDE_RESTRICTION_PREFIX
 * @type {string}
 * @final
 */
export const ALTITUDE_RESTRICTION_PREFIX = 'A';

/**
 * Symbol denoting a less than restriction
 *
 * @enum ABOVE_SYMBOL
 * @type {string}
 * @final
 */
export const BELOW_SYMBOL = '-';

/**
 * Default options for holding patterns
 *
 * @enum DEFAULT_HOLD_PARAMETERS
 * @type {Object}
 * @final
 */
export const DEFAULT_HOLD_PARAMETERS = {
    inboundHeading: undefined,
    legLength: '1min',
    speedMaximum: undefined,
    timer: -1,
    turnDirection: 'right'
};

/**
* Symbol that prepends a fixname indicating the aircraft should pass completely
* over the fix before turning toward the next fix on their route
*
* @enum FLY_OVER_WAYPOINT_PREFIX
* @type {string}
*/
export const FLY_OVER_WAYPOINT_PREFIX = '^';

/**
* Symbol that prepends a fixname indicating the aircraft should enter
* a holding pattern once it arrives at the fix.
*
* @enum HOLD_WAYPOINT_PREFIX
* @type {string}
* @final
*/
export const HOLD_WAYPOINT_PREFIX = '@';

/**
* Index where the name is located within `["WAMMY", "A20+|S220"]`
*
* @enum NAME_INDEX
* @type {number}
* @final
*/
export const NAME_INDEX = 0;

/**
* Index where the restriction is located within `["WAMMY", "A20+|S220"]`
*
* @enum RESTRICTION_INDEX
* @type {number}
* @final
*/
export const RESTRICTION_INDEX = 1;

/**
* Character used to separate altitude/speed restrictions from each other
*
* @enum RESTRICTION_SEPARATOR
* @type {string}
* @final
*/
export const RESTRICTION_SEPARATOR = '|';

/**
* Symbol used to denote an RNAV waypoint
*
* @enum RNAV_WAYPOINT_PREFIX
* @type {string}
* @final
*/
export const RNAV_WAYPOINT_PREFIX = '_';

/**
* @enum RNAV_WAYPOINT_DISPLAY_NAME
* @type {string}
* @final
*/
export const RNAV_WAYPOINT_DISPLAY_NAME = '[RNAV]';

/**
* Character prefix indicating the subsequent value is a speed restriction
*
* @enum SPEED_RESTRICTION_PREFIX
* @type {string}
* @final
*/
export const SPEED_RESTRICTION_PREFIX = 'S';

/**
* Symbols that prepends a three digit number, indicating that the created waypoint
* should simply be to follow the given heading until told to proceed to next waypoint
*
* @enum VECTOR_WAYPOINT_PREFIX
* @type {string}
* @final
*/
export const VECTOR_WAYPOINT_PREFIX = '#';
