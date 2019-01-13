import $ from 'jquery';
import _forEach from 'lodash/forEach';
import EventBus from '../lib/EventBus';
import SpawnPatternCollection from '../trafficGenerator/SpawnPatternCollection';
import SpawnScheduler from '../trafficGenerator/SpawnScheduler';
import { SELECTORS, CLASSNAMES } from '../constants/selectors';
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

        /**
         * Spawn rates by category or route
         *
         * @property _rates
         * @type {object}
         * @default null
         */
        this._rates = null;

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
        this.$dialogBody = this.$dialog.find(`.${CLASSNAMES.DIALOG_BODY}`);

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
        this.$dialogBody.empty();
        this._rates = {};

        for (const category of Object.values(FLIGHT_CATEGORY)) {
            this._rates[category] = 1;

            const $formElement = this._buildFormElement(category, category, this._onChangeFlightCategoryRate);

            this.$dialogBody.append($formElement);
        }

        for (const category of Object.values(FLIGHT_CATEGORY)) {
            const spawnPatterns = SpawnPatternCollection.findSpawnPatternsByCategory(category);

            if (spawnPatterns.length > 0) {
                this.$dialogBody.append('<hr />');
            }

            _forEach(spawnPatterns, (spawnPattern) => {
                const { routeString } = spawnPattern;
                this._rates[routeString] = spawnPattern.rate;

                const $formElement = this._buildFormElement(routeString, spawnPattern, this._onChangeSpawnPatternRate);

                this.$dialogBody.append($formElement);
            });
        }
    }

    /**
     * Build form element
     *
     * @for TrafficRateController
     * @method _buildFormElement
     * @param key {string}
     * @param data {string|object} passed to the change handler
     * @param onChangeMethod {function}
     * @return {jquery|HTML Element}
     */
    _buildFormElement(key, data, onChangeMethod) {
        const rate = this._rates[key];
        const name = key.replace(/\./g, ' ');
        const template = `
            <div class="form-element">
                <div class="form-label">${name}</div>
                <input class="form-input" type="number" name="${key}" value="${rate}" min="0" max="60">
            </div>`;
        const $element = $(template);
        const onChangeHandler = onChangeMethod.bind(this);

        $element.on('change', { rateKey: data }, onChangeHandler);

        return $element;
    }

    /**
     * Called when the rate for a flight category was changed
     *
     * @for TrafficRateController
     * @method _onChangeFlightCategoryRate
     * @param event
     */
    _onChangeFlightCategoryRate(event) {
        const $target = $(event.target);
        const value = $target.val();
        const category = event.data.rateKey;

        this._rates[category] = parseFloat(value);

        const spawnPatterns = SpawnPatternCollection.findSpawnPatternsByCategory(category);

        for (const spawnPattern of spawnPatterns) {
            this._updateRate(spawnPattern);
        }
    }

    /**
     * Called when the rate for a route was changed
     *
     * @for TrafficRateController
     * @method _onChangeSpawnPatternRate
     * @param event
     */
    _onChangeSpawnPatternRate(event) {
        const $target = $(event.target);
        const value = $target.val();
        const spawnPattern = event.data.rateKey;

        this._rates[spawnPattern.routeString] = parseFloat(value);

        this._updateRate(spawnPattern);
    }

    /**
     * Recalculate the rate for a spawn pattern
     *
     * @for TrafficRateController
     * @method _updateRate
     * @param spawnPattern {SpawnPatternModel}
     */
    _updateRate(spawnPattern) {
        const { category, routeString } = spawnPattern;

        spawnPattern.rate = this._rates[category] * this._rates[routeString];

        SpawnScheduler.resetTimer(spawnPattern);
    }
}
