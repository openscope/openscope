/* eslint-disable max-len */
import $ from 'jquery';
import _isEmpty from 'lodash/isEmpty';
import _isNil from 'lodash/isNil';
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
import { time, calculateDeltaTime } from './utilities/timeHelpers';
import { SELECTORS } from './constants/selectors';
import { LOG } from './constants/logLevel';

window.zlsa = {};
window.zlsa.atc = {};
const prop = {};

// IIEFs are pulled in here to add functions to the global space.
//
// This will need to be re-worked, and current global functions should be exported and
// imported as needed in each file.
require('./util');

// saved as this.prop.version and this.prop.version_string
const VERSION = [5, 0, 0];

// are you using a main loop? (you must call update() afterward disable/re-enable)
let UPDATE = true;

// the framerate is updated this often (seconds)
const FRAME_DELAY = 1;

// is this a release build?
const RELEASE = false;

/**
 * @class App
 */
export default class App {
    /**
     * @for App
     * @constructor
     * @param $element {HTML Element|null}
     * @param airportLoadList {array<object>}  List of airports to load
     * @param initialAirportToLoad {string}    ICAO id of the initial airport. may be the default or a stored airport
     */
    constructor(element, airportLoadList, initialAirportToLoad) {
        /**
         * Root DOM element.
         *
         * @property $element
         * @type {jQuery|HTML Element}
         * @default body
         */
        this.$element = $(element);
        this.loadingView = null;
        this.contentQueue = null;
        this.airlineCollection = null;
        this.airportController = null;
        this.tutorialView = null;
        this.aircraftCommander = null;
        this.inputController = null;
        this.uiController = null;
        this.canvasController = null;

        window.prop = prop;

        this.prop = prop;
        this.prop.complete = false;
        this.prop.temp = 'nothing here';
        this.prop.version = VERSION;
        this.prop.version_string = `v${VERSION.join('.')}`;
        this.prop.time = {};
        this.prop.time.start = time();
        this.prop.time.frames = 0;
        this.prop.time.frame = {};
        this.prop.time.frame.start = time();
        this.prop.time.frame.delay = FRAME_DELAY;
        this.prop.time.frame.count = 0;
        this.prop.time.frame.last = time();
        this.prop.time.frame.delta = 0;
        this.prop.time.fps = 0;
        this.prop.log = LOG.DEBUG;
        this.prop.loaded = false;

        if (RELEASE) {
            this.prop.log = LOG.WARNING;
        }

        return this.initiateDataLoad(airportLoadList, initialAirportToLoad);
    }

    /**
     * Lifecycle method. Should be called only once on initialization.
     *
     * Used to load an initial data set from several sources.
     *
     * @for App
     * @method setupChildren
     * @param airportLoadList {array<object>}  List of airports to load
     */
    initiateDataLoad(airportLoadList, initialAirportToLoad) {
        // This is provides a way to get async data from several sources in the app before anything else runs
        // TODO: this is wrong. move this and make it less bad!
        $.when(
            $.getJSON(`assets/airports/${initialAirportToLoad.toLowerCase()}.json`),
            $.getJSON('assets/airlines/airlines.json'),
            $.getJSON('assets/aircraft/aircraft.json')
        )
            .done((airportResponse, airlineResponse, aircraftResponse) => {
                this.setupChildren(
                    airportLoadList,
                    airportResponse[0],
                    airlineResponse[0].airlines,
                    aircraftResponse[0].aircraft
                );
                this.enable();
            })
            .fail((jqXHR, textStatus, errorThrown) => {
                console.error(textStatus);
            });

        return this;
    }

