import $ from 'jquery';
import _forEach from 'lodash/forEach';
import EventBus from '../lib/EventBus';
import EventTracker from '../EventTracker';
import SpawnPatternCollection from '../trafficGenerator/SpawnPatternCollection';
import SpawnScheduler from '../trafficGenerator/SpawnScheduler';
import { SELECTORS, CLASSNAMES } from '../constants/selectors';
import { FLIGHT_CATEGORY } from '../constants/aircraftConstants';
import { EVENT } from '../constants/eventNames';
import { REGEX } from '../constants/globalConstants';
import { TRACKABLE_EVENT } from '../constants/trackableEvents';

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

        /**
         * Form elements by category
         *
         * @property _elements
         * @type {array}
         * @default null
         */
        this._elements = null;

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
        this._elements = {};

        for (const category of Object.values(FLIGHT_CATEGORY)) {
            this._rates[category] = 1;
            this._elements[category] = [];
            const $formElement = this._buildSlider(category, category, category, this._onChangeFlightCategoryRate);

            this.$dialogBody.append($formElement);
        }

        for (const category of Object.values(FLIGHT_CATEGORY)) {
            const spawnPatterns = SpawnPatternCollection.findSpawnPatternsByCategory(category);

            if (spawnPatterns.length > 0) {
                this.$dialogBody.append('<hr />');
            }

            _forEach(spawnPatterns, (spawnPattern) => {
                const label = spawnPattern.routeString.replace(REGEX.SINGLE_DOT, ' ');
                this._rates[spawnPattern.id] = spawnPattern.rate;
                const $formElement = this._buildInputField(spawnPattern.id, label, spawnPattern, this._onChangeSpawnPatternRate);

                this.$dialogBody.append($formElement);
                this._elements[category].push({ spawnPattern, $formElement });
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
    _buildSlider(key, label, data, onChangeMethod) {
        const rate = this._rates[key];
        const template = `
            <div class="form-element">
                <div class="form-label">${label}</div>
                <input class="form-slider" type="range" name="${key}" value="${rate}" min="0" max="10" step="0.5" />
                <span class="form-value">${rate}</span>
            </div>`;
        const $element = $(template);
        const onChangeHandler = onChangeMethod.bind(this);

        $element.on('change', { rateKey: data }, onChangeHandler);

        return $element;
    }

    /**
     * Build form element
     *
     * @for TrafficRateController
     * @method _buildInputField
     * @param key {string}
     * @param data {string|object} passed to the change handler
     * @param onChangeMethod {function}
     * @return {jquery|HTML Element}
     */
    _buildInputField(key, label, data, onChangeMethod) {
        const rate = this._rates[key];
        const template = `
            <div class="form-element">
                <div class="form-label">${label}</div>
                <input class="form-input" type="number" name="${key}" value="${rate}" min="0" max="60">
                <span class="form-value">${rate}</span>
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
        const $output = $target.next(`.${CLASSNAMES.FORM_VALUE}`);
        const value = $target.val();
        const category = event.data.rateKey;
        const elements = this._elements[category];
        const { airportIcao } = elements[0].spawnPattern;
        this._rates[category] = parseFloat(value);

        $output.text(value);
        EventTracker.recordEvent(TRACKABLE_EVENT.CHANGE_SPAWN_PATTERN, 'flight-category', `${airportIcao}:${category}:${value}`);

        for (const { spawnPattern, $formElement } of elements) {
            const $childOutput = $formElement.children(`.${CLASSNAMES.FORM_VALUE}`);

            this._updateRate(spawnPattern, $childOutput);
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
        const $output = $target.next(`.${CLASSNAMES.FORM_VALUE}`);
        const value = $target.val();
        const spawnPattern = event.data.rateKey;
        const nextRate = parseFloat(value);
        this._rates[spawnPattern.id] = nextRate;

        EventTracker.recordEvent(
            TRACKABLE_EVENT.CHANGE_SPAWN_PATTERN,
            'spawn-pattern',
            `${spawnPattern.airportIcao}:${spawnPattern.routeString}:${spawnPattern.rate}:${nextRate}`
        );
        this._updateRate(spawnPattern, $output);
    }

    /**
     * Recalculate the rate for a spawn pattern
     *
     * @for TrafficRateController
     * @method _updateRate
     * @param spawnPattern {SpawnPatternModel}
     * @param $output {jQuery element} text element to output the actual rate
     */
    _updateRate(spawnPattern, $output) {
        const { category } = spawnPattern;
        spawnPattern.rate = this._rates[category] * this._rates[spawnPattern.id];

        $output.text(spawnPattern.rate);
        SpawnScheduler.resetTimer(spawnPattern);
    }
}
