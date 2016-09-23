/* eslint-disable camelcase, no-underscore-dangle, no-mixed-operators, func-names, object-shorthand, no-undef */
import $ from 'jquery';
import _clamp from 'lodash/clamp';
import _map from 'lodash/map';
import { SELECTORS } from './constants/selectors';

function input_change() {
    tab_completion_reset();

    prop.input.command = $(SELECTORS.DOM_SELECTORS.COMMAND).val();

    input_parse();
}

function input_select(callsign) {
    const $command = $(SELECTORS.DOM_SELECTORS.COMMAND);

    if (callsign) {
        $command.val(`${callsign} `);
    } else {
        $command.val('');
    }

    $command.focus();
    input_change();
}

function input_parse() {
    $(SELECTORS.DOM_SELECTORS.STRIP).removeClass(SELECTORS.CLASSNAMES.ACTIVE);
    prop.input.callsign = '';
    prop.input.data = '';

    if (prop.input.command.length === 0) {
        return;
    }

    var match = /^\s*(\w+)/.exec(prop.input.command);

    if (!match) {
        return;
    }

    prop.input.callsign = match[1];
    var number = 0;
    var match = null;
    prop.canvas.dirty = true;

    for (let i = 0; i < prop.aircraft.list.length; i++) {
        var aircraft = prop.aircraft.list[i];

        if (aircraft.matchCallsign(prop.input.callsign)) {
            number += 1;
            match = aircraft;
            aircraft.html.addClass(SELECTORS.CLASSNAMES.ACTIVE);
        }
    }

    var $sidebar = $(SELECTORS.DOM_SELECTORS.SIDEBAR);

    // TODO: this logig block should be either abstracted or simplified.
    if (number === 1 && (
            match.html.offset().top < 0 ||
            (
                (match.html.offset().top + match.html.height() - $sidebar.offset().top) >
                $sidebar.height()
            )
        )
    ) {
        $sidebar.scrollTop($sidebar.scrollTop() + match.html.offset().top - ($sidebar.height() / 2));
    }
}

function input_keydown(e) {
    const $command = $(SELECTORS.DOM_SELECTORS.COMMAND);
    switch(e.which) {
        case 13: // enter
            input_parse();

            if (input_run()) {
                prop.input.history.unshift(prop.input.callsign);
                $command.val('');
                prop.input.command = '';
                tab_completion_reset();
                input_parse();
            }

            prop.input.history_item = null;

            break;

        case 33:  // Page Up
            input_history_prev(); // recall previous callsign
            e.preventDefault();
            break;

        case 34: // Page Down
            input_history_next(); // recall subsequent callsign
            e.preventDefault();
            break;

        case 37: // left arrow
            // shortKeys in use
            if (prop.game.option.get('controlMethod') === 'arrows') {
                $command.val($command.val() + ' \u2BA2');
                e.preventDefault();
                input_change();
            }

            break;

        case 38: // up arrow
            if (prop.game.option.get('controlMethod') === 'arrows') { //shortKeys in use
                $command.val($command.val() + ' \u2B61');
                e.preventDefault();
                input_change();
            } else {
                // recall previous callsign
                input_history_prev();
                e.preventDefault();
            }
            break;

        case 39:  // right arrow
            // shortKeys in use
            if (prop.game.option.get('controlMethod') === 'arrows') {
                $command.val($command.val() + ' \u2BA3');
                e.preventDefault();
                input_change();
            }

            break;

        case 40:  // down arrow
            if (prop.game.option.get('controlMethod') === 'arrows') { // shortKeys in use
                $command.val($command.val() + ' \u2B63');
                e.preventDefault();
                input_change();
            } else {
                // recall previous callsign
                input_history_prev();
                e.preventDefault();
            }

            break;

        case 106: // numpad *
            $command.val($command.val() + ' \u2B50');
            e.preventDefault();
            input_change();

            break;

        case 107: //numpad +
            $command.val($command.val() + ' +');
            e.preventDefault();
            input_change();

            break;

        case 187: // mac + (actually `=`)
            $command.val($command.val() + ' +');
            e.preventDefault();
            input_change();

            break;

        case 109: // numpad -
            $command.val($command.val() + ' -');
            e.preventDefault();
            input_change();

            break;

        case 189: // mac -
            $command.val($command.val() + ' -');
            e.preventDefault();
            input_change();

            break;

        case 111: // numpad /
            $command.val($command.val() + ' takeoff');
            e.preventDefault();
            input_change();

            break;

        case 9: // tab
            if (!prop.input.tab_compl.matches) {
                tab_completion_match();
            }

            tab_completion_cycle({ backwards: e.shiftKey });
            e.preventDefault();

            break;

        case 27:  // esc
            $command.val('');
            e.preventDefault();

            break;
        default:
            break;
    }
}

