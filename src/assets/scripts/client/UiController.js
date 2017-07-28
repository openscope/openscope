/* eslint-disable camelcase, no-mixed-operators, func-names, object-shorthand, no-undef, no-param-reassign */
import $ from 'jquery';
import _forEach from 'lodash/forEach';
import _has from 'lodash/has';
import _isNaN from 'lodash/isNaN';
import _keys from 'lodash/keys';
import EventBus from './lib/EventBus';
import GameController from './game/GameController';
import AirportController from './airport/AirportController';
import { round } from './math/core';
import { speech_toggle } from './speech';
import { EVENT } from './constants/eventNames';
import { GAME_OPTION_NAMES } from './constants/gameOptionConstants';
import { INVALID_NUMBER } from './constants/globalConstants';
import { SELECTORS } from './constants/selectors';
import { STORAGE_KEY } from './constants/storageKeys';
import { THEME } from './constants/themes';

/**
 * @property UI_SETTINGS_MODAL_TEMPLATE
 * @type {string}
 * @final
 */
const UI_SETTINGS_MODAL_TEMPLATE = '<div class="option-dialog"></div>';

/**
 * @property UI_OPTION_CONTAINER_TEMPLATE
 * @type {string}
 * @final
 */
const UI_OPTION_CONTAINER_TEMPLATE = '<div class="option"></div>';

/**
 * @property UI_OPTION_SELECTOR_TEMPLATE
 * @type {string}
 * @final
 */
const UI_OPTION_SELECTOR_TEMPLATE = '<span class="option-type-select"></span>';

/**
 * @class UiController
 */
class UiController {
    /**
     * @constructor
     */
    constructor() {
        this._eventBus = EventBus;

        this.$element = null;
        this.$airportList = null;
        this.$airportListNotes = null;
        this.$toggleTutorial = null;
        this.$fastForwards = null;
        this.$pauseToggle = null;
        this.$pausedImg = null;
        this.$speechToggle = null;
        this.$switchAirport = null;
        this.$toggleLabels = null;
        this.$toggleRestrictedAreas = null;
        this.$toggleSids = null;
        this.$toggleTerrain = null;
        this.$toggleOptions = null;

        this.scale_default = 8; // pixels per km
        this.scale_max = 80; // max scale
        this.scale_min = 1; // min scale
        this.scale = this.scale_default;
        // TODO: This belongs in the CanvasController, not UiController
        this.terrain = THEME.DEFAULT.TERRAIN;
    }

    /**
     * Initialization method
     *
     * Called from the `AppController` after instantiation of the `AircraftController`
     *
     * @for UiController
     * @method init
     * @param $element {jQuery Element}
     */
    init($element) {
        this.$element = $element;

        this.$airportList = this.$element.find(SELECTORS.DOM_SELECTORS.AIRPORT_LIST);
        this.$airportListNotes = this.$element.find(SELECTORS.DOM_SELECTORS.AIRPORT_LIST_NOTES);
        this.$airportSwitch = this.$element.find(SELECTORS.DOM_SELECTORS.AIRPORT_SWITCH);
        this.$toggleTutorial = this.$element.find(SELECTORS.DOM_SELECTORS.TOGGLE_TUTORIAL);
        this.$fastForwards = this.$element.find(SELECTORS.DOM_SELECTORS.FAST_FORWARDS);
        this.$pauseToggle = this.$element.find(SELECTORS.DOM_SELECTORS.PAUSE_TOGGLE);
        this.$pausedImg = this.$element.find(`${SELECTORS.DOM_SELECTORS.PAUSED} img`);
        this.$speechToggle = this.$element.find(SELECTORS.DOM_SELECTORS.SPEECH_TOGGLE);
        this.$switchAirport = this.$element.find(SELECTORS.DOM_SELECTORS.SWITCH_AIRPORT);
        this.$toggleLabels = this.$element.find(SELECTORS.DOM_SELECTORS.TOGGLE_LABELS);
        this.$toggleRestrictedAreas = this.$element.find(SELECTORS.DOM_SELECTORS.TOGGLE_RESTRICTED_AREAS);
        this.$toggleSids = this.$element.find(SELECTORS.DOM_SELECTORS.TOGGLE_SIDS);
        this.$toggleTerrain = this.$element.find(SELECTORS.DOM_SELECTORS.TOGGLE_TERRAIN);
        this.$toggleOptions = this.$element.find(SELECTORS.DOM_SELECTORS.TOGGLE_OPTIONS);

        return this.setupHandlers()
            .enable();
    }

