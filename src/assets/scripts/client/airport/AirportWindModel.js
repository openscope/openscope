import _clamp from 'lodash/clamp';
import _isNil from 'lodash/isNil';
import _round from 'lodash/round';
import GameController from '../game/GameController';
import { calculateNormalDistributedNumber } from '../math/core';
import {
    vectorize_2d,
    vscale
} from '../math/vector';

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
         * Current wind angle
         *
         * @property angle
         * @type {number}
         * @default -9999
         */
        this.angle = -9999;

        /**
         * Current wind speed in knots
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
            throw new Error('Invalid wind data provided to AirportWindModel. Expected and object with keys `angle` and `speed`.');
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
     * Calculates the current wind vector based on an aircraft's altitude
     *
     * @for AirportWindModel
     * @param altitude {number}
     * @return windVector {number}
     */
    calculateWindVector(altitude) {
        // FIXME: taken from the `AircraftModel`. this class should provide a method that does this
        const windIncreaseFactorPerFoot = 0.00002;  // 2.00% per thousand feet
        const windTravelDirection = this.angle + Math.PI;
        const windTravelSpeedAtSurface = this.speed;
        const windTravelSpeed = windTravelSpeedAtSurface * (1 + (altitude * windIncreaseFactorPerFoot));
        const windVector = vscale(vectorize_2d(windTravelDirection), windTravelSpeed);

        return windVector;
    }

    /**
     * Calculate next wind on a bell curve.
     *
     * @for AirportWindModel
     * @method calculateNextWind
     * @private
     */
    _calculateNextWind() {
        // We need to make sure that none of the properties are 0.
        // Otherwise, the function will always return 0, because 0 * anything = 0.
        // If the speed is less than 2, it tends to get stuck on '1' for a while.
        if (this.speed < 2) {
            this.speed = 5;
        }

        if (this.angle === 0) {
            this.angle = 180;
        }

        const speed = calculateNormalDistributedNumber(this.speed);
        const angle = calculateNormalDistributedNumber(this.angle);

        this.speed = _clamp(_round(speed), 0, 25);
        this.angle = _round(angle);
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
            3000,
            null,
            null
        );
    }
}
