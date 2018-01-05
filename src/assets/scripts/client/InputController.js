/* eslint-disable camelcase, no-mixed-operators, object-shorthand, no-undef, expected-return*/
import $ from 'jquery';
import _has from 'lodash/has';
import _includes from 'lodash/includes';
import AirportController from './airport/AirportController';
import CanvasStageModel from './canvas/CanvasStageModel';
import EventBus from './lib/EventBus';
import GameController from './game/GameController';
import UiController from './UiController';
import AircraftCommandParser from './parsers/aircraftCommandParser/AircraftCommandParser';
import ScopeCommandModel from './parsers/scopeCommandParser/ScopeCommandModel';
import { clamp } from './math/core';
import { EVENT } from './constants/eventNames';
import { GAME_OPTION_NAMES } from './constants/gameOptionConstants';
import { INVALID_NUMBER } from './constants/globalConstants';
import {
    COMMAND_CONTEXT,
    KEY_CODES,
    MOUSE_EVENT_CODE,
    PARSED_COMMAND_NAME
} from './constants/inputConstants';
import { SELECTORS } from './constants/selectors';

// Temporary const declaration here to attach to the window AND use as internal propert
const input = {};

/**
 * @class InputController
 */
export default class InputController {
    /**
     * @constructor
     * @param $element {JQuery|HTML Element}
     * @param aircraftCommander {AircraftCommander}
     * @param scopeModel {ScopeModel}
     * @param tutorialView {TutorialView}
     */
    constructor($element, aircraftCommander, aircraftController, scopeModel, tutorialView) {
        this.$element = $element;
        this.$body = null;
        this.$window = null;
        this.$commandInput = null;
        this.$canvases = null;
        this.$sidebar = null;

        this._eventBus = EventBus;
        this._aircraftCommander = aircraftCommander;
        this._aircraftController = aircraftController;
        this._scopeModel = scopeModel;
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
        this._mouseDelta = [0, 0];
        this._mouseDownScreenPosition = [0, 0];
        this.input.isMouseDown = false;
        this.commandBarContext = COMMAND_CONTEXT.AIRCRAFT;

        this._init()
            .enable();
    }