    /**
     * @for UiController
     * @method setupHandlers
     * @chainable
     */
    setupHandlers() {
        return this;
    }

    /**
     * Enable event handlers
     *
     * should be run only once on instantiation
     *
     * @for UiController
     * @method enable
     */
    enable() {
        this.$toggleTutorial.on('click', (event) => this._eventBus.trigger(EVENT.TOGGLE_TUTORIAL, event));
        this.$fastForwards.on('click', (event) => GameController.game_timewarp_toggle(event));
        this.$pauseToggle.on('click', (event) => GameController.game_pause_toggle(event));
        this.$pausedImg.on('click', (event) => GameController.game_unpause(event));

        this.$speechToggle.on('click', (event) => speech_toggle(event));
        this.$switchAirport.on('click', (event) => this.ui_airport_toggle(event));
        this.$toggleLabels.on('click', (event) => this.canvas_labels_toggle(event));
        this.$toggleRestrictedAreas.on('click', (event) => this.canvas_restricted_toggle(event));
        this.$toggleSids.on('click', (event) => this.canvas_sids_toggle(event));
        this.$toggleTerrain.on('click', (event) => this.canvas_terrain_toggle(event));
        this.$toggleOptions.on('click', (event) => this.ui_options_toggle(event));

        return this;
    }

    /**
     * Disable event handlers
     *
     * @for UiController
     * @method disable
     */
    disable() {
        this.$toggleTutorial.off('click', (event) => this._eventBus.trigger(EVENT.TOGGLE_TUTORIAL, event));
        this.$fastForwards.off('click', (event) => GameController.game_timewarp_toggle(event));
        this.$pauseToggle.off('click', (event) => GameController.game_pause_toggle(event));
        this.$pausedImg.off('click', (event) => GameController.game_unpause(event));

        this.$speechToggle.off('click', (event) => speech_toggle(event));
        this.$switchAirport.off('click', (event) => this.ui_airport_toggle(event));
        this.$toggleLabels.off('click', (event) => this.canvas_labels_toggle(event));
        this.$toggleRestrictedAreas.off('click', (event) => this.canvas_restricted_toggle(event));
        this.$toggleSids.off('click', (event) => this.canvas_sids_toggle(event));
        this.$toggleTerrain.off('click', (event) => this.canvas_terrain_toggle(event));
        this.$toggleOptions.off('click', (event) => this.ui_options_toggle(event));

        return this.destroy();
    }

    /**
     * Tear down the instance
     *
     * @for UiController
     * @method destroy
     */
    destroy() {
        this.$element = null;
        this.$airportList = null;
        this.$airportListNotes = null;
        this.$toggleTutorial = null;
        this.$fastForwards = null;
        this.$pauseToggle = null;
        this.$pausedImg = null;
        this.$speechToggle = null;
        this.$switchAirport = null;
        this.$toggleLabels = null;
        this.$toggleRestrictedAreas = null;
        this.$toggleSids = null;
        this.$toggleTerrain = null;
        this.$toggleOptions = null;

        this.ui = {};
        this.ui.scale_default = INVALID_NUMBER;
        this.ui.scale_max = INVALID_NUMBER;
        this.ui.scale_min = INVALID_NUMBER;
        this.ui.scale = INVALID_NUMBER;
        this.ui.terrain = {};


        return this;
    }

    /**
     * @for UiController
     * @method ui_init_pre
     */
    ui_init_pre() {
        this.scale_default = 8; // pixels per km
        this.scale_max = 80; // max scale
        this.scale_min = 1; // min scale
        this.scale = this.scale_default;
        this.terrain = THEME.DEFAULT.TERRAIN;

        this.ui_set_scale_from_storage();
    }

    /**
     * @for uiController
     * @method ui_init
     */
    ui_init() {
        this.$fastForwards.prop('title', 'Set time warp to 2');

        const $options = $(UI_SETTINGS_MODAL_TEMPLATE);
        const descriptions = GameController.game.option.getDescriptions();

        _forEach(descriptions, (opt) => {
            if (opt.type !== 'select') {
                return;
            }

            const $container = this._buildOptionTemplate(opt);
            $options.append($container);
        });

        $('body').append($options);
    }

