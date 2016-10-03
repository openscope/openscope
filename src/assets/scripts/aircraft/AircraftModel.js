/* eslint-disable camelcase, no-underscore-dangle, no-mixed-operators, func-names, object-shorthand, no-param-reassign, no-undef */
import $ from 'jquery';
import _get from 'lodash/get';
import AircraftInstanceModel from './AircraftInstanceModel';

/**
 * Definitions for characteristics of a particular aircraft type
 *
 * @class Model
 */
export default class Model {
    constructor(options = {}) {
        this.loading = true;
        this.loaded = false;
        this.priorityLoad = false;
        this.name = _get(options, 'name', null);
        this.icao = _get(options, 'icao', null);
        this.engines = null;
        this.weightclass = _get(options, 'weightClass', null);
        this.category = _get(options, 'category', null);

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

        this._pendingAircraft = [];

        this.parse(options);

        if (options.url) {
            this.load(options.url);
        }
    }

    parse(data) {
        // TODO: how much of this could happen in the constructor/init methods?
        if (data.engines) {
            this.engines = data.engines;
        }

        if (data.ceiling) {
            this.ceiling = data.ceiling;
        }

        if (data.runway) {
            this.runway = data.runway;
        }

        if (data.speed) {
            this.speed = data.speed;
        }

        if (data.rate) {
            this.rate = data.rate;
        }
    }

    load(url) {
        this._url = url;

        zlsa.atc.loadAsset({
            url,
            immediate: false
        })
        .done((data) => {
            this.parse(data);
            this.loading = false;
            this.loaded = true;
            this._generatePendingAircraft();
        })
        .fail((jqXHR, textStatus, errorThrown) => {
            this.loading = false;
            this._pendingAircraft = [];

            console.error(`Unable to load aircraft/ ${this.icao} : ${textStatus}`);
        });
    }

    /**
     * Generate a new aircraft of this model
     *
     * Handles the case where this model may be asynchronously loaded
     */
    generateAircraft(options) {
        // TODO: prop names of loaded and loading are concerning. there may need to be state
        // machine magic happening here that could lead to issues
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
     */
    _generatePendingAircraft() {
        // TODO: replace $ with _map()
        $.each(this._pendingAircraft, (idx, options) => {
            this._generateAircraft(options);
        });

        this._pendingAircraft = [];
    }
}
