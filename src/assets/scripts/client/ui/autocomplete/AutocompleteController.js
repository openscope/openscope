import $ from 'jquery';
import _isArray from 'lodash/isArray';
import _isEmpty from 'lodash/isEmpty';
import RegexGroup from './RegexGroup';
import {
    AUTOCOMPLETE_COMMAND_TYPE,
    AUTOCOMPLETE_STATE,
    AUTOCOMPLETE_COMMAND_STATES,
    AUTOCOMPLETE_INPUT_PLACEHOLDER,
    AUTOCOMPLETE_PARAMS_VALIDITY,
    AUTOCOMPLETE_REGEXP
} from '../../constants/autocompleteConstants';
import {
    KEY_CODES,
    LEGACY_KEY_CODES,
    MOUSE_EVENT_CODE
} from '../../constants/inputConstants';
import { SELECTORS } from '../../constants/selectors';
import { AUTOCOMPLETE_COMMAND_TEMPLATE } from './AutocompleteCommandTemplate';
import { AUTOCOMPLETE_ARGUMENT_TEMPLATE } from './AutocompleteArgumentTemplate';

const Handlebars = require('handlebars');

/**
 * @class AutocompleteController
 */
export default class AutocompleteController {
    /**
     * @constructor
     * @param $element {JQuery|HTML Element}
     * @param inputController {InputController}
     * @param aircraftController {AircraftController}
     */
    constructor($element, inputController, aircraftController) {
        this.$element = $element;
        this.$autocomplete = null;
        this.$autocompleteInput = null;
        this.$autocompleteOutput = null;
        this.$autocompleteSpacer = null;
        this.$autocompleteSuggests = null;

        this._inputController = inputController;
        this._aircraftController = aircraftController;

        this.commandDefs = {};
        this.lookup = {};
        this.ready = false;

        this.active = false;
        this.state = AUTOCOMPLETE_STATE.COMMANDS.NO_MATCHES;
        this.commandType = AUTOCOMPLETE_COMMAND_TYPE.TRANSMIT;
        this.initialRange = {};
        this.targetRange = {};
        this.highlighted = null;
        this.inputRevert = null;
        this.params = {};

        this._init();
    }

    /**
     * @for AutocompleteController
     * @method _init
     * @private
     */
    _init() {
        this.$autocomplete = this.$element.find(SELECTORS.DOM_SELECTORS.AUTOCOMPLETE);
        this.$autocompleteInput = this.$autocomplete.find(SELECTORS.DOM_SELECTORS.AUTOCOMPLETE_INPUT);
        this.$autocompleteOutput = this.$autocomplete.find(SELECTORS.DOM_SELECTORS.AUTOCOMPLETE_OUTPUT);
        this.$autocompleteSpacer = this.$autocomplete.find(SELECTORS.DOM_SELECTORS.AUTOCOMPLETE_SPACER);
        this.$autocompleteSuggests = this.$autocomplete.find(SELECTORS.DOM_SELECTORS.AUTOCOMPLETE_SUGGESTS);

        this.commandTemplate = Handlebars.compile(AUTOCOMPLETE_COMMAND_TEMPLATE);
        this.argumentTemplate = Handlebars.compile(AUTOCOMPLETE_ARGUMENT_TEMPLATE);

        return this._setupHandlers()._fetchConfig();
    }

    /**
     * @for AutocompleteController
     * @method _setupHandlers
     * @chainable
     * @private
     */
    _setupHandlers() {
        this.onConfigFetchedHandler = this._onConfigFetched.bind(this);
        this.onAutocompleteInputChangeHandler = this._onAutocompleteInputChange.bind(this);
        this.onKeydownHandler = this._onKeydown.bind(this);
        this.onSuggestionClickHandler = this._onSuggestionClick.bind(this);

        return this;
    }

    /**
     * Fetch JSON config file
     *
     * @for AutocompleteController
     * @method _fetchConfig
     * @private
     */
    _fetchConfig() {
        $.getJSON('assets/autocomplete/commandAutocompleteConfig.json')
            .done((response) => this.onConfigFetchedHandler(response))
            .fail((jqXHR) => console.error(`Failed to load autocomplete configuration: ${jqXHR.status}: ${jqXHR.statusText}`));
    }

