import $ from 'jquery';
import { round } from '../math/core';
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
 * Root html element
 *
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
        this.$callsign = null;
        this.$aircraft = null;
        this.$heading = null;
        this.$altitude = null;
        this.$destination = null;
        this.$speed = null;

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
        this.$aircraft = $(this.buildSpanForViewItem(SELECTORS.CLASSNAMES.AIRCRAFT, this.buildIcaoWithWeightClass()));
        this.$callsign = $(this.buildSpanForViewItem(SELECTORS.CLASSNAMES.CALLSIGN, this.callsign));
        this.$heading = $(this.buildSpanForViewItem(SELECTORS.CLASSNAMES.HEADING));
        this.$altitude = $(this.buildSpanForViewItem(SELECTORS.CLASSNAMES.ALTITUDE));
        this.$destination = $(this.buildSpanForViewItem(SELECTORS.CLASSNAMES.DESTINATION, this.destination));
        this.$speed = $(this.buildSpanForViewItem(SELECTORS.CLASSNAMES.SPEED));

        return this;
    }

    /**
     * @for AircraftStripView
     * @method setupHandlers
     */
    setupHandlers(aircraftInstanceModel) {
        this.$element.on('click', this.onClickHandler);
        this.$element.on('dblclick', aircraftInstanceModel, this.onDoubleClickHandler);

        return this;
    }

    /**
     * @for AircraftStripView
     * @method layout
     */
    layout() {
        // TODO: some of the static HTML here could be moved to template constants
        this.$element.append(this.$callsign);
        this.$element.append(this.$heading);
        this.$element.append(this.$altitude);
        this.$element.append(this.$aircraft);
        this.$element.append(this.$destination);
        this.$element.append(this.$speed);
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
        this.$element.off('dblclick', this.onDoubleClickHandler);

        return this.destroy();
    }

    /**
     * @for AircraftStripView
     * @method destroy
     */
    destroy() {
        this.$element = null;
        this.$callsign = null;
        this.$aircraft = null;
        this.$heading = null;
        this.$altitude = null;
        this.$destination = null;
        this.$speed = null;

        this.callsign = '';
        this.icao = '';
        this.destination = '';
        this.weightclass = '';
        this.category = '';
        this.flightPlan = '';

        return this;
    }

    /**
     * Return a span with a classname and/or content string.
     *
     * Used when initializing templates. Removes the need for having individual template constants for each line
     * when the only difference is a classname and content. Also provides a way to cache all the AircraftStripView
     * selectors on instantiation.
     *
     * @for AircraftStripView
     * @param className {string}
     * @param content {string}
     */
    buildSpanForViewItem(className, content = '') {
        return `<span class="${className}">${content}</span>`;
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
     * Fascade method for jquery `.hide()`
     *
     * @for AircraftStripView
     * @method hide
     * @param duration {number}
     */
    hide(duration = 0) {
        this.$element.hide(duration);
    }

    /**
     * @for AircraftStripView
     * @method update
     */
    update(headingText, altitudeText, destinationText, currentSpeedText) {
        this.resetStripStyles();
        this.updateAircraftTelemetryText(headingText, altitudeText, destinationText, currentSpeedText);

        return this;
    }

    /**
     * Remove all old styling
     *
     * @for AircraftStripView
     * @method resetStripStyles
     * @param headingText {string}
     * @param altitudeText {string}
     * @param destinationText {string}
     * @param currentSpeedText {string}
     */
    resetStripStyles() {
        const classnamesToRemove = 'runway hold waiting taxi lookingGood allSet';

        this.$heading.removeClass(classnamesToRemove);
        this.$altitude.removeClass(classnamesToRemove);
        this.$destination.removeClass(classnamesToRemove);
        this.$speed.removeClass(classnamesToRemove);
    }

    /**
     * @for AircraftStripView
     * @method updateAircraftTelemetryText
     * @param headingText {string}
     * @param altitudeText {string}
     * @param destinationText {string}
     * @param currentSpeedText {string}
     */
    updateAircraftTelemetryText(headingText, altitudeText, destinationText, currentSpeedText) {
        this.$heading.text(headingText);
        this.$altitude.text(altitudeText);
        this.$destination.text(destinationText);
        this.$speed.text(currentSpeedText);
    }

    /**
     * @for AircraftStripView
     * @method onClickHandler
     * @param event {jquery event}
     */
    onClickHandler = (event) => {
        window.inputController.input_select(this.callsign);
    };

    /**
     * @for AircraftStripView
     * @method onDoubleClickHandler
     * @param  event {jquery event}
     */
    onDoubleClickHandler = (event) => {
        prop.canvas.panX = 0 - round(window.uiController.km_to_px(event.data.position[0]));
        prop.canvas.panY = round(window.uiController.km_to_px(event.data.position[1]));
        prop.canvas.dirty = true;
    };
}