    /**
     * Callback for a successful data load
     *
     * An first load of data occurs on startup where we load the initial airport, airline definitions and
     * aircraft definitiions. this method is called onComplete of that data load and is used to
     * instantiate various classes with the loaded data.
     *
     * This method should run only on initial load of the app.
     *
     * @for App
     * @method setupChildren
     * @param airportLoadList {array}         List of all airports
     * @param initialAirportData {object}     Airport json for the initial airport, could be default or stored airport
     * @param airlineList {array}             List of all Airline definitions
     * @param aircraftTypeDefinitionList {array}  List of all Aircraft definitions
     */
    setupChildren(airportLoadList, initialAirportData, airlineList, aircraftTypeDefinitionList) {
        // TODO: this entire method needs to be re-written. this is a temporary implemenation used to
        // get things working in a more cohesive manner. soon, all this instantiation should happen
        // in a different class and the window methods should disappear.
        zlsa.atc.loadAsset = (options) => this.contentQueue.add(options);

        // IMPORTANT:
        // The order in which the following classes are instantiated is extremely important. Changing
        // this order could break a lot of things. This interdependency is something we should
        // work on reducing in the future.

        this.loadingView = new LoadingView();
        this.contentQueue = new ContentQueue(this.loadingView);
        this.gameController = new GameController(this.getDeltaTime);
        // TODO: Temporary
        window.gameController = this.gameController;

        this.airportController = new AirportController(initialAirportData, airportLoadList, this.updateRun, this.onAirportChange);
        // TODO: Temporary
        window.airportController = this.airportController;

        this.navigationLibrary = new NavigationLibrary(initialAirportData);
        this.airlineController = new AirlineController(airlineList);
        this.aircraftController = new AircraftController(aircraftTypeDefinitionList, this.airlineController, this.navigationLibrary);
        // TODO: Temporary
        window.aircraftController = this.aircraftController;

        this.spawnPatternCollection = new SpawnPatternCollection(initialAirportData, this.navigationLibrary, this.airportController);
        this.spawnScheduler = new SpawnScheduler(this.spawnPatternCollection, this.aircraftController, this.gameController);
        this.canvasController = new CanvasController(this.$element, this.navigationLibrary);
        this.tutorialView = new TutorialView(this.$element);
        this.uiController = new UiController(this.$element);
        this.aircraftCommander = new AircraftCommander(this.airportController, this.navigationLibrary, this.gameController, this.uiController);
        this.inputController = new InputController(this.$element, this.aircraftCommander);
        this.gameClockView = new GameClockView(this.$element);

        this.updateViewControls();
    }

    /**
     * Lifecycle method. Should be called only once on initialization.
     *
     * Used to fire off `init` and `init_pre` methods and also start the game loop
     *
     * @for App
     * @method enable
     */
    enable() {
        // TEMPORARY!
        // these instances are attached to the window here as an intermediate step away from global functions.
        // this allows for any module file to call window.{module}.{method} and will make the transition to
        // explicit instance parameters easier.
        // window.airlineController = this.airlineController;
        window.tutorialView = this.tutorialView;
        window.inputController = this.inputController;
        window.uiController = this.uiController;
        // window.canvasController = this.canvasController;

        log(`Version ${this.prop.version_string}`);

        return this.init_pre()
                   .init()
                   .done();
    }

    /**
     * @for App
     * @method disable
     */
    disable() {
        return this.destroy();
    }

    /**
     * Tear down the application
     *
     * Should never be called directly, only cia `this.disable()`
     *
     * @for App
     * @method destroy
     */
    destroy() {
        this.$element = null;
        this.contentQueue = null;
        this.loadingView = null;
        this.airlineCollection = null;
        this.airportController = null;
        this.gameController = null;
        this.tutorialView = null;
        this.aircraftCommander = null;
        this.inputController = null;
        this.uiController = null;
        this.canvasController = null;

        return this;
    }

    // === CALLBACKS (all optional and do not need to be defined) ===
    // INIT:
    // module_init_pre()
    // module_init()
    // module_init_post()

    // module_done()
    // -- wait until all async has finished (could take a long time)
    // module_ready()
    // -- wait until first frame is ready (only triggered if UPDATE == true)
    // module_complete()

    // UPDATE:
    // module_update_pre()
    // module_update()
    // module_update_post()

    // RESIZE (called at least once during init and whenever page changes size)
    // module_resize()

    /**
     * @for App
     * @method init_pre
     */
    init_pre() {
        this.tutorialView.tutorial_init_pre();
        this.gameController.init_pre();
        this.inputController.input_init_pre();
        this.canvasController.canvas_init_pre();
        this.uiController.ui_init_pre();

        return this;
    }