    /**
     * Ingest data fetched from JSON config
     *
     * @for AutocompleteController
     * @method _onConfigFetched
     * @private
     */
    _onConfigFetched(data) {
        this.commandDefs = data;

        for (const commandType in data) {
            this.lookup[commandType] = {};
            data[commandType].forEach((commandDef) => {
                // build lookup for fast access by command/alias
                commandDef.variants.forEach((variant) => {
                    variant.aliases.forEach((alias) => {
                        this.lookup[commandType][alias] = commandDef;
                    });
                });

                // setup regular expressions for parameter validation
                commandDef.paramsets.forEach((paramset) => {
                    paramset.candidate = this._buildRegexOrGroup(paramset.candidate, 'i');
                    paramset.validate = this._buildRegexOrGroup(paramset.validate, 'i');
                });
            });
        }

        this.enable();
        this.ready = true;
    }

    /**
     * Build a single regex or group of regexes for parameter validation
     *
     * @for AutocompleteController
     * @method _buildRegexOrGroup
     * @param regexStrs {string|Array<string>}
     * @param flags {string}
     * @private
     */
    _buildRegexOrGroup(regexStrs, flags) {
        if (_isArray(regexStrs)) {
            return new RegexGroup(regexStrs, flags);
        }

        return new RegExp(regexStrs, flags);
    }

    /**
     * Enable event handlers
     *
     * @for AutocompleteController
     * @method enable
     * @chainable
     */
    enable() {
        this.$autocompleteInput.on('input', this.onAutocompleteInputChangeHandler);

        return this;
    }

    /**
     * Disable all event handlers
     *
     * @for AutocompleteController
     * @method disable
     * @chainable
     */
    disable() {
        this.$autocompleteInput.off('input', this.onAutocompleteInputChangeHandler);

        return this;
    }

    /**
     * Destroy the instance
     *
     * @for AutocompleteController
     * @method destroy
     * @chainable
     */
    destroy() {
        this.$element = null;
        this.$autocomplete = null;
        this.$autocompleteInput = null;
        this.$autocompleteOutput = null;
        this.$autocompleteSpacer = null;
        this.$autocompleteSuggests = null;

        this.commandDefs = {};
        this.lookup = {};
        this.ready = false;

        this.initialRange = {};
        this.targetRange = {};

        return this;
    }

    /**
     * Update the current state of the autocomplete UI
     * The state is reflected as a class in the $autocomplete element
     * This determines which keyboard control prompts are displayed
     *
     * @for AutocompleteController
     * @method _updateState
     * @param newState {string}
     * @private
     */
    _updateState(newState) {
        if (this.state === newState) {
            return;
        }

        this.$autocomplete.removeClass(this.state);
        this.state = newState;
        this.$autocomplete.addClass(this.state);
    }

    /**
     * Grow autocomplete target range to encompass whole token to the left
     *
     * @for AutocompleteController
     * @method _growTargetRangeLeft
     * @param cmdstr {string}
     * @param targetRange {object}
     * @private
     */
    _growTargetRangeLeft(cmdstr, targetRange) {
        const reversePrefix = cmdstr.slice(0, targetRange.start).split('').reverse().join('');
        targetRange.start -= AUTOCOMPLETE_REGEXP.TOKEN_END.exec(reversePrefix).index + 1;
    }

    /**
     * Grow autocomplete target range to encompass whole token to the right
     *
     * @for AutocompleteController
     * @method _growTargetRangeRight
     * @param cmdstr {string}
     * @param targetRange {object}
     * @private
     */
    _growTargetRangeRight(cmdstr, targetRange) {
        targetRange.end += AUTOCOMPLETE_REGEXP.TOKEN_END.exec(cmdstr.slice(targetRange.end)).index + 1;
    }

