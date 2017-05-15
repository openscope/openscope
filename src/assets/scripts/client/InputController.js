/* eslint-disable camelcase, no-mixed-operators, object-shorthand, class-methods-use-this, no-undef, expected-return*/
import $ from 'jquery';
import _get from 'lodash/get';
import _has from 'lodash/has';
import _map from 'lodash/map';
import CommandParser from './commandParser/CommandParser';
import { clamp } from './math/core';
import { GAME_OPTION_NAMES } from './constants/gameOptionConstants';
import { SELECTORS } from './constants/selectors';

// Temporary const declaration here to attach to the window AND use as internal propert
const input = {};

/**
 * Name of a command returned from the Parser
 *
 * @property PARSED_COMMAND_NAME
 * @type {Object}
 * @final
 */
const PARSED_COMMAND_NAME = {
    VERSION: 'version',
    TUTORIAL: 'tutorial',
    AUTO: 'auto',
    PAUSE: 'pause',
    TIMEWARP: 'timewarp',
    CLEAR: 'clear',
    AIRPORT: 'airport',
    RATE: 'rate',
    TRANSMIT: 'transmit'
};

/**
 * Enumeration of mouse events returned from $event.which
 *
 * These codes can only be used with jQuery event object.
 *
 * @property MOUSE_EVENT_CODE
 * @type {Object}
 * @final
 */
const MOUSE_EVENT_CODE = {
    LEFT_PRESS: 1,
    MIDDLE_PESS: 2,
    RIGHT_PRESS: 3
};

/**
 * Enumeration of key codes used for inputs.
 *
 * @property KEY_CODES
 * @type {Object}
 * @final
 */
const KEY_CODES = {
    // +
    ADD: 107,
    // -
    DASH: 189,
    DASH_FIREFOX: 173,
    DIVIDE: 111,
    DOWN_ARROW: 40,
    ENTER: 13,
    // =
    EQUALS: 187,
    EQUALS_FIREFOX: 61,
    // esc
    ESCAPE: 27,
    LEFT_ARROW: 37,
    MULTIPLY: 106,
    PAGE_UP: 33,
    PAGE_DOWN: 34,
    RIGHT_ARROW: 39,
    SUBTRACT: 109,
    TAB: 9,
    UP_ARROW: 38,
    // `
    BAT_TICK: 192
};

/**
 * @class InputController
 */
export default class InputController {
    /**
     * @constructor
     */
    constructor($element, aircraftCommander) {
        this.$element = $element;
        this.$window = null;
        this.$commandInput = null;
        this.$canvases = null;
        this.$sidebar = null;

        this._aircraftCommander = aircraftCommander;

        this.input = input;
        this.input.command = '';
        this.input.callsign = '';
        this.input.data = '';
        this.input.history = [];
        this.input.history_item = null;
        this.input.click = [0, 0];
        this.input.positions = '';
        this.input.tab_compl = {};
        this.input.mouseDelta = [0, 0];
        this.input.mouseDown = [0, 0];
        this.input.isMouseDown = false;

        this._init()
            .setupHandlers()
            .enable();
    }

    /**
     * @for InputController
     * @method _init
     */
    _init() {
        this.$window = $(window);
        this.$commandInput = this.$element.find(SELECTORS.DOM_SELECTORS.COMMAND);
        this.$canvases = this.$element.find(SELECTORS.DOM_SELECTORS.CANVASES);
        this.$sidebar = this.$element.find(SELECTORS.DOM_SELECTORS.SIDEBAR);

        return this;
    }

    /**
     * @for InputController
     * @method setupHandlers
     */
    setupHandlers() {
        return this;
    }

