import $ from 'jquery';
import _isNil from 'lodash/isNil';
import _lowerCase from 'lodash/lowerCase';
import App from './App';
import { DEFAULT_AIRPORT_ICAO } from './constants/airportConstants';
import { STORAGE_KEY } from './constants/storageKeys';

require('raf').polyfill();

function _isAirportIcaoInLoadList(icao, airportLoadList) {
    if (_isNil(icao)) {
        return false;
    }

    return airportLoadList.some((airport) => airport.icao === icao);
}

function getInitialAirport(airportLoadList) {
    let airportName = DEFAULT_AIRPORT_ICAO;
    const previousAirportIcaoFromLocalStorage = localStorage[STORAGE_KEY.ATC_LAST_AIRPORT];

    if (_isAirportIcaoInLoadList(previousAirportIcaoFromLocalStorage, airportLoadList)) {
        airportName = _lowerCase(localStorage[STORAGE_KEY.ATC_LAST_AIRPORT]);
    }

    return airportName;
}

/**
 * Entry point for the application.
 *
 * Provides a way to grab the `body` element of the document and pass it to the app.
 */
export default (() => {
    const airportLoadList = window.AIRPORT_LOAD_LIST;
    const initialAirportToLoad = getInitialAirport(airportLoadList);
    const $body = $('body');
    // eslint-disable-next-line no-unused-vars
    const app = new App($body, airportLoadList, initialAirportToLoad);
})();