    /**
     * Build the html for a game option and its cooresponding value elements.
     *
     * @for UiController
     * @method _buildOptionTemplate
     * @param option {object}
     * @return $container {jquery Element}
     * @private
     */
    _buildOptionTemplate(option) {
        const $container = $(UI_OPTION_CONTAINER_TEMPLATE);
        $container.append(`<span class="option-description">${option.description}</span>`);

        const $optionSelector = $(UI_OPTION_SELECTOR_TEMPLATE);
        const $selector = $(`<select name="${option.name}"></select>`);
        const selectedOption = GameController.game.option.getOptionByName(option.name);

        // this could me done with a _map(), but verbosity here makes the code easier to read
        for (let i = 0; i < option.optionList.length; i++) {
            const $optionSelectTempalate = this._buildOptionSelectTemplate(option.optionList[i], selectedOption);

            $selector.append($optionSelectTempalate);
        }

        // TODO: this should be moved to proper event handler method and only assigned here.
        $selector.change((event) => {
            const $currentTarget = $(event.currentTarget);

            GameController.game.option.setOptionByName($currentTarget.attr('name'), $currentTarget.val());

            if ($currentTarget.attr('name') === GAME_OPTION_NAMES.INCLUDE_WIP_AIRPORTS) {
                this._buildAirportList();
            }
        });

        $optionSelector.append($selector);
        $container.append($optionSelector);

        return $container;
    }

    /**
     * Build the html for a select option.
     *
     * @for UiController
     * @method _buildOptionTemplate
     * @param optionData {array<string>}
     * @param selectedOption {string}
     * @return optionSelectTempalate {HTML Element}
     * @private
     */
    _buildOptionSelectTemplate(optionData, selectedOption) {
        // the `selectedOption` coming in to this method will always be a string (due to existing api) but
        // could contain valid numbers. here we test for valid number and build `parsedSelectedOption` accordingly.
        const parsedSelectedOption = !_isNaN(parseFloat(selectedOption))
            ? parseFloat(selectedOption)
            : selectedOption
        let optionSelectTempalate = `<option value="${optionData.value}">${optionData.displayLabel}</option>`;

        if (optionData.value === parsedSelectedOption) {
            optionSelectTempalate = `<option value="${optionData.value}" selected>${optionData.displayLabel}</option>`;
        }

        return optionSelectTempalate;
    }

    /**
     * @for uiController
     * @method onClickAirportListItemHandler
     * @paam event {jquery event}
     */
    onClickAirportListItemHandler(event) {
        if (event.data !== AirportController.airport_get().icao) {
            AirportController.airport_set(event.data);
            this.ui_airport_close();
        }
    }

    /**
     * @for uiController
     * @method buildAirportListItemTemplate
     * @param icao {string}
     * @param difficulty {string}
     * @param name {string}
     * @return {DOM element|string}
     */
    buildAirportListItemTemplate(icao, difficulty, name, flagIcon) {
        return `<li class="airport icao-${icao.toLowerCase()}">` +
                    `<span style="font-size: 7pt" class="difficulty">${difficulty}</span>` +
                    `<span class="icao">${icao.toUpperCase()}</span>` +
                    `<span class="name">${name}</span>` +
                    `<span class="symbol">${flagIcon}</span>` +
                '</li>';
    }

    /**
     * @for UiController
     * @method ui_complete
     */
    ui_complete() {
        this._buildAirportList();
    }

    /**
     * Loop through each airport defined in the `AirportController` and build
     * a list item that can be appended to the #airport-list element.
     *
     * Includes a switch to conditionally include WIP airports based on a user setting
     *
     * @for UiController
     * @method _buildAirportList
     * @private
     */
    _buildAirportList() {
        // clear out the contents of this element
        // this method will run every time a user changes the `INCLUDE_WIP_AIPRORTS` option
        this.$airportList.empty();

        const airports = _keys(AirportController.airports).sort();
        const shouldShowWipAirports = GameController.getGameOption(GAME_OPTION_NAMES.INCLUDE_WIP_AIRPORTS) === 'yes';
        let difficulty = '';

        for (let i = 0; i < airports.length; i++) {
            const { name, icao, level, wip } = AirportController.airports[airports[i]];

            if (!shouldShowWipAirports && wip) {
                continue;
            }

            difficulty = this._buildAirportListIconForDifficultyLevel(level);
            const flagIcon = wip
                ? ' &#9983'
                : '';
            const $airportListItem = $(this.buildAirportListItemTemplate(icao, difficulty, name, flagIcon));

            // TODO: replace with an onClick() handler
            $airportListItem.click(icao.toLowerCase(), (event) => {
                if (event.data !== AirportController.airport_get().icao) {
                    AirportController.airport_set(event.data);
                    this.ui_airport_close();
                }
            });

            this.$airportList.append($airportListItem);
        }

        this._buildAirportListFooter();
    }

