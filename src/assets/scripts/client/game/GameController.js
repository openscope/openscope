import $ from 'jquery';
import _forEach from 'lodash/forEach';
import _has from 'lodash/has';
import EventBus from '../lib/EventBus';
import GameOptions from './GameOptions';
import TimeKeeper from '../engine/TimeKeeper';
import { round } from '../math/core';
import { EVENT } from '../constants/eventNames';
import { GAME_OPTION_NAMES } from '../constants/gameOptionConstants';
import { TIME } from '../constants/globalConstants';
import { SELECTORS } from '../constants/selectors';
import { THEME } from '../constants/themes';

// TODO: Remember to move me to wherever the constants end up being moved to
/**
 * Definitions of point values for given game events
 * @type {Object}
 */
const GAME_EVENTS_POINT_VALUES = {
    AIRSPACE_BUST: -200,
    ARRIVAL: 10,
    COLLISION: -1000,
    DEPARTURE: 10,
    EXTREME_CROSSWIND_OPERATION: -15,
    EXTREME_TAILWIND_OPERATION: -75,
    GO_AROUND: -50,
    HIGH_CROSSWIND_OPERATION: -5,
    HIGH_TAILWIND_OPERATION: -25,
    ILLEGAL_APPROACH_CLEARANCE: -10,
    NOT_CLEARED_ON_ROUTE: -25,
    SEPARATION_LOSS: -200
};

/**
 * List of game events
 * @type {Object}
 */
export const GAME_EVENTS = {
    AIRSPACE_BUST: 'AIRSPACE_BUST',
    ARRIVAL: 'ARRIVAL',
    COLLISION: 'COLLISION',
    DEPARTURE: 'DEPARTURE',
    EXTREME_CROSSWIND_OPERATION: 'EXTREME_CROSSWIND_OPERATION',
    EXTREME_TAILWIND_OPERATION: 'EXTREME_TAILWIND_OPERATION',
    GO_AROUND: 'GO_AROUND',
    HIGH_CROSSWIND_OPERATION: 'HIGH_CROSSWIND_OPERATION',
    HIGH_TAILWIND_OPERATION: 'HIGH_TAILWIND_OPERATION',
    ILLEGAL_APPROACH_CLEARANCE: 'ILLEGAL_APPROACH_CLEARANCE',
    NOT_CLEARED_ON_ROUTE: 'NOT_CLEARED_ON_ROUTE',
    SEPARATION_LOSS: 'SEPARATION_LOSS'
};

/**
 * @class GameController
 */
class GameController {
    /**
     * @constructor
     */
    constructor() {
        // TODO: the below $elements _should_ be used instead of the inline vars currently in use but
        // take caution when implmenting these because it will break tests currently in place. This is
        // because of the use of $ within lifecycle methods and becuase this is a static class used
        // by many of the files under test.
        // this._$htmlElement = $('html');
        // this._$pauseToggleElement = null;
        // this._$fastForwardElement = null;
        // this._$scoreElement = null;
        this.game = {};
        this.game.focused = true;
        this.game.frequency = 1;
        this.game.events = {};
        this.game.timeouts = [];
        this.game.last_score = 0;
        this.game.score = 0;
        this.game.option = new GameOptions();
        this.theme = THEME.DEFAULT;

        this._eventBus = EventBus;
    }

    /**
     * @for GameController
     * @method init_pre
     */
    init_pre() {
        return this.setupHandlers()
            .createChildren()
            .enable();
    }

    /**
    * Initialize blur functions used during game pausing
    *
    * @for GameController
    * @method setupHandlers
    * @chainable
    */
    setupHandlers() {
        this._onWindowBlurHandler = this._onWindowBlur.bind(this);
        this._onWindowFocusHandler = this._onWindowFocus.bind(this);

        return this;
    }

    /**
     * @for GameController
     * @method createChildren
     * @chainable
     */
    createChildren() {
        // see comment in constructor. tl;dr these props should be used but are not because they break tests
        // this._$pauseToggleElement = $(SELECTORS.DOM_SELECTORS.PAUSE_TOGGLE);
        // this._$fastForwardElement = $(SELECTORS.DOM_SELECTORS.FAST_FORWARDS);
        // this._$scoreElement = $(SELECTORS.DOM_SELECTORS.SCORE);

        return this;
    }

