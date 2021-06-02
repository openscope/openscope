import $ from 'jquery';
import _keys from 'lodash/keys';
import AirportController from '../airport/AirportController';
import EventBus from '../lib/EventBus';
import EventTracker from '../EventTracker';
import GameController from '../game/GameController';
import SettingsController from './SettingsController';
import TrafficRateController from './TrafficRateController';
import TutorialView from './TutorialView';
import { speech_toggle } from '../speech';
import { EVENT } from '../constants/eventNames';
import { SELECTORS } from '../constants/selectors';
import { TRACKABLE_EVENT } from '../constants/trackableEvents';

/**
 * Listens for events that occur in the UI and delegates work to the correct place
 *
 * @class UiController
 */
class UiController {
    /**
     * @constructor
     */
    constructor() {
        /**
         * Local reference to `EventBus` singleton
         *
         * @for UiController
         * @property _eventBus
         * @type {EventBus}
         * @default null
         */
        this._eventBus = null;

        /**
         * @for UiController
         * @property tutorialView
         * @type {TutorialView}
         * @default null
         */
        this.tutorialView = null;

        /**
         * @for UiController
         * @property settingsController
         * @type {SettingsController}
         * @default null
         */
        this.settingsController = null;

        /**
         * @for UiController
         * @property trafficRateController
         * @type {TrafficRateController}
         * @default null
         */
        this.trafficRateController = null;

        /**
         * Root element used to find all other DOM elements needed by this class
         *
         * @for UiController
         * @property $element
         * @type {Jquery|Element}
         * @default null
         */
        this.$element = null;

        /**
         * Element of the airport selection dialog
         *
         * @for UiController
         * @property $airportDialog
         * @type {Jquery|Element}
         * @default null
         */
        this.$airportDialog = null;

        /**
         * Element of the body of the airport selection dialog
         *
         * @for UiController
         * @property $airportDialogBody
         * @type {Jquery|Element}
         * @default null
         */
        this.$airportDialogBody = null;

        /**
         * Element of the airport guide dialog
         *
         * @for UiController
         * @property $airportGuideDialog
         * @type {Jquery|Element}
         * @default null
         */
        this.$airportGuideDialog = null;


        /**
         * Element of the airport search bar
         *
         * @for UiController
         * @property $airportSearch
         * @type {Jquery|Element}
         * @default null
         */
        this.$airportSearch = null;

        /**
         * Element of the changelog dialog
         *
         * @for UiController
         * @property $changelogDialog
         * @type {Jquery|Element}
         * @default null
         */
        this.$changelogDialog = null;

        /**
         * Footer button element used to toggle fast-forward mode on/off
         *
         * @for UiController
         * @property $fastForwards
         * @type {Jquery|Element}
         * @default null
         */
        this.$fastForwards = null;

        /**
         * Footer button element which opens the openScope github page in a new tab
         *
         * @for UiController
         * @property $githubLinkElement
         * @type {Jquery|Element}
         * @default null
         */
        this.$githubLinkElement = null;

        /**
         * Element displaying log of readbacks and other messages
         *
         * @for UiController
         * @property $log
         * @type {Jquery|Element}
         * @default null
         */
        this.$log = null;

        /**
         * Element in center of screen to unpause when paused
         *
         * @for UiController
         * @property $pausedImg
         * @type {Jquery|Element}
         * @default null
         */
        this.$pausedImg = null;

        /**
         * Footer button element used to toggle the airport selection dialog on/off
         *
         * @for UiController
         * @property $switchAirport
         * @type {Jquery|Element}
         * @default null
         */
        this.$switchAirport = null;

        /**
         * Footer button element used to toggle the airport guide on/off
         *
         * @for UiController
         * @property $toggleAirportGuide
         * @type {Jquery|Element}
         * @default null
         */
        this.$toggleAirportGuide = null;

        /**
         * Footer button element used to toggle airspace on/off
         *
         * @for UiController
         * @property $toggleAirspace
         * @type {Jquery|Element}
         * @default null
         */
        this.$toggleAirspace = null;

        /**
         * Footer button element used to toggle the changelog on/off
         *
         * @for UiController
         * @property $toggleChangelog
         * @type {Jquery|Element}
         * @default null
         */
        this.$toggleChangelog = null;

        /**
         * Footer button element used to toggle fix and runway labels on/off
         *
         * @for UiController
         * @property $toggleLabels
         * @type {Jquery|Element}
         * @default null
         */
        this.$toggleLabels = null;

        /**
         * Footer button element used to toggle the options menu on/off
         *
         * @for UiController
         * @property $toggleOptions
         * @type {Jquery|Element}
         * @default null
         */
        this.$toggleOptions = null;

        /**
         * Footer button element used to pause when the sim is running
         *
         * @for UiController
         * @property $togglePause
         * @type {Jquery|Element}
         * @default null
         */
        this.$togglePause = null;

        /**
         * Footer button element used to toggle restricted areas on/off
         *
         * @for UiController
         * @property $toggleRestrictedAreas
         * @type {Jquery|Element}
         * @default null
         */
        this.$toggleRestrictedAreas = null;

        /**
         * Footer button element used to toggle SIDs on/off
         *
         * @for UiController
         * @property $toggleSids
         * @type {Jquery|Element}
         * @default null
         */
        this.$toggleSids = null;

        /**
         * Footer button element used to toggle speech synthesis on/off
         *
         * @for UiController
         * @property $toggleSpeech
         * @type {Jquery|Element}
         * @default null
         */
        this.$toggleSpeech = null;

        /**
         * Footer button element used to toggle STARs on/off
         *
         * @for UiController
         * @property $toggleStars
         * @type {Jquery|Element}
         * @default null
         */
        this.$toggleStars = null;

        /**
         * Footer button element used to toggle terrain on/off
         *
         * @for UiController
         * @property $toggleTerrain
         * @type {Jquery|Element}
         * @default null
         */
        this.$toggleTerrain = null;

        /**
         * Footer button element used to toggle the traffic rate menu on/off
         *
         * @for UiController
         * @property $toggleTraffic
         * @type {Jquery|Element}
         * @default null
         */
        this.$toggleTraffic = null;

        /**
         * Footer button element used to toggle the tutorial on/off
         *
         * @for UiController
         * @property $toggleTutorial
         * @type {Jquery|Element}
         * @default null
         */
        this.$toggleTutorial = null;

        /**
         * Footer button element used to toggle the video map on/off
         *
         * @for UiController
         * @property $toggleVideoMap
         * @type {Jquery|Element}
         * @default null
         */
        this.$toggleVideoMap = null;

        /**
         * Element of the tutorial dialog
         *
         * @for UiController
         * @property $tutorialDialog
         * @type {Jquery|Element}
         * @default null
         */
        this.$tutorialDialog = null;
    }