    /**
     * Given a `difficultyLevel`, create a string with the correct icon char code
     * that can be used in the airport list
     *
     * @for UiController
     * @method _buildAirportListIconForDifficultyLevel
     * @param difficultyLevel {string}
     * @return difficulty {string}
     * @private
     */
    _buildAirportListIconForDifficultyLevel(difficultyLevel) {
        let difficulty;
        const icon = '&#9992;';

        switch (difficultyLevel) {
            case 'beginner':
                difficulty = icon;
                break;
            case 'easy':
                difficulty = icon.repeat(2);
                break;
            case 'medium':
                difficulty = icon.repeat(3);
                break;
            case 'hard':
                difficulty = icon.repeat(4);
                break;
            case 'expert':
                difficulty = icon.repeat(5);
                break;
            default:
                difficulty = '?';
                break;
        }

        return difficulty;
    }

    /**
     * Build the markup for the airport list footer
     *
     * This is changed based on a user setting
     *
     * @for UiController
     * @method _buildAirportListFooter
     */
    _buildAirportListFooter() {
        // clear out the contents of this element
        // this method will run every time a user changes the `INCLUDE_WIP_AIPRORTS` option
        this.$airportListNotes.empty();

        const shouldShowWipAirports = GameController.getGameOption(GAME_OPTION_NAMES.INCLUDE_WIP_AIRPORTS) === 'yes';

        if (!shouldShowWipAirports) {
            const notes = $('<span class="words">Additional work-in-progress airports can be activated in the settings menu</span>');
            this.$airportListNotes.append(notes);

            return;
        }

        const symbol = $('<span class="symbol">&#9983</span>');
        const notes = $('<span class="words">indicates airport is a work in progress</span>');

        this.$airportListNotes.append(symbol);
        this.$airportListNotes.append(notes);
    }

    // TODO: this function should live in a helper file somewhere
    /**
     * @for UiController
     * @method px_to_km
     * @param pixels {number}
     * @return {number}
     */
    px_to_km(pixels) {
        return pixels / this.scale;
    }

    // TODO: this function should live in a helper file somewhere
    /**
     * @for UiController
     * @method km_to_px
     * @param kilometers {number}
     * @return {number}
     */
    km_to_px(kilometers) {
        return kilometers * this.scale;
    }

    /**
     * @for UiController
     * @method ui_after_zoom
     */
    ui_after_zoom() {
        localStorage[STORAGE_KEY.ATC_SCALE] = this.scale;
        prop.canvas.dirty = true;
    }

    /**
     * @for UiController
     * @method ui_zoom_out
     */
    ui_zoom_out() {
        const lastpos = [
            round(this.px_to_km(prop.canvas.panX)),
            round(this.px_to_km(prop.canvas.panY))
        ];

        this.scale *= 0.9;

        if (this.scale < this.scale_min) {
            this.scale = this.scale_min;
        }

        this.ui_after_zoom();

        prop.canvas.panX = round(this.km_to_px(lastpos[0]));
        prop.canvas.panY = round(this.km_to_px(lastpos[1]));
    }

    /**
     * @for UiController
     * @method ui_zoom_in
     */
    ui_zoom_in() {
        const lastpos = [
            round(this.px_to_km(prop.canvas.panX)),
            round(this.px_to_km(prop.canvas.panY))
        ];

        this.scale /= 0.9;
        if (this.scale > this.scale_max) {
            this.scale = this.scale_max;
        }

        this.ui_after_zoom();

        prop.canvas.panX = round(this.km_to_px(lastpos[0]));
        prop.canvas.panY = round(this.km_to_px(lastpos[1]));
    }

    /**
     * @for UiController
     * @method ui_zoom_reset
     */
    ui_zoom_reset() {
        this.scale = this.scale_default;

        this.ui_after_zoom();
    }