    /**
     * @for GameController
     * @method enable
     * @chainable
     */
    enable() {
        this._eventBus.on(EVENT.SET_THEME, this._setTheme);

        window.addEventListener('blur', this._onWindowBlurHandler);
        window.addEventListener('focus', this._onWindowFocusHandler);
        // for when the browser window receives or looses focus
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                return this._onWindowBlurHandler();
            }

            return this._onWindowFocusHandler();
        });

        return this.initializeEventCount();
    }

    /**
     * @for GameController
     * @method disable
     * @chainable
     */
    disable() {
        this._eventBus.off(EVENT.SET_THEME, this._setTheme);

        return this.destroy();
    }

    /**
     * Destroy class properties
     *
     * @for GameController
     * @method destroy
     * @chainable
     */
    destroy() {
        // this._$htmlElement = $('html');
        // this._$pauseToggleElement = null;
        // this._$fastForwardElement = null;
        // this._$scoreElement = null;
        this.game = {};
        this.game.focused = true;
        // TODO: remove
        this.game.frequency = 1;
        this.game.events = {};
        this.game.timeouts = [];
        this.game.last_score = 0;
        this.game.score = 0;
        this.game.option = new GameOptions();
        this.theme = THEME.DEFAULT;

        return this;
    }

    /**
     * Initialize `GameController.events` to contain appropriate properties with values of 0
     *
     * @for GameController
     * @method initializeEventCount
     */
    initializeEventCount() {
        _forEach(GAME_EVENTS, (gameEvent, key) => {
            this.game.events[key] = 0;
        });
    }

    // TODO: usages of this method should move to use EventBus
    /**
     * Record a game event to this.game.events, and update this.game.score
     *
     * @for GameController
     * @method events_recordNew
     * @param gameEvent {String} one of the events listed in GAME_EVENTS
     */
    events_recordNew(gameEvent) {
        if (!_has(GAME_EVENTS, gameEvent)) {
            throw new TypeError(`Expected a game event listed in GAME_EVENTS, but instead received ${gameEvent}`);
        }

        this.game.events[gameEvent] += 1;
        this.game.score += GAME_EVENTS_POINT_VALUES[gameEvent];

        this.game_updateScore();
    }


    /**
     * @for GameController
     * @method game_get_weighted_score
     */
    game_get_weighted_score() {
        const hoursPlayed = TimeKeeper.accumulatedDeltaTime / TIME.ONE_HOUR_IN_SECONDS;
        const scorePerHour = this.game.score / hoursPlayed;

        return scorePerHour;
    }

    /**
     * @for GameController
     * @method game_reset_score_and_events
     */
    game_reset_score_and_events() {
        // Reset events
        _forEach(this.game.events, (gameEvent, key) => {
            this.game.events[key] = 0;
        });

        // Reset score
        this.game.score = 0;

        this.game_updateScore();
    }

    /**
     *
     * @for GameController
     * @method updateTimescale
     * @param nextValue {number}
     */
    updateTimescale(nextValue) {
        if (nextValue === 0) {
            this.game_timewarp_toggle();

            return;
        }

        TimeKeeper.updateSimulationRate(nextValue);
    }

    /**
     * Update the visual state of the timewarp control button and call
     * `TimeKeeper.updateTimescalse` with the next timewarp value.
     *
     * This method is called as a result of a user interaction
     *
     * @for GameController
     * @method game_timewarp_toggle
     */
    game_timewarp_toggle() {
        const $fastForwards = $(SELECTORS.DOM_SELECTORS.FAST_FORWARDS);

        if (TimeKeeper.simulationRate >= 5) {
            TimeKeeper.updateSimulationRate(1);

            $fastForwards.removeClass(SELECTORS.CLASSNAMES.SPEED_5);
            $fastForwards.prop('title', 'Set time warp to 2');
        } else if (TimeKeeper.simulationRate === 1) {
            TimeKeeper.updateSimulationRate(2);

            $fastForwards.addClass(SELECTORS.CLASSNAMES.SPEED_2);
            $fastForwards.prop('title', 'Set time warp to 5');
        } else {
            TimeKeeper.updateSimulationRate(5);

            $fastForwards.removeClass(SELECTORS.CLASSNAMES.SPEED_2);
            $fastForwards.addClass(SELECTORS.CLASSNAMES.SPEED_5);
            $fastForwards.prop('title', 'Reset time warp');
        }
    }

    /**
     * @for GameController
     * @method game_pause
     */
    game_pause() {
        TimeKeeper.setPause(true);

        const $pauseToggleElement = $(SELECTORS.DOM_SELECTORS.PAUSE_TOGGLE);

        $pauseToggleElement.addClass(SELECTORS.CLASSNAMES.ACTIVE);
        $pauseToggleElement.attr('title', 'Resume simulation');
        $('html').addClass(SELECTORS.CLASSNAMES.PAUSED);
    }

    /**
     * @for GameController
     * @method game_unpause
     */
    game_unpause() {
        TimeKeeper.setPause(false);

        const $pauseToggleElement = $(SELECTORS.DOM_SELECTORS.PAUSE_TOGGLE);

        $pauseToggleElement.removeClass(SELECTORS.CLASSNAMES.ACTIVE);
        $pauseToggleElement.attr('title', 'Pause simulation');
        $('html').removeClass(SELECTORS.CLASSNAMES.PAUSED);
    }

    /**
     * @for GameController
     * @method game_pause_toggle
     */
    game_pause_toggle() {
        if (TimeKeeper.isPaused) {
            this.game_unpause();

            return;
        }

        this.game_pause();
    }

    /**
     * @for GameController
     * @method game_paused
     * @return
     */
    game_paused() {
        return !this.game.focused || TimeKeeper.isPaused;
    }

    /**
     * @for GameController
     * @method game_speedup
     * @return
     */
    game_speedup() {
        return !this.game_paused() ? TimeKeeper.simulationRate : 0;
    }

    /**
     * @for GameController
     * @method game_timeout
     * @param func {function}
     * @param delay {number}
     * @param that
     * @param data
     * @return gameTimeout
     */
    game_timeout(functionToCall, delay, that, data) {
        const timerDelay = TimeKeeper.accumulatedDeltaTime + delay;
        const gameTimeout = [functionToCall, timerDelay, data, delay, false, that];

        this.game.timeouts.push(gameTimeout);

        return gameTimeout;
    }

    /**
     * @for GameController
     * @method game_interval
     * @param func {function}
     * @param delay {number}
     * @param that
     * @param data
     * @return to
     */
    game_interval(func, delay, that, data) {
        const to = [func, TimeKeeper.accumulatedDeltaTime + delay, data, delay, true, that];

        this.game.timeouts.push(to);

        return to;
    }

    /**
     * @for GameController
     * @method game_clear_timeout
     * @param gameTimeout
     */
    game_clear_timeout(gameTimeout) {
        this.game.timeouts.splice(this.game.timeouts.indexOf(gameTimeout), 1);
    }

    /**
     * Destroy all current timers
     *
     * Used when changing airports. any timer is only valid
     * for a specific airport.
     *
     * @for GameController
     * @method destroyTimers
     */
    destroyTimers() {
        this.game.timeouts = [];
    }

    /**
     * @for GameController
     * @method game_updateScore
     * @param score {number}
     */
    game_updateScore() {
        if (this.game.score === this.game.last_score) {
            return;
        }
        const $scoreElement = $(SELECTORS.DOM_SELECTORS.SCORE);
        $scoreElement.text(round(this.game.score));

        // TODO: wait, what? Why not just < 0?
        if (this.game.score < -0.51) {
            $scoreElement.addClass(SELECTORS.CLASSNAMES.NEGATIVE);
        } else {
            $scoreElement.removeClass(SELECTORS.CLASSNAMES.NEGATIVE);
        }

        this.game.last_score = this.game.score;
    }

    /**
     * @for GameController
     * @method update_pre
     */
    update_pre() {
        const $htmlElement = $('html');

        if (!this.game_paused() && $htmlElement.hasClass(SELECTORS.CLASSNAMES.PAUSED)) {
            $htmlElement.removeClass(SELECTORS.CLASSNAMES.PAUSED);
        }

        this.updateTimers();
    }

    /**
     * @for GameController
     * @method updateTimers
     */
    updateTimers() {
        const currentGameTime = TimeKeeper.accumulatedDeltaTime;

        for (let i = this.game.timeouts.length - 1; i >= 0; i--) {
            let willRemoveTimerFromList = false;
            const timeout = this.game.timeouts[i];
            const callback = timeout[0];
            let delayFireTime = timeout[1];
            const callbackArguments = timeout[2];
            const delayInterval = timeout[3];
            const shouldRepeat = timeout[4];

            if (currentGameTime > delayFireTime) {
                callback.call(timeout[5], callbackArguments);
                willRemoveTimerFromList = true;

                if (shouldRepeat) {
                    delayFireTime += delayInterval;
                    willRemoveTimerFromList = false;
                }
            }

            if (willRemoveTimerFromList) {
                this.game.timeouts.splice(i, 1);
                i -= 1;
            }
        }
    }

    /**
     * @for GameController
     * @method complete
     */
    complete() {
        TimeKeeper.setPause(false);
    }

    /**
     * Facade for `game.option.get`
     *
     * Allows for classes that import the `GameController` single-level
     * access to any game option value
     *
     * @for GameController
     * @method getGameOption
     * @param optionName {string}
     * @return {string}
     */
    getGameOption(optionName) {
        return this.game.option.getOptionByName(optionName);
    }

    // TODO: This probably does not belong in the GameController.
    /**
     * Get the current `PROJECTED_TRACK_LINE_LENGTH` value and return a number.
     *
     * Used by the `CanvasController` to get a number value (this will be stored as a string
     * due to existing api) that can be used when drawing the PTL for each aircraft.
     *
     * @for GameController
     * @method getPtlLength
     * @return {number}
     */
    getPtlLength() {
        let userSettingsPtlLength = this.getGameOption(GAME_OPTION_NAMES.PROJECTED_TRACK_LINE_LENGTH);

        if (userSettingsPtlLength === 'from-theme') {
            userSettingsPtlLength = this.theme.RADAR_TARGET.PROJECTED_TRACK_LINE_LENGTH;
        }

        return parseFloat(userSettingsPtlLength);
    }

    /**
     * Check whether or not the trailing distance separator should be drawn.
     *
     * Used by the `CanvasController` to determine whether or not to proceed with
     * `canvas_draw_separation_indicator`.
     *
     * @for GameController
     * @method shouldUseTrailingSeparationIndicator
     * @param aircraft {AircraftModel}
     * @return {boolean}
     */
    shouldUseTrailingSeparationIndicator(aircraft) {
        const userSettingsValue = this.getGameOption(GAME_OPTION_NAMES.DRAW_ILS_DISTANCE_SEPARATOR);
        let isIndicatorEnabled = userSettingsValue === 'yes';

        if (userSettingsValue === 'from-theme') {
            isIndicatorEnabled = this.theme.RADAR_TARGET.TRAILING_SEPARATION_INDICATOR_ENABLED;
        }

        return isIndicatorEnabled && aircraft.isArrival();
    }

    /**
     * @for GameController
     * @method _onWindowBlur
     * @param event {UIEvent}
     * @private
     */
    _onWindowBlur(event) {
        this.game.focused = false;
        // resetting back to 1 here so when focus returns, we can reliably reset
        // `#game.delta` to 0 to prevent jumpiness
        TimeKeeper.updateSimulationRate(1);
        TimeKeeper.setPause(true);
    }

    /**
     * @for GameController
     * @method _onWindowFocus
     * @param event {UIEvent}
     * @private
     */
    _onWindowFocus(event) {
        this.game.focused = true;

        TimeKeeper.setPause(false);
    }


    // TODO: Upon removal of `this.getPtlLength()`, this will no longer be needed
    /**
     * Change theme to the specified name
     *
     * This should ONLY be called through the EventBus during a `SET_THEME` event,
     * thus ensuring that the same theme is always in use by all app components.
     *
     * This method must remain an arrow function in order to preserve the scope
     * of `this`, since it is being invoked by an EventBus callback.
     *
     * @for GameController
     * @method _setTheme
     * @param themeName {string}
     */
    _setTheme = (themeName) => {
        if (!_has(THEME, themeName)) {
            console.error(`Expected valid theme to change to, but received '${themeName}'`);

            return;
        }

        this.theme = THEME[themeName];
    };
}

export default new GameController();
