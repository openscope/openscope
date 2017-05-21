import $ from 'jquery';
import _uniqueId from 'lodash/uniqueId';
import BaseModel from '../../base/BaseModel';
import EventBus from '../../lib/EventBus';
import { STRIP_VIEW_TEMPLATE } from './stripViewTemplate';
import { SELECTORS } from '../../constants/selectors';
import { EVENT } from '../../constants/eventNames';

/**
 * @property CLASSNAMES
 * @type {object<string, string}
 * @final
 */
const CLASSNAMES = {
    CALLSIGN: 'js-stripView-callsign',
    TRANSPONDER: 'js-stripView-transponder',
    DEPARTURE_AIRPORT_ID: 'js-stripView-departureAirportId',
    FLIGHT_PLAN: 'js-stripView-flightPlan',
    AIRCRAFT_MODEL: 'js-stripView-aircraftModel',
    ALTITUDE: 'js-stripView-altitude',
    ARRIVAL_AIRPORT_ID: 'js-stripView-arrivalAirportId',
    AIRCRAFT_ID: 'js-stripView-aircraftId',
    FLIGHT_PLAN_ALTITUDE: 'js-stripView-flightPlanAltitude',
    ALTERNATE_AIRPORT_ID: 'js-stripView-alternateAirportId',
    REMARKS: 'js-stripView-remarks'
};

// /**
//  * Root html element
//  *
//  * @property AIRCRAFT_STRIP_TEMPLATE
//  * @type {string}
//  * @final
//  */
// const AIRCRAFT_STRIP_TEMPLATE = '<li class="strip"></li>';

// /**
//  * Build a span with a classname and/or content string.
//  *
//  * Used when initializing templates. Removes the need for having individual template
//  * constants for each line when the only difference is a classname and content.
//  *
//  * @for StripViewModel
//  * @param className {string}
//  * @param content {string}
//  */
// const buildSpanForViewItem = (className, content = '') => {
//     return `<span class="${className}">${content}</span>`;
// };

