/* eslint-disable max-len */
import $ from 'jquery';
import AircraftCommander from './aircraft/AircraftCommander';
import AircraftController from './aircraft/AircraftController';
import AirlineController from './airline/AirlineController';
import AirportController from './airport/AirportController';
import AirportGuideViewController from './airportGuide/AirportGuideViewController';
import CanvasController from './canvas/CanvasController';
import AirportInfoController from './info/AirportInfoController';
import ChangelogController from './changelog/ChangelogController';
import ContentQueue from './contentQueue/ContentQueue';
import EventTracker from './EventTracker';
import GameController from './game/GameController';
import InputController from './InputController';
import EventBus from './lib/EventBus';
import LoadingView from './LoadingView';
import NavigationLibrary from './navigationLibrary/NavigationLibrary';
import ScopeModel from './scope/ScopeModel';
import SpawnPatternCollection from './trafficGenerator/SpawnPatternCollection';
import SpawnScheduler from './trafficGenerator/SpawnScheduler';
import UiController from './ui/UiController';
import ScoreController from './game/ScoreController';
import { speech_init } from './speech';
import { EVENT } from './constants/eventNames';
import { SELECTORS } from './constants/selectors';
import { TRACKABLE_EVENT } from './constants/trackableEvents';

/**
 * Root controller class
 *
 * Responsible for instantiating child classes
 * Provides public API used by `App` that is used to fire lifecycle methods
 * in each of the children classes.
 *
 * @class AppController
 */
export default class AppController {
    /**
     * @constructor
     * @param element {jQuery|HTML Element}
     */
    constructor(element) {
        /**
         * Root DOM element.
         *
         * @property $element
         * @type {jQuery|HTML Element}
         * @default body
         */
        this.$element = $(element);

        this.$canvasesElement = null;
        this._eventBus = EventBus;
        this.loadingView = null;
        this.contentQueue = null;
        this.airlineCollection = null;
        this.aircraftCommander = null;
        this.airportGuideController = null;
        this.inputController = null;
        this.canvasController = null;
        this.changelogController = null;

        return this._init()
            .setupHandlers()
            .enable();
    }

    /**
     * @for AppController
     * @method _init
     * @chainable
     * @private
     */
    _init() {
        return this;
    }

    /**
     * Create and bind handler methods
     *
     * @for AppController
     * @method setupHandlers
     * @chainable
     */
    setupHandlers() {
        this.onAirportChangeHandler = this.onAirportChange.bind(this);

        return this;
    }

    /**
     * @for AppController
     * @method enable
     * @chainable
     */
    enable() {
        this._eventBus.on(EVENT.AIRPORT_CHANGE, this.onAirportChangeHandler);

        return this;
    }

    /**
     * @for AppController
     * @method destroy
     * @chainable
     */
    disable() {
        this._eventBus.off(EVENT.AIRPORT_CHANGE, this.onAirportChangeHandler);

        return this.destroy();
    }

    /**
     * @for AppController
     * @method destroy
     * @chainable
     */
    destroy() {
        // TODO: add static class.destroy() here
        this.$element = null;
        this.$canvasesElement = null;
        this._eventBus = null;
        this.loadingView = null;
        this.contentQueue = null;
        this.airlineCollection = null;
        this.aircraftCommander = null;
        this.airportGuideController = null;
        this.inputController = null;
        this.canvasController = null;

        return this;
    }

