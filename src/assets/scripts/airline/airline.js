/* eslint-disable camelcase, no-underscore-dangle, no-mixed-operators, func-names, object-shorthand */
import Fiber from 'fiber';
import _forEach from 'lodash/forEach';

/**
 * An aircrcraft operating agency
 *
 * @class Airline
 * @extends Fiber
 */
const Airline = Fiber.extend(function() {
    return {
        /**
         * Create new airline
         */
        init: function(icao, options) {
            // ICAO airline designation
            this.icao = icao;
            // Agency name
            this.name = 'Default airline';
            // Radio callsign
            this.callsign = 'Default';
            // Parameters for flight number generation
            this.flightNumberGeneration = {
                // How many characters in the flight number
                length: 3,
                // Whether to use alphabetical characters
                alpha: false
            };

            // Named weighted sets of aircraft
            this.fleets = {
                default: []
            };

            this.loading = true;
            this.loaded = false;
            this.priorityLoad = false;
            this._pendingAircraft = [];
            this.parse(options);

            if (options.url) {
                this.load(options.url);
            }
        },

        /**
         * Initialize object from data
         */
        parse: function(data) {
            if (data.icao) {
                this.icao = data.icao;
            }

            if (data.name) {
                this.name = data.name;
            }

            if (data.callsign) {
                this.callsign = data.callsign.name;

                if (data.callsign.length) {
                    this.flightNumberGeneration.length = data.callsign.length;
                }

                this.flightNumberGeneration.alpha = (data.callsign.alpha === true);
            }

            if (data.fleets) {
                this.fleets = data.fleets;
            } else if (data.aircraft) {
                this.fleets.default = data.aircraft;
            }

            for (const f in this.fleets) {
                for (let j = 0; j < this.fleets[f].length; j++) {
                    this.fleets[f][j][0] = this.fleets[f][j][0].toLowerCase();
                }
            }
        },

        /**
         * Load the data for this airline
         */
        load: function(url) {
            this._url = url;

            if (this.loaded) {
                return;
            }

            zlsa.atc.loadAsset({
                url: url,
                immediate: this.priorityLoad
            })
            .done(function(data) {
                this.parse(data);

                this.loading = false;
                this.loaded = true;

                this.validateFleets();
                this._generatePendingAircraft();
            }.bind(this))
            .fail(function(jqXHR, textStatus, errorThrown) {
                this.loading = false;
                this._pendingAircraft = [];

                console.error(`Unable to load airline/${this.icao}: ${textStatus}`);
            }.bind(this));
        },

        /**
         * Return a random ICAO aircraft designator from the given fleet
         *
         * If no fleet is specified the default fleet is used
         */
        chooseAircraft: function(fleet) {
            if (!fleet) {
                fleet = 'default';
            }

            // TODO: this try/catch block could be improved. its hard to tell what his block is actually doing.
            try {
                return choose_weight(this.fleets[fleet.toLowerCase()]);
            } catch (error) {
                console.log(`Unable to find fleet ${fleet} for airline ${this.icao}`);

                throw error;
            }
        },

        /**
         * Create an aircraft
         */
        generateAircraft: function(options) {
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
                } else {
                    console.warn(`Unable to spawn aircraft for airline/ ${this.icao} as loading failed`);

                    return false;
                }
            }

            return this._generateAircraft(options);
        },

        /**
         * Create a flight number/identifier
         */
        generateFlightNumber: function () {
            const flightNumberLength = this.flightNumberGeneration.length;
            let flightNumber = '';
            let list = '0123456789';

            // Start with a number other than zero
            flightNumber += choose(list.substr(1));

            if (this.flightNumberGeneration.alpha) {
                for (let i = 0; i < flightNumberLength - 3; i++) {
                    flightNumber += choose(list);
                }

                list = 'abcdefghijklmnopqrstuvwxyz';

                for (let i = 0; i < 2; i++) {
                    flightNumber += choose(list);
                }
            } else {
                for (let i = 1; i < flightNumberLength; i++) {
                    flightNumber += choose(list);
                }
            }

            return flightNumber;
        },

        /**
         * Checks all fleets for valid aircraft identifiers and log errors
         */
        validateFleets: function () {
            for (const f in this.fleets) {
                for (let j = 0; j < this.fleets[f].length; j++) {
                    // Preload the aircraft model
                    aircraft_model_get(this.fleets[f][j][0]);

                    if (typeof this.fleets[f][j][1] !== 'number') {
                        console.warn(`Airline ${this.icao.toUpperCase()} uses non numeric weight for aircraft ${this.fleets[f][j][0]}, expect errors`);
                    }
                }
            }
        },

        _generateAircraft: function(options) {
            if (!options.callsign) {
                options.callsign = aircraft_callsign_new(options.airline);
            }

            if (!options.icao) {
                options.icao = this.chooseAircraft(options.fleet);
            }

            const model = aircraft_model_get(options.icao.toLowerCase());

            return model.generateAircraft(options);
            // FIXME: this block is unreachable, is it needed?
            // var icao = options.icao.toLowerCase();
        },

        /**
         * Generate aircraft which were queued while the model loaded
         */
        _generatePendingAircraft: function() {
            _forEach(this._pendingAircraft, (aircraftOptions) => {
                this._generateAircraft(aircraftOptions);
            });

            this._pendingAircraft = null;
        },
    };
});

/**
 * @function airline_init_pre
 */
const airline_init_pre = () => {
    prop.airline = {};
    prop.airline.airlines = {};
};

/**
 * @function airline_get
 * @param  {string} icao
 */
const airline_get = (icao) => {
    icao = icao.toLowerCase();

    if (!(icao in prop.airline.airlines)) {
        const airline = new Airline(
            icao,
            {
                url: `assets/airlines/${icao}.json`
            }
        );

        prop.airline.airlines[icao] = airline;
    }

    return prop.airline.airlines[icao];
};

// TODO: temporarily exposed to to maintain previous interface.
window.airline_init_pre = airline_init_pre;
window.airline_get = airline_get;
