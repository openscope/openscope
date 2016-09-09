import $ from 'jquery';
import Fiber from 'fiber';
import AircraftInstanceModel from './AircraftInstanceModel';

/**
 * Definitions for characteristics of a particular aircraft type
 *
 * @class Model
 * @extends Fiber
 */
const Model = Fiber.extend(function() {
  return {
    init: function(options = {}) {
      this.loading = true;
      this.loaded = false;
      this.priorityLoad = false;

      this.name = null;
      this.icao = null;

      this.engines = null;
      this.weightclass = null;
      this.category = null;

      this.rate = {
        turn:       0, // radians per second
        climb:      0, // feet per second
        descent:    0,
        accelerate: 0, // knots per second
        decelerate: 0,
      };

      this.runway = {
        takeoff: 0, // km needed to takeoff
        landing: 0,
      };

      this.speed = {
        min:     0,
        max:     0,
        landing: 0,
        cruise:  0
      };

      this._pendingAircraft = [];

      this.parse(options);

      if(options.url) this.load(options.url);

    },

    parse: function(data) {
      if(data.name) this.name = data.name;
      if(data.icao) this.icao = data.icao;

      if(data.engines) this.engines = data.engines;
      if(data.weightclass) this.weightclass = data.weightclass;
      if(data.category) this.category = data.category;
      if(data.ceiling) this.ceiling = data.ceiling;
      if(data.rate) {
        this.rate         = data.rate;
        this.rate.climb  = this.rate.climb;
        this.rate.descent = this.rate.descent;
      }

      if(data.runway) this.runway = data.runway;

      if(data.speed) this.speed = data.speed;
    },

    load: function(url) {
      this._url = url;
      zlsa.atc.loadAsset({
          url,
          immediate: false
      })
        .done(function (data) {
          this.parse(data);
          this.loading = false;
          this.loaded = true;
          this._generatePendingAircraft();
        }.bind(this))
        .fail(function (jqXHR, textStatus, errorThrown) {
          this.loading = false;
          this._pendingAircraft = [];
          console.error(`Unable to load aircraft/ ${this.icao} : ${textStatus}`);
        }.bind(this));
    },

    /**
     * Generate a new aircraft of this model
     *
     * Handles the case where this model may be asynchronously loaded
     */
    generateAircraft: function(options) {
        // TODO: prop names of loaded and loading are concerning. there may need to be state machine magiv happening here
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
          console.warn(`Unable to spawn aircraft/ ${options.icao} as loading failed`);
          return false;
        }
      }
      return this._generateAircraft(options);
    },

    /**
     * Actual implementation of generateAircraft
     */
    _generateAircraft: function(options) {
      options.model = this;
      const aircraft = new AircraftInstanceModel(options);
      prop.aircraft.list.push(aircraft);
      console.log(`Spawning ${options.category} : ${aircraft.getCallsign()}`);
      return true;
    },

    /**
     * Generate aircraft which were queued while the model loaded
     */
    _generatePendingAircraft: function() {
        // TODO: replace $ with _map()
      $.each(this._pendingAircraft, function (idx, options) {
        this._generateAircraft(options);
      }.bind(this));
      this._pendingAircraft = null;
    },
  };
});


export default Model;
