import _has from 'lodash/has';
import AirlineCollection from './AirlineCollection';
import Airline from './AirlineModelComplex';

// Temporary const declaration here to attach to the window AND use as internal property
const airline = {};

/**
 * @class AirlineController
 */
export default class AirlineController {
    /**
     * @constructor
     * @for AirlineController
     * @param airlineList {array}
     */
    constructor(airlineList) {
        this.airlineCollection = new AirlineCollection(airlineList);

        this.airline = airline;
        this.airline.airlines = {};
        // window.prop.airline = airline;
    }

    /**
     * @for AirlineController
     * @method findAirlineById
     * @param airlineId {string}
     * @return {AirlineModel}
     */
    findAirlineById(airlineId) {
        return this.airlineCollection.findAirlineById(airlineId);
    }

    /**
     * @for AirlineController
     * @method airline_get
     * @param icao {string}
     * return {AirlineModel|null}
     */
    airline_get(icao) {
        icao = icao.toLowerCase();

        if (!_has(this.airline.airlines, icao)) {
            this.addAirline(icao);
        }

        return this.airline.airlines[icao];
    }

    /**
     * @for airlineController
     * @method addAirline
     * @param icao {string}
     */
    addAirline(icao) {
        console.error('.addAirline() is a deprecated method');
        const airlineToAdd = new Airline(
            icao,
            {
                url: `assets/airlines/${icao}.json`
            }
        );

        this.airline.airlines[icao] = airlineToAdd;
    }
}
