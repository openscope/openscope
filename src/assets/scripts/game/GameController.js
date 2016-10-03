/* eslint-disable camelcase, no-underscore-dangle, no-mixed-operators, func-names, object-shorthand,
no-undef, class-methods-use-this */
import $ from 'jquery';
import GameOptions from './GameOptions';
import { round } from '../math/core';
import { SELECTORS } from '../constants/selectors';

// Temporary const declaration here to attach to the window AND use as internal property
const game = {};

/**
 * @class GameController
 */
export default class GameController {
    /**
     * @constructor
     */
    constructor(getDeltaTime) {
        this.getDeltaTime = getDeltaTime;

        this.game = game;
        this.game.paused = true;
        this.game.focused = true;
        this.game.speedup = 1;
        this.game.frequency = 1;
        this.game.time = 0;
        this.game.delta = 0;
        this.game.timeouts = [];

        // TODO: move to `setupHandlers()`
        $(window).blur(() => {
            this.game.focused = false;
        });

        $(window).focus(() => {
            this.game.focused = true;
        });

        this.game.last_score = 0;
        this.game.score = {
            arrival: 0,
            departure: 0,

            windy_landing: 0,
            windy_takeoff: 0,

            failed_arrival: 0,
            failed_departure: 0,

            warning: 0,
            hit: 0,

            abort: {
                landing: 0,
                taxi: 0
            },

            violation: 0,
            restrictions: 0
        };

        this.game.option = new GameOptions();
    }

    /**
     * @for GameController
     * @method init_pre
     */
    init_pre() {
        prop.game = {};
        prop.game.paused = true;
        prop.game.focused = true;
        prop.game.speedup = 1;
        prop.game.frequency = 1;
        prop.game.time = 0;
        prop.game.delta = 0;
        prop.game.timeouts = [];

        $(window).blur(() => {
            prop.game.focused = false;
        });

        $(window).focus(() => {
            prop.game.focused = true;
        });

        prop.game.last_score = 0;
        prop.game.score = {
            arrival: 0,
            departure: 0,

            windy_landing: 0,
            windy_takeoff: 0,

            failed_arrival: 0,
            failed_departure: 0,

            warning: 0,
            hit: 0,

            abort: {
                landing: 0,
                taxi: 0
            },

            violation: 0,
            restrictions: 0
        };

        prop.game.option = new GameOptions();
    }

    /**
     * @for GameController
     * @method game_get_score
     */
    game_get_score() {
        let score = 0;

        score += prop.game.score.arrival * 10;
        score += prop.game.score.departure * 10;

        score -= prop.game.score.windy_landing * 0.5;
        score -= prop.game.score.windy_takeoff * 0.5;

        score -= prop.game.score.failed_arrival * 20;
        score -= prop.game.score.failed_departure * 2;

        score -= prop.game.score.warning * 5;
        score -= prop.game.score.hit * 50;

        score -= prop.game.score.abort.landing * 5;
        score -= prop.game.score.abort.taxi * 2;

        score -= prop.game.score.violation;
        score -= prop.game.score.restrictions * 10;

        return score;
    }

    /**
     * @for GameController
     * @method game_get_weighted_score
     */
    game_get_weighted_score() {
        let score = this.game_get_score();

        score = score / (this.game_time() / 60);
        score *= 500;

        return score;
    }

    /**
     * @for GameController
     * @method game_reset_score
     */
    game_reset_score() {
        prop.game.score.abort = { landing: 0, taxi: 0 };
        prop.game.score.arrival = 0;
        prop.game.score.departure = 0;
        prop.game.score.failed_arrival = 0;
        prop.game.score.failed_departure = 0;
        prop.game.score.hit = 0;
        prop.game.score.restrictions = 0;
        prop.game.score.violation = 0;
        prop.game.score.warning = 0;
        prop.game.score.windy_landing = 0;
        prop.game.score.windy_takeoff = 0;
    }

