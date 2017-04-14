import $ from 'jquery';
import _isString from 'lodash/isString';
import _round from 'lodash/round';
import _uniqueId from 'lodash/uniqueId';
import { round } from '../math/core';
import {
    FLIGHT_CATEGORY,
    FLIGHT_MODES,
    WAYPOINT_NAV_MODE
} from '../constants/aircraftConstants';
import { SELECTORS } from '../constants/selectors';

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
    constructor(aircraftInstanceModel) {
        // TODO: change to use lodash _uniqueId
        this._id = _uniqueId('aircraftStripView-');

        this.$element = null;
        this.$callsign = null;
        this.$aircraft = null;
        this.$heading = null;
        this.$altitude = null;
        this.$destination = null;
        this.$speed = null;

        this.height = AIRCRAFT_STRIP_HEIGHT;
        this.callsign = aircraftInstanceModel.callsign;
        this.icao = aircraftInstanceModel.model.icao;
        this.destination = aircraftInstanceModel.destination;
        this.weightclass = aircraftInstanceModel.model.weightclass;
        this.category = aircraftInstanceModel.category;
        this.flightPlan = aircraftInstanceModel.fms.flightPlanRoute;

        return this._init()
                    .setupHandlers(aircraftInstanceModel)
                    .layout()
                    .redraw();
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
        this.$element.append(this.$callsign);
        this.$element.append(this.$heading);
        this.$element.append(this.$altitude);
        this.$element.append(this.$aircraft);
        this.$element.append(this.$destination);
        this.$element.append(this.$speed);
        this.$element.addClass(this.findClassnameForFlightCateogry());
        // TODO: this doesnt appear to be doing what the below comment says it should be doing
        // set the title property to the flightPlan so it shows on hover
        // this.$element.prop('title', this.flightPlan);

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
        const HEAVY_LETTER = 'H';
        const SUPER_LETTER = 'U';

        let aircraftIcao = this.icao;

        // Bottom Line Data
        if (this.weightclass.indexOf(HEAVY_LETTER) !== -1) {
            aircraftIcao = `${HEAVY_LETTER}/${this.icao}`;
        } else if (this.weightclass.indexOf(SUPER_LETTER) !== -1) {
            aircraftIcao = `${SUPER_LETTER}/${this.icao}`;
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
     * @param heading {string}
     * @param altitude {string}
     * @param destination {string}
     * @param speed {string}
     */
    updateAircraftTelemetryText(heading, altitude, destination, speed) {
        const altitudeDisplay = altitude !== -1
            ? _round(altitude, -2)
            : '-';

        const speedDisplay = speed !== -1
            ? _round(speed, 0)
            : '-';

        this.$altitude.text(altitudeDisplay);
        this.$destination.text(destination.toUpperCase());
        this.$heading.text(heading.toUpperCase());
        this.$speed.text(speedDisplay);
    }

    /**
     * @for AircraftStripView
     * @method updateViewForApron
     * @param destinationText {string}
     * @param hasAltitude {boolean}
     */
    updateViewForApron(destinationText, hasAltitude) {
        this.$heading.addClass(SELECTORS.CLASSNAMES.RUNWAY);
        this.$heading.text(FLIGHT_MODES.APRON);

        if (hasAltitude) {
            this.$altitude.addClass(SELECTORS.CLASSNAMES.RUNWAY);
        }
    }

    /**
     * @for AircraftStripView
     * @method updateViewForTaxi
     * @param destinationText {string}
     * @param hasAltitude {boolean}
     * @param altitudeText {string}
     */
    updateViewForTaxi(destinationText, hasAltitude, altitudeText) {
        this.$heading.addClass(SELECTORS.CLASSNAMES.RUNWAY);
        this.$heading.text(FLIGHT_MODES.TAXI);
        this.$speed.addClass(SELECTORS.CLASSNAMES.RUNWAY);

        if (hasAltitude) {
            this.$altitude.addClass(SELECTORS.CLASSNAMES.RUNWAY);
        }

        if (altitudeText) {
            this.$altitude.text(altitudeText);
        }

        // if (_isString(destinationText)) {
        //     this.$destination.text(destinationText.toUpperCase());
        //     this.$destination.addClass(SELECTORS.CLASSNAMES.RUNWAY);
        // }
    }

    /**
     * @for AircraftStripView
     * @method updateViewForWaiting
     * @param destinationText {string}
     * @param hasClearance {boolean}
     * @param hasAltitude {boolean}
     */
    updateViewForWaiting(destinationText, hasClearance, hasAltitude) {
        this.$heading.addClass(SELECTORS.CLASSNAMES.RUNWAY);
        this.$heading.text(FLIGHT_MODES.WAITING);
        this.$speed.addClass(SELECTORS.CLASSNAMES.RUNWAY);

        if (hasClearance) {
            this.$destination.text(destinationText.toUpperCase());
            this.$destination.addClass(SELECTORS.CLASSNAMES.RUNWAY);
        }

        if (hasAltitude) {
            this.$altitude.addClass(SELECTORS.CLASSNAMES.RUNWAY);
        }
    }

    /**
     * @for AircraftStripView
     * @method updateTakeOffView
     * @param destinationText {string}
     */
    updateViewForTakeoff(destinationText) {
        this.$heading.text(FLIGHT_MODES.TAKEOFF);

        if (_isString(destinationText)) {
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

    // TODO: remove this switch and split up to be inline with `aircraft.flightPhase`
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
                    this.$destination.addClass(SELECTORS.CLASSNAMES.ALL_SET);
                    this.$altitude.addClass(SELECTORS.CLASSNAMES.ALL_SET);
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
                this.$destination.addClass(SELECTORS.CLASSNAMES.LOOKING_GOOD);
                this.$destination.text(destinationText.toUpperCase());
                this.$altitude.addClass(SELECTORS.CLASSNAMES.LOOKING_GOOD);
                this.$speed.addClass(SELECTORS.CLASSNAMES.LOOKING_GOOD);

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
        const { positionModel } = event.data;

        prop.canvas.panX = 0 - round(window.uiController.km_to_px(positionModel.relativePosition[0]));
        prop.canvas.panY = round(window.uiController.km_to_px(positionModel.relativePosition[1]));
        prop.canvas.dirty = true;
    };
}
