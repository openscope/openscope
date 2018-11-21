import 'babel-polyfill';
import $ from 'jquery';
import _isNil from 'lodash/isNil';
import _lowerCase from 'lodash/lowerCase';
import App from './App';
import { DEFAULT_AIRPORT_ICAO } from './constants/airportConstants';
import { STORAGE_KEY } from './constants/storageKeys';

import * as raf from 'raf';
raf.polyfill();

function _isAirportIcaoInLoadList(icao: string, airportLoadList: any): boolean {
    if (_isNil(icao)) {
        return false;
    }

    return airportLoadList.some((airport) => airport.icao === icao);
}

function getInitialAirport(airportLoadList: any): any {
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
export default ((): void => {
    const airportLoadList: any[] = (<any>window).AIRPORT_LOAD_LIST;
    const initialAirportToLoad: any = getInitialAirport(airportLoadList);
    const $body: HTMLBodyElement = $('body');
    // eslint-disable-next-line no-unused-vars
    const app: App = new App($body, airportLoadList, initialAirportToLoad);
})();