    /**
     * Create child instances and initialize singletons.
     *
     * Called from `App.setupChildren()` only after all the required data has been retrieved
     * This method will be called
     *
     * @for AppController
     * @method setupChildren
     * @param airportLoadList {array<object>}
     * @param initialAirportIcao {string}
     * @param initialAirportData {object}
     * @param airlineList {array<object>}
     * @param aircraftTypeDefinitionList {array<object>}
     * @param airportGuideData {object}
     */
    setupChildren(
        airportLoadList,
        initialAirportIcao,
        initialAirportData,
        airlineList,
        aircraftTypeDefinitionList,
        airportGuideData
    ) {
        EventTracker.recordEvent(TRACKABLE_EVENT.AIRPORTS, 'initial-load', initialAirportIcao);

        this.$canvasesElement = this.$element.find(SELECTORS.DOM_SELECTORS.CANVASES);

        // TODO: this entire method needs to be re-written. this is a temporary implemenation used to
        // get things working in a more cohesive manner. soon, all this instantiation should happen
        // in a different class and the window methods should disappear.
        this.loadingView = new LoadingView();
        this.contentQueue = new ContentQueue(this.loadingView);
        zlsa.atc.loadAsset = (options) => this.contentQueue.add(options);

        // IMPORTANT:
        // The order in which the following classes are instantiated is extremely important. Changing
        // this order could break a lot of things. This interdependency is something we should
        // work on reducing in the future.
        AirportController.init(initialAirportIcao, initialAirportData, airportLoadList);
        NavigationLibrary.init(initialAirportData);
        SpawnPatternCollection.init(initialAirportData);

        this.airlineController = new AirlineController(airlineList);
        this.scopeModel = new ScopeModel();
        this.aircraftController = new AircraftController(aircraftTypeDefinitionList, this.airlineController, this.scopeModel);
        this.scoreController = new ScoreController(this.aircraftController);

        SpawnScheduler.init(this.aircraftController);

        // TEMPORARY!
        // some instances are attached to the window here as an intermediate step away from global functions.
        // this allows for any module file to call window.{module}.{method} and will make the transition to
        // explicit instance parameters easier.
        window.aircraftController = this.aircraftController;

        UiController.init(this.$element);

        this.canvasController = new CanvasController(this.$canvasesElement, this.aircraftController, this.scopeModel);
        this.aircraftCommander = new AircraftCommander(this.aircraftController, this.aircraftController.onRequestToChangeTransponderCode);
        this.inputController = new InputController(this.$element, this.aircraftCommander, this.aircraftController, this.scopeModel);
        this.airportInfoController = new AirportInfoController(this.$element);
        this.airportGuideController = new AirportGuideViewController(this.$element, airportGuideData, initialAirportData.icao);
        this.changelogController = new ChangelogController(this.contentQueue);

        this.updateViewControls();
    }

    /**
     * @for AppController
     * @method init_pre
     */
    init_pre() {
        GameController.init_pre();
        this.inputController.input_init_pre();
    }

    /**
     * @for AppController
     * @method init
     */
    init() {
        speech_init();

        this.canvasController.canvas_init();
        UiController.ui_init();
    }

    /**
     * @for AppController
     * @method done
     */
    done() {}

    /**
     * @for AppController
     * @method resize
     */
    resize() {
        this.canvasController.canvas_resize();
    }

    /**
     * @for AppController
     * @method complete
     */
    complete() {
        this.loadingView.complete();
        GameController.complete();
        this.canvasController.canvas_complete();
        UiController.ui_complete();
    }

    /**
     * @for AppController
     * @method updatePre
     */
    updatePre() {
        this.airportInfoController.updateClock();
        GameController.update_pre();
        this.aircraftController.update();
    }

    /**
     * @for AppController
     * @method update
     */
    update() {}

    /**
     * @for AppController
     * @method updatePost
     */
    updatePost() {
        this.canvasController.canvasUpdatePost();
        this.aircraftController.updateAircraftStrips();
    }


    /**
     * `onChange` callback fired from within the `AirportModel` when an airport is changed.
     *
     * When an airport changes various classes need to clear and reset internal properties for
     * the new airport. this callback provides a way to orchestrate all that and send the classes
     * new data.
     *
     * This method will not run on initial load.
     *
     * @for App
     * @method onAirportChange
     * @param nextAirportJson {object}  response or cached object from airport json
     */
    onAirportChange(nextAirportJson) {
        if (!AirportController.current) {
            // if `current` is null, then this is the initial load and we dont need to reset andything
            return;
        }

        EventTracker.recordEvent(TRACKABLE_EVENT.AIRPORTS, 'airport-switcher', nextAirportJson.icao);
        NavigationLibrary.reset();
        this.airlineController.reset();
        this.aircraftController.aircraft_remove_all();
        this.scopeModel.radarTargetCollection.reset();
        SpawnPatternCollection.reset();
        GameController.destroyTimers();

        NavigationLibrary.init(nextAirportJson);
        SpawnPatternCollection.init(nextAirportJson);
        SpawnScheduler.startScheduler();

        this.updateViewControls();
    }

    // TODO: this should live in a view class somewhere. temporary inclusion here to prevent tests from failing
    // due to jQuery and because this does not belong in the `AirportModel`
    /**
     * Update visibility of icons at the bottom of the view that allow toggling of
     * certain view elements.
     *
     * Abstracted from `AirportModel`
     *
     * @for App
     * @method updateViewControls
     */
    updateViewControls() {
        const { current: airport } = AirportController;

        this._eventBus.trigger(EVENT.MARK_SHALLOW_RENDER);

        $(SELECTORS.DOM_SELECTORS.TOGGLE_RESTRICTED_AREAS).toggle((airport.restricted_areas || []).length > 0);
        $(SELECTORS.DOM_SELECTORS.TOGGLE_SIDS).toggle(NavigationLibrary.hasSids);
        $(SELECTORS.DOM_SELECTORS.TOGGLE_TERRAIN).toggle(airport.data.has_terrain);
    }
}
