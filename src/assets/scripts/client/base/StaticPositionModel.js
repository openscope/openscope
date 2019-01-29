import DynamicPositionModel from './DynamicPositionModel';
import {
    DEFAULT_SCREEN_POSITION,
    RELATIVE_POSITION_OFFSET_INDEX
} from '../constants/positionConstants';

/**
 * Like a DynamicPositionModel, but calculates once and PERMANANTLY stores the relative position [x, y] as a property
 *
 * @class StaticPositionModel
 * @extends DynamicPositionModel
 */
export default class StaticPositionModel extends DynamicPositionModel {
    /**
     * Coordinates may contain an optional elevation as a third element.
     * It must be suffixed by either 'ft' or 'm' to indicate the units.
     *
     * Latitude and Longitude numbers may be one of the following forms:
     *   Decimal degrees - `47.112388112`
     *   Decimal degrees - `'N47.112388112'`
     *   Decimal minutes - `'N38d38.109808'`
     *   Decimal seconds - `'N58d27m12.138'`
     *
     * @for StaticPositionModel
     * @constructor
     * @param coordinates {array<string|number>}    array in shape of [latitude, longitude]
     * @param reference {StaticPositionModel}       position to use for calculating relative position
     * @param magnetic_north {number}               magnetic declination (variation), in radians east
     */
    constructor(coordinates = [], reference = null, magnetic_north = 0) {
        super(coordinates, reference, magnetic_north);

        /**
         * Description of a location, expressed in 'kilometers' north and east of a given
         * reference position on the screen (which is almost always the airport). Note that
         * this location is offset from the reference position not in alignment with TRUE
         * north, but rather MAGNETIC north (which is the alignment of the scope).
         *
         * @for StaticPositionModel
         * @property _relativePosition
         * @type {array<number>} [kilometersNorth, kilometersEast]
         * @private
         */
        this._relativePosition = DEFAULT_SCREEN_POSITION;

        this._initializeRelativePosition();
    }

    /**
     * @for StaticPositionModel
     * @property relativePosition
     * @return {array<number>} [kilometersNorth, kilometersEast]
     */
    get referencePosition() {
        return this._referencePosition;
    }

    /**
     * Relative position, in km offset from the airport
     *
     * @for StaticPositionModel
     * @property relativePosition
     * @return {array<number>} [kilometersNorth, kilometersEast]
     */
    get relativePosition() {
        return this._relativePosition;
    }

    /**
     * Kilometers east (magnetic) of the reference position
     *
     * @for StaticPositionModel
     * @property x
     * @type {number}
     */
    get x() {
        return this._relativePosition[RELATIVE_POSITION_OFFSET_INDEX.LONGITUDINAL];
    }

    /**
     * Kilometers north (magnetic) of the reference position
     *
     * @for StaticPositionModel
     * @property y
     * @type {number}
     */
    get y() {
        return this._relativePosition[RELATIVE_POSITION_OFFSET_INDEX.LATITUDINAL];
    }

    /**
     * Dummy method to overwrite that of `DynamicPositionModel` in order to disallow the making of
     * any modifications to the `StaticPositionModel`.
     *
     * @for StaticPositionModel
     * @method setCoordinates
     */
    setCoordinates(...args) {
        console.warn(`Unexpected attempt to modify a StaticPositionModel, via .setCoordinates(${args});`);
        // do nothing, because `StaticPositionModel`s cannot be changed
    }

    /**
     * Calculate the relative position and store it in the property
     *
     * @for DynamicPositionModel
     * @method _initializeRelativePosition
     */
    _initializeRelativePosition() {
        if (!this._hasReferencePosition()) {
            return DEFAULT_SCREEN_POSITION;
        }

        this._relativePosition = DynamicPositionModel.calculateRelativePosition(
            this.gps,
            this._referencePosition,
            this._magneticNorth
        );
    }
}