    /**
     * Initialization method
     *
     * Called from the `AppController` after instantiation of the `AircraftController`
     *
     * @for UiController
     * @method init
     * @param $element {jQuery Element}
     */
    init($element) {
        this._eventBus = EventBus;
        this.tutorialView = new TutorialView($element);
        this.settingsController = new SettingsController($element);
        this.trafficRateController = new TrafficRateController($element);

        this.$element = $element;
        this.$airportDialog = this.$element.find(SELECTORS.DOM_SELECTORS.AIRPORT_SWITCH);
        this.$airportDialogBody = this.$airportDialog.find(SELECTORS.DOM_SELECTORS.DIALOG_BODY);
        this.$airportGuideDialog = this.$element.find(SELECTORS.DOM_SELECTORS.AIRPORT_GUIDE_CONTAINER);
        this.$airportSearch = this.$element.find(SELECTORS.DOM_SELECTORS.AIRPORT_SEARCH);
        this.$changelogDialog = this.$element.find(SELECTORS.DOM_SELECTORS.CHANGELOG_CONTAINER);
        this.$fastForwards = this.$element.find(SELECTORS.DOM_SELECTORS.FAST_FORWARDS);
        this.$githubLinkElement = this.$element.find(SELECTORS.DOM_SELECTORS.GITHUB_EXTERNAL_LINK);
        this.$log = this.$element.find(SELECTORS.DOM_SELECTORS.LOG);
        this.$pausedImg = this.$element.find(`${SELECTORS.DOM_SELECTORS.PAUSED} img`);
        this.$switchAirport = this.$element.find(SELECTORS.DOM_SELECTORS.SWITCH_AIRPORT);
        this.$toggleAirportGuide = this.$element.find(SELECTORS.DOM_SELECTORS.TOGGLE_AIRPORT_GUIDE);
        this.$toggleAirspace = this.$element.find(SELECTORS.DOM_SELECTORS.TOGGLE_AIRSPACE);
        this.$toggleChangelog = this.$element.find(SELECTORS.DOM_SELECTORS.TOGGLE_CHANGELOG);
        this.$toggleLabels = this.$element.find(SELECTORS.DOM_SELECTORS.TOGGLE_LABELS);
        this.$toggleOptions = this.$element.find(SELECTORS.DOM_SELECTORS.TOGGLE_OPTIONS);
        this.$togglePause = this.$element.find(SELECTORS.DOM_SELECTORS.TOGGLE_PAUSE);
        this.$toggleRestrictedAreas = this.$element.find(SELECTORS.DOM_SELECTORS.TOGGLE_RESTRICTED_AREAS);
        this.$toggleSids = this.$element.find(SELECTORS.DOM_SELECTORS.TOGGLE_SIDS);
        this.$toggleSpeech = this.$element.find(SELECTORS.DOM_SELECTORS.TOGGLE_SPEECH);
        this.$toggleStars = this.$element.find(SELECTORS.DOM_SELECTORS.TOGGLE_STARS);
        this.$toggleTerrain = this.$element.find(SELECTORS.DOM_SELECTORS.TOGGLE_TERRAIN);
        this.$toggleTraffic = this.$element.find(SELECTORS.DOM_SELECTORS.TOGGLE_TRAFFIC);
        this.$toggleTutorial = this.$element.find(SELECTORS.DOM_SELECTORS.TOGGLE_TUTORIAL);
        this.$toggleVideoMap = this.$element.find(SELECTORS.DOM_SELECTORS.TOGGLE_VIDEO_MAP);
        this.$tutorialDialog = this.$element.find(SELECTORS.DOM_SELECTORS.TUTORIAL);

        return this.setupHandlers()
            .enable();
    }

