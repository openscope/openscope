import $ from 'jquery';
import { digits_integer } from '../utilities/radioUtilities';
import { SELECTORS } from '../constants/selectors';
import { TIME } from '../constants/globalConstants';

/**
 * @class GameClockView
 */
export default class GameClockView {
    /**
     * @for GameClockView
     * @constructor
     */
    constructor() {
        this.$element = null;
        this.startTime = 0;
        this.time = 0;

        return this._init();
    }

    /**
     * @for GameClockView
     * @method _init
     * @private
     */
    _init() {
        this.$element = $(SELECTORS.DOM_SELECTORS.CLOCK);
        this.$element.addClass(SELECTORS.CLASSNAMES.NOT_SELECTABLE);
        this._setToCurrentZuluTime();

        return this;
    }

    /**
    * Updates the time stored in the clock
    * @for GameClockView
    * @method _tick
    * @private
    */
    _tick() {
        const elapsedTime = window.gameController.game.time * TIME.ONE_SECOND_IN_MILLISECONDS;
        this.time = this.startTime + elapsedTime;
    }

    /**
    * Updates the DOM with the new game time
    * @for GameClockView
    * @method _render
    * @private
    */
    _render() {
        const gameTime = window.gameController.game.time;
        const clockDate = new Date(this.startTime + (gameTime * TIME.ONE_SECOND_IN_MILLISECONDS));
        const hours = digits_integer(clockDate.getHours(), 2);
        const minutes = digits_integer(clockDate.getMinutes(), 2);
        const seconds = digits_integer(clockDate.getSeconds(), 2);
        const clockTime = `${hours}:${minutes}:${seconds}`;
        this.$element.text(clockTime);
    }

    /**
    * @for GameClockView
    * @method destroy
    * @chainable
    */
    destroy() {
        this.$element = null;
        this.startTime = 0;
        this.time = 0;

        return this;
    }

    /**
     * Set game clock to the current zulu time (UTC)
     * @for GameClockView
     * @method setToCurrentZuluTime
     * @private
     */
    _setToCurrentZuluTime() {
        const date = new Date();
        const utc = date.getTime() + (date.getTimezoneOffset() * TIME.ONE_MINUTE_IN_MILLISECONDS);
        this.startTime = utc;
    }

    /**
     * Updates the stored time and displayed time in webpage
     * @for GameClockView
     * @method update
     */
    update() {
        this._tick();
        this._render();
    }
}
