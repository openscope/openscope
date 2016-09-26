/* eslint-disable no-underscore-dangle, no-unused-vars, no-undef, global-require */
import $ from 'jquery';
import peg from 'pegjs';
import ContentQueue from './contentQueue/ContentQueue';
import LoadingView from './LoadingView';
import AirlineController from './airline/AirlineController';
import AircraftController from './aircraft/AircraftController';
import AirportController from './airport/AirportController';
import GameController from './game/GameController';
import TutorialView from './tutorial/TutorialView';
import InputController from './InputController';
import UiController from './UiController';
import CanvasController from './canvas/CanvasController';
import { speech_init } from './speech';
import { time, calculateDeltaTime } from './utilities/timeHelpers';
import { LOG } from './constants/logLevel';

window.peg = peg;
window.zlsa = {};
window.zlsa.atc = {};
const prop = {};

// IIEFs are pulled in here to add functions to the global space.
//
// This will need to be re-worked, and current global functions should be exported and
// imported as needed in each file.
require('./util');
// this module doesnt appear to be in use anywhere
require('./animation');
require('./parser');

const base = require('./base');

// saved as this.prop.version and this.prop.version_string
const VERSION = [3, 0, 0];

// are you using a main loop? (you must call update() afterward disable/reenable)
let UPDATE = true;

// the framerate is updated this often (seconds)
const FRAME_DELAY = 1;

// is this a release build?
const RELEASE = false;

// just a place to store modules.js. this will go away eventually.
let modules;

/**
 * @class App
 */
export default class App {
    /**
     * @for App
     * @constructor
     * @param $element {HTML Element|null}
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
        this.loadingView = null;
        this.contentQueue = null;
        this.airlineController = null;
        this.aircraftController = null;
        this.airportController = null;
        this.tutorialView = null;
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

        return this.setupChildren()
                    .enable();
    }

    /**
     * @for App
     * @method setupChildren
     */
    setupChildren() {
        this.loadingView = new LoadingView();
        this.contentQueue = new ContentQueue(this.loadingView);
        this.airlineController = new AirlineController();
        this.aircraftController = new AircraftController();
        this.airportController = new AirportController();
        this.gameController = new GameController();
        this.tutorialView = new TutorialView(this.$element);
        this.inputController = new InputController(this.$element);
        this.uiController = new UiController(this.$element);
        this.canvasController = new CanvasController(this.$element);

        return this;
    }

    /**
     * @for App
     * @method enable
     */
    enable() {
        zlsa.atc.loadAsset = (options) => this.contentQueue.add(options);
        // TEMPORARY!
        // these instances are attached to the window here as an intermediate step away from global functions.
        // this allows for any module file to full window.{module}.{method} and will make the transition to
        // explicit instance parameters easier.
        window.airlineController = this.airlineController;
        window.aircraftController = this.aircraftController;
        window.airportController = this.airportController;
        window.gameController = this.gameController;
        window.tutorialView = this.tutorialView;
        window.inputController = this.inputController;
        window.uiController = this.uiController;
        window.canvasController = this.canvasController;

        // This is the old entry point for the application. We include this here now so that
        // the app will run. This is a temporary implementation and should be refactored immediately.
        //
        // Eventually, this method will contain all of the initiation logic currently contained in
        // modules.js and the modules file will no longer be needed. This class will be in charge of
        // running the game loop and keeping up with housekeeping tasks.
        modules = require('./modules');

        // TODO: MOVE THIS!!!
        /**
         * Change whether updates should run
         */
        window.updateRun = (arg) => {
            console.warn('updateRun: ', arg);
            if (!UPDATE && arg) {
                requestAnimationFrame(() => this.update());
            }

            UPDATE = arg;
        };

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
     * @for App
     * @method destroy
     */
    destroy() {
        this.$element = null;
        this.contentQueue = null;
        this.loadingView = null;
        this.airlineController = null;
        this.aircraftController = null;
        this.airportController = null;
        this.gameController = null;
        this.tutorialView = null;
        this.inputController = null;
        this.uiController = null;
        this.canvasController = null;

        return this;
    }

    /**
     * @for App
     * @method init_pre
     */
    init_pre() {
        this.tutorialView.tutorial_init_pre();
        this.gameController.init_pre();
        this.inputController.input_init_pre();
        this.airlineController.init_pre();
        this.aircraftController.init_pre();
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
        this.aircraftController.aircraft_update();
        this.updatePost();
        this.incrementFrame();

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
}