    /**
     * Activate the autocomplete UI
     * Starts in command search and suggest mode
     *
     * @for AutocompleteController
     * @method activate
     */
    activate() {
        if (!this.ready) {
            return;
        }

        const cmdstr = this._inputController.$commandInput.val();
        // remember initial selection/cursor state, in case of reset
        this.initialRange = {
            start: this._inputController.$commandInput.prop('selectionStart'),
            end: this._inputController.$commandInput.prop('selectionEnd')
        };
        // target range of command input to ingest and replace
        this.targetRange = Object.assign({}, this.initialRange);

        // cursor/selection left boundary adjustment
        if (this.targetRange.start > 0) { // guarantees index (start - 1) is valid
            if (this.targetRange.start === this.targetRange.end) { // cursor
                if (!AUTOCOMPLETE_REGEXP.WHITESPACE.test(cmdstr.charAt(this.targetRange.start - 1))) {
                    // cursor at mid token or touching right edge of a token
                    this._growTargetRangeLeft(cmdstr, this.targetRange);
                }
            } else { // selection, guarantees index (start + 1) is valid
                const leftBoundary = cmdstr.slice(this.targetRange.start - 1, this.targetRange.start + 1);
                if (AUTOCOMPLETE_REGEXP.TOKEN_MID.test(leftBoundary)) {
                    // selection left boundary at mid token
                    this._growTargetRangeLeft(cmdstr, this.targetRange);
                } else if (AUTOCOMPLETE_REGEXP.TOKEN_END.exec(leftBoundary)?.index === 0) { // using test() gives spurious match
                    // selection left boundary touching right edge of a token
                    // exclude one space for UI aesthetics
                    this.targetRange.start += 1;
                }
            }
        }

        // cursor/selection right boundary adjustment
        if (this.targetRange.end < cmdstr.length && // guarantees index (end + 1) is valid
            this.targetRange.start < this.targetRange.end && // guarantees index (end - 1) is valid; cursor start already moved
            AUTOCOMPLETE_REGEXP.TOKEN_MID.test(cmdstr.slice(this.targetRange.end - 1, this.targetRange.end + 1))
        ) {
            // cursor/selection right boundary at mid token
            this._growTargetRangeRight(cmdstr, this.targetRange);
        }

        // find first token in whole command string, if any
        const { index: firstChar, 1: firstToken } = AUTOCOMPLETE_REGEXP.FIRST_TOKEN.exec(cmdstr) ?? {};

        // is the first token an aircraft callsign?
        const aircraft = this._aircraftController.findAircraftByCallsign(firstToken);

        // if (aircraft) {
        // TODO: if so, be clever and filter suggestions depending on departure/arrival and flight phase
        // }

        // may require additional space for correct positioning
        let extraPad = '';

        // determine command type to autocomplete
        if (firstChar === undefined) {
            // empty/blank command string
            this.commandType = AUTOCOMPLETE_COMMAND_TYPE.SYSTEM;
        } else if (this.targetRange.start <= firstChar) {
            // cursor/selection before or includes first token
            if (aircraft) {
                // first token is callsign, exclude it
                let startWithoutCallsign = firstChar + firstToken.length + 1;

                // callsign not guaranteed to be followed by whitespace, i.e. cmdstr may match ^\s*<callsign>$
                if (startWithoutCallsign > cmdstr.length) {
                    startWithoutCallsign = cmdstr.length;
                    extraPad = ' ';
                }

                this.targetRange.start = startWithoutCallsign;
                this.targetRange.end = Math.max(this.targetRange.start, this.targetRange.end);
                this.commandType = AUTOCOMPLETE_COMMAND_TYPE.TRANSMIT;
            } else {
                // first token is not callsign
                this.commandType = AUTOCOMPLETE_COMMAND_TYPE.SYSTEM;
            }
        } else {
            // cursor/selection outside first token
            this.commandType = AUTOCOMPLETE_COMMAND_TYPE.TRANSMIT;
        }

        this._updateState(AUTOCOMPLETE_STATE.COMMANDS.NO_MATCHES);
        this.$autocompleteSpacer.text(cmdstr.slice(0, this.targetRange.start).concat(extraPad));
        this.$autocompleteInput.val(cmdstr.slice(this.targetRange.start, this.targetRange.end));
        this.$autocompleteInput.attr('placeholder', AUTOCOMPLETE_INPUT_PLACEHOLDER.COMMAND);
        this.onAutocompleteInputChangeHandler();
        this.$autocomplete.addClass('active');
        this.$autocompleteInput.focus();
        this.active = true;
    }

