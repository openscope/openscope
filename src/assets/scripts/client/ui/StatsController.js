import $ from 'jquery';
import _forEach from 'lodash/forEach';
import { SELECTORS } from '../constants/selectors';

/**
 * @property UI_OPTIONS_MODAL_TEMPLATE
 * @type {string}
 * @final
 */
const UI_OPTIONS_MODAL_TEMPLATE = `
    <div class="option-dialog dialog">
        <p class="dialog-title">Stats</p>
        <div class="stats-body"></div>
    </div>`;

/**
 * Names of game events as shown to user
 * @type {Object}
 */
const GAME_EVENTS_NAMES = {
    DEPARTURE: 'Departures',
    ARRIVAL: 'Arrivals',
    GO_AROUND: 'Go arounds',
    SEPARATION_LOSS: 'Separation losses',
    LOCALIZER_INTERCEPT_ABOVE_GLIDESLOPE: 'Localizer interceptions above glideslope',
    COLLISION: 'Collisions',
    NO_TAKEOFF_SEPARATION: 'No takeoff separation',
    AIRSPACE_BUST: 'Airspace bust',
    ILLEGAL_APPROACH_CLEARANCE: 'Illegal approach clearances',
    EXTREME_CROSSWIND_OPERATION: 'Extreme crosswind operations',
    EXTREME_TAILWIND_OPERATION: 'Extreme tailwind operations',
    HIGH_CROSSWIND_OPERATION: 'High crosswind operations',
    HIGH_TAILWIND_OPERATION: 'High tailwind operations',
    NOT_CLEARED_ON_ROUTE: 'Aircraft left airspace not cleared on their route'
};


/**
 * @class StatsController
 */
export default class StatsController {
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

        /**
         * Dialog's body DOM element
         *
         * @property $dialogBody
         * @type {jquery|HTML Element}
         * @default null
         */
        this.$dialogBody = null;

        this.init();
    }

    /**
     *
     * @for StatsController
     * @method init
     */
    init() {
        this.$dialog = $(UI_OPTIONS_MODAL_TEMPLATE);
        this.$dialogBody = this.$dialog.find(SELECTORS.DOM_SELECTORS.STATS_BODY);

        _forEach(GAME_EVENTS_NAMES, (gameEvent, key) => {
            this.$dialogBody.append(this._buildStatsItem(key));
        });

        this.$element.append(this.$dialog);

        return this;
    }

    /**
    * @for StatsController
    * @method toggleDialog
    */
    toggleDialog() {
        this.$dialog.toggleClass(SELECTORS.CLASSNAMES.OPEN);
    }

    /**
     * @for StatsController
     * @method _buildStatsItem
     * @private
     */
    _buildStatsItem(key) {
        return `<li class="stats-item">
                    <span class="stats-value" id="stats-value-${key}">0</span>
                    <span>${GAME_EVENTS_NAMES[key]}</span>
                </li>`;
    }
}
