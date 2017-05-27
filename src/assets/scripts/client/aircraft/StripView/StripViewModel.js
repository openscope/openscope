import $ from 'jquery';
import _uniqueId from 'lodash/uniqueId';
import BaseModel from '../../base/BaseModel';
import EventBus from '../../lib/EventBus';
import { STRIP_VIEW_TEMPLATE } from './stripViewTemplate';
import { SELECTORS } from '../../constants/selectors';
import { EVENT } from '../../constants/eventNames';

/**
 * @property STRIP_VIEW_SELECTORS
 * @type {object<string, string}
 * @final
 */
const STRIP_VIEW_SELECTORS = {
    CALLSIGN: '.js-stripView-callsign',
    AIRCRAFT_MODEL: '.js-stripView-aircraftModel',
    AIRCRAFT_ID: '.js-stripView-aircraftId',
    TRANSPONDER: '.js-stripView-transponder',
    ASSIGNED_ALTITUDE: '.js-stripView-assignedAltitude',
    FLIGHT_PLAN_ALTITUDE: '.js-stripView-flightPlanAltitude',
    DEPARTURE_AIRPORT_ID: '.js-stripView-departureAirportId',
    ARRIVAL_AIRPORT_ID: '.js-stripView-arrivalAirportId',
    ALTERNATE_AIRPORT_ID: '.js-stripView-alternateAirportId',
    FLIGHT_PLAN: '.js-stripView-flightPlan',
    REMARKS: '.js-stripView-remarks'
};

/**
 * Encapsulation of data and view elements for a single aircraft progress strip
 *
 * Handles display and updating of an aircraft progress strip
 *
 * @class StripViewModel
 * @extends BaseModel
 */
export default class StripViewModel extends BaseModel {
    /**
     * Height of the AircraftStrip DOM element in px.
     *
     * @property AIRCRAFT_STRIP_HEIGHT
     * @type {number}
     * @static
     */
    static HEIGHT = 60;

    /**
     * @constructor
     * @param aircraftModel {object}
     */
    constructor(aircraftModel) {
        super('stripViewModel');

        /**
         * Internal reference to `EventBus` class
         *
         * @property _eventBus
         * @type {EventBus}
         * @default EventBus
         * @private
         */
        this._eventBus = EventBus;

        /**
         * Root HTML Element
         *
         * @property $element
         * @type {JQuery Element}
         * @default null
         */
        this.$element = null;

        /**
         * Reference to the `AircraftModel#id` property
         *
         * Used only for associating a `StripViewModel` with a
         * specific `aircraftId`
         *
         * @property aircraftId
         * @type {string}
         */
        this.aircraftId = aircraftModel.id;

        /**
         *
         *
         * @property insideCenter
         * @type {boolean}
         * @default false
         */
        this.insideCenter = false;

        /**
         * Aircraft callsign
         *
         * @property _callsign
         * @type {string}
         * @default ''
         * @private
         */
        this._callsign = '';

        /**
         *
         *
         * @property _aircraftType
         * @type {string}
         * @default ''
         * @private
         */
        this._aircraftType = '';

        /**
         * Aircraft transponder code
         *
         * @property _transponder
         * @type {number}
         * @default 1200
         * @private
         */
        this._transponder = 1200;

        /**
         *
         *
         */
        this._assignedAltitude = -1;

        /**
         *
         *
         * @property _flightPlanAltitude
         * @type
         * @default
         * @private
         */
        this._flightPlanAltitude = -1;

        /**
         * Arrival airport icao
         *
         * @property _arrivalAirport
         * @type
         * @default
         * @private
         */
        this._arrivalAirport = '';

        /**
         * Departure airport icao
         *
         * @property _departureAirport
         * @type
         * @default
         * @private
         */
        this._departureAirport = '';

        /**
         * Alternate airport icao
         *
         * @property _alternateAirport
         * @type
         * @default
         * @private
         */
        this._alternateAirport = '';

        /**
         * Route string that represents the 'filed' flight plan
         *
         * @property _flightPlan
         * @type {string}
         * @default ''
         * @private
         */
        this._flightPlan = '';

        /**
         * HTML Element that holds the `#_callsign` value
         *
         * @property
         * @type {JQuery Element}
         * @default null
         */
        this.$callsignView = null;

        /**
         * HTML Element that holds the `#_aircraftType` value
         *
         * @property $aircraftTypeView
         * @type {JQuery Element}
         * @default null
         */
        this.$aircraftTypeView = null;

        /**
         * HTML Element that holds the `#_transponderCode` value
         *
         * @property $transponderView
         * @type {JQuery Element}
         * @default null
         */
        this.$transponderView = null;

        /**
         * HTML Element that holds the `#_assignedAltitude` value
         *
         * @property $assignedAltitudeView
         * @type {JQuery Element}
         * @default null
         */
        this.$assignedAltitudeView = null;

        /**
         * HTML Element that holds the `#_flightPlanAltitude` value
         *
         * @property $flightPlanAltitudeView
         * @type {JQuery Element}
         * @default null
         */
        this.$flightPlanAltitudeView = null;

        /**
         * HTML Element that hold the `#_arrivalAirport` value
         *
         * @property $arrivalAirportView
         * @type {JQuery Element}
         * @default null
         */
        this.$arrivalAirportView = null;

        /**
         * HTML Element that hold the `#_departureAirport` value
         *
         * @property $departureAirportView
         * @type {JQuery Element}
         * @default null
         */
        this.$departureAirportView = null;

        /**
         * HTML Element that hold the `#_alternateAirport` value
         *
         * @property $alternateAirportView
         * @type {JQuery Element}
         * @default null
         */
        this.$alternateAirportView = null;

        /**
         * HTML Element that holds the `#_flightPlan` value
         *
         * @property $_flightPlanView
         * @type {JQuery Element}
         * @default null
         */
        this.$flightPlanView = null;

        return this._init(aircraftModel)
            ._createChildren()
            ._setupHandlers()
            ._layout()
            ._redraw();
    }