    /**
     * @for InputController
     * @method _init
     */
    _init() {
        this.$body = this.$element[0];
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
     * Enable all event handlers
     *
     * @for InputController
     * @method enable
     */
    enable() {
        this.$window.on('keydown', (event) => this.onKeydownHandler(event));
        this.$commandInput.on('input', (event) => this.onCommandInputChangeHandler(event));
        // TODO: these are non-standard events and will be deprecated soon. this should be moved
        // over to the `wheel` event. This should also be moved over to `.on()` instead of `.bind()`
        // https://developer.mozilla.org/en-US/docs/Web/Events/wheel
        // this.$commandInput.on('DOMMouseScroll mousewheel', (event) => this.onMouseScrollHandler(event));
        this.$canvases.bind('DOMMouseScroll mousewheel', (event) => this.onMouseScrollHandler(event));
        this.$canvases.on('mousemove', (event) => this.onMouseClickAndDragHandler(event));
        this.$canvases.on('mouseup', (event) => this.onMouseUpHandler(event));
        this.$canvases.on('mousedown', (event) => this.onMouseDownHandler(event));
        this.$body.addEventListener('contextmenu', (event) => event.preventDefault());

        // TODO: Fix this
        this._eventBus.on(EVENT.STRIP_CLICK, this.selectAircraftByCallsign);

        return this;
    }

    /**
     * Disable all event handlers and destroy the instance
     *
     * @for InputController
     * @method disable
     */
    disable() {
        this.$window.off('keydown', (event) => this.onKeydownHandler(event));
        this.$commandInput.off('input', (event) => this.onCommandInputChangeHandler(event));
        // uncomment only after `.on()` for this event has been implemented.
        // this.$commandInput.off('DOMMouseScroll mousewheel', (event) => this.onMouseScrollHandler(event));
        this.$canvases.off('mousemove', (event) => this.onMouseClickAndDragHandler(event));
        this.$canvases.off('mouseup', (event) => this.onMouseUpHandler(event));
        this.$canvases.off('mousedown', (event) => this.onMouseDownHandler(event));
        this.$body.removeEventListener('contextmenu', (event) => event.preventDefault());

        this._eventBus.off(EVENT.STRIP_CLICK, this.selectAircraftByCallsign);

        return this.destroy();
    }

    /**
     * @for InputController
     * @method destroy
     */
    destroy() {
        this.$element = null;
        this.$body = null;
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
        this._mouseDelta = [0, 0];
        this._mouseDownScreenPosition = [0, 0];
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
        this._mouseDelta = [0, 0];
        this._mouseDownScreenPosition = [0, 0];
        this.input.isMouseDown = false;
    }

    // TODO: The tutorial should be moved to the UiController, and then this can be removed
    /**
     * Close all open dialogs and return focus to the command bar
     *
     * @for InputController
     * @method closeAllDialogs
     */
    closeAllDialogs() {
        if (prop.tutorial.open) {
            this._tutorialView.tutorial_close();
        }

        UiController.closeAllDialogs();
    }

    /**
     * @for InputController
     * @method onMouseScrollHandler
     * @param event {jquery Event}
     */
    onMouseScrollHandler(event) {
        if (event.originalEvent.wheelDelta > 0 || event.originalEvent.detail < 0) {
            CanvasStageModel.zoomIn();
        } else {
            CanvasStageModel.zoomOut();
        }
    }

    /**
     * @for InputController
     * @method onMouseClickAndDragHandler
     * @param event {jquery Event}
     */
    onMouseClickAndDragHandler(event) {
        if (!this.input.isMouseDown) {
            return this;
        }

        const nextXPan = event.pageX - this._mouseDownScreenPosition[0];
        const nextYPan = event.pageY - this._mouseDownScreenPosition[1];

        // TODO: investigate `_mouseDelta` and what exactly it does
        // this updates the current mouseDelta so the next time through we have correct values
        this._mouseDelta = [
            nextXPan,
            nextYPan
        ];

        CanvasStageModel.updatePan(nextXPan, nextYPan);
    }

    /**
     * @for InputController
     * @method onMouseUpHandler
     * @param event {jquery Event}
     */
    onMouseUpHandler(event) {
        this.input.isMouseDown = false;

        // TODO: Do something with this event or stop collecting it; it causes lint errors
        return event;
    }

    /**
     * @for InputController
     * @method onMouseDownHandler
     * @param event {jquery Event}
     */
    onMouseDownHandler(event) {
        event.preventDefault();

        // TODO: This should use a switch on `event.which` instead of `if/else if`
        if (event.which === MOUSE_EVENT_CODE.MIDDLE_PRESS) {
            CanvasStageModel.zoomReset();
        } else if (event.which === MOUSE_EVENT_CODE.RIGHT_PRESS) {
            // Record mouse down position for panning
            this._mouseDownScreenPosition = [
                event.pageX - CanvasStageModel._panX,
                event.pageY - CanvasStageModel._panY
            ];
            this.input.isMouseDown = true;
        } else if (event.which === MOUSE_EVENT_CODE.LEFT_PRESS) {
            // Aircraft label selection
            let currentMousePosition = [event.pageX, -event.pageY];
            currentMousePosition[0] -= CanvasStageModel.width / 2;
            currentMousePosition[1] += CanvasStageModel.height / 2;

            const [aircraftModel, distanceFromPosition] = this._aircraftController.aircraft_get_nearest([
                CanvasStageModel.translatePixelsToKilometers(currentMousePosition[0] - CanvasStageModel._panX),
                CanvasStageModel.translatePixelsToKilometers(currentMousePosition[1] + CanvasStageModel._panY)
            ]);

            if (distanceFromPosition > CanvasStageModel.translatePixelsToKilometers(50)) {
                this.selectAircraft();
            } else if (this.commandBarContext === COMMAND_CONTEXT.SCOPE) {
                const newCommandValue = `${this.$commandInput.val()} ${aircraftModel.callsign}`;
                this.input.command = newCommandValue;

                this.$commandInput.val(newCommandValue);
                this.processCommand();
            } else if (aircraftModel) {
                this.selectAircraft(aircraftModel);
            }

            currentMousePosition = [
                CanvasStageModel.translatePixelsToKilometers(currentMousePosition[0]),
                CanvasStageModel.translatePixelsToKilometers(currentMousePosition[1])
            ];

            currentMousePosition[0] = parseFloat(currentMousePosition[0].toFixed(2));
            currentMousePosition[1] = parseFloat(currentMousePosition[1].toFixed(2));
            // FIXME: what the is this?!
            this.input.positions += `[${currentMousePosition.join(',')}]`;

            return false;
        }
    }

    /**
     * @for InputController
     * @method onCommandInputChangeHandler
     */
    onCommandInputChangeHandler() {
        this.input.command = this.$commandInput.val();
    }

    /**
     * @for InputController
     * @method selectAircraft
     * @param aircraftModel {AircraftModel}
     */
    selectAircraft = (aircraftModel) => {
        if (!aircraftModel) {
            // TODO: Refactor out the prop
            // using `prop` here so CanvasController knows which aircraft is selected
            prop.input.callsign = '';
            prop.input.command = '';
            this.input.callsign = '';
            this.input.command = '';
            this.$commandInput.val('');
            this._eventBus.trigger(EVENT.DESELECT_ACTIVE_STRIP_VIEW, {});

            return;
        }

        // TODO: Refactor out the prop
        // using `prop` here so CanvasController knows which aircraft is selected
        prop.input.callsign = aircraftModel.callsign;
        prop.input.command = '';
        this.input.callsign = aircraftModel.callsign;
        this.input.command = '';
        this.$commandInput.val(`${aircraftModel.callsign} `);
        this._eventBus.trigger(EVENT.SELECT_STRIP_VIEW_FROM_DATA_BLOCK, aircraftModel);
    };

    /**
     * Select aircraft by callsign
     *
     * @for InputController
     * @method selectAircraftByCallsign
     * @param callsign {string}
     */
    selectAircraftByCallsign = (callsign) => {
        const aircraftModel = this._aircraftController.findAircraftByCallsign(callsign);

        this.selectAircraft(aircraftModel);
    }

    /**
     * @for InputController
     * @method onKeydownHandler
     */
    onKeydownHandler(event) {
        const currentCommandInputValue = this.$commandInput.val();

        // TODO: this swtich can be simplified, there is a lot of repetition here
        switch (event.which) {
            case KEY_CODES.BAT_TICK:
                this.$commandInput.val(`${currentCommandInputValue}\` `);
                event.preventDefault();
                this.onCommandInputChangeHandler();

                break;
            case KEY_CODES.ENTER:
                this.processCommand();

                break;
            case KEY_CODES.PAGE_UP:
                this.selectPreviousAircraft();
                event.preventDefault();

                break;
            case KEY_CODES.PAGE_DOWN:
                this.selectNextAircraft();
                event.preventDefault();

                break;
            case KEY_CODES.LEFT_ARROW:
                if (this._isArrowControlMethod()) {
                    this.$commandInput.val(`${currentCommandInputValue} t l `);
                    event.preventDefault();
                    this.onCommandInputChangeHandler();
                }

                break;
            case KEY_CODES.UP_ARROW:
                if (this._isArrowControlMethod()) {
                    this.$commandInput.val(`${currentCommandInputValue} c `);
                    event.preventDefault();
                    this.onCommandInputChangeHandler();
                } else {
                    this.selectPreviousAircraft();
                    event.preventDefault();
                }

                break;
            case KEY_CODES.RIGHT_ARROW:
                if (this._isArrowControlMethod()) {
                    this.$commandInput.val(`${currentCommandInputValue} t r `);
                    event.preventDefault();
                    this.onCommandInputChangeHandler();
                }

                break;
            case KEY_CODES.DOWN_ARROW:
                if (this._isArrowControlMethod()) {
                    this.$commandInput.val(`${currentCommandInputValue} d `);
                    event.preventDefault();
                    this.onCommandInputChangeHandler();
                } else {
                    this.selectPreviousAircraft();
                    event.preventDefault();
                }

                break;
            case KEY_CODES.MULTIPLY:
                this.$commandInput.val(`${currentCommandInputValue} \u2B50 `);
                event.preventDefault();
                this.onCommandInputChangeHandler();

                break;
            case KEY_CODES.ADD:
                this.$commandInput.val(`${currentCommandInputValue} + `);
                event.preventDefault();
                this.onCommandInputChangeHandler();

                break;
            case KEY_CODES.EQUALS: // mac + (actually `=`)
                this.$commandInput.val(`${currentCommandInputValue} + `);
                event.preventDefault();
                this.onCommandInputChangeHandler();

                break;
            case KEY_CODES.SUBTRACT:
                this.$commandInput.val(`${currentCommandInputValue} - `);
                event.preventDefault();
                this.onCommandInputChangeHandler();

                break;
            case KEY_CODES.DASH: // mac -
                this.$commandInput.val(`${currentCommandInputValue} - `);
                event.preventDefault();
                this.onCommandInputChangeHandler();

                break;
            case KEY_CODES.DIVIDE:
                this.$commandInput.val(`${currentCommandInputValue} takeoff `);
                event.preventDefault();
                this.onCommandInputChangeHandler();

                break;
            case KEY_CODES.TAB:
                this.$commandInput.val('');
                event.preventDefault();
                this._toggleCommandBarContext();

                break;
            case KEY_CODES.ESCAPE: {
                this.closeAllDialogs();

                if (!_includes(currentCommandInputValue, this.input.callsign) ||
                    currentCommandInputValue.trim() === this.input.callsign
                ) {
                    this.selectAircraft();

                    return;
                }

                this.$commandInput.val(`${this.input.callsign} `);

                return;
            }
            default:
                this.$commandInput.focus();
        }
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
     * @method selectPreviousAircraft
     */
    selectPreviousAircraft() {
        if (this.input.history.length === 0) {
            return;
        }

        if (this.input.history_item == null) {
            this.input.history.unshift(this.input.command);
            this.input.history_item = 0;
        }

        this.input.history_item += 1;
        this.input_history_clamp();

        const callsign = this.input.history[this.input.history_item];
        const aircraftModel = this._aircraftController.findAircraftByCallsign(callsign);

        this.selectAircraft(aircraftModel);
        this.onCommandInputChangeHandler();
    }

    /**
     * @for InputController
     * @method selectNextAircraft
     */
    selectNextAircraft() {
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

        const callsign = this.input.history[this.input.history_item];
        const aircraftModel = this._aircraftController.findAircraftByCallsign(callsign);

        this.selectAircraft(aircraftModel);
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
     * Toggle command bar between aircraft commands and scope commands
     *
     * @for InputController
     * @method _toggleCommandBarContext
     */
    _toggleCommandBarContext() {
        switch (this.commandBarContext) {
            case COMMAND_CONTEXT.AIRCRAFT:
                this.commandBarContext = COMMAND_CONTEXT.SCOPE;
                this.$commandInput.attr('placeholder', 'enter scope command');
                this.$commandInput.css({ color: 'red' });

                return;
            case COMMAND_CONTEXT.SCOPE:
                this.commandBarContext = COMMAND_CONTEXT.AIRCRAFT;
                this.$commandInput.attr('placeholder', 'enter aircraft command');
                this.$commandInput.css({ color: 'white' });

                return;
            default:
                return;
        }
    }

    /**
     * Process the command currently in the command bar
     *
     * @for InputController
     * @method processCommand
     * @return {array} [success of operation, response]
     */
    processCommand() {
        let response = [];

        if (this.commandBarContext === COMMAND_CONTEXT.AIRCRAFT) {
            response = this.processAircraftCommand();
        } else if (this.commandBarContext === COMMAND_CONTEXT.SCOPE) {
            response = this.processScopeCommand();
        }

        this.selectAircraft();

        return response;
    }

    /**
     * Process user command to be applied to an aircraft
     *
     * @for InputController
     * @method processAircraftCommand
     */
    processAircraftCommand() {
        //     this.input.history.unshift(this.input.callsign);
        //     this.$commandInput.val('');
        //     this.input.command = '';

        let aircraftCommandParser;
        // this could use $commandInput.val() as an alternative
        const userCommand = this.input.command.trim().toLowerCase();

        // Using try/catch here very much on purpose. the `AircraftCommandParser` will throw when it encounters any kind
        // of error; invalid length, validation, parse, etc. Here we catch those errors, log them to the screen
        // and then throw them all at once
        try {
            aircraftCommandParser = new AircraftCommandParser(userCommand);
        } catch (error) {
            UiController.ui_log('Command not understood', true);

            throw error;
        }

        if (aircraftCommandParser.command !== 'transmit') {
            return this.processSystemCommand(aircraftCommandParser);
        }

        this.input.history.unshift(this.input.callsign);
        this.input.history_item = null;

        return this.processTransmitCommand(aircraftCommandParser);
    }

    /**
     * Process user command to be applied to the user's scope
     *
     * @for InputController
     * @method processScopeCommand
     */
    processScopeCommand() {
        let scopeCommandModel;
        const userCommand = this.input.command.trim().toLowerCase();

        try {
            scopeCommandModel = new ScopeCommandModel(userCommand);
        } catch (error) {
            UiController.ui_log('ERROR: BAD SYNTAX', true);

            throw error;
        }

        const [successful, response] = this._scopeModel.runScopeCommand(scopeCommandModel);
        const isWarning = !successful;

        UiController.ui_log(response, isWarning);
    }

    /**
     * @for InputController
     * @method processSystemCommand
     * @param aircraftCommandParser {AircraftCommandParser}
     * @return {boolean}
     */
    processSystemCommand(aircraftCommandParser) {
        switch (aircraftCommandParser.command) {
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
                let nextTimewarpValue = 0;

                if (aircraftCommandParser.args) {
                    nextTimewarpValue = aircraftCommandParser.args[0];
                }

                GameController.updateTimescale(nextTimewarpValue);

                return true;

            case PARSED_COMMAND_NAME.CLEAR:
                localStorage.clear();
                location.reload();

                break;
            case PARSED_COMMAND_NAME.AIRPORT: {
                // TODO: it may be better to do this in the parser
                const airportIcao = aircraftCommandParser.args[0];

                if (_has(AirportController.airports, airportIcao)) {
                    AirportController.airport_set(airportIcao);
                }

                return true;
            }
            // TODO: this will be removed entirely, eventually.
            case PARSED_COMMAND_NAME.RATE:
                UiController.ui_log('this command has been deprecated', true);

                return true;
            default:
                return true;
        }
    }

    /**
     * @for InputController
     * @method processTransmitCommand
     * @param aircraftCommandParser {AircraftCommandParser}
     * @return {boolean}
     */
    processTransmitCommand(aircraftCommandParser) {
        // TODO: abstract the aircraft callsign matching
        let matches = 0;
        let match = INVALID_NUMBER;

        for (let i = 0; i < this._aircraftController.aircraft.list.length; i++) {
            const aircraft = this._aircraftController.aircraft.list[i];

            if (aircraft.matchCallsign(aircraftCommandParser.callsign)) {
                matches += 1;
                match = i;
            }
        }

        if (matches > 1) {
            UiController.ui_log('multiple aircraft match the callsign, say again', true);

            return true;
        }

        if (match === INVALID_NUMBER) {
            UiController.ui_log('no such aircraft, say again', true);

            return true;
        }

        const aircraft = this._aircraftController.aircraft.list[match];

        return this._aircraftCommander.runCommands(aircraft, aircraftCommandParser.args);
    }
}
