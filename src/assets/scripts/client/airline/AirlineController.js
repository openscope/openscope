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
     *
     *
     */
    reset() {
        this.airlineCollection.reset();
    }
}