function tab_completion_cycle(opt) {
    let matches = prop.input.tab_compl.matches;

    if (!matches || matches.length === 0) {
        return;
    }

    let i = prop.input.tab_compl.cycle_item;
    if (opt.backwards) {
        i = (i <= 0) ? matches.length - 1 : i - 1;
    } else {
        i = (i >= matches.length - 1) ? 0 : i + 1;
    }

    $(SELECTORS.DOM_SELECTORS.COMMAND).val(matches[i] + ' ');

    prop.input.command = matches[i];
    prop.input.tab_compl.cycle_item = i;

    input_parse();
}

function tab_completion_match() {
    let matches;
    let val = $('#command').val();
    let aircrafts = prop.aircraft.list;

    if (prop.input.callsign) {
        aircrafts = aircrafts.filter(function(a) {
            return a.matchCallsign(prop.input.callsign);
        });
    }

    matches = _map(aircrafts, (aircraft) => {
        return aircraft.getCallsign();
    });

    if (aircrafts.length === 1 && (prop.input.data || val[val.length - 1] === ' ')) {
        matches = aircrafts[0].COMMANDS.filter(function(c) {
            return c.toLowerCase().indexOf(prop.input.data.toLowerCase()) === 0;
        })
        .map(function(c) {
            return val.substring(0, prop.input.callsign.length + 1) + c;
        });
    }

    tab_completion_reset();
    prop.input.tab_compl.matches = matches;
    prop.input.tab_compl.cycle_item = -1;
}

function tab_completion_reset() {
    prop.input.tab_compl = {};
}

function input_history_clamp() {
    prop.input.history_item = _clamp(0, prop.input.history_item, prop.input.history.length - 1);
}

function input_history_prev() {
    if (prop.input.history.length === 0) {
        return;
    }

    if (prop.input.history_item == null) {
        prop.input.history.unshift(prop.input.command);
        prop.input.history_item = 0;
    }

    prop.input.history_item += 1;
    input_history_clamp();

    const command = `${prop.input.history[prop.input.history_item]} `;
    $(SELECTORS.DOM_SELECTORS.COMMAND).val(command.toUpperCase());
    input_change();
}

function input_history_next() {
    const $command = $(SELECTORS.DOM_SELECTORS.COMMAND);

    if (prop.input.history.length === 0 || !prop.input.history_item) {
        return;
    }

    prop.input.history_item -= 1;

    if (prop.input.history_item <= 0) {
        $command.val(prop.input.history[0]);

        input_change();

        prop.input.history.splice(0, 1);
        prop.input.history_item = null;

        return;
    }

    input_history_clamp();

    var command = prop.input.history[prop.input.history_item] + ' ';
    $command.val(command.toUpperCase());
    input_change();
}

function input_run() {
    let result;

    try {
        result = zlsa.atc.Parser.parse(prop.input.command.trim().toLowerCase());
    } catch (e) {
        if (e.hasOwnProperty('name') && e.name == 'SyntaxError') {
            ui_log('Command not understood');

            return;
        }

        throw e;
    }

    if (result.command === 'version') {
        ui_log('Air Traffic Control simulator version ' + prop.version.join('.'));

        return true;
    } else if (result.command === 'tutorial') {
        window.tutorialView.tutorial_toggle();

        return true;
    } else if (result.command === 'auto') {
        aircraft_toggle_auto();

        if (prop.aircraft.auto.enabled) {
            ui_log('automatic controller ENGAGED');
        } else {
            ui_log('automatic controller OFF');
        }

        return true;
    } else if (result.command === 'pause') {
        window.gameController.game_pause_toggle();
        return true;
    } else if (result.command === 'timewarp') {
        if (result.args) {
            prop.game.speedup = result.args;
        } else {
            window.gameController.game_timewarp_toggle();
        }

        return true;
    } else if (result.command === 'clear') {
        localStorage.clear();
        location.reload();
    } else if (result.command === 'airport') {
        if (result.args) {
            if (result.args.toLowerCase() in prop.airport.airports) {
                window.airportController.airport_set(result.args.toLowerCase());
            } else {
                ui_airport_toggle();
            }
        } else {
            ui_airport_toggle();
        }

        return true;
    } else if (result.command === 'rate') {
        if (result.args && result.args > 0) {
            prop.game.frequency = result.args;
        }

        return true;
    } else if (result.command != 'transmit') {
        return true;
    }

    var matches = 0;
    var match = -1;

    for (let i = 0; i < prop.aircraft.list.length; i++) {
        var aircraft = prop.aircraft.list[i];
        if (aircraft.matchCallsign(result.callsign)) {
            matches += 1;
            match = i;
        }
    }

    if (matches > 1) {
        ui_log('multiple aircraft match the callsign, say again');

        return true;
    }

    if (match === -1) {
        ui_log('no such aircraft, say again');

        return true;
    }

    var aircraft = prop.aircraft.list[match];

    return aircraft.runCommands(result.args);
}

