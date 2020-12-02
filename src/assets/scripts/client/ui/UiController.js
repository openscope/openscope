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
         * Element of the airport guide dialog
         *
         * @for UiController
         * @property $changelogDialog
         * @type {Jquery|Element}
         * @default null
         */
        this.$changelogDialog = null;

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
         * Element in center of screen to unpause when paused
         *
         * @for UiController
         * @property $pausedImg
         * @type {Jquery|Element}
         * @default null
         */
        this.$pausedImg = null;

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
         * Footer button element used to toggle speech synthesis on/off
         *
         * @for UiController
         * @property $toggleSpeech
         * @type {Jquery|Element}
         * @default null
         */
        this.$toggleSpeech = null;

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
         * Footer button element used to toggle the airport guide on/off
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
         * Footer button element used to toggle the tutoral on/off
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
         * Footer button element used as a hook to
         * activate/show option
         *
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
        this.$changelogDialog = this.$element.find(SELECTORS.DOM_SELECTORS.CHANGELOG_CONTAINER);
        this.$tutorialDialog = this.$element.find(SELECTORS.DOM_SELECTORS.TUTORIAL);
        this.$fastForwards = this.$element.find(SELECTORS.DOM_SELECTORS.FAST_FORWARDS);
        this.$githubLinkElement = this.$element.find(SELECTORS.DOM_SELECTORS.GITHUB_EXTERNAL_LINK);
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
        this.$toggleTutorial = this.$element.find(SELECTORS.DOM_SELECTORS.TOGGLE_TUTORIAL);
        this.$toggleVideoMap = this.$element.find(SELECTORS.DOM_SELECTORS.TOGGLE_VIDEO_MAP);
        this.$toggleTraffic = this.$element.find(SELECTORS.DOM_SELECTORS.TOGGLE_TRAFFIC);

        return this.setupHandlers()
            .enable();
    }

    /**
     * @for UiController
     * @method setupHandlers
     * @chainable
     */
    setupHandlers() {
        return this;
    }

    /**
     * Enable event handlers
     *
     * should be run only once on instantiation
     *
     * @for UiController
     * @method enable
     */
    enable() {
        // TODO: move these to properly bound handler methods
        this.$fastForwards.on('click', (event) => GameController.game_timewarp_toggle(event));
        this.$githubLinkElement.on('click', (event) => this.onClickGithubLink(event));
        this.$pausedImg.on('click', (event) => GameController.game_unpause(event));
        this.$switchAirport.on('click', (event) => this.onToggleAirportList(event));
        this.$toggleAirportGuide.on('click', (event) => this.onToggleAirportGuide(event));
        this.$toggleAirspace.on('click', (event) => this.onToggleAirspace(event));
        this.$toggleChangelog.on('click', (event) => this.onToggleChangelog(event));
        this.$toggleLabels.on('click', (event) => this.onToggleLabels(event));
        this.$togglePause.on('click', (event) => GameController.game_pause_toggle(event));
        this.$toggleRestrictedAreas.on('click', (event) => this.onToggleRestrictedAreas(event));
        this.$toggleSids.on('click', (event) => this.onToggleSids(event));
        this.$toggleSpeech.on('click', (event) => speech_toggle(event));
        this.$toggleStars.on('click', (event) => this.onToggleStars(event));
        this.$toggleTerrain.on('click', (event) => this.onToggleTerrain(event));
        this.$toggleTutorial.on('click', (event) => this.onToggleTutorial(event));
        this.$toggleOptions.on('click', (event) => this.onToggleOptions(event));
        this.$toggleVideoMap.on('click', (event) => this.onToggleVideoMap(event));
        this.$toggleTraffic.on('click', (event) => this.onToggleTraffic(event));

        return this;
    }

    /**
     * Disable event handlers
     *
     * @for UiController
     * @method disable
     */
    disable() {
        this.$fastForwards.off('click', (event) => GameController.game_timewarp_toggle(event));
        this.$githubLinkElement.off('click', (event) => this.onClickGithubLink(event));
        this.$pausedImg.off('click', (event) => GameController.game_unpause(event));
        this.$switchAirport.off('click', (event) => this.onToggleAirportList(event));
        this.$toggleAirportGuide.off('click', (event) => this.onToggleAirportGuide(event));
        this.$toggleAirspace.off('click', (event) => this.onToggleAirspace(event));
        this.$toggleChangelog.off('click', (event) => this.onToggleChangelog(event));
        this.$toggleLabels.off('click', (event) => this.onToggleLabels(event));
        this.$togglePause.off('click', (event) => GameController.game_pause_toggle(event));
        this.$toggleRestrictedAreas.off('click', (event) => this.onToggleRestrictedAreas(event));
        this.$toggleSids.off('click', (event) => this.onToggleSids(event));
        this.$toggleSpeech.off('click', (event) => speech_toggle(event));
        this.$toggleStars.off('click', (event) => this.onToggleStars(event));
        this.$toggleTerrain.off('click', (event) => this.onToggleTerrain(event));
        this.$toggleTutorial.off('click', (event) => this.onToggleTutorial(event));
        this.$toggleOptions.off('click', (event) => this.onToggleOptions(event));
        this.$toggleVideoMap.off('click', (event) => this.onToggleVideoMap(event));
        this.$toggleTraffic.off('click', (event) => this.onToggleTraffic(event));

        return this.destroy();
    }

    /**
     * Tear down the instance
     *
     * @for UiController
     * @method destroy
     */
    destroy() {
        this._eventBus = null;
        this.tutorialView = null;
        this.settingsController = null;

        this.$element = null;
        this.$airportDialog = null;
        this.$airportDialogBody = null;
        this.$airportGuideDialog = null;
        this.$changelogDialog = null;
        this.$tutorialDialog = null;
        this.$fastForwards = null;
        this.$githubLinkElement = null;
        this.$pausedImg = null;
        this.$switchAirport = null;
        this.$toggleAirportGuide = null;
        this.$toggleChangelog = null;
        this.$toggleLabels = null;
        this.$toggleOptions = null;
        this.$togglePause = null;
        this.$toggleRestrictedAreas = null;
        this.$toggleSids = null;
        this.$toggleSpeech = null;
        this.$toggleStars = null;
        this.$toggleTerrain = null;
        this.$toggleTutorial = null;
        this.$toggleVideoMap = null;
        this.$onToggleTraffic = null;

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
     * Close all open dialogs and return focus to the command bar
     *
     * @for UiController
     * @method closeAllDialogs
     */
    closeAllDialogs() {
        if (this.isTutorialDialogOpen()) {
            this.tutorialView.tutorial_close();
        }

        if (this.settingsController.isDialogOpen()) {
            this.onToggleOptions();
        }

        if (this.trafficRateController.isDialogOpen()) {
            this.onToggleTraffic();
        }

        if (this.isAirportSelectionDialogOpen()) {
            this.onToggleAirportList();
        }

        if (this.isAirportGuideDialogOpen()) {
            this.onToggleAirportGuide();
        }

        if (this.isChangelogDialogOpen()) {
            this.onToggleChangelog();
        }
    }

    isChangelogDialogOpen() {
        return this.$changelogDialog.hasClass(SELECTORS.CLASSNAMES.OPEN);
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
     * @for UiController
     * @method ui_complete
     */
    ui_complete() {
        this._buildAirportList();
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
            <li class="airport-list-item icao-${icao.toLowerCase()}">
                <span style="font-size: 7pt" class="difficulty">${difficulty}</span>
                <span class="icao">${icao.toUpperCase()}</span>
                <span class="name">${name}</span>
            </li>
        `;
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

        const $log = $(SELECTORS.DOM_SELECTORS.LOG);
        $log.append(html);
        $log.scrollTop($log.get(0).scrollHeight);

        GameController.game_timeout((uiLogView) => {
            uiLogView.addClass(SELECTORS.CLASSNAMES.HIDDEN);

            setTimeout(() => {
                uiLogView.remove();
            }, 10000);
        }, 3, window, html);
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
        $(`.icao-${icao}`).addClass(SELECTORS.CLASSNAMES.AIRPORT_LIST_ITEM_IS_ACTIVE);

        this.$switchAirport.addClass(SELECTORS.CLASSNAMES.ACTIVE);
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
        const labelButtonElement = $(SELECTORS.DOM_SELECTORS.TOGGLE_AIRPORT_GUIDE);

        EventTracker.recordEvent(TRACKABLE_EVENT.OPTIONS,
            'airport-guide',
            `airport-guide:${labelButtonElement.hasClass(SELECTORS.CLASSNAMES.ACTIVE)}`);
        labelButtonElement.toggleClass(SELECTORS.CLASSNAMES.ACTIVE);
        this._eventBus.trigger(EVENT.TOGGLE_AIRPORT_GUIDE);
    }

    /**
     * @for UiController
     * @method onToggleAirspace
     * @param event {jquery event}
     */
    onToggleAirspace(event) {
        const $airspaceButtonElement = $(event.target).closest(SELECTORS.DOM_SELECTORS.CONTROL);

        $airspaceButtonElement.toggleClass(SELECTORS.CLASSNAMES.ACTIVE);
        EventTracker.recordEvent(
            TRACKABLE_EVENT.OPTIONS,
            'airspace',
            `${$airspaceButtonElement.hasClass(SELECTORS.CLASSNAMES.ACTIVE)}`
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
        const labelButtonElement = $(event.target).closest(SELECTORS.DOM_SELECTORS.CONTROL);

        EventTracker.recordEvent(
            TRACKABLE_EVENT.OPTIONS,
            'fix-runway-labels',
            `${labelButtonElement.hasClass(SELECTORS.CLASSNAMES.ACTIVE)}`
        );
        labelButtonElement.toggleClass(SELECTORS.CLASSNAMES.ACTIVE);
        this._eventBus.trigger(EVENT.TOGGLE_LABELS);
    }

    /**
     * @for UiController
     * @method onToggleRestrictedAreas
     */
    onToggleRestrictedAreas(event) {
        const restrictedButtonElement = $(event.target).closest(SELECTORS.DOM_SELECTORS.CONTROL);

        restrictedButtonElement.toggleClass(`${SELECTORS.DOM_SELECTORS.WARNING_BUTTON} ${SELECTORS.CLASSNAMES.ACTIVE}`);
        EventTracker.recordEvent(
            TRACKABLE_EVENT.OPTIONS,
            'restricted',
            `${restrictedButtonElement.hasClass(SELECTORS.CLASSNAMES.ACTIVE)}`
        );
        this._eventBus.trigger(EVENT.TOGGLE_RESTRICTED_AREAS);
    }

    /**
    * @for UiController
    * @method onToggleOptions
    */
    onToggleOptions() {
        EventTracker.recordEvent(
            TRACKABLE_EVENT.SETTINGS,
            'toggle-dialog',
            `${this.$toggleOptions.hasClass(SELECTORS.CLASSNAMES.ACTIVE)}`
        );
        this.$toggleOptions.toggleClass(SELECTORS.CLASSNAMES.ACTIVE);
        this.settingsController.toggleDialog();
    }

    /**
     * @for UiController
     * @method onToggleSids
     * @param event {jquery event}
     */
    onToggleSids(event) {
        const $sisdButtonElement = $(event.target).closest(SELECTORS.DOM_SELECTORS.CONTROL);

        $sisdButtonElement.toggleClass(SELECTORS.CLASSNAMES.ACTIVE);
        EventTracker.recordEvent(TRACKABLE_EVENT.OPTIONS, 'sids', `${$sisdButtonElement.hasClass(SELECTORS.CLASSNAMES.ACTIVE)}`);
        this._eventBus.trigger(EVENT.TOGGLE_SID_MAP);
    }

    /**
     * @for UiController
     * @method onToggleStars
     * @param event {jquery event}
     */
    onToggleStars(event) {
        const $starsButtonElement = $(event.target).closest(SELECTORS.DOM_SELECTORS.CONTROL);

        $starsButtonElement.toggleClass(SELECTORS.CLASSNAMES.ACTIVE);
        EventTracker.recordEvent(
            TRACKABLE_EVENT.OPTIONS,
            'stars',
            `${$starsButtonElement.hasClass(SELECTORS.CLASSNAMES.ACTIVE)}`
        );
        this._eventBus.trigger(EVENT.TOGGLE_STAR_MAP);
    }

    /**
     * @for UiController
     * @method onToggleTerrain
     * @param event {jquery event}
     */
    onToggleTerrain(event) {
        const $terrainButtonElement = $(event.target).closest(SELECTORS.DOM_SELECTORS.CONTROL);

        $terrainButtonElement.toggleClass(SELECTORS.CLASSNAMES.ACTIVE);
        EventTracker.recordEvent(
            TRACKABLE_EVENT.OPTIONS,
            'terrain',
            `${$terrainButtonElement.hasClass(SELECTORS.CLASSNAMES.ACTIVE)}`
        );
        this._eventBus.trigger(EVENT.TOGGLE_TERRAIN);
    }

    /**
    * @for UiController
    * @method onToggleTutorial
    * @param event {jquery event}
    */
    onToggleTutorial(event) {
        EventTracker.recordEvent(
            TRACKABLE_EVENT.OPTIONS,
            'tutorial'
        );
        this._eventBus.trigger(EVENT.TOGGLE_TUTORIAL);
    }

    /**
     * @for UiController
     * @method onToggleVideoMap
     * @param event {jquery event}
     */
    onToggleVideoMap(event) {
        const $videoMapButtonElement = $(event.target).closest(SELECTORS.DOM_SELECTORS.CONTROL);

        $videoMapButtonElement.toggleClass(SELECTORS.CLASSNAMES.ACTIVE);
        EventTracker.recordEvent(
            TRACKABLE_EVENT.OPTIONS,
            'video-map',
            `${$videoMapButtonElement.hasClass(SELECTORS.CLASSNAMES.ACTIVE)}`
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

    /**
     * Handler for toggling the traffic volume view
     *
     * @for UiController
     * @method onToggleTraffic
     * @param event {jquery event}
     */
    onToggleTraffic(event) {
        EventTracker.recordEvent(
            TRACKABLE_EVENT.OPTIONS,
            'traffic',
            `${!this.$toggleTraffic.hasClass(SELECTORS.CLASSNAMES.ACTIVE)}`
        );
        this.$toggleTraffic.toggleClass(SELECTORS.CLASSNAMES.ACTIVE);
        this.trafficRateController.toggleDialog();
    }
}

export default new UiController();