    /**
     * Highlight previous suggested command
     *
     * @for AutocompleteController
     * @method highlightPrev
     */
    highlightPrev() {
        const $highlightOld = this.$autocompleteSuggests.find('tr.highlight');
        let $highlightNew = this.$autocompleteSuggests.find('tr').last();

        if ($highlightOld.length) {
            $highlightOld.removeClass('highlight');
            const $highlightOldPrev = $highlightOld.prev();

            if ($highlightOldPrev.length) {
                $highlightNew = $highlightOldPrev;
            }
        }

        $highlightNew.addClass('highlight');
        this.highlighted = $highlightNew.data('command');
        this._updateState(AUTOCOMPLETE_STATE.COMMANDS.HIGHLIGHT);
    }

    /**
     * Highlight next suggested command
     *
     * @for AutocompleteController
     * @method highlightNext
     */
    highlightNext() {
        const $highlightOld = this.$autocompleteSuggests.find('tr.highlight');
        let $highlightNew = this.$autocompleteSuggests.find('tr').first();

        if ($highlightOld.length) {
            $highlightOld.removeClass('highlight');
            const $highlightOldNext = $highlightOld.next();

            if ($highlightOldNext.length) {
                $highlightNew = $highlightOldNext;
            }
        }

        $highlightNew.addClass('highlight');
        this.highlighted = $highlightNew.data('command');
        this._updateState(AUTOCOMPLETE_STATE.COMMANDS.HIGHLIGHT);
    }

    /**
     * Quit out of the autocomplete UI while in
     * command search and suggest mode
     *
     * @for AutocompleteController
     * @method cancel
     */
    cancel() {
        this._inputController.$commandInput.prop('selectionStart', this.initialRange.start);
        this._inputController.$commandInput.prop('selectionEnd', this.initialRange.end);
        this._inputController.$commandInput.focus();

        this.initialRange = {};
        this.targetRange = {};
        this.highlighted = null;

        this.$autocomplete.removeClass();
        this.active = false;
    }

    /**
     * Select the specified suggested command
     * Proceed to parameter guidance and validation mode
     *
     * @for AutocompleteController
     * @method selectCommand
     * @param command {string}
     */
    selectCommand(command) {
        // for revert purposes
        this.inputRevert = this.$autocompleteInput.val();

        const out = `${command} `;
        this.$autocompleteOutput.val(out);
        this.$autocompleteOutput.attr('size', out.length);

        this.params = { command: command };
        this.params.paramsets = this.lookup[this.commandType][command].paramsets;

        this._updateState(AUTOCOMPLETE_STATE.PARAMS.INVALID);
        this.$autocompleteInput.val('');
        this.$autocompleteInput.attr('placeholder', AUTOCOMPLETE_INPUT_PLACEHOLDER.PARAM);
        this.onAutocompleteInputChangeHandler();
        this.$autocompleteInput.focus();
    }

    /**
     * Revert back to command search and suggest mode
     *
     * @for AutocompleteController
     * @method revert
     */
    revert() {
        this.$autocompleteOutput.val('');
        this.$autocompleteOutput.attr('size', 1);

        this._updateState(AUTOCOMPLETE_STATE.COMMANDS.HIGHLIGHT);
        this.$autocompleteInput.val(this.inputRevert);
        this.$autocompleteInput.attr('placeholder', AUTOCOMPLETE_INPUT_PLACEHOLDER.COMMAND);
        this.onAutocompleteInputChangeHandler();
        this.$autocompleteInput.focus();

        this.params = {};
        this.inputRevert = null;
    }

    /**
     * Commit a validated command to the command input
     * This completes the autocomplete process
     *
     * @for AutocompleteController
     * @method commit
     */
    commit() {
        let cmdstr = this._inputController.$commandInput.val();
        // consume whitespace immediately before start of target range
        const before = cmdstr.slice(0, this.targetRange.start).trimRight();
        // consume whitespace immediately after end of target range
        const after = cmdstr.slice(this.targetRange.end).trimLeft();

        let paramstr = this.$autocompleteInput.val().trim();

        if (paramstr.length) {
            paramstr = paramstr.replace(AUTOCOMPLETE_REGEXP.WHITESPACE, ' ').concat(' ');
        }

        cmdstr = before.concat((before.length > 0) ? ' ' : '', this.params.command, ' ', paramstr);
        this._inputController.$commandInput.val(cmdstr + after);
        this._inputController.$commandInput.prop('selectionStart', cmdstr.length);
        this._inputController.$commandInput.prop('selectionEnd', cmdstr.length);
        this._inputController.$commandInput.focus();

        this.initialRange = {};
        this.targetRange = {};
        this.highlighted = null;
        this.inputRevert = null;
        this.params = {};

        this.$autocomplete.removeClass();
        this.active = false;
    }

