import _has from 'lodash/has';
import EventBus from '../lib/EventBus';
import { GAME_OPTION_VALUES } from '../constants/gameOptionConstants';

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
        this._eventBus = EventBus;
        this._options = {};

        this.addGameOptions();
    }

    /**
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
     */
    addOption(data) {
        const optionStorageName = `zlsa.atc.option.${data.name}`;
        this._options[data.name] = data;
        let dataName = data.defaultValue;

        if (_has(localStorage, optionStorageName)) {
            dataName = localStorage[optionStorageName];
        }

        this[data.name] = dataName;
    }

    /**
     * @for GameOptions
     * @method getDescriptions
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
     */
    getOptionByName(name) {
        return this[name];
    }

    /**
     * Sets a game option to a given value
     *
     * @for GameOptions
     * @method setOptionByName
     * @param name {string} name of the option to change
     * @param value {string} value to set the option to
     */
    setOptionByName(name, value) {
        localStorage[`zlsa.atc.option.${name}`] = value;
        this[name] = value;

        if (this._options[name].onChangeEventHandler) {
            this._eventBus.trigger(this._options[name].onChangeEventHandler, value);
        }

        return value;
    }
}
