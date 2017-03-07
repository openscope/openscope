import PositionModel from './PositionModel';
import { DEFAULT_SCREEN_POSITION } from '../constants/positionConstants';

/**
 * Calculates and permanently stores the screen position (x, y) as a property
 *
 * @class StaticPositionModel
 * @extends PositionModel
 */
export default class StaticPositionModel extends PositionModel {
    constructor(coordinates = [], reference, magnetic_north = 0) {
        super(coordinates, reference, magnetic_north);
        /**
         * @property x
         * @type {number}
         * @default 0
         */
        this.x = 0;

        /**
         * @property y
         * @type {number}
         * @default 0
         */
        this.y = 0;

        this._initializeScreenPosition();
    }

    get position() {
        return [this.x, this.y];
    }

    /**
     * Return a copy of this `StaticPositionModel` as a `PositionModel`
     *
     * @for StaticPositionModel
     * @method toPositionModel
     * @return {PositionModel}
     */
    toPositionModel() {
        return new PositionModel(this.gps, this.reference_position, this.magnetic_north);
    }

    /**
     * @for PositionModel
     * @method _initializeScreenPosition
     */
    _initializeScreenPosition() {
        if (!this._hasReferencePosition()) {
            return DEFAULT_SCREEN_POSITION;
        }

        const [x, y] = PositionModel.calculatePosition(this.gps, this.reference_position, this.magnetic_north);

        this.x = x;
        this.y = y;
    }
}