    /**
     * @for UiController
     * @method setupHandlers
     * @chainable
     */
    setupHandlers() {
        this.onAirportChangeHandler = this.onAirportChange.bind(this);

        return this;
    }

    /**
     * Enable event handlers
     *
     * @for UiController
     * @method enable
     * @chainable
     */
    enable() {
        this._eventBus.on(EVENT.AIRPORT_CHANGE, this.onAirportChangeHandler);

        // TODO: move these to properly bound handler methods

        // using keyup here because the search is based on the contents of the search bar
        this.$airportSearch.on('keyup', (event) => this._onInitiateAirportSearch(event));
        this.$fastForwards.on('click', (event) => GameController.game_timewarp_toggle(event));
        this.$githubLinkElement.on('click', (event) => this.onClickGithubLink(event));
        this.$pausedImg.on('click', (event) => GameController.game_unpause(event));
        this.$switchAirport.on('click', (event) => this.onToggleAirportList(event));
        this.$toggleAirportGuide.on('click', (event) => this.onToggleAirportGuide(event));
        this.$toggleAirspace.on('click', (event) => this.onToggleAirspace(event));
        this.$toggleChangelog.on('click', (event) => this.onToggleChangelog(event));
        this.$toggleLabels.on('click', (event) => this.onToggleLabels(event));
        this.$toggleOptions.on('click', (event) => this.onToggleOptions(event));
        this.$togglePause.on('click', (event) => GameController.game_pause_toggle(event));
        this.$toggleRestrictedAreas.on('click', (event) => this.onToggleRestrictedAreas(event));
        this.$toggleSids.on('click', (event) => this.onToggleSids(event));
        this.$toggleSpeech.on('click', (event) => speech_toggle(event));
        this.$toggleStars.on('click', (event) => this.onToggleStars(event));
        this.$toggleTerrain.on('click', (event) => this.onToggleTerrain(event));
        this.$toggleTraffic.on('click', (event) => this.onToggleTraffic(event));
        this.$toggleTutorial.on('click', (event) => this.onToggleTutorial(event));
        this.$toggleVideoMap.on('click', (event) => this.onToggleVideoMap(event));

        return this;
    }