function input_init_pre() {
    prop.input = {};
    prop.input.command = '';
    prop.input.callsign = '';
    prop.input.data = '';
    prop.input.history = [];
    prop.input.history_item = null;
    prop.input.click = [0, 0];
    prop.input.positions = '';
    prop.input.tab_compl = {};
    prop.input.mouseDelta = [0, 0];
    prop.input.mouseDown = [0, 0];
    prop.input.isMouseDown = false;
}

function input_init() {
    // For firefox see: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode
    const is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    const $window = $(window);
    const $canvases = $(SELECTORS.DOM_SELECTORS.CANVASES);
    const $command = $(SELECTORS.DOM_SELECTORS.COMMAND);

    $window.keydown((e) => {
        if (e.which === 27) {
            if (prop.tutorial.open) {
                tutorial_close();
            } else if ($(SELECTORS.DOM_SELECTORS.AIRPORT_SWITCH).hasClass(SELECTORS.CLASSNAMES.OPEN)) {
                ui_airport_close();
            }
        }

        if (e.which === 189 || (is_firefox && e.which === 173)) {
            // Minus key to zoom out, plus to zoom in
            ui_zoom_out();
            return false;
        } else if (e.which === 187 || (is_firefox && e.which === 61)) {
            if (e.shiftKey) {
                ui_zoom_in();
            } else {
                ui_zoom_reset();
            }

            return false;
        }

        if (!prop.tutorial.open) {
            return;
        }

        if (e.which === 33) {
            tutorial_prev();
            e.preventDefault();
        } else if (e.which === 34) {
            tutorial_next();
            e.preventDefault();
        }
    });

    $canvases.bind('DOMMouseScroll mousewheel', (event) => {
        if (event.originalEvent.wheelDelta > 0 || event.originalEvent.detail < 0) {
            ui_zoom_in();
        } else {
            ui_zoom_out();
        }
    });

    $canvases.mousemove((event) => {
        if (prop.input.isMouseDown) {
            prop.input.mouseDelta = [event.pageX - prop.input.mouseDown[0], event.pageY - prop.input.mouseDown[1]];
            prop.canvas.panX = prop.input.mouseDelta[0];
            prop.canvas.panY = prop.input.mouseDelta[1];
            prop.canvas.dirty = true;
        }
    });

    $canvases.mouseup((event) => {
        prop.input.isMouseDown = false;
    });

    $canvases.mousedown((event) => {
        event.preventDefault();

        if (event.which === 2) {
            ui_zoom_reset();
        } else if (event.which === 1) {
            // Record mouse down position for panning
            prop.input.mouseDown = [
                event.pageX - prop.canvas.panX,
                event.pageY - prop.canvas.panY
            ];
            prop.input.isMouseDown = true;

            // Aircraft label selection
            let position = [event.pageX, -event.pageY];
            position[0] -= prop.canvas.size.width / 2;
            position[1] += prop.canvas.size.height / 2;
            const nearest = window.aircraftController.aircraft_get_nearest([
                px_to_km(position[0] - prop.canvas.panX),
                px_to_km(position[1] + prop.canvas.panY)
            ]);

            if (nearest[0]) {
                if (nearest[1] < px_to_km(80)) {
                    input_select(nearest[0].getCallsign().toUpperCase());
                } else {
                    input_select();
                }
            }

            position = [
                px_to_km(position[0]),
                px_to_km(position[1])
            ];

            position[0] = parseFloat(position[0].toFixed(2));
            position[1] = parseFloat(position[1].toFixed(2));
            prop.input.positions += `[${position.join(',')}]`;

            return false;
        }
    });

    $window.keydown(() => {
        if (!window.gameController.game_paused()) {
            $command.focus();
        }
    });

    $command.keydown(input_keydown);
    $command.on('input', input_change);
}


window.input_init_pre = input_init_pre;
window.input_init = input_init;
window.input_select = input_select;
window.input_change = input_change;
window.input_parse = input_parse;
window.input_keydown = input_keydown;
window.tab_completion_cycle = tab_completion_cycle;
window.tab_completion_match = tab_completion_match;
window.tab_completion_reset = tab_completion_reset;
window.input_history_clamp = input_history_clamp;
window.input_history_prev = input_history_prev;
window.input_history_next = input_history_next;
window.input_run = input_run;
