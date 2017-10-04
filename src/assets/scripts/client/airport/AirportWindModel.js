import _floor from 'lodash/floor';
import { calculateNormalDistributedNumber } from '../math/core';

export default class AirportWindModel {
    /**
     * Constructor. Sets up the class with
     * invalid properties.
     * 
     * @constructor
     */
    constructor(data) {
        this.angle = -9999;
        this.speed = -1;

        return this._init(data);
    }

    /**
     * Method to initialize default wind values.
     * 
     * @method _init
     * @private
     */
    _init(data) {
        this.speed = data.speed;
        this.angle = data.angle;

        const nextWind = {
            speed: this.speed,
            angle: this.angle
        };

        return this._calculateNextWind(nextWind);
    }

    /**
     * Actual math function to find the wind on a bell curve.
     * 
     * @method calculateNextWind
     * @param {Object} data 
     * @private
     */
    _calculateNextWind(data) {
        const speed = calculateNormalDistributedNumber(data.speed);
        const initialAngle = calculateNormalDistributedNumber(data.angle);
        let nextAngle = initialAngle;
    
        if (initialAngle > 360) {
            // How many times can we subtract 360 and not get a negative number?
            const factorsOfThreeSixty = _floor(initialAngle / 360);
    
            nextAngle = initialAngle - (360 * factorsOfThreeSixty);
        }
    
        const nextWind = {
            speed: speed,
            angle: nextAngle
        };
        
        return nextWind;
    }

    /**
     * Creates the timer to update the wind.
     * 
     * @method createWindUpdateTimer
     */
    createWindUpdateTimer() {

    }

    /**
     * Resets the wind, and the timer.
     * 
     * @method reset
     */
    reset() {
        this.speed = 10;
        this.angle = 0;
    }

    /**
     * Getter for the current wind.
     * 
     * @return {Object} wind, with properties `speed` and `angle`.
     */
    get wind() {
        const consiseWind = {
            speed: this.speed,
            angle: this.angle
        };

        return consiseWind;
    }
}