    /**
     * @for AutocompleteController
     * @method _onKeydown
     * @param event {jquery Event}
     * @private
     */
    _onKeydown(event) {
        let { code } = event.originalEvent;

        if (code == null) {
            // fallback for legacy browsers like IE/Edge
            code = event.originalEvent.keyCode;
        }

        switch (code) {
            // navigate through command suggestions
            case KEY_CODES.UP_ARROW:
            case LEGACY_KEY_CODES.UP_ARROW:
                event.preventDefault();

                if (this.state === AUTOCOMPLETE_STATE.COMMANDS.HIGHLIGHT || this.state === AUTOCOMPLETE_STATE.COMMANDS.MATCHES) {
                    this.highlightPrev();
                }

                break;
            case KEY_CODES.DOWN_ARROW:
            case LEGACY_KEY_CODES.DOWN_ARROW:
                event.preventDefault();

                if (this.state === AUTOCOMPLETE_STATE.COMMANDS.HIGHLIGHT || this.state === AUTOCOMPLETE_STATE.COMMANDS.MATCHES) {
                    this.highlightNext();
                }

                break;
            case KEY_CODES.TAB:
            case LEGACY_KEY_CODES.TAB:
                event.preventDefault();

                if (this.state === AUTOCOMPLETE_STATE.COMMANDS.HIGHLIGHT) {
                    // replace with selected suggestion (command or alias)
                    this.selectCommand(this.highlighted);
                } else if (this.state === AUTOCOMPLETE_STATE.PARAMS.VALID) {
                    // commit if valid command or alias + arguments
                    this.commit();
                }

                break;
            case KEY_CODES.ENTER:
            case KEY_CODES.NUM_ENTER:
            case LEGACY_KEY_CODES.ENTER:
                if (this.state === AUTOCOMPLETE_STATE.PARAMS.VALID) {
                    // shortcut to commit + submit immediately
                    this.commit();
                    this._inputController.processCommand();
                }

                break;
            // cancel / revert
            case KEY_CODES.ESCAPE:
            case LEGACY_KEY_CODES.ESCAPE:
                if (AUTOCOMPLETE_COMMAND_STATES.includes(this.state)) {
                    this.cancel();
                } else {
                    this.revert();
                }

                break;
            default:
                this.$autocompleteInput.focus();
        }
    }

    /**
     * @for AutocompleteController
     * @method _onSuggestionClick
     * @param event {jquery Event}
     */
    _onSuggestionClick(event) {
        if (event.which === MOUSE_EVENT_CODE.LEFT_PRESS) {
            const command = $(event.currentTarget).data('command');

            if (command) {
                this.highlighted = command; // for revert purposes
                this.selectCommand(command);
            }
        }
    }

    /**
     * @for AutocompleteController
     * @method _onAutocompleteInputChange
     * @private
     */
    _onAutocompleteInputChange() {
        const currentAutocompleteInputValue = this.$autocompleteInput.val();
        const inputLength = currentAutocompleteInputValue.length;
        this.$autocompleteInput.attr('size',
            (inputLength === 0 ? this.$autocompleteInput.attr('placeholder').length : inputLength));

        if (AUTOCOMPLETE_COMMAND_STATES.includes(this.state)) {
            this._matchCommands(currentAutocompleteInputValue.trim().toLowerCase());
        } else {
            this._validateArgs(currentAutocompleteInputValue.trim());
        }
    }

