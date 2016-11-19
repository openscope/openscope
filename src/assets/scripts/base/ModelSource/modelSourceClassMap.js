import _keys from 'lodash/keys';
import FixModel from '../../airport/Fix/FixModel';
// import Waypoint from '../../aircraft/Waypoint';
// import PositionModel from '../PositionModel';

/**
 *
 * @property CLASS_MAP
 * @type {object}
 * @final
 */
export const CLASS_MAP = {
    /**
     *
     *
     */
    FixModel: FixModel

    // TODO: Future additions to the pool each of these models need some work in orer to integrate
    // into the pool structure
    //
    // /**
    //  *
    //  *
    //  */
    // Waypoint: Waypoint
    //
    // /**
    //  *
    //  *
    //  */
    // PositionModel: PositionModel
};

export const CLASS_MAP_LENGTH = _keys(CLASS_MAP).length;
