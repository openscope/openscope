import _floor from 'lodash/floor';
import _isNil from 'lodash/isNil';
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
     * @param initialAirportWind {object{ speed: number, angle: number }}
     */
    constructor(initialAirportWind) {
        /**
         *
         *
         * @property angle
         * @type {number}
         * @default -9999
         */
        this.angle = -9999;

        /**
         *
         *
         * @property speed
         * @type {number}
         * @default -1
         */
        this.speed = -1;

        return this._init(initialAirportWind)
            ._setupHandlers()
            .enable();
    }

    /**
     * Method to initialize default wind values.
     *
     * @for AirportWindModel
     * @method _init
     * @param initialAirportWind {object}  wind value defaults from airport json
     * @private
     */
    _init(initialAirportWind) {
        if (_isNil(initialAirportWind)) {
            throw new Error('Invalid wind data provided to AirportWindModel. Epected and object with keys `angle` and `speed`.');
        }

        this.speed = initialAirportWind.speed;
        this.angle = initialAirportWind.angle;

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
        this._calculateNextWindHandler = this._calculateNextWind.bind(this);

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
        // We need to make sure that none of the properties are 0.
        // Otherwise, the function will always return 0, because 0 * anything = 0.
        if (this.speed === 0) {
            this.speed = 1;
        }
        if (this.angle === 0) {
            this.angle = 1;
        }

        const speed = calculateNormalDistributedNumber(this.speed);
        const initialAngle = calculateNormalDistributedNumber(this.angle);
        let nextAngle = initialAngle;

        if (initialAngle > 360) {
            // How many times can we subtract 360 and not get a negative number?
            const factorsOfThreeSixty = _floor(initialAngle / 360);

            nextAngle = initialAngle - (360 * factorsOfThreeSixty);
        }

        this.speed = _round(speed);
        this.angle = _round(nextAngle);
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
            this._calculateNextWindHandler,
            5,
            null,
            null
        );
    }

    // FIXME: taken from the `AircraftModel`. this class should provide a method that does this
    // const windTravelDirection = wind.angle + Math.PI;
    // const windTravelSpeedAtSurface = wind.speed;
    // const windTravelSpeed = windTravelSpeedAtSurface * (1 + (this.altitude * windIncreaseFactorPerFoot));
    // const windVector = vscale(vectorize_2d(windTravelDirection), windTravelSpeed);
}