    /**
     * Disable event handlers
     *
     * @for UiController
     * @method disable
     * @chainable
     */
    disable() {
        this._eventBus.off(EVENT.AIRPORT_CHANGE, this.onAirportChangeHandler);
        this.$airportSearch.off('keyup', (event) => this._onInitiateAirportSearch(event));
        this.$fastForwards.off('click', (event) => GameController.game_timewarp_toggle(event));
        this.$githubLinkElement.off('click', (event) => this.onClickGithubLink(event));
        this.$pausedImg.off('click', (event) => GameController.game_unpause(event));
        this.$switchAirport.off('click', (event) => this.onToggleAirportList(event));
        this.$toggleAirportGuide.off('click', (event) => this.onToggleAirportGuide(event));
        this.$toggleAirspace.off('click', (event) => this.onToggleAirspace(event));
        this.$toggleChangelog.off('click', (event) => this.onToggleChangelog(event));
        this.$toggleLabels.off('click', (event) => this.onToggleLabels(event));
        this.$toggleOptions.off('click', (event) => this.onToggleOptions(event));
        this.$togglePause.off('click', (event) => GameController.game_pause_toggle(event));
        this.$toggleRestrictedAreas.off('click', (event) => this.onToggleRestrictedAreas(event));
        this.$toggleSids.off('click', (event) => this.onToggleSids(event));
        this.$toggleSpeech.off('click', (event) => speech_toggle(event));
        this.$toggleStars.off('click', (event) => this.onToggleStars(event));
        this.$toggleTerrain.off('click', (event) => this.onToggleTerrain(event));
        this.$toggleTraffic.off('click', (event) => this.onToggleTraffic(event));
        this.$toggleTutorial.off('click', (event) => this.onToggleTutorial(event));
        this.$toggleVideoMap.off('click', (event) => this.onToggleVideoMap(event));

        return this();
    }

    /**
     * Reset the instance
     *
     * @for UiController
     * @method reset
     */
    reset() {
        this.disable();

        this._eventBus = null;
        this.tutorialView = null;
        this.settingsController = null;
        this.trafficRateController = null;

        this.$element = null;
        this.$airportDialog = null;
        this.$airportDialogBody = null;
        this.$airportGuideDialog = null;
        this.$airportSearch = null;
        this.$changelogDialog = null;
        this.$fastForwards = null;
        this.$githubLinkElement = null;
        this.$log = null;
        this.$pausedImg = null;
        this.$switchAirport = null;
        this.$toggleAirportGuide = null;
        this.$toggleAirspace = null;
        this.$toggleChangelog = null;
        this.$toggleLabels = null;
        this.$toggleOptions = null;
        this.$togglePause = null;
        this.$toggleRestrictedAreas = null;
        this.$toggleSids = null;
        this.$toggleSpeech = null;
        this.$toggleStars = null;
        this.$toggleTerrain = null;
        this.$toggleTraffic = null;
        this.$toggleTutorial = null;
        this.$toggleVideoMap = null;
        this.$tutorialDialog = null;

        return this;
    }

    /**
     * @for uiController
     * @method ui_init
     */
    ui_init() {
        this.tutorialView.tutorial_init_pre();
        this.$fastForwards.prop('title', 'Set time warp to 2');
    }

    /**
     * @for UiController
     * @method ui_complete
     */
    ui_complete() {
        this._buildAirportList();
    }

    /**
     * @for UiController
     * @method ui_log
     */
    ui_log(message, warn = false) {
        const html = $(`<span class="item"><span class="message">${message}</span></span>`);

        if (warn) {
            html.addClass(SELECTORS.CLASSNAMES.WARN);
            EventTracker.recordEvent(TRACKABLE_EVENT.UI_LOG, 'error', message);
        }

        this.$log.append(html);
        this.$log.scrollTop(this.$log.get(0).scrollHeight);

        GameController.game_timeout((uiLogView) => {
            uiLogView.addClass(SELECTORS.CLASSNAMES.HIDDEN);

            setTimeout(() => {
                uiLogView.remove();
            }, 10000);
        }, 3, window, html);
    }

    /**
     * @for UiController
     * @method onAirportChange
     */
    onAirportChange() {
        this.$log.empty();
    }

