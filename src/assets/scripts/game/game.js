/* eslint-disable camelcase, no-underscore-dangle, no-mixed-operators, func-names, object-shorthand, no-undef */
import $ from 'jquery';
import GameOptions from './GameOptions';
import { round } from '../math/core';
import { SELECTORS } from '../constants/selectors';

const game_init_pre = () => {
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
};

const game_get_score = () => {
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
};

const game_get_weighted_score = () => {
    var score = game_get_score();

    score = score / (game_time() / 60);
    score *= 500;

    return score;
};

const game_reset_score = () => {
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
};

const game_timewarp_toggle = () => {
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
};

const game_pause = () => {
    const $pauseToggle = $(`.${SELECTORS.CLASSNAMES.PAUSE_TOGGLE}`);
    prop.game.paused = true;

    $pauseToggle.addClass(SELECTORS.CLASSNAMES.ACTIVE);
    $pauseToggle.attr('title', 'Resume simulation');
    $('html').addClass(SELECTORS.CLASSNAMES.PAUSED);
};

const game_unpause = () => {
    const $pauseToggle = $(`.${SELECTORS.CLASSNAMES.PAUSE_TOGGLE}`);
    prop.game.paused = false;

    $pauseToggle.removeClass(SELECTORS.CLASSNAMES.ACTIVE);
    $pauseToggle.attr('title', 'Pause simulation');
    $('html').removeClass(SELECTORS.CLASSNAMES.PAUSED);
};

const game_pause_toggle = () => {
    if (prop.game.paused) {
        game_unpause();
    } else {
        game_pause();
    }
};

const game_paused = () => {
    return !prop.game.focused || prop.game.paused;
};

const game_time = () => {
    return prop.game.time;
};

const game_delta = () => {
    return prop.game.delta;
};

const game_speedup = () => {
    // if (game_paused()) {
    //     return 0;
    // }
    //
    // return prop.game.speedup;
    return !game_paused() ? prop.game.speedup : 0;
};

const game_timeout = (func, delay, that, data) => {
    var to = [func, game_time() + delay, data, delay, false, that];

    prop.game.timeouts.push(to);

    return to;
};

const game_interval = (func, delay, that, data) => {
    var to = [func, game_time() + delay, data, delay, true, that];

    prop.game.timeouts.push(to);

    return to;
};

const game_clear_timeout = (to) => {
    prop.game.timeouts.splice(prop.game.timeouts.indexOf(to), 1);
};

const game_update_pre = () => {
    const $score = $(`#${SELECTORS.IDS.SCORE}`);
    const score = game_get_score();

    if (score !== prop.game.last_score) {
        $score.text(round(score));

        if (score < -0.51) {
            $score.addClass(SELECTORS.CLASSNAMES.NEGATIVE);
        } else {
            $score.removeClass(SELECTORS.CLASSNAMES.NEGATIVE);
        }

        prop.game.last_score = score;
    }

    prop.game.delta = Math.min(delta() * prop.game.speedup, 100);

    if (game_paused()) {
        prop.game.delta = 0;
    } else {
        $('html').removeClass(SELECTORS.CLASSNAMES.PAUSED);
    }

    prop.game.time += prop.game.delta;

    for (let i = prop.game.timeouts.length - 1; i >= 0; i--) {
        let remove = false;
        let timeout = prop.game.timeouts[i];

        if (game_time() > timeout[1]) {
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
};

const game_complete = () => {
    prop.game.paused = false;
};

// TODO: methods attached to the window temporarily to maintain previous interface before refatoring.
window.game_init_pre = game_init_pre;
window.game_get_score = game_get_score;
window.game_get_weighted_score = game_get_weighted_score;
window.game_reset_score = game_reset_score;
window.game_timewarp_toggle = game_timewarp_toggle;
window.game_pause = game_pause;
window.game_unpause = game_unpause;
window.game_pause_toggle = game_pause_toggle;
window.game_paused = game_paused;
window.game_time = game_time;
window.game_delta = game_delta;
window.game_speedup = game_speedup;
window.game_timeout = game_timeout;
window.game_interval = game_interval;
window.game_clear_timeout = game_clear_timeout;
window.game_update_pre = game_update_pre;
window.game_complete = game_complete;
