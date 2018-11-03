import { radians_normalize } from '../math/circle';

/**
 * @class Compass
 */
class Compass {
    /**
     * @constructor
     */
    // istanbul ignore next
    constructor() {
        /**
         * Magnetic declination, in radians east
         *
         * @property _magneticNorth
         * @type {number}
         * @default 0
         */
        this._magneticNorth = 0;
    }

    /**
     * Facade to access the compass's magnetic declination value
     *
     * @for Compass
     * @property magneticNorth
     * @return {number}
     */
    get magneticNorth() {
        return this._magneticNorth;
    }

    /**
     * Fascade to change the compass's magnetic declination value
     *
     * @for Compass
     * @property magneticNorth
     * @param {number}
     */
    set magneticNorth(magneticNorth) {
        this._magneticNorth = magneticNorth;
    }

    /**
     *
     * @for Compass
     * @method normalize
     * @param radians {number}
     * @return {number} the angle relative to the magnetic north within [0,2π]
     */
    normalize(radians) {
        return radians_normalize(radians - this._magneticNorth);
    }

}

export default new Compass();