    /**
     * Close all open dialogs and return focus to the command bar
     *
     * @for UiController
     * @method closeAllDialogs
     */
    closeAllDialogs() {
        if (this.isAirportGuideDialogOpen()) {
            this.onToggleAirportGuide();
        }

        if (this.isAirportSelectionDialogOpen()) {
            this.onToggleAirportList();
        }

        if (this.isChangelogDialogOpen()) {
            this.onToggleChangelog();
        }

        if (this.settingsController.isDialogOpen()) {
            this.onToggleOptions();
        }

        if (this.trafficRateController.isDialogOpen()) {
            this.onToggleTraffic();
        }

        if (this.isTutorialDialogOpen()) {
            this.onToggleTutorial();
        }
    }

    /**
     * Returns whether the airport guide dialog is open
     *
     * @for UiController
     * @method isAirportGuideDialogOpen
     * @return {boolean}
     */
    isAirportGuideDialogOpen() {
        return this.$airportGuideDialog.hasClass(SELECTORS.CLASSNAMES.OPEN);
    }

    /**
     * Returns whether the airport selection dialog is open
     *
     * @for UiController
     * @method isAirportSelectionDialogOpen
     * @return {boolean}
     */
    isAirportSelectionDialogOpen() {
        return this.$airportDialog.hasClass(SELECTORS.CLASSNAMES.OPEN);
    }

    /**
     * Returns whether the changelog dialog is open
     *
     * @for UiController
     * @method isChangelogDialogOpen
     * @return {boolean}
     */
    isChangelogDialogOpen() {
        return this.$changelogDialog.hasClass(SELECTORS.CLASSNAMES.OPEN);
    }

    /**
     * Returns whether the tutorial dialog is open
     *
     * @for UiController
     * @method isTutorialDialogOpen
     * @return {boolean}
     */
    isTutorialDialogOpen() {
        return this.$tutorialDialog.hasClass(SELECTORS.CLASSNAMES.OPEN);
    }

    /**
     * @for uiController
     * @method onClickAirportListItemHandler
     * @paam event {jquery event}
     */
    onClickAirportListItemHandler(event) {
        if (event.data !== AirportController.airport_get().icao) {
            AirportController.airport_set(event.data);
            this._onClickCloseAirportDialog();
        }
    }

    /**
     * Loop through each airport defined in the `AirportController` and build
     * a list item that can be appended to the #airport-list element.
     *
     * @for UiController
     * @method _buildAirportList
     * @private
     */
    _buildAirportList() {
        // clear out the contents of this element
        this.$airportDialogBody.empty();

        const airports = _keys(AirportController.airports).sort();
        let difficulty = '';

        for (let i = 0; i < airports.length; i++) {
            const { name, icao, level } = AirportController.airports[airports[i]];

            difficulty = this._buildAirportListIconForDifficultyLevel(level);
            const $airportListItem = $(this._buildAirportListItemTemplate(icao, difficulty, name));

            // TODO: replace with an onClick() handler
            $airportListItem.click(icao.toLowerCase(), (event) => {
                if (event.data !== AirportController.airport_get().icao) {
                    AirportController.airport_set(event.data);

                    this._onClickCloseAirportDialog();
                }
            });

            this.$airportDialogBody.append($airportListItem);
        }
    }

