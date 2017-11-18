/**
* Symbol that divides each direct segment
*
* @enum DIRECT_SEGMENT_DIVIDER
* @type {string}
* @final
*/
export const DIRECT_SEGMENT_DIVIDER = '..';

/**
* Known types of `LegModel`s
*
* @enum LEG_TYPE
* @type {object}
* @final
*/
export const LEG_TYPE = {
    /**
    * For legs following an airway from entry point to exit point
    *
    * @memberof LEG_TYPE
    * @property AIRWAY
    * @type {string}
    */
    AIRWAY: 'airway',

    /**
    * For legs that are simply direct from the previous fix to the next fix
    *
    * @memberof LEG_TYPE
    * @property DIRECT
    * @type {string}
    */
    DIRECT: 'direct',

    /**
    * For legs following an instrument procedure from entry point to exit point
    *
    * This currently includes SIDs and STARs (though additional procedures are planned)
    *
    * @memberof LEG_TYPE
    * @property PROCEDURE
    * @type {string}
    */
    PROCEDURE: 'procedure'
};

/**
* Symbol that divides each route segment
*
* @enum PROCEDURE_OR_AIRWAY_SEGMENT_DIVIDER
* @type {string}
* @final
*/
export const PROCEDURE_OR_AIRWAY_SEGMENT_DIVIDER = '.';

/**
* @property PROCEDURE_TYPE
* @type {Object}
* @final
*/
export const PROCEDURE_TYPE = {
    SID: 'SID',
    STAR: 'STAR'
};
