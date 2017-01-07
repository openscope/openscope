import _get from 'lodash/get';
import _has from 'lodash/has';
import _forEach from 'lodash/forEach';
import { choose, choose_weight } from '../utilities/generalUtilities';

/**
 * @DEPRECATED
 */

/**
 * An aircraft operating agency
 *
 * @class AirlineModel
 */
export default class AirlineModel {
    // /**
    //  * Create new airline
    //  *
    //  * @constructor
    //  * @for AirlineModel
    //  * @param icao {string}
    //  * @param options {object}
    //  */
    // constructor(icao, options) {
    //     // ICAO airline designation
    //     this.icao = icao;
    //     // Agency name
    //     this.name = _get(options, 'name', 'Default airline');
    //     // Radio callsign
    //     this.callsign = 'Default';
    //     // Parameters for flight number generation
    //     this.flightNumberGeneration = {
    //         // How many characters in the flight number
    //         length: 3,
    //         // Whether to use alphabetical characters
    //         alpha: false
    //     };
    //
    //     // Named weighted sets of aircraft
    //     this.fleets = {
    //         default: []
    //     };
    //
    //     this.loading = true;
    //     this.loaded = false;
    //     this.priorityLoad = false;
    //     this._pendingAircraft = [];
    //
    //     this.parse(options);
    //
    //     if (options.url) {
    //         this.load(options.url);
    //     }
    // }
    //
    // /**
    //  * Initialize object from data
    //  *
    //  * This method will be called twice at minimum; once on instantiation and again once
    //  * `onLoadSuccess`. Most of the properties below will only be available `onLoadSuccess`
    //  *
    //  * @for AirlineModel
    //  * @method parse
    //  * @param data {object}
    //  */
    // parse(data) {
    //     this.icao = _get(data, 'icao', this.icao);
    //
    //     if (data.callsign) {
    //         this.callsign = data.callsign.name;
    //
    //         if (data.callsign.length) {
    //             this.flightNumberGeneration.length = data.callsign.length;
    //         }
    //
    //         this.flightNumberGeneration.alpha = _has(data, 'callsign.alpha');
    //     }
    //
    //     if (data.fleets) {
    //         this.fleets = data.fleets;
    //     } else if (data.aircraft) {
    //         this.fleets.default = data.aircraft;
    //     }
    //
    //     _forEach(this.fleets, (fleet) => {
    //         _forEach(fleet, (aircraftInFleet) => {
    //             const NAME_INDEX = 0;
    //             aircraftInFleet[NAME_INDEX] = aircraftInFleet[NAME_INDEX].toLowerCase();
    //         });
    //     });
    // }
    //
    // /**
    //  * Load the data for this airline
    //  *
    //  * @for AirlineModel
    //  * @method load
    //  * @param url {string}
    //  */
    // load(url) {
    //     this._url = url;
    //
    //     if (this.loaded) {
    //         return;
    //     }
    //
    //     zlsa.atc.loadAsset({
    //         url: url,
    //         immediate: this.priorityLoad
    //     })
    //     .done((response) => this.onLoadSuccess(response))
    //     .fail((...args) => this.onLoadError(...args));
    // }
    //
    // /**
    //  * @for AirlineModel
    //  * @method onLoadSuccess
    //  * @param response {object}
    //  */
    // onLoadSuccess(response) {
    //     this.parse(response);
    //
    //     this.loading = false;
    //     this.loaded = true;
    //
    //     this.validateFleets();
    //     this._generatePendingAircraft();
    // }
    //
    // /**
    //  * @for AirlineModel
    //  * @method onLoadError
    //  * @param textStatus {string}
    //  */
    // onLoadError({ textStatus }) {
    //     this.loading = false;
    //     this._pendingAircraft = [];
    //
    //     console.error(`Unable to load airline/${this.icao}: ${textStatus}`);
    // }
    //
    // /**
    //  * Return a random ICAO aircraft designator from the given fleet
    //  *
    //  * If no fleet is specified the default fleet is used
    //  *
    //  * @for AirlineModel
    //  * @method chooseAircraft
    //  * @param fleet
    //  * @return
    //  */
    // chooseAircraft(fleet) {
    //     if (!fleet) {
    //         fleet = 'default';
    //     }
    //
    //     // TODO: why is this a try/catch?
    //     // TODO: this try/catch block could be improved. its hard to tell what his block is actually doing.
    //     try {
    //         return choose_weight(this.fleets[fleet.toLowerCase()]);
    //     } catch (error) {
    //         console.log(`Unable to find fleet ${fleet} for airline ${this.icao}`);
    //
    //         throw error;
    //     }
    // }
    //
    // /**
    //  * Create an aircraft
    //  *
    //  * @for AirlineModel
    //  * @method generateAircraft
    //  * @param options {object}
    //  * @return
    //  */
    // generateAircraft(options) {
    //     if (!this.loaded) {
    //         if (this.loading) {
    //             this._pendingAircraft.push(options);
    //
    //             if (!this.priorityLoad) {
    //                 zlsa.atc.loadAsset({
    //                     url: this._url,
    //                     immediate: true
    //                 });
    //
    //                 this.priorityLoad = true;
    //             }
    //
    //             return true;
    //         }
    //
    //         console.warn(`Unable to spawn aircraft for airline/ ${this.icao} as loading failed`);
    //
    //         return false;
    //     }
    //
    //     return this._generateAircraft(options);
    // }
    //
    // // TODO: the logic here can be simplified.
    // /**
    //  * Create a flight number/identifier
    //  *
    //  * @for AirlineModel
    //  * @method generateFlightNumber
    //  * @return flightNumber {string}
    //  */
    // generateFlightNumber() {
    //     let flightNumber = '';
    //     let list = '0123456789';
    //
    //     // Start with a number other than zero
    //     flightNumber += choose(list.substr(1));
    //
    //     if (this.flightNumberGeneration.alpha) {
    //         // TODO: why `this.flightNumberGeneration.length - 3`?  enumerate the magic number.
    //         for (let i = 0; i < this.flightNumberGeneration.length - 3; i++) {
    //             flightNumber += choose(list);
    //         }
    //
    //         list = 'abcdefghijklmnopqrstuvwxyz';
    //
    //         for (let i = 0; i < 2; i++) {
    //             flightNumber += choose(list);
    //         }
    //     } else {
    //         for (let i = 1; i < this.flightNumberGeneration.length; i++) {
    //             flightNumber += choose(list);
    //         }
    //     }
    //
    //     // if this flightNumber already exists, repeat the process of generating a new flightNumber
    //     if (window.aircraftController.isCallsignInList(flightNumber)) {
    //         return this.generateFlightNumber();
    //     }
    //
    //     return flightNumber;
    // }
    //
    // /**
    //  * Checks all fleets for valid aircraft identifiers and log errors
    //  *
    //  * @for AirlineModel
    //  * @method validateFleets
    //  */
    // validateFleets() {
    //     _forEach(this.fleets, (fleet) => {
    //         _forEach(fleet, (fleetAircraft) => {
    //             const NAME_INDEX = 0;
    //             // Preload the aircraft model
    //             window.aircraftController.aircraft_model_get(fleetAircraft[NAME_INDEX]);
    //
    //             if (typeof fleetAircraft[1] !== 'number') {
    //                 console.warn(`Airline ${this.icao.toUpperCase()} uses non numeric weight for aircraft ${fleetAircraft[NAME_INDEX]}, expect errors`);
    //             }
    //         });
    //     });
    // }
    //
    // /**
    //  * Generate aircraft which were queued while the model loaded
    //  *
    //  * @for AirlineModel
    //  * @method _generatePendingAircraft
    //  * @private
    //  */
    // _generatePendingAircraft() {
    //     _forEach(this._pendingAircraft, (aircraftOptions) => {
    //         this._generateAircraft(aircraftOptions);
    //     });
    //
    //     this._pendingAircraft = null;
    // }
    //
    // /**
    //  * @for AirlineModel
    //  * @method _generateAircraft
    //  * @param options {object}
    //  * @return {function}
    //  */
    // _generateAircraft(options) {
    //     if (!options.callsign) {
    //         options.callsign = this.generateFlightNumber();
    //
    //         window.aircraftController.addCallsignToList(options.callsign);
    //     }
    //
    //     if (!options.icao) {
    //         options.icao = this.chooseAircraft(options.fleet);
    //     }
    //
    //     const model = window.aircraftController.aircraft_model_get(options.icao.toLowerCase());
    //
    //     return model.generateAircraft(options);
    }
}