/**
 *
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
     *
     * @constructor
     * @param aircraftModel {object}
     */
    constructor(aircraftModel) {
        super();

        /**
         * @property _id
         * @type {string}
         * @private
         */
        this._id = _uniqueId('aircraftStripView-');

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
         *
         *
         * @property $element
         * @type {JQuery Element}
         * @default null
         */
        this.$element = null;

        // TODO: not in use
        /**
         * Reference to the `AircraftModel#id` property
         *
         * @property aircraftId
         * @type {string}
         */
        this.aircraftId = aircraftModel.id;

        // /**
        //  *
        //  *
        //  * @property _flightPhase
        //  * @type
        //  * @default
        //  * @private
        //  */
        // this._flightPhase = '';

        /**
         *
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

        // /**
        //  *
        //  *
        //  * @property _altitude
        //  * @type
        //  * @default
        //  * @private
        //  */
        // this._altitude = -1;


        // /**
        //  *
        //  *
        //  * @property _speed
        //  * @type
        //  * @default
        //  * @private
        //  */
        // this._speed = -1;


        /**
         *
         *
         * @property
         * @type {JQuery Element}
         * @default null
         */
        this.$callsignView = null;

        /**
         *
         *
         * @property $aircraftTypeView
         * @type {JQuery Element}
         * @default null
         */
        this.$aircraftTypeView = null;

        // /**
        //  *
        //  *
        //  * @property $infoBoxTopView
        //  * @type {JQuery Element}
        //  * @default null
        //  */
        // this.$infoBoxTopView = null;

        // /**
        //  *
        //  *
        //  * @property $altitudeView
        //  * @type {JQuery Element}
        //  * @default null
        //  */
        // this.$altitudeView = null;

        // /**
        //  *
        //  *
        //  * @property $infoBoxBottomView
        //  * @type {JQuery Element}
        //  * @default null
        //  */
        // this.$infoBoxBottomView = null;

        // /**
        //  *
        //  *
        //  * @property $speedView
        //  * @type {JQuery Element}
        //  * @default null
        //  */
        // this.$speedView = null;


        return this._init(aircraftModel)
            ._createChildren()
            ._setupHandlers()
            ._layout()
            ._redraw();
    }

    /**
     *
     *
     * @method _init
     * @param aircraftModel {object}
     */
    _init(aircraftModel) {
        // FIXME: move this logic to `AircraftModel.getViewModel()`
        // this._flightPhase = aircraftModel.fms.currentPhase;
        this._callsign = aircraftModel.callsign;
        this._aircraftType = aircraftModel.model;
        // // TODO: make this not a ternary
        // this._altitude = aircraftModel.mcp.altitude !== -1
        //     ? aircraftModel.mcp.altitude
        //     : 0;
        // this._infoBoxBottom = aircraftModel.fms.getProcedureAndExitName();
        // // TODO: make this not a ternary
        // this._speed = aircraftModel.mcp.speed !== -1
        //     ? aircraftModel.mcp.speed
        //     : 0;
        // this._categoryClassName = this.findClassnameForFlightCateogry(aircraftModel);

        return this;
    }

    /**
     *
     *
     * @for StripViewModel
     * @method _createChildren
     */
    _createChildren() {
        this.$element = $(STRIP_VIEW_TEMPLATE);
        this.$callsignView = this.$element.find(CLASSNAMES.CALLSIGN);
        this.$aircraftTypeView = this.$element.find(CLASSNAMES.AIRCRAFT_MODEL);
        // this.$infoBoxTopView = $(buildSpanForViewItem(SELECTORS.CLASSNAMES.HEADING, this._flightPhase.toUpperCase()));
        // this.$altitudeView = $(buildSpanForViewItem(SELECTORS.CLASSNAMES.ALTITUDE, this._altitude));
        // this.$infoBoxBottomView = $(buildSpanForViewItem(SELECTORS.CLASSNAMES.DESTINATION, this._infoBoxBottom));
        // this.$speedView = $(buildSpanForViewItem(SELECTORS.CLASSNAMES.SPEED, this._speed));

        return this;
    }

    /**
     *
     *
     * @for StripViewModel
     * @method _setupHandlers
     */
    _setupHandlers() {
        this.$element.on('click', this.onClickHandler);
        this.$element.on('dblclick', this.onDoubleClickHandler);

        return this;
    }

    /**
     *
     *
     * @for StripViewModel
     * @method _layout
     */
    _layout() {
        this.$callsignView.text(this._callsign);
        this.$aircraftTypeView.text(this._aircraftType);
        // this.$element.append(this.$infoBoxTopView);
        // this.$element.append(this.$altitudeView);
        // this.$element.append(this.$infoBoxBottomView);
        // this.$element.append(this.$speedView);
        // this.$element.addClass(this._categoryClassName);

        return this;
    }

    /**
     *
     *
     * @for StripViewModel
     * @method _render
     */
    _redraw() {
        return this;
    }


    /**
     *
     *
     * @method reset
     */
    reset() {
        this.$element.off('click', this.onClickHandler);
        this.$element.off('dblclick', this.onDoubleClickHandler);
    }

    /**
     *
     *
     * @for StripViewModel
     * @method shouldUpdate
     * @param  aircraftModel {AircraftInstanceModel}
     * @return {boolean}
     */
    shouldUpdate(aircraftModel) {
        return aircraftModel.fms.currentPhase !== this._flightPhase ||
            aircraftModel.mcp.altitude !== this._altitude ||
            aircraftModel.mcp.speed !== this._speed;
    }

    /**
     *
     *
     * @method update
     * @param aircraftModel {AircraftInstanceModel}
     */
    update(aircraftModel) {
        if (!this.shouldUpdate(aircraftModel)) {
            return;
        }

        // _updateStripView
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
     * Fascade method for jquery `.hide()`
     *
     * @for AircraftStripView
     * @method hide
     * @param duration {number}
     */
    hide(duration = 0) {
        this.$element.hide(duration);
    }

    // /**
    //  * @for AircraftStripView
    //  * @method findClassnameForFlightCateogry
    //  * @return {string}
    //  */
    // findClassnameForFlightCateogry(aircraftModel) {
    //     let className = SELECTORS.CLASSNAMES.ARRIVAL;

    //     if (aircraftModel.isDeparture()) {
    //         className = SELECTORS.CLASSNAMES.DEPARTURE;
    //     }

    //     return className;
    // }

    // TODO: this should live in the `AircraftTypeDefinitionModel` or the `AircraftModel` iteslf (or both)
    // /**
    //  * @for StripViewModel
    //  * @method _buildIcaoWithWeightClass
    //  * @return aircraftIcao {string}
    //  * @private
    //  */
    // _buildIcaoWithWeightClass() {
    //     const HEAVY_LETTER = 'H';
    //     const SUPER_LETTER = 'U';

    //     let aircraftIcao = this._aircraftType.icao;

    //     // Bottom Line Data
    //     if (this._aircraftType.weightclass === HEAVY_LETTER) {
    //         aircraftIcao = `${HEAVY_LETTER}/${this._aircraftType.icao}`;
    //     } else if (this._aircraftType.weightclass === SUPER_LETTER) {
    //         aircraftIcao = `${SUPER_LETTER}/${this._aircraftType.icao}`;
    //     }

    //     return aircraftIcao.toUpperCase();
    // }

    // TODO: this feels like a utility function
    // /**
    //  *
    //  * @method _getValueOrZero
    //  * @param  {[type]}        prop [description]
    //  * @return {[type]}             [description]
    //  */
    // _getValueOrZero(prop) {
    //     let valueOrZero = prop;

    //     if (prop === -1) {
    //         valueOrZero = 0;
    //     }

    //     return valueOrZero;
    // }

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
}
