import _has from 'lodash/has';
import Airline from './AirlineModelComplex';

// Temporary const declaration here to attach to the window AND use as internal property
const airline = {};

/**
 * @class AirlineController
 */
export default class AirlineController {
    /**
     * @constructor
     */
    constructor() {
        this.airline = airline;
        this.airline.airlines = {};
        prop.airline = airline;
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
        const airlineToAdd = new Airline(
            icao,
            {
                url: `assets/airlines/${icao}.json`
            }
        );

        this.airline.airlines[icao] = airlineToAdd;
    }
}