    /**
     * @for UiController
     * @method ui_log
     */
    ui_log(message, warn = false) {
        const html = $(`<span class="item"><span class="message">${message}</span></span>`);

        if (warn) {
            html.addClass(SELECTORS.CLASSNAMES.WARN);
        }

        const $log = $(SELECTORS.DOM_SELECTORS.LOG);
        $log.append(html);
        $log.scrollTop($log.get(0).scrollHeight);

        GameController.game_timeout((uiLogView) => {
            uiLogView.addClass(SELECTORS.CLASSNAMES.HIDDEN);

            setTimeout(() => {
                uiLogView.remove();
            }, 10000);
        }, 3, window, html);
    }

    /**
     * @for UiController
     * @method ui_airport_open
     */
    ui_airport_open() {
        this.$airportSwitch.addClass(SELECTORS.CLASSNAMES.OPEN);

        const $previousActiveAirport = this.$airportList.find(SELECTORS.DOM_SELECTORS.ACTIVE);

        // Remove the active class from a no-longer-selected airport in the list.
        if ($previousActiveAirport.length !== 0) {
            $previousActiveAirport.removeClass(SELECTORS.CLASSNAMES.ACTIVE);
        }

        const icao = AirportController.airport_get().icao.toLowerCase();
        $(`.airport.icao-${icao}`).addClass(SELECTORS.CLASSNAMES.ACTIVE);

        this.$switchAirport.addClass(SELECTORS.CLASSNAMES.ACTIVE);
    }

    /**
     * @for UiController
     * @method ui_airport_close
     */
    ui_airport_close() {
        this.$airportSwitch.removeClass(SELECTORS.CLASSNAMES.OPEN);
        this.$switchAirport.removeClass(SELECTORS.CLASSNAMES.ACTIVE);
    }

    /**
     * @for UiController
     * @method ui_airport_toggle
     */
    ui_airport_toggle() {
        if (this.$airportSwitch.hasClass(SELECTORS.CLASSNAMES.OPEN)) {
            this.ui_airport_close();
        } else {
            this.ui_airport_open();
        }
    }

    /**
     * @for UiController
     * @method canvas_labels_toggle
     * @param {jquery event}
     */
    canvas_labels_toggle(event) {
        $(event.target).closest(SELECTORS.DOM_SELECTORS.CONTROL).toggleClass(SELECTORS.CLASSNAMES.ACTIVE);

        prop.canvas.draw_labels = !prop.canvas.draw_labels;
    }

    /**
     * @for UiController
     * @method canvas_restricted_toggle
     */
    canvas_restricted_toggle(event) {
        $(event.target).closest(SELECTORS.DOM_SELECTORS.CONTROL)
            .toggleClass(`${SELECTORS.DOM_SELECTORS.WARNING_BUTTON} ${SELECTORS.CLASSNAMES.ACTIVE}`);

        prop.canvas.draw_restricted = !prop.canvas.draw_restricted;
    }

    /**
     * @for UiController
     * @method canvas_sids_toggle
     * @param event {jquery event}
     */
    canvas_sids_toggle(event) {
        $(event.target).closest(SELECTORS.DOM_SELECTORS.CONTROL).toggleClass(SELECTORS.CLASSNAMES.ACTIVE);

        prop.canvas.draw_sids = !prop.canvas.draw_sids;
    }

    /**
     * @for UiController
     * @method canvas_terrain_toggle
     * @param event {jquery event}
     */
    canvas_terrain_toggle(event) {
        $(event.target).closest(SELECTORS.DOM_SELECTORS.CONTROL).toggleClass(SELECTORS.CLASSNAMES.ACTIVE);
        prop.canvas.draw_terrain = !prop.canvas.draw_terrain;
    }

    /**
     * @for UiController
     * @method ui_options_toggle
     */
    ui_options_toggle() {
        const $optionsDialog = $(SELECTORS.DOM_SELECTORS.OPTIONS_DIALOG);

        if ($optionsDialog.hasClass(SELECTORS.CLASSNAMES.OPEN)) {
            $optionsDialog.removeClass(SELECTORS.CLASSNAMES.OPEN);
            $optionsDialog.removeClass(SELECTORS.CLASSNAMES.ACTIVE);
        } else {
            $optionsDialog.addClass(SELECTORS.CLASSNAMES.OPEN);
            $optionsDialog.addClass(SELECTORS.CLASSNAMES.ACTIVE);
        }
    }

    /**
     * @for UiController
     * @method ui_set_scale_from_storage
     */
    ui_set_scale_from_storage() {
        if (!_has(localStorage, STORAGE_KEY.ATC_SCALE)) {
            return;
        }

        this.scale = localStorage[STORAGE_KEY.ATC_SCALE];
    }
}

export default new UiController();
