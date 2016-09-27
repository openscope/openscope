import $ from 'jquery';
import { FLIGHT_CATEGORY } from './AircraftInstanceModel';
import { SELECTORS } from '../constants/selectors';

/**
 * unique id for each AircraftStripView instance
 *
 * @property ID
 * @type {number}
 */
let ID = 0;

/**
 * @property AIRCRAFT_STRIP_TEMPLATE
 * @type {string}
 * @final
 */
const AIRCRAFT_STRIP_TEMPLATE = '<li class="strip"></li>';

/**
 * Height of the AircraftStrip DOM element in px.
 *
 * @property AIRCRAFT_STRIP_HEIGHT
 * @type {number}
 * @final
 */
const AIRCRAFT_STRIP_HEIGHT = 45;

/**
 * @class AircraftStripView
 */
export default class AircraftStripView {
    /**
     * @for AircraftStripView
     * @constructor
     * @param callsign {string}  this property is a result of a function call and not directly tied to the
     *                           `AircraftInstanceModel`, thus it is included explicitly intead of obtainined
     *                           from the `AircraftInstanceModel`
     * @param aircraftInstanceModel {AircraftInstanceModel}
     */
    constructor(callsign = '', aircraftInstanceModel) {
        this._id = ID++;
        this.$element = null;

        this.height = AIRCRAFT_STRIP_HEIGHT;
        this.callsign = callsign;
        this.icao = aircraftInstanceModel.model.icao;
        this.destination = aircraftInstanceModel.destination;
        this.weightclass = aircraftInstanceModel.model.weightclass;
        this.category = aircraftInstanceModel.category;
        this.flightPlan = aircraftInstanceModel.fms.fp.route.join(' ');

        return this.createChildren()
                    .setupHandlers(aircraftInstanceModel)
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
     * @method setupHandlers
     */
    setupHandlers(aircraftInstanceModel) {
        this.$element.on('click', this.onClickHandler);
        // this.$element.on('dblclick', aircraftInstanceModel.onDoubleClickAircraftStripHandler);

        return this;
    }

    /**
     * @for AircraftStripView
     * @method layout
     */
    layout() {
        // TODO: some of the static HTML here could be moved to template constants
        this.$element.append(`<span class='callsign'>${this.callsign}</span>`);
        this.$element.append('<span class="heading">???</span>');
        this.$element.append('<span class="altitude">???</span>');
        this.$element.append(`<span class='aircraft'>${this.buildIcaoWithWeightClass()}</span>`);
        this.$element.append(`<span class="destination">${this.destination}</span>`);
        this.$element.append('<span class="speed">???</span>');
        this.$element.addClass(this.findClassnameForFlightCateogry());
        // TODO: this doesnt appear to be doing what the below comment says it should be doing
        // show fp route on hover
        this.$element.prop('title', this.flightPlan);

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
        this.$element.off('click', this.onClickHandler);
        // this.$element.off('dblclick', aircraftInstanceModel.onDoubleClickAircraftStripHandler);

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
        this.flightPlan = '';

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

    /**
     * @for AircraftStripView
     * @method onClickHandler
     * @param event {jquery event}
     */
    onClickHandler = (event) => {
        window.inputController.input_select(this.callsign);
    };
}
