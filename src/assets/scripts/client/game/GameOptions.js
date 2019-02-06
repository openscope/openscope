import _isNil from 'lodash/isNil';
import EventBus from '../lib/EventBus';
import EventTracker from '../EventTracker';
import { GAME_OPTION_VALUES } from '../constants/gameOptionConstants';
import { TRACKABLE_EVENT } from '../constants/trackableEvents';

/**
 * Set, store and retrieve game options.
 *
 * @class GameOptions
 */
export default class GameOptions {
    /**
     * @for GameOptions
     * @constructor
     */
    constructor() {
        /**
         * @property _eventBus
         * @type EventBus
         * @private
         */
        this._eventBus = EventBus;

        /**
         * @property _options
         * @type {Object}
         * @default {}
         * @private
         */
        this._options = {};

        /**
         * Model properties will be added for each game option
         * dynamically via `.addGameOptions()`
         *
         * @property {*}
         * @type {string}
         *
         * this[OPTION_NAME] = OPTION_VALUE;
         */

        this.addGameOptions();
    }

    /**
     * Add available game options to `_options` dictionary
     *
     * @for GameOptions
     * @method addGameOptions
     */
    addGameOptions() {
        for (let i = 0; i < GAME_OPTION_VALUES.length; i++) {
            const option = GAME_OPTION_VALUES[i];

            this.addOption(option);
        }
    }

    /**
     * @for GameOptions
     * @method addOption
     * @param optionProps {object}
     */
    addOption(optionProps) {
        const optionStorageKey = this.buildStorageName(optionProps.name);
        const storedOptionValue = global.localStorage.getItem(optionStorageKey);
        this._options[optionProps.name] = optionProps;
        let optionValue = optionProps.defaultValue;

        if (!_isNil(storedOptionValue)) {
            optionValue = storedOptionValue;
        }

        this[optionProps.name] = optionValue;
    }

    /**
     * @for GameOptions
     * @method getDescriptions
     * @return {object}
     */
    getDescriptions() {
        return this._options;
    }

    /**
     * Gets the value of a given game option
     *
     * @for GameOptions
     * @method getOptionByName
     * @param name {string}
     * @return {object}
     */
    getOptionByName(name) {
        return this[name];
    }

    /**
     * Sets a game option to a given value
     *
     * will fire an event with the `EventBus` is one is registered
     *
     * @for GameOptions
     * @method setOptionByName
     * @param name {string} name of the option to change
     * @param value {string} value to set the option to
     */
    setOptionByName(name, value) {
        this[name] = value;
        const optionStorageKey = this.buildStorageName(name);

        global.localStorage.setItem(optionStorageKey, value);
        EventTracker.recordEvent(TRACKABLE_EVENT.SETTINGS, name, value);

        if (this._options[name].onChangeEventHandler) {
            this._eventBus.trigger(this._options[name].onChangeEventHandler, value);
        }

        return value;
    }

    /**
     * Build a string that can be used as a key for localStorage data
     *
     * @for GameOptions
     * @method buildStorageName
     * @param optionName {string}
     * @return {string}
     */
    buildStorageName(optionName) {
        return `zlsa.atc.option.${optionName}`;
    }
}