    /**
     * @for App
     * @method init
     */
    init() {
        speech_init();

        this.canvasController.canvas_init();
        this.uiController.ui_init();

        return this;
    }

    /**
     * @for App
     * @method init_post
     */
    init_post() {
        return this;
    }

    /**
     * @for App
     * @method done
     */
    done() {
        $(window).resize(this.resize);
        this.resize();

        this.prop.loaded = true;

        this.ready();

        if (UPDATE) {
            requestAnimationFrame(() => this.update());
        }


        return this;
    }

    /**
     * @for App
     * @method ready
     */
    ready() {
        return this;
    }

    /**
     * @for App
     * @method resize
     */
    resize = () => {
        this.canvasController.canvas_resize();
    };

    /**
     * @for App
     * @method complete
     */
    complete() {
        this.gameController.complete();
        this.canvasController.canvas_complete();
        this.uiController.ui_complete();

        return this;
    }

    /**
     * @for App
     * @method updatePre
     */
    updatePre() {
        this.gameController.update_pre();

        return this;
    }

    /**
     * @for App
     * @method updatePost
     */
    updatePost() {
        this.canvasController.canvas_update_post();

        return this;
    }

    /**
     * @for App
     * @method update
     */
    update() {
        if (!this.prop.complete) {
            this.complete();
            this.loadingView.complete();

            this.prop.complete = true;
        }

        if (!UPDATE) {
            return this;
        }

        requestAnimationFrame(() => this.update());

        this.updatePre();
        this.aircraftController.aircraft_update();
        this.updatePost();
        this.incrementFrame();
        this.gameClockView.update();

        return this;
    }

    /**
     * @for App
     * @method incrementFrame
     */
    incrementFrame() {
        const currentTime = time();
        const elapsed = currentTime - this.prop.time.frame.start;

        this.prop.time.frames += 1;
        this.prop.time.frame.count += 1;

        if (elapsed > this.prop.time.frame.delay) {
            this.prop.time.fps = this.prop.time.frame.count / elapsed;
            this.prop.time.frame.count = 0;
            this.prop.time.frame.start = currentTime;
        }

        this.prop.time.frame.delta = calculateDeltaTime(this.prop.time.frame.last);
        this.prop.time.frame.last = currentTime;
    }

    /**
     * @for App
     * @method getDeltaTime
     * @return {number}
     */
    getDeltaTime = () => {
        return this.prop.time.frame.delta;
    };

    /**
     * @for App
     * @method updateRun
     * @param shouldUpdate {boolean}
     */
    updateRun = (shouldUpdate) => {
        if (!UPDATE && shouldUpdate) {
            requestAnimationFrame(() => this.update());
        }

        UPDATE = shouldUpdate;
    };

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
        if (!this.airportController.airport.current) {
            // if `current` is null, then this is the initial load and we dont need to reset andything
            return;
        }

        this.navigationLibrary.reset();
        this.airlineController.reset();
        this.aircraftController.aircraft_remove_all();
        this.spawnPatternCollection.reset();
        this.gameController.destroyTimers();
        this.spawnScheduler = null;

        this.navigationLibrary.init(nextAirportJson);
        this.spawnPatternCollection.init(nextAirportJson, this.navigationLibrary, this.airportController);
        this.spawnScheduler = new SpawnScheduler(this.spawnPatternCollection, this.aircraftController, this.gameController);

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
        const { current: airport } = this.airportController;

        this.canvasController.canvas.draw_labels = true;
        this.canvasController.canvas.dirty = true;

        $(SELECTORS.DOM_SELECTORS.TOGGLE_LABELS).toggle(!_isEmpty(airport.maps));
        $(SELECTORS.DOM_SELECTORS.TOGGLE_RESTRICTED_AREAS).toggle((airport.restricted_areas || []).length > 0);
        $(SELECTORS.DOM_SELECTORS.TOGGLE_SIDS).toggle(!_isNil(this.navigationLibrary.sidCollection));
        $(SELECTORS.DOM_SELECTORS.TOGGLE_TERRAIN).toggle(airport.data.has_terrain);
    }
}
