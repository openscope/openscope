import _forEach from 'lodash/forEach';
import _get from 'lodash/get';
import AircraftInstanceModel from './AircraftInstanceModel';

// DEPRECATED

/**
 * Definitions for characteristics of a particular aircraft type
 *
 * @class AircraftModel
 */
export default class AircraftModel {
    /**
     * @for AircraftModel
     * @constructor
     * @param options {object}
     */
    constructor(options = {}) {
        console.error('DEPRECATED');

        this.loading = true;
        this.loaded = false;
        this.priorityLoad = false;
        this.name = _get(options, 'name', null);
        this.icao = _get(options, 'icao', null);
        this.engines = null;
        this.ceiling = null;
        this.weightclass = _get(options, 'weightClass', null);
        this.category = _get(options, 'category', null);
        this._url = '';
        this._pendingAircraft = [];

        this.rate = {
            // radians per second
            turn: 0,
            // feet per second
            climb: 0,
            descent: 0,
            // knots per second
            accelerate: 0,
            decelerate: 0
        };

        this.runway = {
            // km needed to takeoff
            takeoff: 0,
            landing: 0
        };

        this.speed = {
            min: 0,
            max: 0,
            landing: 0,
            cruise: 0
        };

        this.parse(options);

        if (options.url) {
            this.load(options.url);
        }
    }

    /**
     * Set class properties with `data`.
     *
     * This method is run once on instantiation and again `onLoadSuccess`
     *
     * @for AircraftModel
     * @method parse
     * @param data {object}
     */
    parse(data) {
        this.engines = _get(data, 'engines', this.engines);
        this.ceiling = _get(data, 'ceiling', this.ceiling);
        this.runway = _get(data, 'runway', this.runway);
        this.speed = _get(data, 'speed', this.speed);
        this.rate = _get(data, 'rate', this.rate);
    }

    /**
     * @for AircraftModel
     * @method load
     * @param url {string}
     */
    load(url) {
        this._url = url;

        zlsa.atc.loadAsset({
            url,
            immediate: false
        })
        .done((response) => this.onLoadSuccess(response))
        .fail((...args) => this.onLoadError(...args));
    }

    /**
     * @for AircraftModel
     * @method onLoadSuccess
     * @param response {object}
     */
    onLoadSuccess = (response) => {
        this.parse(response);

        this.loading = false;
        this.loaded = true;

        this._generatePendingAircraft();
    };

    /**
     * @for AircraftModel
     * @method onLoadError
     * @param textStatus {string}
     */
    onLoadError = ({ textStatus }) => {
        this.loading = false;
        this._pendingAircraft = [];

        console.error(`Unable to load aircraft/ ${this.icao} : ${textStatus}`);
    };


    /**
     * Generate a new aircraft of this model
     *
     * Handles the case where this model may be asynchronously loaded
     *
     * @for AircraftModel
     * @method generateAircraft
     * @param options {object}
     */
    generateAircraft(options) {
        // TODO: prop names of loaded and loading are concerning. there may be state machine magic happening here
        // that could lead to issues
        if (!this.loaded) {
            if (this.loading) {
                this._pendingAircraft.push(options);

                if (!this.priorityLoad) {
                    zlsa.atc.loadAsset({
                        url: this._url,
                        immediate: true
                    });

                    this.priorityLoad = true;
                }

                return true;
            }

            console.warn(`Unable to spawn aircraft/ ${options.icao} as loading failed`);

            return false;
        }

        return this._generateAircraft(options);
    }

    /**
     * Actual implementation of generateAircraft
     *
     * @for AircraftModel
     * @method _generateAircraft
     * @param options {object}
     * @return {boolean}
     * @private
     */
    _generateAircraft(options) {
        options.model = this;
        const aircraft = new AircraftInstanceModel(options);

        prop.aircraft.list.push(aircraft);

        console.log(`Spawning ${options.category} : ${aircraft.getCallsign()}`);

        return true;
    }

    /**
     * Generate aircraft which were queued while the model loaded
     *
     * @for AircraftModel
     * @method _generatePendingAircraft
     */
    _generatePendingAircraft() {
        _forEach(this._pendingAircraft, (pendingAircraftOptions) => {
            this._generateAircraft(pendingAircraftOptions);
        });

        this._pendingAircraft = [];
    }
}
