import _floor from 'lodash/floor';
import _round from 'lodash/round';
import GameController from '../game/GameController';
import { calculateNormalDistributedNumber } from '../math/core';

/**
 *
 *
 * @class AirportWindModel
 */
export default class AirportWindModel {
    /**
     * @constructor
     * @param initialAirportWind {object}
     */
    constructor(initialAirportWind) {
        /**
         *
         *
         * @proeprty angle
         * @type {number}
         */
        this.angle = 0;

        /**
         *
         *
         * @proeprty speed
         * @type {number}
         */
        this.speed = 10;

        /**
         * Instance of the running schedule.
         *
         * @type {gameTimeout|null}
         */
        this.currentSchedule = null;

        return this._init(initialAirportWind)
            ._setupHandlers()
            .enable();
    }

    /**
     * Method to initialize default wind values.
     *
     * @for AirportWindModel
     * @method _init
     * @param {Object} data - airport-specific defaults from AirportModel
     * @private
     */
    _init(data) {
        this.speed = data.speed;
        this.angle = data.angle;

        return this;
    }

    /**
     * Setup handler methods with proper scope binding
     *
     * @for AirportWindModel
     * @method _setupHandlers
     * @chainable
     * @private
     */
    _setupHandlers() {
        this._onCalculateNextWindHandler = this._calculateNextWind.bind(this);

        return this;
    }

    /**
     * Enable the instance
     *
     * @for AirportWindModel
     * @method enable
     * @chainable
     */
    enable() {
        this._onCalculateNextWindHandler;
        this._createWindUpdateTimer();

        return this;
    }

    /**
     * Actual math function to find the wind on a bell curve.
     *
     * @for AirportWindModel
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
     * Creates an interval timer that will call `._calculateNextWind()`
     *
     * @for AirportWindModel
     * @method createWindUpdateTimer
     * @return {gameTimeout} an instance of the new game timeout.
     * @private
     */
    _createWindUpdateTimer() {
        GameController.game_interval(
            this._onCalculateNextWindHandler,
            300,
            null,
            null
        );
    }
}
