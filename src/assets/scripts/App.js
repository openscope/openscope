/* eslint-disable no-underscore-dangle */
import Fiber from 'fiber';
import LoadingView from './LoadingView';
import peg from 'pegjs';
import { time, calculateDeltaTime } from './utilities/timeHelpers';
import { LOG } from './constants/logLevel';

window.peg = peg;
window.zlsa = {};
window.zlsa.atc = {};
const prop = {}

// IIEFs that are pulled in here to add functions to the global space.
//
// This will need to be re-worked, and current global functions should be exported and imported
// as needed in each file.
require('./util');
require('./animation');
require('./parser');
require('./speech');
require('./get')


// saved as prop.version and prop.version_string
const VERSION = [2, 1, 8];

// are you using a main loop? (you must call update() afterward disable/reenable)
const UPDATE = true;

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
        this.loadingView = new LoadingView(this.$element);

        return this;
    }

    /**
     * @for App
     * @method enable
     */
    enable() {
        const Mediator = Fiber.extend((base) => ({
            init: (options) => {},

            trigger: (event, data) => {
                if (event === 'startLoading') {
                    this.loadingView.startLoad(data);
                } else if (event === 'stopLoading') {
                    this.loadingView.stopLoad();
                }
            }
        }));

        /*eslint-enable*/
        window.zlsa.atc.mediator = new Mediator()

        // This is the old entry point for the application. We include this here now so that
        // the app will run. This is a temporary implementation and should be refactored immediately.
        //
        // Eventually, this method will contain all of the initiation logic currently contained in
        // modules.js and the modules file will no longer be needed. This class will be in charge of
        // running the game loop and keeping up with housekeeping tasks.
        modules = require('./modules');


        // window.modules = {};
        // loadingView = new LoadingView();
        //
        // propInit();
        // log(`Version ${prop.version_string}`);
        // // load_modules();
        //
        // // TODO: temp to get browserify working. these calls should be moved to proper `class.init()` type methods
        // // that are instantiated and live in `App.js`.

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
        this.loadingView = null;
        this.prop = null;

        return this;
    }

    /**
     * @for App
     * @method init_pre
     */
    init_pre() {
        // tutorial_init_pre();
        // game_init_pre();
        // input_init_pre();
        // airline_init_pre();
        // aircraft_init_pre();
        // airport_init_pre();
        // canvas_init_pre();
        // ui_init_pre();

        return this;
    }

    /**
     * @for App
     * @method init
     */
    init() {
        // speech_init();
        // tutorial_init();
        // input_init();
        // aircraft_init();
        // airport_init();
        // canvas_init();
        // ui_init();

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
        // $(window).resize(resize);
        // resize();
        //
        // callModule('*', 'done');
        // prop.loaded = true;
        // callModule('*', 'ready');
        //
        // // TODO: temp fix to get browserify working
        // airport_ready();
        //
        // if (UPDATE) {
        //     requestAnimationFrame(update);
        // }


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
     * @method complete
     */
    complete() {

        return this;
    }

    /**
     * @for App
     * @method update_pre
     */
    update_pre() {

        return this;
    }

    /**
     * @for App
     * @method update
     */
    update() {
        // if (!prop.complete) {
        //
        //     // TODO: temp fix to get browserify working
        //     game_complete();
        //     ui_complete();
        //
        //     loadingView.complete();
        //     prop.complete = true;
        // }
        //
        // if (UPDATE) {
        //     requestAnimationFrame(update);
        // } else {
        //     return;
        // }
        //
        // game_update_pre();
        // aircraft_update();
        // canvas_update_post();
        //
        // prop.time.frames += 1;
        // prop.time.frame.count += 1;
        //
        // const elapsed = time() - prop.time.frame.start;
        //
        // if (elapsed > prop.time.frame.delay) {
        //     prop.time.fps = prop.time.frame.count / elapsed;
        //     prop.time.frame.count = 0;
        //     prop.time.frame.start = time();
        // }
        //
        // prop.time.frame.delta = calculateDeltaTime(prop.time.frame.last);
        // prop.time.frame.last = time()

        return this;
    }

    /**
     * @for App
     * @method update_post
     */
    update_post() {

        return this;
    }

    /**
     * @for App
     * @method resize
     */
    resize() {
        // canvas_resize();

        return this;
    }
}
