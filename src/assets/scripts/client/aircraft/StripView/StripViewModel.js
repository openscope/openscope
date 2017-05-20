import $ from 'jquery';
import _uniqueId from 'lodash/uniqueId';
import BaseModel from '../../base/BaseModel';
import EventBus from '../../lib/EventBus';
import { round } from '../../math/core';
import { SELECTORS } from '../../constants/selectors';
import { EVENT } from '../../constants/eventNames';

/**
 * Root html element
 *
 * @property AIRCRAFT_STRIP_TEMPLATE
 * @type {string}
 * @final
 */
const AIRCRAFT_STRIP_TEMPLATE = '<li class="strip"></li>';

/**
 * Build a span with a classname and/or content string.
 *
 * Used when initializing templates. Removes the need for having individual template
 * constants for each line when the only difference is a classname and content.
 *
 * @for StripViewModel
 * @param className {string}
 * @param content {string}
 */
const buildSpanForViewItem = (className, content = '') => {
    return `<span class="${className}">${content}</span>`;
};

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
    static HEIGHT = 45;

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


        this._eventBus = EventBus;

        /**
         *
         *
         * @property aircraftId
         * @type {string}
         */
        this.aircraftId = aircraftModel.id;

        /**
         *
         *
         * @property _flightPhase
         * @type
         * @default
         * @private
         */
        this._flightPhase = '';

        /**
         *
         *
         * @property _callsign
         * @type
         * @default
         * @private
         */
        this._callsign = '';

        /**
         *
         *
         * @property _altitude
         * @type
         * @default
         * @private
         */
        this._altitude = -1;

        /**
         *
         *
         * @property _aircraftType
         * @type
         * @default
         * @private
         */
        this._aircraftType = '';

        /**
         *
         *
         * @property _speed
         * @type
         * @default
         * @private
         */
        this._speed = -1;

        /**
         *
         *
         * @property $element
         * @type {JQuery Element}
         * @default null
         */
        this.$element = null;

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
         * @property $infoBoxTopView
         * @type {JQuery Element}
         * @default null
         */
        this.$infoBoxTopView = null;

        /**
         *
         *
         * @property $altitudeView
         * @type {JQuery Element}
         * @default null
         */
        this.$altitudeView = null;

        /**
         *
         *
         * @property $aircraftTypeView
         * @type {JQuery Element}
         * @default null
         */
        this.$aircraftTypeView = null;

        /**
         *
         *
         * @property $infoBoxBottomView
         * @type {JQuery Element}
         * @default null
         */
        this.$infoBoxBottomView = null;

        /**
         *
         *
         * @property $speedView
         * @type {JQuery Element}
         * @default null
         */
        this.$speedView = null;


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
        this._flightPhase = aircraftModel.fms.currentPhase;
        this._callsign = aircraftModel.callsign;
        // TODO: make this not a ternary
        this._altitude = aircraftModel.mcp.altitude !== -1
            ? aircraftModel.mcp.altitude
            : 0;
        this._aircraftType = aircraftModel.model;
        this._infoBoxBottom = aircraftModel.fms.getProcedureAndExitName();
        // TODO: make this not a ternary
        this._speed = aircraftModel.mcp.speed !== -1
            ? aircraftModel.mcp.speed
            : 0;
        this._categoryClassName = this.findClassnameForFlightCateogry(aircraftModel);

        return this;
    }

    /**
     *
     *
     * @for StripViewModel
     * @method _createChildren
     */
    _createChildren() {
        this.$element = $(AIRCRAFT_STRIP_TEMPLATE);
        this.$callsignView = $(buildSpanForViewItem(SELECTORS.CLASSNAMES.CALLSIGN, this._callsign.toUpperCase()));
        this.$infoBoxTopView = $(buildSpanForViewItem(SELECTORS.CLASSNAMES.HEADING, this._flightPhase.toUpperCase()));
        this.$altitudeView = $(buildSpanForViewItem(SELECTORS.CLASSNAMES.ALTITUDE, this._altitude));
        this.$aircraftTypeView = $(buildSpanForViewItem(SELECTORS.CLASSNAMES.AIRCRAFT, this._buildIcaoWithWeightClass()));
        this.$infoBoxBottomView = $(buildSpanForViewItem(SELECTORS.CLASSNAMES.DESTINATION, this._infoBoxBottom));
        this.$speedView = $(buildSpanForViewItem(SELECTORS.CLASSNAMES.SPEED, this._speed));

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
        this.$element.append(this.$callsignView);
        this.$element.append(this.$infoBoxTopView);
        this.$element.append(this.$altitudeView);
        this.$element.append(this.$aircraftTypeView);
        this.$element.append(this.$infoBoxBottomView);
        this.$element.append(this.$speedView);
        this.$element.addClass(this._categoryClassName);

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

    /**
     * @for AircraftStripView
     * @method findClassnameForFlightCateogry
     * @return {string}
     */
    findClassnameForFlightCateogry(aircraftModel) {
        let className = SELECTORS.CLASSNAMES.ARRIVAL;

        if (aircraftModel.isDeparture()) {
            className = SELECTORS.CLASSNAMES.DEPARTURE;
        }

        return className;
    }

    /**
     * @for StripViewModel
     * @method _buildIcaoWithWeightClass
     * @return aircraftIcao {string}
     * @private
     */
    _buildIcaoWithWeightClass() {
        const HEAVY_LETTER = 'H';
        const SUPER_LETTER = 'U';

        let aircraftIcao = this._aircraftType.icao;

        // Bottom Line Data
        if (this._aircraftType.weightclass === HEAVY_LETTER) {
            aircraftIcao = `${HEAVY_LETTER}/${this._aircraftType.icao}`;
        } else if (this._aircraftType.weightclass === SUPER_LETTER) {
            aircraftIcao = `${SUPER_LETTER}/${this._aircraftType.icao}`;
        }

        return aircraftIcao.toUpperCase();
    }

    // TODO: this feels like a utility function
    /**
     *
     * @method _getValueOrZero
     * @param  {[type]}        prop [description]
     * @return {[type]}             [description]
     */
    _getValueOrZero(prop) {
        let valueOrZero = prop;

        if (prop === -1) {
            valueOrZero = 0;
        }

        return valueOrZero;
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
     * Click handler for a double-click on an AircraftStripView
     *
     * @for AircraftStripView
     * @method onDoubleClickHandler
     * @param  event {jquery event}
     */
    // eslint-disable-next-line no-unused-vars
    onDoubleClickHandler = (event) => {
        console.log('onDoubleClick', this._callsign);
        const { positionModel } = event.data;

        // TODO: move to CanvasController
        prop.canvas.panX = 0 - round(window.uiController.km_to_px(positionModel.relativePosition[0]));
        prop.canvas.panY = round(window.uiController.km_to_px(positionModel.relativePosition[1]));
        prop.canvas.dirty = true;
    };
}
