import AirportModel from '../airport/AirportModel';
import AirportController from '../airport/AirportController';
import { getNormalDistributedNumber } from '../math/core';

/**
 * @class WindController
 */
class WindController {
    /**
     * Constructor. Generates the initial wind for
     * an airport. Should be called on initialization, or
     * when an airport is changed.
     * 
     * @method constructor
     * @param {AirportModel}
     */
    constructor(airport) {
        /**
         * Our {AirportModel} to use.
         */
        this.airport = airport;

        /**
         * Initial wind speed.
         */
        this._defaultWindSpeed = airport.wind.speed;

        /**
         * Initial wind angle
         */
        this._defaultWindAngle = airport.wind.angle;

        this.updateWindSpeed(_defaultWindSpeed);
        this.updateWindAngle(_defaultWindAngle);
    }

    /**
     * Gets a new speed for the wind.
     * 
     * @param averageSpeed {Number} - the average windspeed [knots]
     * @return {Number} - the new windspeed
     */
    updateWindSpeed(averageSpeed) {
        return getNormalDistributedNumber(averageSpeed);
    }

    /**
     * Gets a new wind angle for the wind.
     * 
     * @param averageAngle {Number} - the average wind angle [degrees]
     * @return {Number} - the new wind angle, from 0 to 359
     */
    updateWindAngle(averageAngle) {
        const newAngle = getNormalDistributedNumber(averageAngle);

        if (newAngle >= 360) {
            return newAngle - 360;
        }

        return newAngle;
    }
}

export default new WindController(AirportController.current);
