import $ from 'jquery';
import _forEach from 'lodash/forEach';
import _isNaN from 'lodash/isNaN';
import GameController from '../game/GameController';

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
 * @property UI_OPTION_LABEL_TEMPLATE
 * @type {string}
 * @final
 */
const UI_OPTION_LABEL_TEMPLATE = '<span class="option-description"></span>';

/**
 * @property UI_OPTION_SELECTOR_TEMPLATE
 * @type {string}
 * @final
 */
const UI_OPTION_SELECTOR_TEMPLATE = '<span class="option-type-select"></span>';

/**
 * @property UI_STATIC_TEXT_TEMPLATE
 * @type {string}
 * @final
 */
const UI_STATIC_TEXT_TEMPLATE = '<span class="option-static-text"></span>';

/**
 * @class SettingsController
 */
export default class SettingsController {
    constructor($element) {
        /**
         * Root DOM element
         *
         * @property $element
         * @type {jquery|HTML Element}
         * @default $element
         */
        this.$element = $element;

        this.init();
    }

    /**
     *
     * @for SettingsController
     * @method init
     * @chainable
     */
    init() {
        const $options = $(UI_SETTINGS_MODAL_TEMPLATE);
        const $version = this._buildVersionTemplate();
        const descriptions = GameController.game.option.getDescriptions();

        _forEach(descriptions, (opt) => {
            if (opt.type !== 'select') {
                return;
            }

            const $container = this._buildOptionTemplate(opt);
            $options.append($container);
        });

        $version.addClass('simulator-version');
        $options.append($version);
        this.$element.append($options);

        return this;
    }

    /**
     * Build the html for a game option and its cooresponding value elements.
     *
     * @for SettingsController
     * @method _buildOptionTemplate
     * @param option {object}
     * @return $container {jquery Element}
     * @private
     */
    _buildOptionTemplate(option) {
        const $container = $(UI_OPTION_CONTAINER_TEMPLATE);
        const $label = $(UI_OPTION_LABEL_TEMPLATE);
        const $optionSelector = $(UI_OPTION_SELECTOR_TEMPLATE);
        const $selector = $(`<select name="${option.name}"></select>`);
        const selectedOption = GameController.game.option.getOptionByName(option.name);

        $container.append($label);
        $label.text(option.description);

        // this could me done with a _map(), but verbosity here makes the code easier to read
        for (let i = 0; i < option.optionList.length; i++) {
            const $optionSelectTempalate = this._buildOptionSelectTemplate(option.optionList[i], selectedOption);

            $selector.append($optionSelectTempalate);
        }

        // TODO: this should be moved to proper event handler method and only assigned here.
        $selector.change((event) => {
            const $currentTarget = $(event.currentTarget);

            GameController.game.option.setOptionByName($currentTarget.attr('name'), $currentTarget.val());
        });

        $optionSelector.append($selector);
        $container.append($optionSelector);

        return $container;
    }

    /**
     * Build the html for a select option.
     *
     * @for SettingsController
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
            : selectedOption;

        if (optionData.value === parsedSelectedOption) {
            return `<option value="${optionData.value}" selected>${optionData.displayLabel}</option>`;
        }

        return `<option value="${optionData.value}">${optionData.displayLabel}</option>`;
    }

    /**
     * Builds a static text information psuedo-option.
     * Will display as such:
     *
     * `(settings menu)`
     *
     * `Text text text         Value value value`
     *
     * @for SettingsController
     * @method _buildStaticTemplate
     * @param {string} label
     * @param {string} value (optional)
     * @return {JQuery|HTML element}
     */
    _buildStaticTemplate(label, value = '') {
        const $container = $(UI_OPTION_CONTAINER_TEMPLATE);
        const $label = $(UI_OPTION_LABEL_TEMPLATE);
        const $value = $(UI_STATIC_TEXT_TEMPLATE);

        $container.append($label);
        $container.append($value);
        $label.text(label);
        $value.text(value);

        return $container;
    }

    /**
     * Build the html for the simulator version psuedo-option.
     *
     * @for SettingsController
     * @method _buildVersionTemplate
     * @return {JQuery|HTML element}
     */
    _buildVersionTemplate() {
        const simulatorVersion = window.GLOBAL.VERSION;

        return this._buildStaticTemplate('openScope ATC simulator version', simulatorVersion);
    }
}
