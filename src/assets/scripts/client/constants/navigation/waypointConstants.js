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

// TODO: Move this to global constants or somewhere more relevant!
/**
* Enumeration for the radix value of `parseInt`
*
* @enum DECIMAL_RADIX
* @type {number}
* @final
*/
export const DECIMAL_RADIX = 10;

/**
 * Number to used to convert a FL altitude to an altitude in thousands
 *
 * @enum ABOVE_SYMBOL
 * @type {string}
 * @final
 */
export const FL_TO_THOUSANDS_MULTIPLIER = 100;

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
* Character prefix indicating the subsequent value is a speed restriction
*
* @enum SPEED_RESTRICTION_PREFIX
* @type {string}
* @final
*/
export const SPEED_RESTRICTION_PREFIX = 'S';