    /**
     * @for InputController
     * @method enable
     */
    enable() {
        this.$window.on('keydown', (event) => this.onKeydownHandler(event));
        this.$commandInput.on('keydown', (event) => this.onCommandInputKeydownHandler(event));
        this.$commandInput.on('input', (event) => this.onCommandInputChangeHandler(event));
        // TODO: these are non-standard events and will be deprecated soon. this should be moved
        // over to the `wheel` event. This should also be moved over to `.on()` instead of `.bind()`
        // https://developer.mozilla.org/en-US/docs/Web/Events/wheel
        // this.$commandInput.on('DOMMouseScroll mousewheel', (event) => this.onMouseScrollHandler(event));
        this.$canvases.bind('DOMMouseScroll mousewheel', (event) => this.onMouseScrollHandler(event));
        this.$canvases.on('mousemove', (event) => this.onMouseMoveHandler(event));
        this.$canvases.on('mouseup', (event) => this.onMouseUpHandler(event));
        this.$canvases.on('mousedown', (event) => this.onMouseDownHandler(event));

        return this;
    }

    /**
     * @for InputController
     * @method disable
     */
    disable() {
        this.$window.off('keydown', (event) => this.onKeydownHandler(event));
        this.$commandInput.off('keydown', (event) => this.onCommandInputKeydownHandler(event));
        this.$commandInput.off('input', (event) => this.onCommandInputChangeHandler(event));
        // uncomment only after `.on()` for this event has been implemented.
        // this.$commandInput.off('DOMMouseScroll mousewheel', (event) => this.onMouseScrollHandler(event));
        this.$canvases.off('mousemove', (event) => this.onMouseMoveHandler(event));
        this.$canvases.off('mouseup', (event) => this.onMouseUpHandler(event));
        this.$canvases.off('mousedown', (event) => this.onMouseDownHandler(event));

        return this.destroy();
    }

    /**
     * @for InputController
     * @method destroy
     */
    destroy() {
        this.$element = null;
        this.$window = null;
        this.$commandInput = null;
        this.$canvases = null;
        this.$sidebar = null;

        this.input = input;
        this.input.command = '';
        this.input.callsign = '';
        // this.input.data = '';
        this.input.history = [];
        this.input.history_item = null;
        this.input.click = [0, 0];
        this.input.positions = '';
        this.input.tab_compl = {};
        this.input.mouseDelta = [0, 0];
        this.input.mouseDown = [0, 0];
        this.input.isMouseDown = false;

        return this;
    }

