/**
 * Character used to separate the airline and fleet
 * Example: AAL airlines and long fleet -> 'AAL/long'
 *
 * @enum AIRLINE_NAME_FLEET_SEPARATOR
 * @type {string}
 */
export const AIRLINE_NAME_FLEET_SEPARATOR = '/';

/**
 * Default callsign format
 *
 * @enum DEFAULT_CALLSIGN_FORMAT
 * @type {string}
*/
export const DEFAULT_CALLSIGN_FORMAT = '###';

/**
 * Character used to represent a position where a random letter should be generated
 * in a callsign
 *
 * @enum CALLSIGN_RANDOM_LETTER_CHARACTER
 * @type {string}
*/
export const CALLSIGN_RANDOM_LETTER_CHARACTER = '@';

/**
 * Character used to represent a position where a random digit should be generated
 * in a callsign
 *
 * @enum CALLSIGN_RANDOM_DIGIT_CHARACTER
 * @type {string}
*/
export const CALLSIGN_RANDOM_DIGIT_CHARACTER = '#';
