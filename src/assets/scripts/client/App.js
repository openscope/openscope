import $ from 'jquery';
import ContentQueue from './contentQueue/ContentQueue';
import LoadingView from './LoadingView';
import AirportController from './airport/AirportController';
import GameController from './game/GameController';
import TutorialView from './tutorial/TutorialView';
import AircraftCommander from './aircraft/AircraftCommander';
import InputController from './InputController';
import UiController from './UiController';
import CanvasController from './canvas/CanvasController';
import GameClockView from './game/GameClockView';
import { speech_init } from './speech';
import { time, calculateDeltaTime } from './utilities/timeHelpers';
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
const VERSION = [3, 2, 0];

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
     */
    constructor(element, airportLoadList) {
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

        return this.setupChildren(airportLoadList)
                    .enable();
    }

    /**
     * Lifecycle method. Should be called only once on initialization.
     *
     * Used to setup properties and initialize dependant classes.
     *
     * @for App
     * @method setupChildren
     * @param airportLoadList {array<object>}  List of airports to load
     */
    setupChildren(airportLoadList) {
        this.loadingView = new LoadingView();
        this.contentQueue = new ContentQueue(this.loadingView);
        this.airportController = new AirportController(airportLoadList, this.updateRun);
        this.gameController = new GameController(this.getDeltaTime);
        this.tutorialView = new TutorialView(this.$element);
        this.aircraftCommander = new AircraftCommander();
        this.inputController = new InputController(this.$element, this.aircraftCommander);
        this.uiController = new UiController(this.$element);
        this.canvasController = new CanvasController(this.$element);
        this.gameClockView = new GameClockView(this.$element);

        return this;
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
        zlsa.atc.loadAsset = (options) => this.contentQueue.add(options);
        // TEMPORARY!
        // these instances are attached to the window here as an intermediate step away from global functions.
        // this allows for any module file to call window.{module}.{method} and will make the transition to
        // explicit instance parameters easier.
        window.airportController = this.airportController;
        window.gameController = this.gameController;
        window.tutorialView = this.tutorialView;
        window.inputController = this.inputController;
        window.uiController = this.uiController;
        window.canvasController = this.canvasController;

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
        this.airportController.init_pre();
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

        this.airportController.init();
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
        this.airportController.ready();

        return this;
    }

    /**
     * @for App
     * @method resize
     */
    resize() {
        this.canvasController.canvas_resize();

        return this;
    }

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
        this.airportController.recalculate();
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
        // console.warn('updateRun: ', shouldUpdate);
        if (!UPDATE && shouldUpdate) {
            requestAnimationFrame(() => this.update());
        }

        UPDATE = shouldUpdate;
    };
}
