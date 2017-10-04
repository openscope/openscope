import _floor from 'lodash/floor';
import _round from 'lodash/round';
import GameController from '../game/GameController';
import { calculateNormalDistributedNumber } from '../math/core';

export default class AirportWindModel {
    /**
     * Constructor. Sets up the class with
     * invalid properties.
     * 
     * @constructor
     */
    constructor(data) {
        this.angle = 0;
        this.speed = 10;

        /**
         * Instance of the running schedule.
         * 
         * @type {gameTimeout|null}
         */
        this.currentSchedule = null;

        return this._init(data);
    }

    /**
     * Method to initialize default wind values.
     * 
     * @method _init
     * @param {Object} data - airport-specific defaults from AirportModel
     * @private
     */
    _init(data) {
        this.speed = data.speed;
        this.angle = data.angle;

        return this._doUpdateTimer();
    }

    /**
     * Actual math function to find the wind on a bell curve.
     * 
     * @method calculateNextWind
     * @private
     */
    _calculateNextWind() {
        // We don't want decimal values, so we round.
        const speed = _round(calculateNormalDistributedNumber(this.speed));
        const initialAngle = _round(calculateNormalDistributedNumber(this.angle));
        let nextAngle = initialAngle;
    
        if (initialAngle > 360) {
            // How many times can we subtract 360 and not get a negative number?
            const factorsOfThreeSixty = _floor(initialAngle / 360);
    
            nextAngle = initialAngle - (360 * factorsOfThreeSixty);
        }
    
        this.speed = speed;
        this.angle = nextAngle;
    }

    /**
     * Creates the timer to update the wind.
     * 
     * @method createWindUpdateTimer
     * @private
     * @return {gameTimeout} an instance of the new game timeout.
     */
    _createWindUpdateTimer() {
        return GameController.game_interval(
            this._calculateNextWind(),
            300,
            null,
            null
        );
    }
}