    /**
     * Initialize the instance
     *
     * Should be run once only on instantiation
     *
     * @for StripViewModel
     * @method _init
     * @param aircraftModel {object}
     * @chainable
     */
    _init(aircraftModel) {
        const {
            callsign,
            insideCenter,
            icaoWithWeightClass,
            transponderCode,
            assignedAltitude,
            arrivalAirportId,
            departureAirportId,
            flightPlanAltitude,
            flightPlan
        } = aircraftModel.getViewModel();

        this._callsign = callsign;
        this.insideCenter = insideCenter;
        this._transponder = transponderCode;
        this._aircraftType = icaoWithWeightClass;
        this._assignedAltitude = assignedAltitude;
        this._flightPlanAltitude = flightPlanAltitude;
        this._arrivalAirport = arrivalAirportId;
        this._departureAirport = departureAirportId;
        this._flightPlan = flightPlan;
        this._categoryClassName = this._buildClassnameForFlightCategory(aircraftModel);

        return this;
    }

    /**
     * Set initial element references
     *
     * Should be run once only on instantiation
     *
     * @for StripViewModel
     * @method _createChildren
     * @chainable
     */
    _createChildren() {
        this.$element = $(STRIP_VIEW_TEMPLATE);
        this.$callsignView = this.$element.find(STRIP_VIEW_SELECTORS.CALLSIGN);
        this.$transponderView = this.$element.find(STRIP_VIEW_SELECTORS.TRANSPONDER);
        this.$aircraftTypeView = this.$element.find(STRIP_VIEW_SELECTORS.AIRCRAFT_MODEL);
        this.$assignedAltitudeView = this.$element.find(STRIP_VIEW_SELECTORS.ASSIGNED_ALTITUDE);
        this.$flightPlanAltitudeView = this.$element.find(STRIP_VIEW_SELECTORS.FLIGHT_PLAN_ALTITUDE);
        this.$arrivalAirportView = this.$element.find(STRIP_VIEW_SELECTORS.ARRIVAL_AIRPORT_ID);
        this.$departureAirportView = this.$element.find(STRIP_VIEW_SELECTORS.DEPARTURE_AIRPORT_ID);
        this.$alternateAirportView = this.$element.find(STRIP_VIEW_SELECTORS.ALTERNATE_AIRPORT_ID);
        this.$flightPlanView = this.$element.find(STRIP_VIEW_SELECTORS.FLIGHT_PLAN);

        return this;
    }

    /**
     * Create event handlers
     *
     * Should be run once only on instantiation
     *
     * @for StripViewModel
     * @method _setupHandlers
     * @chainable
     */
    _setupHandlers() {
        this.$element.on('click', this.onClickHandler);
        this.$element.on('dblclick', this.onDoubleClickHandler);

        return this;
    }

    /**
     * Set the layout with the correct data
     *
     * @for StripViewModel
     * @method _layout
     * @chainable
     */
    _layout() {
        this.$callsignView.text(this._callsign);
        this.$transponderView.text(this._transponder);
        this.$aircraftTypeView.text(this._aircraftType);
        this.$assignedAltitudeView.text(this._assignedAltitude);
        this.$flightPlanAltitudeView.text(this._flightPlanAltitude);
        this.$departureAirportView.text(this._departureAirport);
        this.$arrivalAirportView.text(this._arrivalAirport);
        this.$alternateAirportView.text(this._alternateAirport);
        this.$flightPlanView.text(this._flightPlan);
        this.$element.addClass(this._categoryClassName);

        return this;
    }

    /**
     *
     *
     * @for StripViewModel
     * @method _render
     * @chainable
     */
    _redraw() {
        return this;
    }

    /**
     * Disable the instance ane tear down handlers
     *
     * @for StripViewModel
     * @method disable
     */
    disable() {
        this.$element.off('click', this.onClickHandler);
        this.$element.off('dblclick', this.onDoubleClickHandler);

        return this;
    }

