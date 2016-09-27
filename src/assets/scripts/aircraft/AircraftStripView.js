import $ from 'jquery';
import { FLIGHT_CATEGORY } from './AircraftInstanceModel';
import { SELECTORS } from '../constants/selectors';

/**
 * @property AIRCRAFT_STRIP_TEMPLATE
 * @type {string}
 * @final
 */
const AIRCRAFT_STRIP_TEMPLATE = '<li class="strip"></li>';

/**
 * @class AircraftStripView
 */
export default class AircraftStripView {
    /**
     * @constructor
     */
    constructor(callsign = '', aircraftModel, destination = '', category = '') {
        this.$element = null;
        this.callsign = callsign;
        this.icao = aircraftModel.icao;
        this.destination = destination;
        this.weightclass = aircraftModel.weightclass;
        this.category = category;

        return this.createChildren()
                    .layout()
                    .redraw()
    }

    /**
     * @for AircraftStripView
     * @method
     */
    createChildren() {
        this.$element = $(AIRCRAFT_STRIP_TEMPLATE);

        return this;
    }

    /**
     * @for AircraftStripView
     * @method layout
     */
    layout() {
        this.$element.append(`<span class='callsign'>${this.callsign}</span>`);
        this.$element.append('<span class="heading">???</span>');
        this.$element.append('<span class="altitude">???</span>');
        this.$element.append(`<span class='aircraft'>${this.buildIcaoWithWeightClass()}</span>`);
        this.$element.append(`<span class="destination">${this.destination}</span>`);
        this.$element.append('<span class="speed">???</span>');
        this.$element.addClass(this.findClassnameForFlightCateogry());

        return this;
    }

    /**
     * @for AircraftStripView
     * @method redraw
     */
    redraw() {
        return this;
    }

    /**
     * @for AircraftStripView
     * @method enable
     */
    enable() {
        return this;
    }

    /**
     * @for AircraftStripView
     * @method disable
     */
    disable() {
        return this.destroy();
    }

    /**
     * @for AircraftStripView
     * @method destroy
     */
    destroy() {
        this.$element = null;
        this.callsign = '';
        this.icao = '';
        this.destination = '';
        this.weightclass = '';
        this.category = '';

        return this;
    }

    /**
     * @for AircraftStripView
     * @method buildIcaoWithWeightClass
     * @return aircraftIcao {string}
     */
    buildIcaoWithWeightClass() {
        let aircraftIcao = this.icao;

        // Bottom Line Data
        if (['H', 'U'].indexOf(this.weightclass) > -1) {
            aircraftIcao = `H/${this.icao}`;
        }

        return aircraftIcao;
    }

    /**
     * @for AircraftStripView
     * @method findClassnameForFlightCateogry
     * @return {string}
     */
    findClassnameForFlightCateogry() {
        return this.category === FLIGHT_CATEGORY.DEPARTURE
            ? SELECTORS.CLASSNAMES.DEPARTURE
            : SELECTORS.CLASSNAMES.ARRIVAL;
    }
}
