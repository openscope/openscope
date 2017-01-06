import _isNil from 'lodash/isNil';
import AirlineCollection from './AirlineCollection';

/**
 * Controller for all things Airline.
 *
 * @class AirlineController
 */
export default class AirlineController {
    /**
     * @constructor
     * @for AirlineController
     * @param airlineList {array<object>}
     */
    constructor(airlineList) {
        /**
         * Instance of an `AirlineCollection`
         *
         * @property airlineCollection
         * @type {AirlineCollection}
         */
        this.airlineCollection = new AirlineCollection(airlineList);
    }

    /**
     * Given an `airlineId` find and return an `AirlineModel`
     *
     * @for AirlineController
     * @method findAirlineById
     * @param airlineId {string}
     * @return {AirlineModel}
     */
    findAirlineById(airlineId) {
        return this.airlineCollection.findAirlineById(airlineId);
    }

    /**
     * Remove a provided flightNumber from an airline's list of `flightNumbersInUse`
     *
     * Used when an aircraft leaves controlled airspace. Removing a flightNumber
     * from the list allows it to be used again by another aircraft
     *
     * @for AirlineCollection
     * @method removeFlightNumberFromList
     * @param airline {string}
     * @param callsign {string}
     */
    removeFlightNumberFromList(airline, callsign) {
        const airlineModel = this.findAirlineById(airline);

        if (_isNil(airlineModel)) {
            return;
        }

        airlineModel.removeFlightNumber(callsign);
    }

    /**
     * Reset session specific class properties
     *
     * Used when changing airports. Clears flightNumbersInUse and
     * any other properties specific to a current session at a
     * specific airport
     *
     * @for AirlineController
     * @method reset
     */
    reset() {
        this.airlineCollection.reset();
    }
}
