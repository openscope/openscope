/* eslint-disable no-underscore-dangle */
import $ from 'jquery';
import peg from 'pegjs';
import ContentQueue from './contentQueue/ContentQueue';
import LoadingView from './LoadingView';
import { time, calculateDeltaTime } from './utilities/timeHelpers';
import { LOG } from './constants/logLevel';

window.peg = peg;
window.zlsa = {};
window.zlsa.atc = {};
const prop = {};

// IIEFs that are pulled in here to add functions to the global space.
//
// This will need to be re-worked, and current global functions should be exported and imported
// as needed in each file.
require('./util');
require('./animation');
require('./parser');
require('./speech');
const tutorial = require('./tutorial/tutorial');
const base = require('./base');
const game = require('./game/game');
const input = require('./input');
const airline = require('./airline/airline');
const aircraft = require('./aircraft/aircraft');
const airport = require('./airport/airport');
const canvas = require('./canvas');
const ui = require('./ui');


// saved as prop.version and prop.version_string
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
     * @param $element {jquery|null}
     */
    constructor($element) {
        this.$element = $element;
        this.loadingView = null;
        this.contentQueue = null;

        window.prop = prop;
        prop.complete = false;
        prop.temp = 'nothing here';
        prop.version = VERSION;
        prop.version_string = `v${VERSION.join('.')}`;
        prop.time = {};
        prop.time.start = time();
        prop.time.frames = 0;
        prop.time.frame = {};
        prop.time.frame.start = time();
        prop.time.frame.delay = FRAME_DELAY;
        prop.time.frame.count = 0;
        prop.time.frame.last = time();
        prop.time.frame.delta = 0;
        prop.time.fps = 0;
        prop.log = LOG.DEBUG;
        prop.loaded = false;

        if (RELEASE) {
            prop.log = LOG.WARNING;
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

        return this;
    }

    /**
     * @for App
     * @method enable
     */
    enable() {
        zlsa.atc.loadAsset = (options) => this.contentQueue.add(options);

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

        log(`Version ${prop.version_string}`);

        // TODO: temp to get browserify working. these calls should be moved to proper `class.init()` type methods
        // that are instantiated and live in `App.js`.

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

        return this;
    }

    /**
     * @for App
     * @method init_pre
     */
    init_pre() {
        tutorial_init_pre();
        game_init_pre();
        input_init_pre();
        airline_init_pre();
        aircraft_init_pre();
        airport_init_pre();
        canvas_init_pre();
        ui_init_pre();

        return this;
    }

    /**
     * @for App
     * @method init
     */
    init() {
        speech_init();
        tutorial_init();
        input_init();
        aircraft_init();
        airport_init();
        canvas_init();
        ui_init();

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

        prop.loaded = true;

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
        // TODO: temp fix to get browserify working
        airport_ready();

        return this;
    }

    /**
     * @for App
     * @method complete
     */
    complete() {
        game_complete();
        canvas_complete();
        ui_complete();

        return this;
    }

    /**
     * @for App
     * @method resize
     */
    resize() {
        canvas_resize();

        return this;
    }

    /**
     * @for App
     * @method updatePre
     */
    updatePre() {
        game_update_pre();

        return this;
    }

    /**
     * @for App
     * @method update
     */
    update() {
        if (!prop.complete) {
            // TODO: temp fix to get browserify working

            this.complete();

            this.loadingView.complete();
            prop.complete = true;
        }

        if (!UPDATE) {
            return;
        }

        requestAnimationFrame(() => this.update());

        this.updatePre();
        aircraft_update();
        this.updatePost();

        prop.time.frames += 1;
        prop.time.frame.count += 1;

        const elapsed = time() - prop.time.frame.start;

        if (elapsed > prop.time.frame.delay) {
            prop.time.fps = prop.time.frame.count / elapsed;
            prop.time.frame.count = 0;
            prop.time.frame.start = time();
        }

        prop.time.frame.delta = calculateDeltaTime(prop.time.frame.last);
        prop.time.frame.last = time()

        return this;
    }

    /**
     * @for App
     * @method updatePost
     */
    updatePost() {
        canvas_update_post();

        return this;
    }
}