    /**
     * @for InputController
     * @method input_init_pre
     */
    input_init_pre() {
        // TODO: these prop properties can be removed except for `prop.input`
        prop.input = input;
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

    /**
     * @for InputController
     * @method onMouseScrollHandler
     * @param event {jquery Event}
     */
    onMouseScrollHandler(event) {
        if (event.originalEvent.wheelDelta > 0 || event.originalEvent.detail < 0) {
            window.uiController.ui_zoom_in();
        } else {
            window.uiController.ui_zoom_out();
        }
    }

    /**
     * @for InputController
     * @method onMouseMoveHandler
     * @param event {jquery Event}
     */
    onMouseMoveHandler(event) {
        if (!prop.input.isMouseDown) {
            return this;
        }

        prop.input.mouseDelta = [
            event.pageX - prop.input.mouseDown[0],
            event.pageY - prop.input.mouseDown[1]
        ];
        prop.canvas.panX = prop.input.mouseDelta[0];
        prop.canvas.panY = prop.input.mouseDelta[1];
        prop.canvas.dirty = true;
    }

    /**
     * @for InputController
     * @method onMouseUpHandler
     * @param event {jquery Event}
     */
    onMouseUpHandler(event) {
        prop.input.isMouseDown = false;
    }

    /**
     * @for InputController
     * @method onMouseDownHandler
     * @param event {jquery Event}
     */
    onMouseDownHandler(event) {
        event.preventDefault();

        if (event.which === MOUSE_EVENT_CODE.MIDDLE_PESS) {
            window.uiController.ui_zoom_reset();
        } else if (event.which === MOUSE_EVENT_CODE.LEFT_PRESS) {
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
                window.uiController.px_to_km(position[0] - prop.canvas.panX),
                window.uiController.px_to_km(position[1] + prop.canvas.panY)
            ]);

            if (nearest[0]) {
                if (nearest[1] < window.uiController.px_to_km(80)) {
                    this.input.callsign = nearest[0].callsign.toUpperCase();

                    this.input_select(this.input.callsign);
                } else {
                    this.input_select();
                }
            }

            position = [
                window.uiController.px_to_km(position[0]),
                window.uiController.px_to_km(position[1])
            ];

            position[0] = parseFloat(position[0].toFixed(2));
            position[1] = parseFloat(position[1].toFixed(2));
            prop.input.positions += `[${position.join(',')}]`;

            return false;
        }
    }

    /**
     * @for InputController
     * @method onKeydownHandler
     * @param event {jQuery Event}
     * @private
     */
    onKeydownHandler(event) {
        // For firefox see: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode
        const is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

        if (!window.gameController.game_paused()) {
            this.$commandInput.focus();
        }

        if (event.which === KEY_CODES.ESCAPE) {
            if (prop.tutorial.open) {
                window.tutorialView.tutorial_close();
            } else if ($(SELECTORS.DOM_SELECTORS.AIRPORT_SWITCH).hasClass(SELECTORS.CLASSNAMES.OPEN)) {
                window.uiController.ui_airport_close();
            }
        }

        if (event.which === KEY_CODES.DASH || (is_firefox && event.which === KEY_CODES.DASH_FIREFOX)) {
            // Minus key to zoom out, plus to zoom in
            window.uiController.ui_zoom_out();
            return false;
        } else if (event.which === KEY_CODES.EQUALS || (is_firefox && event.which === KEY_CODES.EQUALS_FIREFOX)) {
            if (event.shiftKey) {
                window.uiController.ui_zoom_in();
            } else {
                window.uiController.ui_zoom_reset();
            }

            return false;
        }

        if (!prop.tutorial.open) {
            return;
        }

        if (event.which === KEY_CODES.PAGE_UP) {
            window.tutorialView.tutorial_prev();
            event.preventDefault();
        } else if (event.which === KEY_CODES.PAGE_DOWN) {
            window.tutorialView.tutorial_next();
            event.preventDefault();
        }
    }

    /**
     * @for InputController
     * @method input_parse
     */
    input_parse() {
        const $strip = this.$element.find(SELECTORS.DOM_SELECTORS.STRIP);
        $strip.removeClass(SELECTORS.CLASSNAMES.ACTIVE);

        prop.input.callsign = '';
        prop.input.data = '';

        if (prop.input.command.length === 0) {
            return;
        }

        // TODO: move to master REGEX constant
        let match = /^\s*(\w+)/.exec(prop.input.command);

        if (!match) {
            return;
        }

        prop.input.callsign = match[1];
        let number = 0;
        // TODO: this is a very mutable property. perhaps it should be something else?
        match = null;
        prop.canvas.dirty = true;

        for (let i = 0; i < prop.aircraft.list.length; i++) {
            const aircraft = prop.aircraft.list[i];

            if (aircraft.matchCallsign(prop.input.callsign)) {
                number += 1;
                match = aircraft;
                // TODO: this should be from an encapsulated class on the window.
                aircraft.$html.addClass(SELECTORS.CLASSNAMES.ACTIVE);
            }
        }

        // TODO: this logic block should be either abstracted or simplified.
        if (number === 1 && (
                match.$html.offset().top < 0 ||
                (
                    (match.$html.offset().top + match.$html.height() - this.$sidebar.offset().top) >
                    this.$sidebar.height()
                )
            )
        ) {
            this.$sidebar.scrollTop(this.$sidebar.scrollTop() + match.$html.offset().top - (this.$sidebar.height() / 2));
        }
    }

    /**
     * @for InputController
     * @method onCommandInputChangeHandler
     */
    onCommandInputChangeHandler() {
        this.tab_completion_reset();

        prop.input.command = this.$commandInput.val();

        this.input_parse();
    }

    /**
     * @for InputController
     * @method input_select
     * @param callsign {string}
     */
    input_select(callsign) {
        if (callsign) {
            this.$commandInput.val(`${callsign} `);
        } else {
            this.$commandInput.val('');
        }

        this.$commandInput.focus();

        this.onCommandInputChangeHandler();
    }

    /**
     * @for InputController
     * @method onCommandInputKeydownHandler
     */
    onCommandInputKeydownHandler(e) {
        const currentCommandInputValue = this.$commandInput.val();

        // TODO: this swtich can be simplified, there is a lot of repetition here
        switch (e.which) {
            case KEY_CODES.BAT_TICK:
                this.$commandInput.val(`${currentCommandInputValue}\` `);
                e.preventDefault();
                this.onCommandInputChangeHandler();

                break;
            case KEY_CODES.ENTER:
                this.input_parse();

                if (this.input_run()) {
                    prop.input.history.unshift(prop.input.callsign);
                    this.$commandInput.val('');
                    prop.input.command = '';

                    this.tab_completion_reset();
                    this.input_parse();
                }

                prop.input.history_item = null;

                break;

            case KEY_CODES.PAGE_UP:
                // recall previous callsign
                this.input_history_prev();
                e.preventDefault();
                break;

            case KEY_CODES.PAGE_DOWN:
                // recall subsequent callsign
                this.input_history_next();
                e.preventDefault();
                break;

            case KEY_CODES.LEFT_ARROW:
                // shortKeys in use
                if (this._isArrowControlMethod()) {
                    this.$commandInput.val(`${currentCommandInputValue} t l `);
                    e.preventDefault();
                    this.onCommandInputChangeHandler();
                }

                break;

            case KEY_CODES.UP_ARROW:
                if (this._isArrowControlMethod()) {
                    this.$commandInput.val(`${currentCommandInputValue} \u2B61 `);
                    e.preventDefault();
                    this.onCommandInputChangeHandler();
                } else {
                    // recall previous callsign
                    this.input_history_prev();
                    e.preventDefault();
                }
                break;

            case KEY_CODES.RIGHT_ARROW:
                // shortKeys in use
                if (this._isArrowControlMethod()) {
                    this.$commandInput.val(`${currentCommandInputValue} t r `);
                    e.preventDefault();
                    this.onCommandInputChangeHandler();
                }

                break;

            case KEY_CODES.DOWN_ARROW:
                if (this._isArrowControlMethod()) {
                    this.$commandInput.val(`${currentCommandInputValue} \u2B63 `);
                    e.preventDefault();
                    this.onCommandInputChangeHandler();
                } else {
                    // recall previous callsign
                    this.input_history_prev();
                    e.preventDefault();
                }

                break;

            case KEY_CODES.MULTIPLY:
                this.$commandInput.val(`${currentCommandInputValue} \u2B50 `);
                e.preventDefault();
                this.onCommandInputChangeHandler();

                break;

            case KEY_CODES.ADD:
                this.$commandInput.val(`${currentCommandInputValue} + `);
                e.preventDefault();
                this.onCommandInputChangeHandler();

                break;

            case KEY_CODES.EQUALS: // mac + (actually `=`)
                this.$commandInput.val(`${currentCommandInputValue} + `);
                e.preventDefault();
                this.onCommandInputChangeHandler();

                break;

            case KEY_CODES.SUBTRACT:
                this.$commandInput.val(`${currentCommandInputValue} - `);
                e.preventDefault();
                this.onCommandInputChangeHandler();

                break;

            case KEY_CODES.DASH: // mac -
                this.$commandInput.val(`${currentCommandInputValue} - `);
                e.preventDefault();
                this.onCommandInputChangeHandler();

                break;

            case KEY_CODES.DIVIDE:
                this.$commandInput.val(`${currentCommandInputValue} takeoff `);
                e.preventDefault();
                this.onCommandInputChangeHandler();

                break;

            case KEY_CODES.TAB:
                if (!prop.input.tab_compl.matches) {
                    this.tab_completion_match();
                }

                this.tab_completion_cycle({ backwards: e.shiftKey });
                e.preventDefault();

                break;

            case KEY_CODES.ESCAPE:
                const currentCommandValue = this.$commandInput.val();

                // if the current commandInput value contains a callsign and commands, only clear the commands
                if (currentCommandValue.trim() !== this.input.callsign) {
                    this.$commandInput.val(`${this.input.callsign} `);

                    return;
                }

                this.$commandInput.val('');

                break;
            default:
                break;
        }
    }

    /**
     * @for InputController
     * @method tab_completion_cycle
     * @param opt
     */
    tab_completion_cycle(opt) {
        const matches = prop.input.tab_compl.matches;

        if (!matches || matches.length === 0) {
            return;
        }

        // TODO: this block needs some work. this initial assignment looks to be overwritten every time.
        let i = prop.input.tab_compl.cycle_item;
        if (opt.backwards) {
            i = (i <= 0) ? matches.length - 1 : i - 1;
        } else {
            i = (i >= matches.length - 1) ? 0 : i + 1;
        }

        this.$commandInput.val(`${matches[i]} `);

        prop.input.command = matches[i];
        prop.input.tab_compl.cycle_item = i;

        this.input_parse();
    }

    /**
     * @for InputController
     * @method tab_completion_match
     */
    tab_completion_match() {
        let matches;
        const val = this.$commandInput.val();
        let aircrafts = prop.aircraft.list;

        if (prop.input.callsign) {
            aircrafts = aircrafts.filter((a) => {
                return a.matchCallsign(prop.input.callsign);
            });
        }

        matches = _map(aircrafts, (aircraft) => {
            return aircraft.callsign;
        });

        if (aircrafts.length === 1 && (prop.input.data || val[val.length - 1] === ' ')) {
            // TODO: update inline functions
            matches = aircrafts[0].COMMANDS.filter((c) => {
                return c.toLowerCase().indexOf(prop.input.data.toLowerCase()) === 0;
            })
            .map((c) => {
                return val.substring(0, prop.input.callsign.length + 1) + c;
            });
        }

        this.tab_completion_reset();

        prop.input.tab_compl.matches = matches;
        prop.input.tab_compl.cycle_item = -1;
    }

    /**
     * @for InputController
     * @method tab_completion_reset
     */
    tab_completion_reset() {
        prop.input.tab_compl = {};
    }

    /**
     * @for InputController
     * @method input_history_clamp
     */
    input_history_clamp() {
        prop.input.history_item = clamp(0, prop.input.history_item, prop.input.history.length - 1);
    }

    /**
     * @for InputController
     * @method input_history_prev
     */
    input_history_prev() {
        if (prop.input.history.length === 0) {
            return;
        }

        if (prop.input.history_item == null) {
            prop.input.history.unshift(prop.input.command);
            prop.input.history_item = 0;
        }

        prop.input.history_item += 1;
        this.input_history_clamp();

        const command = `${prop.input.history[prop.input.history_item]} `;
        this.$commandInput.val(command.toUpperCase());

        this.onCommandInputChangeHandler();
    }

    /**
     * @for InputController
     * @method input_history_next
     */
    input_history_next() {
        if (prop.input.history.length === 0 || !prop.input.history_item) {
            return;
        }

        prop.input.history_item -= 1;

        if (prop.input.history_item <= 0) {
            this.$commandInput.val(prop.input.history[0]);

            this.onCommandInputChangeHandler();

            prop.input.history.splice(0, 1);
            prop.input.history_item = null;

            return;
        }

        this.input_history_clamp();

        const command = `${prop.input.history[prop.input.history_item]} `;

        this.$commandInput.val(command.toUpperCase());
        this.onCommandInputChangeHandler();
    }

    /**
     * Encapsulation of repeated boolean logic
     *
     * @for InputController
     * @method _isArrowControlMethod
     * @return {boolean}
     */
    _isArrowControlMethod() {
        return window.gameController.game.option.get(GAME_OPTION_NAMES.CONTROL_METHOD) === 'arrows';
    }

    /**
     * @for InputController
     * @method _parseUserCommand
     * @return result {CommandParser}
     */
    _parseUserCommand() {
        let result;
        // this could use $commandInput.val() as an alternative
        const userCommand = prop.input.command.trim().toLowerCase();

        // Using try/catch here very much on purpose. the `CommandParser` will throw when it encounters any kind
        // of error; invalid length, validation, parse, etc. Here we catch those errors, log them to the screen
        // and then throw them all at once
        try {
            result = new CommandParser(userCommand);
        } catch (error) {
            window.uiController.ui_log('Command not understood');

            throw error;
        }

        return result;
    }

    /**
     * @for InputController
     * @method input_run
     */
    input_run() {
        const commandParser = this._parseUserCommand();

        if (commandParser.command !== 'transmit') {
            return this.processSystemCommand(commandParser);
        }

        return this.processTransmitCommand(commandParser);
    }

    /**
     * @for InputController
     * @method processSystemCommand
     * @param commandParser {CommandParser}
     * @return {boolean}
     */
    processSystemCommand(commandParser) {
        switch (commandParser.command) {
            case PARSED_COMMAND_NAME.VERSION:
                window.uiController.ui_log(`Air Traffic Control simulator version ${prop.version}`);

                return true;

            case PARSED_COMMAND_NAME.TUTORIAL:
                window.tutorialView.tutorial_toggle();

                return true;

            case PARSED_COMMAND_NAME.AUTO:
                // TODO: does this function exist anywhere?
                // aircraft_toggle_auto();
                //
                // if (prop.aircraft.auto.enabled) {
                //     window.uiController.ui_log('automatic controller ENGAGED');
                // } else {
                //     window.uiController.ui_log('automatic controller OFF');
                // }

                return true;

            case PARSED_COMMAND_NAME.PAUSE:
                window.gameController.game_pause_toggle();

                return true;

            case PARSED_COMMAND_NAME.TIMEWARP:
                if (commandParser.args) {
                    window.gameController.game.speedup = commandParser.args;
                } else {
                    window.gameController.game_timewarp_toggle();
                }

                return true;

            case PARSED_COMMAND_NAME.CLEAR:
                localStorage.clear();
                location.reload();

            case PARSED_COMMAND_NAME.AIRPORT:
                // TODO: it may be better to do this in the parser
                const airportIcao = commandParser.args[0];

                if (_has(prop.airport.airports, airportIcao)) {
                    window.airportController.airport_set(airportIcao);
                }

                return true;

            case PARSED_COMMAND_NAME.RATE:
                // TODO: is this if even needed?
                if (commandParser.args) {
                    window.gameController.game.frequency = commandParser.args;
                }

                return true;
            default:
                return true;
        }
    }

    /**
     * @for InputController
     * @method processTransmitCommand
     * @param commandParser {CommandParser}
     * @return {boolean}
     */
    processTransmitCommand(commandParser) {
        // TODO: abstract the aircraft callsign matching
        let matches = 0;
        let match = -1;

        for (let i = 0; i < prop.aircraft.list.length; i++) {
            const aircraft = prop.aircraft.list[i];

            if (aircraft.matchCallsign(commandParser.callsign)) {
                matches += 1;
                match = i;
            }
        }

        if (matches > 1) {
            window.uiController.ui_log('multiple aircraft match the callsign, say again');

            return true;
        }

        if (match === -1) {
            window.uiController.ui_log('no such aircraft, say again');

            return true;
        }

        const aircraft = prop.aircraft.list[match];

        return this._aircraftCommander.runCommands(aircraft, commandParser.args);
    }
}
