import _keys from 'lodash/keys';
import FixModel from '../../navigationLibrary/Fix/FixModel';
// import Waypoint from '../../aircraft/Waypoint';
// import PositionModel from '../PositionModel';

/**
 * A map of Constructor names to constructor functions
 *
 * @property CLASS_MAP
 * @type {object}
 * @final
 */
export const CLASS_MAP = {
    /**
     * @memberof CLASS_MAP
     * @property FixModel
     * @type {FixModel}
     * @final
     */
    FixModel: FixModel

    // TODO: Future additions to the pool each of these models need some work in orer to integrate
    // into the pool structure
    //
    // /**
    //  * @memberof CLASS_MAP
    //  * @property Waypoint
    //  * @type {Waypoint}
    //  * @final
    //  */
    // Waypoint: Waypoint
    // /**
    //  * @memberof CLASS_MAP
    //  * @property PositionModel
    //  * @type {PositionModel}
    //  * @final
    //  */
    // PositionModel: PositionModel
};

/**
 * Provide a length number that can be accessed externally
 *
 * Since CLASS_MAP is an object, determining the length (number of keys) is a two-step process.
 * We do that here so any class that needs to know the length can simply import this property.
 *
 * @property CLASS_MAP_LENGTH
 * @type {number}
 */
export const CLASS_MAP_LENGTH = _keys(CLASS_MAP).length;
