import $ from 'jquery';
import { round } from '../math/core';
import {
    FLIGHT_CATEGORY,
    FLIGHT_MODES,
    WAYPOINT_NAV_MODE
} from '../constants/aircraftConstants';
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
        // TODO: change to use lodash _uniqueId
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

        return this._init()
                    .setupHandlers(aircraftInstanceModel)
                    .layout()
                    .redraw()
    }

    /**
     * @for AircraftStripView
     * @method
     */
    _init() {
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

        // TODO: indexOf is goofy here, this can be simplified
        // Bottom Line Data
        if (['H', 'U'].indexOf(this.weightclass) > -1) {
            aircraftIcao = `H/${this.icao}`;
        }

        return aircraftIcao.toUpperCase();
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
        this.$heading.text(headingText.toUpperCase());
        this.$altitude.text(altitudeText);
        this.$destination.text(destinationText.toUpperCase());
        this.$speed.text(currentSpeedText);
    }

    /**
     * @for AircraftStripView
     * @method updateViewForApron
     * @param destinationText {string}
     * @param hasAltitude {boolean}
     * @param isFollowingSID {boolean}
     */
    updateViewForApron(destinationText, hasAltitude, isFollowingSID) {
        this.$speed.addClass(SELECTORS.CLASSNAMES.RUNWAY);
        this.$heading.addClass(SELECTORS.CLASSNAMES.RUNWAY);
        this.$heading.text(FLIGHT_MODES.APRON);

        if (hasAltitude) {
            this.$altitude.addClass(SELECTORS.CLASSNAMES.RUNWAY);
        }

        if (isFollowingSID) {
            // TODO: this should be a class method on the FMS
            this.$destination.text(destinationText.toUpperCase());
            this.$destination.addClass(SELECTORS.CLASSNAMES.RUNWAY);
        }
    }

    /**
     * @for AircraftStripView
     * @method updateViewForTaxi
     * @param destinationText {string}
     * @param hasAltitude {boolean}
     * @param isFollowingSID {boolean}
     * @param altitudeText {string}
     */
    updateViewForTaxi(destinationText, hasAltitude, isFollowingSID, altitudeText) {
        // TODO: abstract FROM HERE
        this.$speed.addClass(SELECTORS.CLASSNAMES.RUNWAY);
        this.$heading.addClass(SELECTORS.CLASSNAMES.RUNWAY);
        this.$heading.text(FLIGHT_MODES.TAXI);

        if (hasAltitude) {
            this.$altitude.addClass(SELECTORS.CLASSNAMES.RUNWAY);
        }

        if (isFollowingSID) {
            // TODO: this should be a class method on the FMS
            this.$destination.text(destinationText.toUpperCase());
            this.$destination.addClass(SELECTORS.CLASSNAMES.RUNWAY);
        }
        // TODO: abstract TO HERE

        if (altitudeText) {
            this.$altitude.text(altitudeText);
        }
    }

    /**
     * @for AircraftStripView
     * @method updateViewForWaiting
     * @param destinationText {string}
     * @param hasAltitude {boolean}
     * @param isFollowingSID {boolean}
     */
    updateViewForWaiting(destinationText, hasAltitude, isFollowingSID) {
        this.$speed.addClass(SELECTORS.CLASSNAMES.RUNWAY);
        this.$heading.addClass(SELECTORS.CLASSNAMES.RUNWAY);
        this.$heading.text(FLIGHT_MODES.WAITING);

        if (hasAltitude) {
            this.$altitude.addClass(SELECTORS.CLASSNAMES.RUNWAY);
        }

        if (isFollowingSID) {
            // TODO: this should be a class method on the FMS
            this.$destination.text(destinationText.toUpperCase());
            this.$destination.addClass(SELECTORS.CLASSNAMES.RUNWAY);
        }
    }

    /**
     * @for AircraftStripView
     * @method updateTakeOffView
     * @param destinationText {string}
     */
    updateViewForTakeoff(destinationText, isFollowingSID) {
        this.$heading.text(FLIGHT_MODES.TAKEOFF);

        if (isFollowingSID) {
            this.$destination.text(destinationText.toUpperCase());
            this.$destination.addClass(SELECTORS.CLASSNAMES.LOOKING_GOOD);
        }
    }

    /**
     * @for AircraftStripView
     * @method updateViewForLanding
     * @param destinationText {string}
     */
    updateViewForLanding(destinationText) {
        const ON_GLIDESLOPE = 'GS';
        const ON_ILS = 'on ILS';

        this.$heading.addClass(SELECTORS.CLASSNAMES.ALL_SET);
        this.$heading.text(ON_ILS.toUpperCase());
        this.$altitude.addClass(SELECTORS.CLASSNAMES.ALL_SET);
        this.$altitude.text(ON_GLIDESLOPE);
        this.$speed.addClass(SELECTORS.CLASSNAMES.ALL_SET);
        this.$destination.addClass(SELECTORS.CLASSNAMES.ALL_SET);
        this.$destination.text(destinationText.toUpperCase());
    }

    /**
     * @for AircraftStripView
     * @method updateViewForCruise
     * @param navMode
     * @param headingText {string}
     * @param destinationText {string}
     * @param isFollowingSID {boolean}
     * @param isFollowingSTAR {boolean}
     * @param fixRestrictions {object}
     */
    updateViewForCruise(
        navMode,
        headingText = '',
        destinationText = '',
        isFollowingSID = false,
        isFollowingSTAR = false,
        fixRestrictions = {}
    ) {
        switch (navMode) {
            case WAYPOINT_NAV_MODE.FIX:
                this.$heading.text(headingText);

                if (isFollowingSID) {
                    this.$heading.addClass(SELECTORS.CLASSNAMES.ALL_SET);
                    this.$altitude.addClass(SELECTORS.CLASSNAMES.ALL_SET);
                    this.$destination.addClass(SELECTORS.CLASSNAMES.ALL_SET);
                    this.$speed.addClass(SELECTORS.CLASSNAMES.ALL_SET);
                }

                if (isFollowingSTAR) {
                    this.$heading.addClass(SELECTORS.CLASSNAMES.FOLLOWING_STAR);
                    this.$destination.text(destinationText.toUpperCase());
                    this.$destination.addClass(SELECTORS.CLASSNAMES.FOLLOWING_STAR);

                    if (fixRestrictions.altitude) {
                        this.$altitude.addClass(SELECTORS.CLASSNAMES.FOLLOWING_STAR);
                    }

                    if (fixRestrictions.speed) {
                        this.$speed.addClass(SELECTORS.CLASSNAMES.FOLLOWING_STAR);
                    }
                }

                break;
            case WAYPOINT_NAV_MODE.HOLD:
                this.$heading.text(headingText.toUpperCase());
                this.$heading.addClass(SELECTORS.CLASSNAMES.HOLD);
                break;
            case WAYPOINT_NAV_MODE.RWY:
                // attempting ILS intercept
                this.$heading.addClass(SELECTORS.CLASSNAMES.LOOKING_GOOD);
                this.$heading.text(headingText.toUpperCase());
                this.$altitude.addClass(SELECTORS.CLASSNAMES.LOOKING_GOOD);
                this.$speed.addClass(SELECTORS.CLASSNAMES.LOOKING_GOOD);
                this.$destination.addClass(SELECTORS.CLASSNAMES.LOOKING_GOOD);
                this.$destination.text(destinationText.toUpperCase());
                break;
            default:
                break;
        }
    }

    /**
     * Click handler for a single click on an AircraftStripView
     *
     * @for AircraftStripView
     * @method onClickHandler
     * @param event {jquery event}
     */
    onClickHandler = (event) => {
        window.inputController.input_select(this.callsign);
    };

    /**
     * Click handler for a double-click on an AircraftStripView
     *
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