    /**
     * Given a `difficultyLevel`, create a string with the correct icon char code
     * that can be used in the airport list
     *
     * @for UiController
     * @method _buildAirportListIconForDifficultyLevel
     * @param difficultyLevel {string}
     * @return difficulty {string}
     * @private
     */
    _buildAirportListIconForDifficultyLevel(difficultyLevel) {
        let difficulty;
        const icon = '&#9992;';

        switch (difficultyLevel) {
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

        return difficulty;
    }

    /**
     * @for uiController
     * @method _buildAirportListItemTemplate
     * @param icao {string}
     * @param difficulty {string}
     * @param name {string}
     * @return {DOM element|string}
     */
    _buildAirportListItemTemplate(icao, difficulty, name) {
        return `
            <li class="airport-list-item" data-icao="${icao.toLowerCase()}">
                <span style="font-size: 7pt" class="difficulty">${difficulty}</span>
                <span class="icao">${icao.toUpperCase()}</span>
                <span class="name">${name}</span>
            </li>
        `;
    }

    /**
     * @for UiController
     * @method _onClickOpenAirportDialog
     */

    _onClickOpenAirportDialog() {
        EventTracker.recordEvent(TRACKABLE_EVENT.AIRPORTS, 'airport-switcher', 'open');
        this.$airportDialog.addClass(SELECTORS.CLASSNAMES.OPEN);

        const $previousActiveAirport = this.$airportDialogBody.find(SELECTORS.DOM_SELECTORS.AIRPORT_LIST_ITEM_IS_ACTIVE);

        // Remove the active class from a no-longer-selected airport in the list.
        if ($previousActiveAirport.length !== 0) {
            $previousActiveAirport.removeClass(SELECTORS.CLASSNAMES.AIRPORT_LIST_ITEM_IS_ACTIVE);
        }

        const icao = AirportController.airport_get().icao.toLowerCase();
        this.$airportDialogBody.find(`li[data-icao="${icao}"]`).addClass(SELECTORS.CLASSNAMES.AIRPORT_LIST_ITEM_IS_ACTIVE);

        this.$switchAirport.addClass(SELECTORS.CLASSNAMES.ACTIVE);
    }


    /**
     * @for UiController
     * @method _onInitiateAirportSearch
     */
    _onInitiateAirportSearch() {
        EventTracker.recordEvent(TRACKABLE_EVENT.AIRPORTS, 'airport-search', 'start');

        const value = this.$airportSearch.val().toLowerCase();

        $('.dialog-body li').each(
            function() {
                $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
            }
        );
    }

    /**
     * @for UiController
     * @method _onClickCloseAirportDialog
     * @private
     */
    _onClickCloseAirportDialog() {
        EventTracker.recordEvent(TRACKABLE_EVENT.AIRPORTS, 'airport-switcher', 'close');
        this.$airportDialog.removeClass(SELECTORS.CLASSNAMES.OPEN);
        this.$switchAirport.removeClass(SELECTORS.CLASSNAMES.ACTIVE);
        this.$airportSearch.val(null);
        $('.dialog-body li').each(() => $(this).toggle(true));
    }

    /**
     * @for UiController
     * @method onToggleAirportList
     */
    onToggleAirportList() {
        if (this.$airportDialog.hasClass(SELECTORS.CLASSNAMES.OPEN)) {
            this._onClickCloseAirportDialog();

            return;
        }

        this._onClickOpenAirportDialog();
    }

    /**
     * @for UiController
     * @method onToggleAirportGuide
     */
    onToggleAirportGuide() {
        this.$toggleAirportGuide.toggleClass(SELECTORS.CLASSNAMES.ACTIVE);
        EventTracker.recordEvent(
            TRACKABLE_EVENT.OPTIONS,
            'airport-guide',
            `airport-guide:${this.$toggleAirportGuide.hasClass(SELECTORS.CLASSNAMES.ACTIVE)}`
        );
        this._eventBus.trigger(EVENT.TOGGLE_AIRPORT_GUIDE);
    }

    /**
     * @for UiController
     * @method onToggleAirspace
     * @param event {jquery event}
     */
    onToggleAirspace(event) {
        this.$toggleAirspace.toggleClass(SELECTORS.CLASSNAMES.ACTIVE);
        EventTracker.recordEvent(
            TRACKABLE_EVENT.OPTIONS,
            'airspace',
            `${this.$toggleAirspace.hasClass(SELECTORS.CLASSNAMES.ACTIVE)}`
        );
        this._eventBus.trigger(EVENT.TOGGLE_AIRSPACE);
    }

    /**
     * @for UiController
     * @method onToggleChangelog
     */
    onToggleChangelog() {
        this._eventBus.trigger(EVENT.TOGGLE_CHANGELOG);
    }

    /**
     * @for UiController
     * @method onToggleLabels
     * @param {jquery event}
     */
    onToggleLabels(event) {
        this.$toggleLabels.toggleClass(SELECTORS.CLASSNAMES.ACTIVE);
        EventTracker.recordEvent(
            TRACKABLE_EVENT.OPTIONS,
            'fix-runway-labels',
            `${this.$toggleLabels.hasClass(SELECTORS.CLASSNAMES.ACTIVE)}`
        );
        this._eventBus.trigger(EVENT.TOGGLE_LABELS);
    }

    /**
    * @for UiController
    * @method onToggleOptions
    */
    onToggleOptions() {
        this.$toggleOptions.toggleClass(SELECTORS.CLASSNAMES.ACTIVE);
        EventTracker.recordEvent(
            TRACKABLE_EVENT.SETTINGS,
            'toggle-dialog',
            `${this.$toggleOptions.hasClass(SELECTORS.CLASSNAMES.ACTIVE)}`
        );
        this.settingsController.toggleDialog();
    }

    /**
     * @for UiController
     * @method onToggleRestrictedAreas
     */
    onToggleRestrictedAreas(event) {
        this.$toggleRestrictedAreas.toggleClass(`${SELECTORS.DOM_SELECTORS.WARNING_BUTTON} ${SELECTORS.CLASSNAMES.ACTIVE}`);
        EventTracker.recordEvent(
            TRACKABLE_EVENT.OPTIONS,
            'restricted',
            `${this.$toggleRestrictedAreas.hasClass(SELECTORS.CLASSNAMES.ACTIVE)}`
        );
        this._eventBus.trigger(EVENT.TOGGLE_RESTRICTED_AREAS);
    }

    /**
     * @for UiController
     * @method onToggleSids
     * @param event {jquery event}
     */
    onToggleSids(event) {
        this.$toggleSids.toggleClass(SELECTORS.CLASSNAMES.ACTIVE);
        EventTracker.recordEvent(
            TRACKABLE_EVENT.OPTIONS,
            'sids',
            `${this.$toggleSids.hasClass(SELECTORS.CLASSNAMES.ACTIVE)}`
        );
        this._eventBus.trigger(EVENT.TOGGLE_SID_MAP);
    }

    /**
     * @for UiController
     * @method onToggleStars
     * @param event {jquery event}
     */
    onToggleStars(event) {
        this.$toggleStars.toggleClass(SELECTORS.CLASSNAMES.ACTIVE);
        EventTracker.recordEvent(
            TRACKABLE_EVENT.OPTIONS,
            'stars',
            `${this.$toggleStars.hasClass(SELECTORS.CLASSNAMES.ACTIVE)}`
        );
        this._eventBus.trigger(EVENT.TOGGLE_STAR_MAP);
    }

    /**
     * @for UiController
     * @method onToggleTerrain
     * @param event {jquery event}
     */
    onToggleTerrain(event) {
        this.$toggleTerrain.toggleClass(SELECTORS.CLASSNAMES.ACTIVE);
        EventTracker.recordEvent(
            TRACKABLE_EVENT.OPTIONS,
            'terrain',
            `${this.$toggleTerrain.hasClass(SELECTORS.CLASSNAMES.ACTIVE)}`
        );
        this._eventBus.trigger(EVENT.TOGGLE_TERRAIN);
    }

    /**
     * Handler for toggling the traffic volume view
     *
     * @for UiController
     * @method onToggleTraffic
     * @param event {jquery event}
     */
    onToggleTraffic(event) {
        this.$toggleTraffic.toggleClass(SELECTORS.CLASSNAMES.ACTIVE);
        EventTracker.recordEvent(
            TRACKABLE_EVENT.OPTIONS,
            'traffic',
            `${this.$toggleTraffic.hasClass(SELECTORS.CLASSNAMES.ACTIVE)}`
        );
        this.trafficRateController.toggleDialog();
    }

    /**
    * @for UiController
    * @method onToggleTutorial
    * @param event {jquery event}
    */
    onToggleTutorial(event) {
        this._eventBus.trigger(EVENT.TOGGLE_TUTORIAL);
        EventTracker.recordEvent(
            TRACKABLE_EVENT.OPTIONS,
            'tutorial',
            `${this.$toggleTutorial.hasClass(SELECTORS.CLASSNAMES.ACTIVE)}`
        );
    }

    /**
     * @for UiController
     * @method onToggleVideoMap
     * @param event {jquery event}
     */
    onToggleVideoMap(event) {
        this.$toggleVideoMap.toggleClass(SELECTORS.CLASSNAMES.ACTIVE);
        EventTracker.recordEvent(
            TRACKABLE_EVENT.OPTIONS,
            'video-map',
            `${this.$toggleVideoMap.hasClass(SELECTORS.CLASSNAMES.ACTIVE)}`
        );
        this._eventBus.trigger(EVENT.TOGGLE_VIDEO_MAP);
    }

    /**
     * Provides a hook to track a click event for ga
     *
     * @for UiController
     * @method onClickGithubLink
     * @param event {jquery event}
     */
    onClickGithubLink(event) {
        EventTracker.recordClickOnOutboundLink(event.target.href);
    }
}

export default new UiController();
