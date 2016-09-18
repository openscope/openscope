/* eslint-disable camelcase, no-underscore-dangle, no-mixed-operators, func-names, object-shorthand, no-undef */
import $ from 'jquery';
import _has from 'lodash/has';
import _keys from 'lodash/keys';
import { round } from './math/core';
import { SELECTORS } from './constants/selectors';
import { STORAGE_KEY } from './constants/storageKeys';

function px_to_km(pixels) {
    return pixels / prop.ui.scale;
}

function km_to_px(kilometers) {
    return kilometers * prop.ui.scale;
}

function ui_init_pre() {
    prop.ui = {};
    prop.ui.scale_default = 8; // pixels per km
    prop.ui.scale_max = 80; // max scale
    prop.ui.scale_min = 1; // min scale
    prop.ui.scale = prop.ui.scale_default;
    prop.ui.terrain = {
        colors: {
            1000: '26, 150, 65',
            2000: '119, 194, 92',
            3000: '255, 255, 192',
            4000: '253, 201, 128',
            5000: '240, 124, 74',
            6000: '156, 81, 31'
        },
        border_opacity: 1,
        fill_opacity: 0.1
    };

    if (_has(localStorage, STORAGE_KEY.ATC_SCALE)) {
        prop.ui.scale = localStorage[STORAGE_KEY.ATC_SCALE];
    }
}

function ui_after_zoom() {
    localStorage[STORAGE_KEY.ATC_SCALE] = prop.ui.scale;

    prop.canvas.dirty = true;
}

function ui_zoom_out() {
    const lastpos = [
        round(px_to_km(prop.canvas.panX)),
        round(px_to_km(prop.canvas.panY))
    ];

    prop.ui.scale *= 0.9;
    if (prop.ui.scale < prop.ui.scale_min) {
        prop.ui.scale = prop.ui.scale_min;
    }

    ui_after_zoom();

    prop.canvas.panX = round(km_to_px(lastpos[0]));
    prop.canvas.panY = round(km_to_px(lastpos[1]));
}

function ui_zoom_in() {
    const lastpos = [
        round(px_to_km(prop.canvas.panX)),
        round(px_to_km(prop.canvas.panY))
    ];

    prop.ui.scale /= 0.9;
    if (prop.ui.scale > prop.ui.scale_max) {
        prop.ui.scale = prop.ui.scale_max;
    }

    ui_after_zoom();

    prop.canvas.panX = round(km_to_px(lastpos[0]));
    prop.canvas.panY = round(km_to_px(lastpos[1]));
}

function ui_zoom_reset() {
    prop.ui.scale = prop.ui.scale_default;

    ui_after_zoom();
}

function ui_log(message) {
    message = arguments[0];
    let warn = false;

    if (arguments[0] === true) {
        warn = true;
        message = arguments[1];
    } else if (arguments.length >= 2) {
        message += `, ${arguments[1]}`;
    }

//  $("#log").append("<span class='item'><span class='from'>"+from+"</span><span class='message'>"+message+"</span></span>");
    var html = $("<span class='item'><span class='message'>" + message + "</span></span>");
    if (warn) {
        html.addClass(SELECTORS.CLASSNAMES.WARN);
    }

    const $log = $(SELECTORS.DOM_SELECTORS.LOG);
    $log.append(html);
    $log.scrollTop($log.get(0).scrollHeight);

    game_timeout(function(html) {
        html.addClass(SELECTORS.CLASSNAMES.HIDDEN);

        setTimeout(function() {
            html.remove();
        }, 10000);
    }, 3, window, html);

// speech_say(message);
// console.log("MESSAGE: " + message);
}

function ui_airport_open() {
    $(SELECTORS.DOM_SELECTORS.AIRPORT).removeClass(SELECTORS.CLASSNAMES.ACTIVE);
    $('.airport.icao-' + airport_get().icao.toLowerCase()).addClass(SELECTORS.CLASSNAMES.ACTIVE);

    $(SELECTORS.DOM_SELECTORS.AIRPORT_SWITCH).addClass(SELECTORS.CLASSNAMES.OPEN);
    $(SELECTORS.DOM_SELECTORS.SWITCH_AIRPORT).addClass(SELECTORS.CLASSNAMES.ACTIVE);
}

function ui_airport_close() {
    $(SELECTORS.DOM_SELECTORS.AIRPORT_SWITCH).removeClass(SELECTORS.CLASSNAMES.OPEN);
    $(SELECTORS.DOM_SELECTORS.SWITCH_AIRPORT).removeClass(SELECTORS.CLASSNAMES.ACTIVE);
}

function ui_airport_toggle() {
    if ($(SELECTORS.DOM_SELECTORS.AIRPORT_SWITCH).hasClass(SELECTORS.CLASSNAMES.OPEN)) {
        ui_airport_close();
    } else {
        ui_airport_open();
    }
}

function canvas_labels_toggle(event) {
    $(event.target).closest(SELECTORS.DOM_SELECTORS.CONTROL).toggleClass(SELECTORS.CLASSNAMES.ACTIVE);
    prop.canvas.draw_labels = !prop.canvas.draw_labels;
}

function canvas_restricted_toggle(event) {
    $(event.target).closest(SELECTORS.DOM_SELECTORS.CONTROL)
        .toggleClass(`${SELECTORS.DOM_SELECTORS.WARNING_BUTTON} ${SELECTORS.CLASSNAMES.ACTIVE}`);
    prop.canvas.draw_restricted = !prop.canvas.draw_restricted;
}

function canvas_sids_toggle(event) {
    $(event.target).closest(SELECTORS.DOM_SELECTORS.CONTROL).toggleClass(SELECTORS.CLASSNAMES.ACTIVE);
    prop.canvas.draw_sids = !prop.canvas.draw_sids;
}

