/* eslint-disable */
require('raf').polyfill();
import 'babel-polyfill';
import $ from 'jquery';
import App from './App';
import _has from 'lodash/has';
import _lowerCase from 'lodash/lowerCase';
import { DEFAULT_AIRPORT_ICAO } from './constants/airportConstants';
import { STORAGE_KEY } from './constants/storageKeys';

const getInitialAirport = () => {
    let airportName = DEFAULT_AIRPORT_ICAO;

    if (_has(localStorage, STORAGE_KEY.ATC_LAST_AIRPORT)) {
        airportName = _lowerCase(localStorage[STORAGE_KEY.ATC_LAST_AIRPORT]);
    }

    return airportName;
};

/**
 * Entry point for the application.
 *
 * Provides a way to grab the `body` element of the document and pass it to the app.
 */
export default (() => {
    const airportLoadList = window.AIRPORT_LOAD_LIST;
    const initialAirportToLoad = getInitialAirport();
    const $body = $('body');
    const app = new App($body, airportLoadList, initialAirportToLoad);
})();
