import 'babel-polyfill';
import 'raf/polyfill';
import isNil = require('lodash/isNil');
import lowerCase = require('lodash/lowerCase');
import * as $ from 'jquery';
import App from './App';
import ILoadableAirport from './common/i-loadable-airport';
import { DEFAULT_AIRPORT_ICAO } from './constants/airportConstants';
import { STORAGE_KEY } from './constants/storageKeys';

function _isAirportIcaoInLoadList(icao: string, airportLoadList: ILoadableAirport[]): boolean {
    if (isNil(icao)) {
        return false;
    }

    return airportLoadList.some((airport: ILoadableAirport): boolean => airport.icao === icao);
}

function getInitialAirport(airportLoadList: ILoadableAirport[]): string {
    let airportName: string = DEFAULT_AIRPORT_ICAO;
    const previousAirportIcaoFromLocalStorage: string = localStorage[STORAGE_KEY.ATC_LAST_AIRPORT];

    if (_isAirportIcaoInLoadList(previousAirportIcaoFromLocalStorage, airportLoadList)) {
        airportName = lowerCase(localStorage[STORAGE_KEY.ATC_LAST_AIRPORT]);
    }

    return airportName;
}

/**
 * Entry point for the application.
 *
 * Provides a way to grab the `body` element of the document and pass it to the app.
 */
export default ((): void => {
    const airportLoadList: ILoadableAirport[] = (<any>window).AIRPORT_LOAD_LIST;
    const initialAirportToLoad: any = getInitialAirport(airportLoadList);
    const $body: JQuery = $('body');

    // eslint-disable-next-line no-unused-vars
    new App($body, airportLoadList, initialAirportToLoad);
})();
