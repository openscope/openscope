/**
* Symbol that divides each direct segment
*
* @enum DIRECT_SEPARATION_SYMBOL
* @type {string}
* @final
*/
export const DIRECT_SEPARATION_SYMBOL = '..';

/**
* Symbol that prepends a fixname indicating the aircraft should enter
* a holding pattern once it arrives at the fix.
*
* @enum HOLD_SEGMENT_SYMBOL
* @type {string}
* @final
*/
export const HOLD_SEGMENT_SYMBOL = '@';

/**
* A procedure segment has exactly three parts (ex: `BETHL.GRNPA1.KLAS`)
*
* @enum MAXIMUM_PROCEDURE_SEGMENT_LENGTH
* @type {number}
* @final
*/
export const MAXIMUM_PROCEDURE_SEGMENT_LENGTH = 3;

/**
* A route is assumed to have, at most, three parts.
*
* @enum MAXIMUM_ROUTE_SEGMENT_LENGTH
* @type {number}
* @final
*/
export const MAXIMUM_ROUTE_SEGMENT_LENGTH = 3;

/**
* Symbol that divides each route segment
*
* @enum PROCEDURE_SEGMENT_SEPARATION_SYMBOL
* @type {string}
* @final
*/
export const PROCEDURE_SEGMENT_SEPARATION_SYMBOL = '.';

/**
* Symbol that divides each route segment
*
* @enum SEGMENT_SEPARATION_SYMBOL
* @type {string}
* @final
*/
export const SEGMENT_SEPARATION_SYMBOL = '.';
