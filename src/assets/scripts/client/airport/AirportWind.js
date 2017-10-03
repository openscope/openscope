import AirportModel from './AirportModel';
import { calculateNextWind } from '../utilities/windUtilities';

/**
 * Mutable array that holds the information on the airport's current wind.
 */
export const airportWind = {
   speed: 10,
   angle: 0
};

export default class AirportWind {
    /**
     * Constructor
     */
    constructor() {}

    /**
     * Sets the initial airportWind, instead of the default.
     * Also can be used to force-set the wind.
     * 
     * @method setStaticWind
     * @param nextWind {Array} [speed, angle]
     */
    setStaticWind(nextWind) {
        airportWind = nextWind;
    }

    /**
     * Updates the wind, using a bell curve.
     */
    updateWind(wind) {
        return calculateNextWind(wind);
    }
}