import $ from 'jquery';
import _forEach from 'lodash/forEach';
import EventBus from '../lib/EventBus';
import SpawnPatternCollection from '../trafficGenerator/SpawnPatternCollection';
import SpawnScheduler from '../trafficGenerator/SpawnScheduler';
import { SELECTORS } from '../constants/selectors';
import { FLIGHT_CATEGORY } from '../constants/aircraftConstants';
import { EVENT } from '../constants/eventNames';

/**
 * @property UI_SETTINGS_MODAL_TEMPLATE
 * @type {string}
 * @final
 */
const UI_TRAFFIC_MODAL_TEMPLATE = `
    <div class="traffic-dialog dialog">
        <p class="dialog-title">Traffic rate</p>
        <div class="dialog-body nice-scrollbar"></div>
    </div>`;

/**
 * @class TrafficRateController
 */
export default class TrafficRateController {

    constructor($element) {
        /**
         * @property EventBus
         * @type {EventBus}
         * @default EventBus
         * @private
         */
        this._eventBus = EventBus;

        /**
         * Root DOM element
         *
         * @property $element
         * @type {jquery|HTML Element}
         * @default $element
         */
        this.$element = $element;

        /**
         * Dialog DOM element
         *
         * @property $dialog
         * @type {jquery|HTML Element}
         * @default null
         */
        this.$dialog = null;

        this.init()
            ._setupHandlers()
            .enable();
    }

    /**
     *
     * @for TrafficRateController
     * @method init
     * @chainable
     */
    init() {
        this.$dialog = $(UI_TRAFFIC_MODAL_TEMPLATE);
        this.$body = this.$dialog.find('.dialog-body');

        this._buildDialogBody();
        this.$element.append(this.$dialog);

        return this;
    }

    /**
     * Create event handlers
     *
     * Should be run once only on instantiation
     *
     * @for TrafficRateController
     * @method _setupHandlers
     * @chainable
     */
    _setupHandlers() {
        this._onAirportChangeHandler = this.onAirportChange.bind(this);

        return this;
    }

    /**
     * Enable event handlers
     *
     * should be run only once on instantiation
     *
     * @for TrafficRateController
     * @method enable
     * @chainable
     */
    enable() {
        this._eventBus.on(EVENT.AIRPORT_CHANGE, this._onAirportChangeHandler);

        return this;
    }

    /**
     * Disable event handlers
     *
     * @for TrafficRateController
     * @method disable
     * @chainable
     */
    disable() {
        this._eventBus.off(EVENT.AIRPORT_CHANGE, this._onAirportChangeHandler);

        return this;
    }

    /**
     * Returns whether the airport selection dialog is open
     *
     * @for TrafficRateController
     * @method isDialogOpen
     * @return {boolean}
     */
    isDialogOpen() {
        return this.$dialog.hasClass(SELECTORS.CLASSNAMES.OPEN);
    }

    /**
    * @for TrafficRateController
    * @method toggleDialog
    */
    toggleDialog() {
        this.$dialog.toggleClass(SELECTORS.CLASSNAMES.OPEN);
    }

    /**
     * Rebuilds the dialog body when the airport is changed.
     *
     * @for TrafficRateController
     * @method onAirportChange
     */
    onAirportChange() {
        this._buildDialogBody();
    }

    /**
     * Builds the dialog body
     *
     * @for TrafficRateController
     * @method _buildDialogBody
     */
    _buildDialogBody() {
        this.$body.empty();

        _forEach(['departures', 'arrivals', 'overflights'], (opt) => {
            const $option = this._buildFormElement(opt);

            this.$body.append($option);
        });

        const arrivals = SpawnPatternCollection.findSpawnPatternsByCategory(FLIGHT_CATEGORY.ARRIVAL);
        const departures = SpawnPatternCollection.findSpawnPatternsByCategory(FLIGHT_CATEGORY.DEPARTURE);
        const overflights = SpawnPatternCollection.findSpawnPatternsByCategory(FLIGHT_CATEGORY.OVERFLIGHT);

        if (arrivals.length > 0) {
            this.$body.append('<hr />');
        }

        _forEach(arrivals, (spawnPattern) => {
            const $option = this._buildOptionForSpawnPattern(spawnPattern);

            this.$body.append($option);
        });

        if (departures.length > 0) {
            this.$body.append('<hr />');
        }

        _forEach(departures, (spawnPattern) => {
            const $option = this._buildOptionForSpawnPattern(spawnPattern);

            this.$body.append($option);
        });

        if (overflights.length > 0) {
            this.$body.append('<hr />');
        }

        _forEach(overflights, (spawnPattern) => {
            const $option = this._buildOptionForSpawnPattern(spawnPattern);

            this.$body.append($option);
        });
    }

    /**
     * Builds a single slider
     *
     * @for TrafficRateController
     * @method _buildFormElement
     * @return {jquery|HTML Element}
     */
    _buildFormElement(opt) {
        const currentValue = 5;
        const template = `
            <div class="form-element">
                <div class="form-label">${opt.replace(/\./g, ' ')}</div>
                <input class="form-slider" type="range" min="0" max="60" value="${currentValue}" name="${opt}" />
            </div>`;
        const $element = $(template);

        $element.on('change', this._onSliderChange);

        return $element;
    }

    /**
     * Builds a single slider
     *
     * @for TrafficRateController
     * @method _buildFormElementForSpawnPattern
     * @param spawnPattern {SpawnPatternModel}
     * @return {jquery|HTML Element}
     */
    _buildFormElementForSpawnPattern(spawnPattern) {
        const name = spawnPattern.routeString.replace(/\./g, ' ');
        const template = `
            <div class="form-element">
                <div class="form-label">${name}</div>
                <input class="form-slider" type="range" min="0" max="60" value="${spawnPattern.rate}" name="${name}" />
            </div>`;
        const $element = $(template);

        $element.on('change', (event) => this._onChangeSpawnPattern(event, spawnPattern));

        return $element;
    }

    _onSliderChange(event) {
        const $target = $(event.target);
        const name = $target.attr('name');
        const value = $target.val();

        console.log(`CHANGE: ${name} ${value}`);

        // TODO: implement
    }

    _onChangeSpawnPattern(event, spawnPattern) {
        const $target = $(event.target);
        const value = $target.val();

        // debug, to be removed
        console.log(`CHANGE: ${spawnPattern.routeString} ${value}`);

        spawnPattern.rate = parseFloat(value);

        SpawnScheduler.resetTimer(spawnPattern);
    }
}