    /**
     * @for GameController
     * @method game_timewarp_toggle
     */
    game_timewarp_toggle() {
        const $fastForwards = $(`.${SELECTORS.CLASSNAMES.FAST_FORWARDS}`);

        if (prop.game.speedup === 5) {
            prop.game.speedup = 1;

            $fastForwards.removeClass(SELECTORS.CLASSNAMES.SPEED_5);
            $fastForwards.prop('title', 'Set time warp to 2');
        } else if (prop.game.speedup === 1) {
            prop.game.speedup = 2;

            $fastForwards.addClass(SELECTORS.CLASSNAMES.SPEED_2);
            $fastForwards.prop('title', 'Set time warp to 5');
        } else {
            prop.game.speedup = 5;

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
        const $pauseToggle = $(`.${SELECTORS.CLASSNAMES.PAUSE_TOGGLE}`);
        prop.game.paused = true;

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
        prop.game.paused = false;

        $pauseToggle.removeClass(SELECTORS.CLASSNAMES.ACTIVE);
        $pauseToggle.attr('title', 'Pause simulation');
        $('html').removeClass(SELECTORS.CLASSNAMES.PAUSED);
    }

    /**
     * @for GameController
     * @method game_pause_toggle
     */
    game_pause_toggle() {
        // TODO: simplify if/else logic. should only need an if with an early exit
        if (prop.game.paused) {
            this.game_unpause();
        } else {
            this.game_pause();
        }
    }

    /**
     * @for GameController
     * @method game_paused
     * @return
     */
    game_paused() {
        return !prop.game.focused || prop.game.paused;
    }

    /**
     * @for GameController
     * @method game_time
     * @return {number}
     */
    game_time() {
        return prop.game.time;
    }

    /**
     * @for GameController
     * @method game_delta
     * @return {number}
     */
    game_delta() {
        return prop.game.delta;
    }

    /**
     * @for GameController
     * @method game_speedup
     * @return
     */
    game_speedup() {
        return !this.game_paused() ? prop.game.speedup : 0;
    }

    /**
     * @for GameController
     * @method game_timeout
     * @param func {function}
     * @pram delay {number}
     * @param that
     * @param data
     * @return to
     */
    game_timeout(func, delay, that, data) {
        const to = [func, this.game_time() + delay, data, delay, false, that];

        prop.game.timeouts.push(to);

        return to;
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

        prop.game.timeouts.push(to);

        return to;
    }

    /**
     * @for GameController
     * @method game_clear_timeout
     * @param to
     */
    game_clear_timeout(to) {
        prop.game.timeouts.splice(prop.game.timeouts.indexOf(to), 1);
    }

    /**
     * @for GameController
     * @method updateScore
     * @param score {number}
     */
    updateScore(score) {
        const $score = $(SELECTORS.DOM_SELECTORS.SCORE);
        $score.text(round(score));

        if (score < -0.51) {
            $score.addClass(SELECTORS.CLASSNAMES.NEGATIVE);
        } else {
            $score.removeClass(SELECTORS.CLASSNAMES.NEGATIVE);
        }

        prop.game.last_score = score;
    }

    /**
     * @for GameController
     * @method update_pre
     */
    update_pre() {
        const score = this.game_get_score();

        if (score !== prop.game.last_score) {
            this.updateScore(score);
        }

        prop.game.delta = Math.min(this.getDeltaTime() * prop.game.speedup, 100);

        if (this.game_paused()) {
            prop.game.delta = 0;
        } else {
            $('html').removeClass(SELECTORS.CLASSNAMES.PAUSED);
        }

        prop.game.time += prop.game.delta;

        for (let i = prop.game.timeouts.length - 1; i >= 0; i--) {
            let remove = false;
            let timeout = prop.game.timeouts[i];

            if (this.game_time() > timeout[1]) {
                timeout[0].call(timeout[5], timeout[2]);

                if (timeout[4]) {
                    timeout[1] += timeout[3];
                } else {
                    remove = true;
                }
            }

            if (remove) {
                prop.game.timeouts.splice(i, 1);
                i -= 1;
            }
        }
    }

    /**
     * @for GameController
     * @method complete
     */
    complete() {
        prop.game.paused = false;
    }
}
