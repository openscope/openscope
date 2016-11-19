import _keys from 'lodash/keys';
import FixModel from '../../airport/Fix/FixModel';
import PositionModel from '../PositionModel';

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
    FixModel: FixModel,

    /**
     *
     *
     */
    PositionModel: PositionModel
};

export const CLASS_MAP_LENGTH = _keys(CLASS_MAP).length;
