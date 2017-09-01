/* eslint-disable camelcase, no-mixed-operators, object-shorthand, no-undef, expected-return*/
import $ from 'jquery';
import _has from 'lodash/has';
import _map from 'lodash/map';
import AirportController from './airport/AirportController';
import EventBus from './lib/EventBus';
import GameController from './game/GameController';
import UiController from './UiController';
import CommandParser from './commandParser/CommandParser';
import { clamp } from './math/core';
import { EVENT } from './constants/eventNames';
import { GAME_OPTION_NAMES } from './constants/gameOptionConstants';
import { INVALID_NUMBER } from './constants/globalConstants';
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
    MIDDLE_PRESS: 2,
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
     * @param $element {JQuery|HTML Element}
     * @param aircraftCommander {AircraftCommander}
     * @param uiController {UiController}
     * @param onSelectAircraftStrip {function}       provides direct access to method in AircraftController that
     *                                               that can be used to select a specific `stripViewModel`.
     */
    constructor($element, aircraftCommander, aircraftController, tutorialView) {
        this.$element = $element;
        this.$window = null;
        this.$commandInput = null;
        this.$canvases = null;
        this.$sidebar = null;

        this._eventBus = EventBus;
        this._aircraftCommander = aircraftCommander;
        this._aircraftController = aircraftController;
        this._tutorialView = tutorialView;


        prop.input = input;
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

        this._eventBus.on(EVENT.STRIP_CLICK, this.input_select);

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

        this._eventBus.off(EVENT.STRIP_CLICK, this.input_select);

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
        // TODO: these prop properties can be removed except for `this.input`
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
    }

    /**
     * @for InputController
     * @method onMouseScrollHandler
     * @param event {jquery Event}
     */
    onMouseScrollHandler(event) {
        if (event.originalEvent.wheelDelta > 0 || event.originalEvent.detail < 0) {
            UiController.ui_zoom_in();
        } else {
            UiController.ui_zoom_out();
        }
    }

    /**
     * @for InputController
     * @method onMouseMoveHandler
     * @param event {jquery Event}
     */
    onMouseMoveHandler(event) {
        if (!this.input.isMouseDown) {
            return this;
        }

        this.input.mouseDelta = [
            event.pageX - this.input.mouseDown[0],
            event.pageY - this.input.mouseDown[1]
        ];
        prop.canvas.panX = this.input.mouseDelta[0];
        prop.canvas.panY = this.input.mouseDelta[1];
        prop.canvas.dirty = true;
    }

    /**
     * @for InputController
     * @method onMouseUpHandler
     * @param event {jquery Event}
     */
    onMouseUpHandler(event) {
        this.input.isMouseDown = false;
    }

    /**
     * @for InputController
     * @method onMouseDownHandler
     * @param event {jquery Event}
     */
    onMouseDownHandler(event) {
        event.preventDefault();

        // TODO: this should use early returns instead of the else if
        if (event.which === MOUSE_EVENT_CODE.MIDDLE_PRESS) {
            UiController.ui_zoom_reset();
        } else if (event.which === MOUSE_EVENT_CODE.LEFT_PRESS) {
            // Record mouse down position for panning
            this.input.mouseDown = [
                event.pageX - prop.canvas.panX,
                event.pageY - prop.canvas.panY
            ];
            this.input.isMouseDown = true;

            // Aircraft label selection
            let position = [event.pageX, -event.pageY];
            position[0] -= prop.canvas.size.width / 2;
            position[1] += prop.canvas.size.height / 2;

            const [aircraftModel, distanceFromPosition] = this._aircraftController.aircraft_get_nearest([
                UiController.px_to_km(position[0] - prop.canvas.panX),
                UiController.px_to_km(position[1] + prop.canvas.panY)
            ]);

            if (aircraftModel) {
                if (distanceFromPosition < UiController.px_to_km(80)) {
                    this.input.callsign = aircraftModel.callsign.toUpperCase();

                    this.input_select(this.input.callsign);
                    this._eventBus.trigger(EVENT.SELECT_STRIP_VIEW_FROM_DATA_BLOCK, aircraftModel);
                } else {
                    this.input_select();
                    this._eventBus.trigger(EVENT.DESELECT_ACTIVE_STRIP_VIEW, {});
                }
            }

            position = [
                UiController.px_to_km(position[0]),
                UiController.px_to_km(position[1])
            ];

            position[0] = parseFloat(position[0].toFixed(2));
            position[1] = parseFloat(position[1].toFixed(2));
            this.input.positions += `[${position.join(',')}]`;

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

        if (!GameController.game_paused()) {
            this.$commandInput.focus();
        }

        if (event.which === KEY_CODES.ESCAPE) {
            if (prop.tutorial.open) {
                this._tutorialView.tutorial_close();
            } else if ($(SELECTORS.DOM_SELECTORS.AIRPORT_SWITCH).hasClass(SELECTORS.CLASSNAMES.OPEN)) {
                UiController.ui_airport_close();
            }
        }

        if (!prop.tutorial.open) {
            return;
        }

        if (event.which === KEY_CODES.PAGE_UP) {
            this._tutorialView.tutorial_prev();
            event.preventDefault();
        } else if (event.which === KEY_CODES.PAGE_DOWN) {
            this._tutorialView.tutorial_next();
            event.preventDefault();
        }
    }

    /**
     * @for InputController
     * @method input_parse
     */
    input_parse() {
        this.input.callsign = '';
        this.input.data = '';

        if (this.input.command.length === 0) {
            return;
        }

        // TODO: move to master REGEX constant
        const match = /^\s*(\w+)/.exec(this.input.command);

        if (!match) {
            return;
        }

        this.input.callsign = match[1];
        prop.canvas.dirty = true;

        // TODO: this looks like it should happen in the `AircraftController`
        for (let i = 0; i < this._aircraftController.aircraft.list.length; i++) {
            const aircraft = this._aircraftController.aircraft.list[i];

            if (aircraft.matchCallsign(this.input.callsign)) {
                this._aircraftController.onSelectAircraftStrip(aircraft);

                break;
            }
        }
    }

    /**
     * @for InputController
     * @method onCommandInputChangeHandler
     */
    onCommandInputChangeHandler() {
        this.tab_completion_reset();

        this.input.command = this.$commandInput.val();

        this.input_parse();
    }

    /**
     * @for InputController
     * @method input_select
     * @param callsign {string}
     */
    input_select = (callsign) => {
        let nextCommandInputValue = '';

        if (callsign) {
            nextCommandInputValue = `${callsign} `;
        }

        this.$commandInput.val(nextCommandInputValue);
        this.$commandInput.focus();

        this.onCommandInputChangeHandler();
    };

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
                    this.input.history.unshift(this.input.callsign);
                    this.$commandInput.val('');
                    this.input.command = '';

                    this.tab_completion_reset();
                    this.input_parse();
                }

                this.input.history_item = null;

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
                if (!this.input.tab_compl.matches) {
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
        const matches = this.input.tab_compl.matches;

        if (!matches || matches.length === 0) {
            return;
        }

        // TODO: this block needs some work. this initial assignment looks to be overwritten every time.
        let i = this.input.tab_compl.cycle_item;
        if (opt.backwards) {
            i = (i <= 0) ? matches.length - 1 : i - 1;
        } else {
            i = (i >= matches.length - 1) ? 0 : i + 1;
        }

        this.$commandInput.val(`${matches[i]} `);

        this.input.command = matches[i];
        this.input.tab_compl.cycle_item = i;

        this.input_parse();
    }

    /**
     * @for InputController
     * @method tab_completion_match
     */
    tab_completion_match() {
        let matches;
        const val = this.$commandInput.val();
        let aircrafts = this._aircraftController.aircraft.list;

        if (this.input.callsign) {
            aircrafts = aircrafts.filter((a) => {
                return a.matchCallsign(this.input.callsign);
            });
        }

        matches = _map(aircrafts, (aircraft) => {
            return aircraft.callsign;
        });

        if (aircrafts.length === 1 && (this.input.data || val[val.length - 1] === ' ')) {
            // TODO: update inline functions
            matches = aircrafts[0].COMMANDS.filter((c) => {
                return c.toLowerCase().indexOf(this.input.data.toLowerCase()) === 0;
            })
            .map((c) => {
                return val.substring(0, this.input.callsign.length + 1) + c;
            });
        }

        this.tab_completion_reset();

        this.input.tab_compl.matches = matches;
        this.input.tab_compl.cycle_item = INVALID_NUMBER;
    }

    /**
     * @for InputController
     * @method tab_completion_reset
     */
    tab_completion_reset() {
        this.input.tab_compl = {};
    }

    /**
     * @for InputController
     * @method input_history_clamp
     */
    input_history_clamp() {
        this.input.history_item = clamp(0, this.input.history_item, this.input.history.length - 1);
    }

    /**
     * @for InputController
     * @method input_history_prev
     */
    input_history_prev() {
        if (this.input.history.length === 0) {
            return;
        }

        if (this.input.history_item == null) {
            this.input.history.unshift(this.input.command);
            this.input.history_item = 0;
        }

        this.input.history_item += 1;
        this.input_history_clamp();

        const command = `${this.input.history[this.input.history_item]} `;
        this.$commandInput.val(command.toUpperCase());

        this.onCommandInputChangeHandler();
    }

    /**
     * @for InputController
     * @method input_history_next
     */
    input_history_next() {
        if (this.input.history.length === 0 || !this.input.history_item) {
            return;
        }

        this.input.history_item -= 1;

        if (this.input.history_item <= 0) {
            this.$commandInput.val(this.input.history[0]);

            this.onCommandInputChangeHandler();

            this.input.history.splice(0, 1);
            this.input.history_item = null;

            return;
        }

        this.input_history_clamp();

        const command = `${this.input.history[this.input.history_item]} `;

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
        return GameController.game.option.getOptionByName(GAME_OPTION_NAMES.CONTROL_METHOD) === 'arrows';
    }

    /**
     * @for InputController
     * @method _parseUserCommand
     * @return result {CommandParser}
     */
    _parseUserCommand() {
        let result;
        // this could use $commandInput.val() as an alternative
        const userCommand = this.input.command.trim().toLowerCase();

        // Using try/catch here very much on purpose. the `CommandParser` will throw when it encounters any kind
        // of error; invalid length, validation, parse, etc. Here we catch those errors, log them to the screen
        // and then throw them all at once
        try {
            result = new CommandParser(userCommand);
        } catch (error) {
            UiController.ui_log('Command not understood');

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
                UiController.ui_log(`Air Traffic Control simulator version ${prop.version}`);

                return true;

            case PARSED_COMMAND_NAME.TUTORIAL:
                this._tutorialView.tutorial_toggle();

                return true;

            case PARSED_COMMAND_NAME.AUTO:
                // TODO: does this function exist anywhere?
                // aircraft_toggle_auto();
                //
                // if (this._aircraftController.aircraft.auto.enabled) {
                //     UiController.ui_log('automatic controller ENGAGED');
                // } else {
                //     UiController.ui_log('automatic controller OFF');
                // }

                return true;

            case PARSED_COMMAND_NAME.PAUSE:
                GameController.game_pause_toggle();

                return true;

            case PARSED_COMMAND_NAME.TIMEWARP:
                if (commandParser.args) {
                    GameController.game.speedup = commandParser.args;
                } else {
                    GameController.game_timewarp_toggle();
                }

                return true;

            case PARSED_COMMAND_NAME.CLEAR:
                localStorage.clear();
                location.reload();

                break;
            case PARSED_COMMAND_NAME.AIRPORT:
                // TODO: it may be better to do this in the parser
                const airportIcao = commandParser.args[0];

                if (_has(AirportController.airports, airportIcao)) {
                    AirportController.airport_set(airportIcao);
                }

                return true;

            case PARSED_COMMAND_NAME.RATE:
                // TODO: is this if even needed?
                if (commandParser.args) {
                    GameController.game.frequency = commandParser.args;
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
        let match = INVALID_NUMBER;

        for (let i = 0; i < this._aircraftController.aircraft.list.length; i++) {
            const aircraft = this._aircraftController.aircraft.list[i];

            if (aircraft.matchCallsign(commandParser.callsign)) {
                matches += 1;
                match = i;
            }
        }

        if (matches > 1) {
            UiController.ui_log('multiple aircraft match the callsign, say again');

            return true;
        }

        if (match === INVALID_NUMBER) {
            UiController.ui_log('no such aircraft, say again');

            return true;
        }

        const aircraft = this._aircraftController.aircraft.list[match];

        return this._aircraftCommander.runCommands(aircraft, commandParser.args);
    }
}
