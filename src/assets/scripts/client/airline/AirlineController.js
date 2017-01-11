import _isNil from 'lodash/isNil';
import AirlineCollection from './AirlineCollection';
import AirlineModel from './AirlineModel';

/**
 * Controller for all things Airline
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
     * Convenience property that exposes a list of all `flightNumbers` currently in use
     *
     * Useful for determining if a freshly generated `flightNumber` is currently in use.
     *
     * @for AirlineController
     * @method flightNumbers
     * @return {array<string>}
     */
    get flightNumbers() {
        return this.airlineCollection.flightNumbers;
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
     * Generates a new `flightNumber` using the `flightNumberGeneration` rules of a given `AirlineModel`.
     *
     * This method provides a higher-level view of all the `flightNumbers` in use, and gurantees unique
     * `flightNumbers` across all airlines. Though not as realistic, having unique `flightNumbers` allows
     * for faster processing of aircraft commands by using only a `flightNumber` for a command.
     *
     * @for AirlineController
     * @method generateFlightNumberWithAirlineModel
     * @param airlineModel {AirlineModel}
     * @return flightNumber {string}
     */
    generateFlightNumberWithAirlineModel(airlineModel) {
        if (!(airlineModel instanceof AirlineModel)) {
            throw new TypeError('Invalid parameter. Expected airlineModel to be an instance of AirlineModel');
        }

        const flightNumber = airlineModel.generateFlightNumber();

        if (this._hasFlightNumber(flightNumber)) {
            this.generateFlightNumberWithAirlineModel(airlineModel);
        }

        airlineModel.addFlightNumberToInUse(flightNumber);

        return flightNumber;
    }

    /**
     * Remove a provided flightNumber from an airline's list of `activeFlightNumbers`
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
            throw new TypeError('Invalid airline passed to removeFlightNumberFromList, no AirlineModel found');
        }

        airlineModel.removeFlightNumber(callsign);
    }

    /**
     * Reset session specific class properties
     *
     * Used when changing airports. Clears activeFlightNumbers and
     * any other properties specific to a current session at a
     * specific airport
     *
     * @for AirlineController
     * @method reset
     */
    reset() {
        this.airlineCollection.reset();
    }

    /**
     * Used to determine if a provided `flightNumber` is already in use
     *
     * @for AirlineController
     * @method _hasFlightNumber
     * @param flightNumber {string}
     * @returns {boolean}
     */
    _hasFlightNumber(flightNumber) {
        const invalidIndex = -1;

        return this.flightNumbers.indexOf(flightNumber) !== invalidIndex;
    }
}
