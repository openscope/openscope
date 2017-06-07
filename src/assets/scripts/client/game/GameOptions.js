import _has from 'lodash/has';
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
     * @for GameOptions
     * @method get
     * @param name {string}
     */
    get(name) {
        return this[name];
    }

    /**
     * @for GameOptions
     * @method set
     * @param name {string}
     * @param value
     */
    set(name, value) {
        localStorage[`zlsa.atc.option.${name}`] = value;
        this[name] = value;

        return value;
    }
}