function canvas_terrain_toggle(event) {
    $(event.target).closest(SELECTORS.DOM_SELECTORS.CONTROL).toggleClass(SELECTORS.CLASSNAMES.ACTIVE);
    prop.canvas.draw_terrain = !prop.canvas.draw_terrain;
}

function ui_options_toggle() {
    const $optionsDialog = $(SELECTORS.DOM_SELECTORS.OPTIONS_DIALOG);

    if ($optionsDialog.hasClass(SELECTORS.CLASSNAMES.OPEN)) {
        $optionsDialog.removeClass(SELECTORS.CLASSNAMES.OPEN);
        $optionsDialog.removeClass(SELECTORS.CLASSNAMES.ACTIVE);
    } else {
        $optionsDialog.addClass(SELECTORS.CLASSNAMES.OPEN);
        $optionsDialog.addClass(SELECTORS.CLASSNAMES.ACTIVE);
    }
}

function ui_init() {
    $(SELECTORS.DOM_SELECTORS.FAST_FORWARDS).prop('title', 'Set time warp to 2');
    const $options = $("<div id='options-dialog' class='dialog'></div>");
    const descriptions = prop.game.option.getDescriptions();
    const switches = {
        '.fast-forwards': game_timewarp_toggle,
        '.speech-toggle': speech_toggle,
        '.switch-airport': ui_airport_toggle,
        '.toggle-tutorial': tutorial_toggle,
        '.pause-toggle': game_pause_toggle,
        '#paused img': game_unpause,
        '.toggle-labels': canvas_labels_toggle,
        '.toggle-restricted-areas': canvas_restricted_toggle,
        '.toggle-sids': canvas_sids_toggle,
        '.toggle-terrain': canvas_terrain_toggle
    };

    $.each(switches, function(selector, fn) {
        $(selector).on('click', function(event) { fn(event); });
    });

    for (const key in descriptions) {
        const opt = descriptions[key];

        if (opt.type === 'select') {
            const container = $('<div class="option"></div>');
            container.append('<span class="option-description">' + opt.description + '</span>');

            const sel_span = $('<span class="option-selector option-type-select"></span>');
            const selector = $('<select id="opt-' + opt.name + '" name="' + opt.name + '"></select>');

            selector.data('name', opt.name);

            var current = prop.game.option.get(opt.name);
            for (let i = 0; i < opt.data.length; i++) {
                var s = "<option value='" + opt.data[i][1];

                if (opt.data[i][1] === current) {
                    s += "' selected='selected";
                }

                s += "'>" + opt.data[i][0] + "</option>";
                selector.append(s);
            }

            selector.change(function() {
                prop.game.option.set($(this).data('name'), $(this).val());
            });

            sel_span.append(selector);
            container.append(sel_span);
            $options.append(container);
        }
    }

    $('body').append($options);
    $(SELECTORS.DOM_SELECTORS.TOGGLE_OPTIONS).click(function() {
        ui_options_toggle();
    });
}

function ui_complete() {
    const airports = _keys(prop.airport.airports).sort();
    const icon = '&#9992;';
    let difficulty = '';
    let airport;

    for (let i = 0; i < airports.length; i++) {
        airport = prop.airport.airports[airports[i]];

        switch (airport.level) {
            case 'beginner':
                difficulty = icon;
                break;
            case 'easy':
                difficulty = icon.repeat(2);
                break;
            case 'medium':
                difficulty = icon.repeat(3);
                break;
            case 'hard':
                difficulty = icon.repeat(4);
                break;
            case 'expert':
                difficulty = icon.repeat(5);
                break;
            default:
                difficulty = '?';
                break;
        }

        const html = $("<li class='airport icao-" + airport.icao.toLowerCase() + "'>" +
                     "<span style='font-size: 7pt' class='difficulty'>" + difficulty + "</span>" +
                     "<span class='icao'>" + airport.icao.toUpperCase() + "</span>" +
                     "<span class='name'>" + airport.name + "</span></li>");

        // TODO: replace with an onClick() handler
        html.click(airport.icao.toLowerCase(), function(event) {
            if (event.data !== airport_get().icao) {
                airport_set(event.data);
                ui_airport_close();
            }
        });

        $(SELECTORS.DOM_SELECTORS.AIRPORT_LIST).append(html);
    }

    const symbol = $("<span class='symbol'>" + "&#9983" + "</span>");
    $(SELECTORS.DOM_SELECTORS.AIRPORT_LIST_NOTES).append(symbol);

    const notes = $("<span class='words'>indicates airport is a work in progress</span>");
    $(SELECTORS.DOM_SELECTORS.AIRPORT_LIST_NOTES).append(notes);
}

window.ui_init_pre = ui_init_pre;
window.ui_zoom_out = ui_zoom_out;
window.ui_zoom_in = ui_zoom_in;
window.ui_zoom_reset = ui_zoom_reset;
window.ui_after_zoom = ui_after_zoom;
window.ui_init = ui_init;
window.ui_complete = ui_complete;
window.px_to_km = px_to_km;
window.km_to_px = km_to_px;
window.ui_log = ui_log;
window.ui_airport_open = ui_airport_open;
window.ui_airport_close = ui_airport_close;
window.ui_airport_toggle = ui_airport_toggle;
window.canvas_labels_toggle = canvas_labels_toggle;
window.canvas_restricted_toggle = canvas_restricted_toggle;
window.canvas_sids_toggle = canvas_sids_toggle;
window.canvas_terrain_toggle = canvas_terrain_toggle;
window.ui_options_toggle = ui_options_toggle;