    /**
     * @for AutocompleteController
     * @method _matchCommands
     * @param prefix {string} Partial command typed by user into autocomplete input
     * @private
     */
    _matchCommands(prefix) {
        let matches = {};

        // empty / blank input:
        // transmit: force no results, otherwise _findCandidateCommands will return *everything*!
        //     TODO: provide smart suggestions based on aircraft category/flight phase?
        // system: go ahead and show all commands, there aren't that many
        if (prefix.length > 0 || this.commandType === AUTOCOMPLETE_COMMAND_TYPE.SYSTEM) {
            matches = this._findCandidateCommands(prefix);
        }

        this.$autocompleteSuggests.html(this.commandTemplate(matches));
        this.$autocompleteSuggests.find('tr').on('click', this.onSuggestionClickHandler);

        if (_isEmpty(matches)) {
            this._updateState(AUTOCOMPLETE_STATE.COMMANDS.NO_MATCHES);
        } else {
            // seek to retain highlight on previously highlighted entry if it still exists
            let findAndHighlight = this.state === AUTOCOMPLETE_STATE.COMMANDS.HIGHLIGHT;

            // pre-emptively highlight corresponding entry when input is exact match for a command or alias
            if (Object.keys(this.lookup[this.commandType]).includes(prefix)) {
                this.highlighted = prefix;
                findAndHighlight = true;
            }

            if (findAndHighlight) {
                const $highlight = this.$autocompleteSuggests.find(`tr[data-command="${this.highlighted}"]`);

                if ($highlight.length) {
                    $highlight.addClass('highlight');
                    this._updateState(AUTOCOMPLETE_STATE.COMMANDS.HIGHLIGHT);
                    return;
                }
            }

            this._updateState(AUTOCOMPLETE_STATE.COMMANDS.MATCHES);
        }

        this.highlighted = null;
    }

    /**
     * Take user input from autocomplete input (distinct from simulator command input) and
     * use it as a prefix to search for all potentially matching commands
     *
     * @for AutocompleteController
     * @method _findCandidateCommands
     * @param prefix {string} Partial command typed by user into autocomplete input
     * @private
     */
    _findCandidateCommands(prefix) {
        const matches = {};
        for (const command of this.commandDefs[this.commandType]) {
            for (const variant of command.variants) {
                /* eslint-disable max-len, no-multi-spaces */
                for (const alias of variant.aliases) {
                    if (alias.startsWith(prefix) &&
                        (typeof matches[command.id] === 'undefined' ||        // has not been matched yet
                        matches[command.id].direct === false ||               // has only been matched indirectly (altkey match)
                        alias.length < matches[command.id].command.length)) { // was matched directly for a longer variant of the command
                        matches[command.id] = { direct: true, command: alias, explanation: variant.explain };
                    }
                }

                // skip checking altkeys if there is already a direct hit for this commandDef
                // includes direct hit on previously seen variants, even if the current one isn't one
                if (typeof matches[command.id] !== 'undefined' && matches[command.id].direct === true) {
                    continue;
                }

                if (variant.altkeys.some((alt) => alt.startsWith(prefix))) {
                    const c = variant.aliases[0];

                    if (typeof matches[command.id] === 'undefined' ||    // has not been matched yet
                        c.length < matches[command.id].command.length) { // was matched indirectly for a longer variant of the command
                        matches[command.id] = { direct: false, command: c, explanation: variant.explain };
                    }
                }
            }
        }

        return matches;
    }


    /**
     * @for AutocompleteController
     * @method _validateArgs
     * @param paramstr {string} Partial argument string typed by user into autocomplete input
     * @private
     */
    _validateArgs(paramstr) {
        if (this.params.paramsets.length === 0) {
            if (paramstr.length === 0) {
                this.params.validity = AUTOCOMPLETE_PARAMS_VALIDITY.VALID;
                this._updateState(AUTOCOMPLETE_STATE.PARAMS.VALID);
            } else {
                this.params.validity = AUTOCOMPLETE_PARAMS_VALIDITY.INVALID;
                this._updateState(AUTOCOMPLETE_STATE.PARAMS.INVALID);
            }
        } else {
            this.params.paramsets.forEach((paramset) => {
                if (paramset.validate.test(paramstr)) {
                    paramset.validity = AUTOCOMPLETE_PARAMS_VALIDITY.VALID;
                } else if (paramset.candidate.test(paramstr)) {
                    paramset.validity = AUTOCOMPLETE_PARAMS_VALIDITY.CANDIDATE;
                } else {
                    paramset.validity = AUTOCOMPLETE_PARAMS_VALIDITY.INVALID;
                }
            });
            if (this.params.paramsets.some((paramset) => paramset.validity === AUTOCOMPLETE_PARAMS_VALIDITY.VALID)) {
                this._updateState(AUTOCOMPLETE_STATE.PARAMS.VALID);
            } else {
                this._updateState(AUTOCOMPLETE_STATE.PARAMS.INVALID);
            }
        }
        this.$autocompleteSuggests.html(this.argumentTemplate(this.params));
    }
}
