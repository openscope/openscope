import $ from 'jquery';
import _forEach from 'lodash/forEach';
import _has from 'lodash/has';
import GameOptions from './GameOptions';
import { round } from '../math/core';
import { GAME_OPTION_NAMES } from '../constants/gameOptionConstants';
import { SELECTORS } from '../constants/selectors';
import { TIME } from '../constants/globalConstants';

// Temporary const declaration here to attach to the window AND use as internal property
const game = {};

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
        this.game = game;
        this.game.paused = true;
        this.game.focused = true;
        this.game.speedup = 1;
        this.game.frequency = 1;
        this.game.time = 0;
        this.game.startTime = 0;
        this.game.delta = 0;
        this.game.events = {};
        this.game.timeouts = [];
        this.game.last_score = 0;
        this.game.score = 0;
        this.game.option = new GameOptions();
    }

    /**
     * @for GameController
     * @method init_pre
     */
    init_pre(getDeltaTime) {
        this.getDeltaTime = getDeltaTime;

        // TODO: move calling of these methods to the proper lifecycle positions
        this.setupHandlers();
        this.enable();
        this.initializeEventCount();
    }

    /**
    * Initialize blur functions used during game pausing
    *
    * @for GameController
    * @method setupHandlers
    * @return
    */
    setupHandlers() {
        // Set blurring function
        $(window).blur(() => {
            this.game.focused = false;
        });

        // Set un-blurring function
        $(window).focus(() => {
            this.game.focused = true;
        });
    }

    /**
     * @for GameController
     * @method enable
     */
    enable() {
        return this;
    }

    /**
     * @for GameController
     * @method disable
     */
    disable() {
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

    /**
    * Record a game event to this.game.events, and update this.game.score
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
    }


    /**
     * @for GameController
     * @method game_get_weighted_score
     */
    game_get_weighted_score() {
        const hoursPlayed = this.game_time() / TIME.ONE_HOUR_IN_SECONDS;
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
    }

    /**
     * @for GameController
     * @method game_timewarp_toggle
     */
    game_timewarp_toggle() {
        const $fastForwards = $(`.${SELECTORS.CLASSNAMES.FAST_FORWARDS}`);

        if (this.game.speedup === 5) {
            this.game.speedup = 1;

            $fastForwards.removeClass(SELECTORS.CLASSNAMES.SPEED_5);
            $fastForwards.prop('title', 'Set time warp to 2');
        } else if (this.game.speedup === 1) {
            this.game.speedup = 2;

            $fastForwards.addClass(SELECTORS.CLASSNAMES.SPEED_2);
            $fastForwards.prop('title', 'Set time warp to 5');
        } else {
            this.game.speedup = 5;

            $fastForwards.removeClass(SELECTORS.CLASSNAMES.SPEED_2);
            $fastForwards.addClass(SELECTORS.CLASSNAMES.SPEED_5);
            $fastForwards.prop('title', 'Reset time warp');
        }
    };

    /**
     * @for GameController
     * @method game_pause
     */
    game_pause() {
        const $pauseToggle = $(`.${SELECTORS.CLASSNAMES.PAUSE_TOGGLE}`);
        this.game.paused = true;

        $pauseToggle.addClass(SELECTORS.CLASSNAMES.ACTIVE);
        $pauseToggle.attr('title', 'Resume simulation');
        $('html').addClass(SELECTORS.CLASSNAMES.PAUSED);
    }

    /**
     * @for GameController
     * @method game_unpause
     */
    game_unpause() {
        const $pauseToggle = $(`.${SELECTORS.CLASSNAMES.PAUSE_TOGGLE}`);
        this.game.paused = false;

        $pauseToggle.removeClass(SELECTORS.CLASSNAMES.ACTIVE);
        $pauseToggle.attr('title', 'Pause simulation');
        $('html').removeClass(SELECTORS.CLASSNAMES.PAUSED);
    }

    /**
     * @for GameController
     * @method game_pause_toggle
     */
    game_pause_toggle() {
        if (this.game.paused) {
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
        return !this.game.focused || this.game.paused;
    }

    /**
     * @for GameController
     * @method game_time
     * @return {number}
     */
    game_time() {
        return this.game.time;
    }

    /**
     * @for GameController
     * @method game_delta
     * @return {number}
     */
    game_delta() {
        return this.game.delta;
    }

    /**
     * @for GameController
     * @method game_speedup
     * @return
     */
    game_speedup() {
        return !this.game_paused() ? this.game.speedup : 0;
    }

    /**
     * @for GameController
     * @method game_timeout
     * @param func {function}
     * @pram delay {number}
     * @param that
     * @param data
     * @return gameTimeout
     */
    game_timeout(functionToCall, delay, that, data) {
        const timerDelay = this.game_time() + delay;
        const gameTimeout = [functionToCall, timerDelay, data, delay, false, that];

        this.game.timeouts.push(gameTimeout);

        return gameTimeout;
    }

    /**
     * @for GameController
     * @method game_interval
     * @param func {function}
     * @pram delay {number}
     * @param that
     * @param data
     * @return to
     */
    game_interval(func, delay, that, data) {
        const to = [func, this.game_time() + delay, data, delay, true, that];

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
    game_updateScore(score) {
        const $score = $(SELECTORS.DOM_SELECTORS.SCORE);
        $score.text(round(score));

        if (score < -0.51) {
            $score.addClass(SELECTORS.CLASSNAMES.NEGATIVE);
        } else {
            $score.removeClass(SELECTORS.CLASSNAMES.NEGATIVE);
        }

        this.game.last_score = score;
    }

    /**
     * @for GameController
     * @method update_pre
     */
    update_pre() {
        if (this.game.score !== this.game.last_score) {
            this.game_updateScore(this.game.score);
        }

        this.game.delta = Math.min(this.getDeltaTime() * this.game.speedup, 100);

        if (this.game_paused()) {
            this.game.delta = 0;
        } else {
            $('html').removeClass(SELECTORS.CLASSNAMES.PAUSED);
        }

        this.game.time += this.game.delta;

        this.updateTimers();
    }

    /**
     * @for GameController
     * @method updateTimers
     */
    updateTimers() {
        for (let i = this.game.timeouts.length - 1; i >= 0; i--) {
            let willRemoveTimerFromList = false;
            const timeout = this.game.timeouts[i];
            const callback = timeout[0];
            let delayFireTime = timeout[1];
            const callbackArguments = timeout[2];
            const delayInterval = timeout[3];
            const shouldRepeat = timeout[4];

            if (this.game_time() > delayFireTime) {
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
        this.game.paused = false;
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
        return this.game.option.get(optionName);
    }

    /**
     * Get the curretn `PTL_LENGTH` value and return a number.
     *
     * Used by the `CanvasController` to get a number value (this will be stored as a string
     * due to existing api) that can be used when drawing the PTL for each aircraft.
     *
     * @for GameController
     * @method getPtlLength
     * @return {number}
     */
    getPtlLength() {
        const currentPtlVal = this.getGameOption(GAME_OPTION_NAMES.PTL_LENGTH);

        return parseFloat(currentPtlVal);
    }
}

export default new GameController();
