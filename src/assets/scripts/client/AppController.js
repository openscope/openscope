/* eslint-disable max-len */
import $ from 'jquery';
import _isEmpty from 'lodash/isEmpty';
import _isNil from 'lodash/isNil';
import EventBus from './lib/EventBus';
import ContentQueue from './contentQueue/ContentQueue';
import LoadingView from './LoadingView';
import AirportController from './airport/AirportController';
import NavigationLibrary from './navigationLibrary/NavigationLibrary';
import AircraftController from './aircraft/AircraftController';
import AirlineController from './airline/AirlineController';
import SpawnPatternCollection from './trafficGenerator/SpawnPatternCollection';
import SpawnScheduler from './trafficGenerator/SpawnScheduler';
import GameController from './game/GameController';
import TutorialView from './tutorial/TutorialView';
import AircraftCommander from './aircraft/AircraftCommander';
import InputController from './InputController';
import UiController from './UiController';
import CanvasController from './canvas/CanvasController';
import GameClockView from './game/GameClockView';
import { speech_init } from './speech';
import { EVENT } from './constants/eventNames';
import { SELECTORS } from './constants/selectors';

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
        this.eventBus = EventBus;
        this.loadingView = null;
        this.contentQueue = null;
        this.airlineCollection = null;
        this.tutorialView = null;
        this.aircraftCommander = null;
        this.inputController = null;
        this.canvasController = null;

        return this._init()
            .enable();
    }

    /**
     *
     * @for AppController
     * @method _init
     * @chainable
     * @private
     */
    _init() {
        return this;
    }

    /**
     * @for AppController
     * @method enable
     * @chainable
     */
    enable() {
        this.eventBus.on(EVENT.AIRPORT_CHANGE, this.onAirportChange);

        return this;
    }

    /**
     * @for AppController
     * @method destroy
     * @chainable
     */
    disable() {
        return this;
    }

    /**
     * @for AppController
     * @method destroy
     * @chainable
     */
    destroy() {
        // TODO: add static class.destroy() here

        this.$element = null;
        this.eventBus = null;
        this.loadingView = null;
        this.contentQueue = null;
        this.airlineCollection = null;
        this.tutorialView = null;
        this.aircraftCommander = null;
        this.inputController = null;
        this.canvasController = null;

        return this;
    }

    /**
     *
     *
     * @for AppController
     * @method setupChildren
     * @param airportLoadList {array<object>}
     * @param initialAirportData {object}
     * @param airlineList {array<object>}
     * @param aircraftTypeDefinitionList {array<object>}
     */
    setupChildren(airportLoadList, initialAirportData, airlineList, aircraftTypeDefinitionList) {
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
        AirportController.init(initialAirportData, airportLoadList);

        this.navigationLibrary = new NavigationLibrary(initialAirportData);
        this.airlineController = new AirlineController(airlineList);
        this.aircraftController = new AircraftController(aircraftTypeDefinitionList, this.airlineController, this.navigationLibrary);
        // TEMPORARY!
        // some instances are attached to the window here as an intermediate step away from global functions.
        // this allows for any module file to call window.{module}.{method} and will make the transition to
        // explicit instance parameters easier.
        window.aircraftController = this.aircraftController;

        UiController.init(this.$element);

        this.spawnPatternCollection = new SpawnPatternCollection(initialAirportData, this.navigationLibrary);
        this.spawnScheduler = new SpawnScheduler(this.spawnPatternCollection, this.aircraftController);
        this.canvasController = new CanvasController(this.$element, this.navigationLibrary);
        this.tutorialView = new TutorialView(this.$element);
        this.aircraftCommander = new AircraftCommander(this.navigationLibrary, this.aircraftController.onRequestToChangeTransponderCode);
        this.inputController = new InputController(this.$element, this.aircraftCommander, this.aircraftController, this.tutorialView);
        this.gameClockView = new GameClockView(this.$element);

        this.updateViewControls();
    }

    /**
     * @for AppController
     * @method init_pre
     */
    init_pre(getDeltaTime) {
        GameController.init_pre(getDeltaTime);
        this.tutorialView.tutorial_init_pre();
        this.inputController.input_init_pre();
        this.canvasController.canvas_init_pre();
        UiController.ui_init_pre();
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
    resize = () => {
        this.canvasController.canvas_resize();
    };

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
        this.gameClockView.update();
        GameController.update_pre();
        this.aircraftController.aircraft_update();
    }

    /**
     * @for AppController
     * @method updatePost
     */
    updatePost() {
        this.canvasController.canvas_update_post();
        this.aircraftController.updateAircraftStrips();
    }

    /**
     * @for AppController
     * @method update
     */
    update() {}

    /**
     * onChange callback fired from within the `AirportModel` when an airport is changed.
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
    onAirportChange = (nextAirportJson) => {
        if (!AirportController.current) {
            // if `current` is null, then this is the initial load and we dont need to reset andything
            return;
        }

        this.navigationLibrary.reset();
        this.airlineController.reset();
        this.aircraftController.aircraft_remove_all();
        this.spawnPatternCollection.reset();
        GameController.destroyTimers();
        this.spawnScheduler = null;

        this.navigationLibrary.init(nextAirportJson);
        this.spawnPatternCollection.init(nextAirportJson, this.navigationLibrary);
        this.spawnScheduler = new SpawnScheduler(
            this.spawnPatternCollection,
            this.aircraftController
        );

        this.updateViewControls();
    };

    // TODO: this should live in a view class somewhere. temporary inclusion here to prevent tests from failing
    // due to jQuery and because this does not belong in the `AirportModel`
    /**
     * Update visibility of icons at the bottom of the view that allow toggling of
     * certain view elements.
     *
     * Abstrcated from `AirportModel`
     *
     * @for App
     * @method updateViewControls
     */
    updateViewControls() {
        const { current: airport } = AirportController;

        this.canvasController.canvas.draw_labels = true;
        this.canvasController.canvas.dirty = true;

        $(SELECTORS.DOM_SELECTORS.TOGGLE_LABELS).toggle(!_isEmpty(airport.maps));
        $(SELECTORS.DOM_SELECTORS.TOGGLE_RESTRICTED_AREAS).toggle((airport.restricted_areas || []).length > 0);
        $(SELECTORS.DOM_SELECTORS.TOGGLE_SIDS).toggle(!_isNil(this.navigationLibrary.sidCollection));
        $(SELECTORS.DOM_SELECTORS.TOGGLE_TERRAIN).toggle(airport.data.has_terrain);
    }
}
