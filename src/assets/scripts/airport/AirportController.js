import _has from 'lodash/has';
import _forEach from 'lodash/forEach';
import Airport from './AirportModel';
import { AIRPORT_LOAD_LIST } from './airportLoadList';
import { STORAGE_KEY } from '../constants/storageKeys';

// Temporary const declaration here to attach to the window AND use as internal property
const airport = {};

/**
 * @class AirportController
 */
export default class AirportController {
    /**
     * @constructor
     */
    constructor(updateRun) {
        this.updateRun = updateRun;
        this.airport = airport;
        this.airport.airports = {};
        this.airport.current = null;
    }

    /**
     * @for AirportController
     * @method init_pre
     */
    init_pre() {
        prop.airport = {};
        prop.airport.airports = {};
        prop.airport.current = null;
    }

    /**
     * Load each airport in the `airportLoadList`
     *
     * @for AirportController
     * @method init
     */
    init() {
        _forEach(AIRPORT_LOAD_LIST, (airport) => {
            this.airport_load(airport);
        });
    }

    /**
     * @for AirportController
     * @method ready
     */
    ready() {
        let airportName = 'ksfo';

        if (!_has(localStorage, STORAGE_KEY.ATC_LAST_AIRPORT) ||
            !_has(prop.airport.airports, STORAGE_KEY.ATC_LAST_AIRPORT)
        ) {
            airportName = 'ksfo';
        }

        this.airport_set(airportName);
    }

    /**
     * @for AirportController
     * @method airport_set
     */
    airport_set(icao) {
        // TODO: simplify these ifs by combining them
        if (!icao) {
            if (_has(localStorage, STORAGE_KEY.ATC_LAST_AIRPORT)) {
                icao = localStorage[STORAGE_KEY.ATC_LAST_AIRPORT];
            }
        }

        icao = icao.toLowerCase();

        if (!icao in prop.airport.airports) {
            console.log(`${icao}: no such airport`);

            return;
        }

        if (prop.airport.current) {
            prop.airport.current.unset();
            window.aircraftController.aircraft_remove_all();
        }

        const newAirport = prop.airport.airports[icao];
        newAirport.set();
    }

    /**
     * @function airport_load
     * @param icao {string}
     * @param level {string}
     * @param name {string}
     * @return airport {AirtportInstance}
     */
    airport_load({ icao, level, name }) {
        icao = icao.toLowerCase();

        if (icao in prop.airport.airports) {
            console.log(`${icao}: already loaded`);

            return null;
        }

        // create a new Airport with a reference to this.updateRun()
        const airport = new Airport(
            {
                icao,
                level,
                name
            },
            this.updateRun
        );

        this.airport_add(airport);

        return airport;
    };

    /**
     * @function airport_add
     * @param airport
     */
    airport_add(airport) {
        prop.airport.airports[airport.icao.toLowerCase()] = airport;
    };

    /**
     * @function airport_get
     * @param icao {string}
     * @return
     */
    airport_get(icao) {
        if (!icao) {
            return prop.airport.current;
        }

        return prop.airport.airports[icao.toLowerCase()];
    };
}
