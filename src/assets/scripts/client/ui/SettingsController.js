import $ from 'jquery';
import _forEach from 'lodash/forEach';
import _isNaN from 'lodash/isNaN';
import GameController from '../game/GameController';
import { SELECTORS } from '../constants/selectors';

/**
 * @property UI_SETTINGS_MODAL_TEMPLATE
 * @type {string}
 * @final
 */
const UI_SETTINGS_MODAL_TEMPLATE = `
    <div class="option-dialog dialog notSelectable">
        <p class="dialog-title">Settings</p>
        <div class="dialog-body nice-scrollbar"></div>
    </div>`;

/**
 * @property UI_DIALOG_FOOTER_TEMPLATE
 * @type {string}
 * @final
 */
const UI_DIALOG_FOOTER_TEMPLATE = '<div class="dialog-footer"></div>';

/**
 * @property UI_OPTION_CONTAINER_TEMPLATE
 * @type {string}
 * @final
 */
const UI_OPTION_CONTAINER_TEMPLATE = '<div class="form-element"></div>';

/**
 * @property UI_OPTION_LABEL_TEMPLATE
 * @type {string}
 * @final
 */
const UI_OPTION_LABEL_TEMPLATE = '<span class="form-label"></span>';

/**
 * @property UI_OPTION_SELECTOR_TEMPLATE
 * @type {string}
 * @final
 */
const UI_OPTION_SELECTOR_TEMPLATE = '<span class="form-type-select"></span>';

// TODO: This class has no corresponding styles
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
     * @for SettingsController
     * @method init
     * @chainable
     */
    init() {
        this.$dialog = $(UI_SETTINGS_MODAL_TEMPLATE);
        this.$dialogBody = this.$dialog.find(SELECTORS.DOM_SELECTORS.DIALOG_BODY);
        const descriptions = GameController.game.option.getDescriptions();

        _forEach(descriptions, (opt) => {
            let $container = this._buildTextInputTemplate(opt);

            if (opt.type === 'select') {
                $container = this._buildSelectInputTemplate(opt);
            }

            this.$dialogBody.append($container);
        });

        const $version = this._buildVersionTemplate();

        this.$dialog.append($version);
        this.$element.append(this.$dialog);

        return this;
    }

    /**
     * Returns whether the airport selection dialog is open
     *
     * @for SettingsController
     * @method isDialogOpen
     * @return {boolean}
     */
    isDialogOpen() {
        return this.$dialog.hasClass(SELECTORS.CLASSNAMES.OPEN);
    }

    /**
    * @for SettingsController
    * @method toggleDialog
    */
    toggleDialog() {
        this.$dialog.toggleClass(SELECTORS.CLASSNAMES.OPEN);
    }

    /**
     * Build the html for a game option and its corresponding value elements.
     *
     * @for SettingsController
     * @method _buildSelectInputTemplate
     * @param option {object}
     * @return $container {jquery Element}
     * @private
     */
    _buildSelectInputTemplate(option) {
        const $container = $(UI_OPTION_CONTAINER_TEMPLATE);
        const $label = $(UI_OPTION_LABEL_TEMPLATE);
        const $optionSelector = $(UI_OPTION_SELECTOR_TEMPLATE);
        const $selector = $(`<select name="${option.name}"></select>`);
        const selectedOption = GameController.game.option.getOptionByName(option.name);

        $label.text(option.description);
        $container.append($label);

        // this could me done with a _map(), but verbosity here makes the code easier to read
        for (let i = 0; i < option.optionList.length; i++) {
            const $optionSelectTempalate = this._buildSelectOptionTemplate(option.optionList[i], selectedOption);

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
     * @method _buildSelectOptionTemplate
     * @param optionData {array<string>}
     * @param selectedOption {string}
     * @return optionSelectTempalate {HTML Element}
     * @private
     */
    _buildSelectOptionTemplate(optionData, selectedOption) {
        if (optionData.value === selectedOption) {
            return `<option value="${optionData.value}" selected>${optionData.displayLabel}</option>`;
        }

        return `<option value="${optionData.value}">${optionData.displayLabel}</option>`;
    }

    /**
     * Build text input form element
     *
     * @for SettingsController
     * @method _buildTextInputTemplate
     * @param option {object}
     * @return $container {jquery Element}
     */
    _buildTextInputTemplate(option) {
        const $container = $(UI_OPTION_CONTAINER_TEMPLATE);
        const $label = $(UI_OPTION_LABEL_TEMPLATE);
        const currentValue = GameController.game.option.getOptionByName(option.name);
        const $selector = $(`<input class="form-input" step="any"
                                    type="${option.type}"
                                    name="${option.name}"
                                    value="${currentValue}">`);
        const $unit = $(`<span class="form-value">${option.unit}</span>`);

        $label.text(option.description);
        $container.append($label);

        // TODO: this should be moved to proper event handler method and only assigned here.
        $selector.change((event) => {
            const $currentTarget = $(event.currentTarget);
            const currentValue = $currentTarget.val();

            if (!option.validationHandler(currentValue)) {
                // User didn't enter a valid value, revert to the old value
                $selector.val(currentValue);

                return;
            }

            let nextValue = currentValue;
            if (option.type === 'number') {
                nextValue = parseFloat(nextValue);
            }

            GameController.game.option.setOptionByName($currentTarget.attr('name'), nextValue);
        });

        $container.append($selector);
        $container.append($unit);

        return $container;
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
        const $container = $(UI_DIALOG_FOOTER_TEMPLATE);

        $container.text(`openScope ATC Simulator v${simulatorVersion}`);

        return $container;
    }
}