    /**
     * Destroy the instance
     *
     * @for StripViewModel
     * @method destroy
     * @chainable
     */
    destroy() {
        this.disable();
        this.$element.remove();

        this.id = '';
        this._eventBus = null;
        this.$element = null;
        this.aircraftId = '';
        this.insideCenter = false;
        this._callsign = '';
        this._aircraftType = '';
        this._transponder = 1200;
        this._assignedAltitude = -1;
        this._flightPlanAltitude = -1;
        this._arrivalAirport = '';
        this._departureAirport = '';
        this._alternateAirport = '';
        this._flightPlan = '';
        this.$callsignView = null;
        this.$aircraftTypeView = null;
        this.$transponderView = null;
        this.$flightPlanAltitudeView = null;
        this.$arrivalAirportView = null;
        this.$departureAirportView = null;
        this.$alternateAirportView = null;
        this.$flightPlanView = null;

        return this;
    }

    /**
     *
     *
     * @for StripViewModel
     * @method update
     * @param aircraftModel {AircraftInstanceModel}
     */
    update(aircraftModel) {
        if (!this._shouldUpdate(aircraftModel)) {
            this.show();

            return;
        }

        this.hide();
        this._updateStripView(aircraftModel);
        this.show();
    }

    /**
     * Add active css classname
     *
     * @for StripViewModel
     * @method addActiveState
     */
    addActiveState() {
        this.$element.addClass(SELECTORS.CLASSNAMES.ACTIVE);
    }

    /**
     * Remove active css classname
     *
     * @for StripViewModel
     * @method removeActiveState
     */
    removeActiveState() {
        this.$element.removeClass(SELECTORS.CLASSNAMES.ACTIVE);
    }

    /**
     * Show the `$element`
     *
     * Facade for jquery method `.show()`
     *
     * @for StripViewModel
     * @method show
     * @param duration {number} [optional=0]
     */
    show(duration = 0) {
        this.$element.show(duration);
    }

    /**
     * Fascade for jquery method `.hide()`
     *
     * @for AircraftStripView
     * @method hide
     * @param duration {number} [optional=0]
     */
    hide(duration = 0) {
        this.$element.hide(duration);
    }

    /**
     * Click handler for a single click on an AircraftStripView
     *
     * @for AircraftStripView
     * @method onClickHandler
     * @param event {jquery event}
     */
    // eslint-disable-next-line no-unused-vars
    onClickHandler = (event) => {
        this._eventBus.trigger(EVENT.STRIP_CLICK, this._callsign);
    };

    /**
     * Handler for a double-click on an AircraftStripView
     *
     * Initiates a two-step event process, though undesired, is necessary.
     * We don't (and shouldn't) have access to the `AircraftController` or the
     * `CanvasController` from within this class.
     *
     * @for AircraftStripView
     * @method onDoubleClickHandler
     * @param  event {jquery event}
     */
    // eslint-disable-next-line no-unused-vars
    onDoubleClickHandler = (event) => {
        this._eventBus.trigger(EVENT.STRIP_DOUBLE_CLICK, this._callsign);
    };


    /**
     * Return a classname based on whether an aircraft is a `departure` or an `arrival`
     *
     * @for AircraftStripView
     * @method _buildClassnameForFlightCategory
     * @return {string}
     */
    _buildClassnameForFlightCategory(aircraftModel) {
        let className = SELECTORS.CLASSNAMES.ARRIVAL;

        if (aircraftModel.isDeparture()) {
            className = SELECTORS.CLASSNAMES.DEPARTURE;
        }

        return className;
    }

    /**
     * Encapsulation of boolean logic used to determine if the view needs to be updated
     *
     * This method provides an implementation an 'early exit', so if the view doesn't
     * need to be updated it can be skipped.
     *
     * @for StripViewModel
     * @method shouldUpdate
     * @param  aircraftModel {AircraftInstanceModel}
     * @return {boolean}
     * @private
     */
    _shouldUpdate(aircraftModel) {
        const viewModel = aircraftModel.getViewModel();

        return this.insideCenter !== viewModel.insideCenter ||
            this._assignedAltitude !== viewModel.assignedAltitude ||
            this._flightPlanAltitude !== viewModel.flightPlanAltitude ||
            this._arrivalAirport !== viewModel.arrivalAirportId ||
            this._departureAirport !== viewModel.departureAirportId ||
            this._flightPlan !== viewModel.flightPlan;
    }

    /**
     *
     *
     * @for StripViewModel
     * @method _updateStripView
     * @param {AircraftModel} aircraftModel
     * @private
     */
    _updateStripView(aircraftModel) {
        const {
            insideCenter,
            assignedAltitude,
            arrivalAirportId,
            departureAirportId,
            flightPlanAltitude,
            flightPlan
        } = aircraftModel.getViewModel();

        this.insideCenter = insideCenter;
        this._assignedAltitude = assignedAltitude;
        this._flightPlanAltitude = flightPlanAltitude;
        this._arrivalAirport = arrivalAirportId;
        this._departureAirport = departureAirportId;
        this._flightPlan = flightPlan;

        return this._layout();
    }
}
