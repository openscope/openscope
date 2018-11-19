import $ from 'jquery';
import _forEach from 'lodash/forEach';
import SpawnPatternCollection from '../trafficGenerator/SpawnPatternCollection';
import { SELECTORS } from '../constants/selectors';
import { FLIGHT_CATEGORY } from '../constants/aircraftConstants';

/**
 * @property UI_SETTINGS_MODAL_TEMPLATE
 * @type {string}
 * @final
 */
const UI_TRAFFIC_MODAL_TEMPLATE = '<div class="traffic-dialog dialog"><p class="dialog-titel">Traffic rate</p><div class="dialog-body nice-scrollbar"></div></div>';

/**
 * @class TrafficRateController
 */
export default class TrafficRateController {

    constructor($element) {
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

        this.init();
    }

    /**
     *
     * @for SettingsController
     * @method init
     * @chainable
     */
    init() {
        this.$dialog = $(UI_TRAFFIC_MODAL_TEMPLATE);
        this.$body = this.$dialog.find('.dialog-body');

        _forEach(['departures', 'arrivals', 'overflights'], (opt) => {
            const $option = `<div class="option">
                                <div class="option-label">${opt}</div>
                                <input class="option-slider" type="range" min="0" max="20" value="5" />
                            </div>`;
            this.$body.append($option);
        });

        const arrivals = SpawnPatternCollection.findSpawnPatternsByCategory(FLIGHT_CATEGORY.ARRIVAL);
        const departures = SpawnPatternCollection.findSpawnPatternsByCategory(FLIGHT_CATEGORY.DEPARTURE);
        const overflights = SpawnPatternCollection.findSpawnPatternsByCategory(FLIGHT_CATEGORY.OVERFLIGHT);

        if (arrivals.length > 0) {
            this.$body.append('<hr />');
        }

        _forEach(arrivals, (opt) => {
            const $option = `<div class="option">
                                <div class="option-label">${opt.routeString.replace(/\./g, ' ')}</div>
                                <input class="option-slider" type="range" min="0" max="20" value="5" />
                            </div>`;
            this.$body.append($option);
        });

        if (departures.length > 0) {
            this.$body.append('<hr />');
        }

        _forEach(departures, (opt) => {
            const $option = `<div class="option">
                                <div class="option-label">${opt.routeString.replace(/\./g, ' ')}</div>
                                <input class="option-slider" type="range" min="0" max="20" value="5" />
                            </div>`;
            this.$body.append($option);
        });

        if (overflights.length > 0) {
            this.$body.append('<hr />');
        }

        _forEach(overflights, (opt) => {
            const $option = `<div class="option">
                                <div class="option-label">${opt.routeString.replace(/\./g, ' ')}</div>
                                <input class="option-slider" type="range" min="0" max="20" value="5" />
                            </div>`;
            this.$body.append($option);
        });

        this.$element.append(this.$dialog);

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
}
