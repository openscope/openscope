import $ from 'jquery';
import AppController from './AppController';
import EventBus from './lib/EventBus';
import { time, calculateDeltaTime } from './utilities/timeHelpers';
import { EVENT } from './constants/eventNames';
import { LOG } from './constants/logLevel';

window.zlsa = {};
window.zlsa.atc = {};
const prop = {};

// IIEFs are pulled in here to add functions to the global space.
//
// This will need to be re-worked, and current global functions should be exported and
// imported as needed in each file.
require('./util');

// Used to display the version number in the console
const VERSION = '5.3.0-BETA';

// are you using a main loop? (you must call update() afterward disable/re-enable)
let UPDATE = true;

/**
 * @class App
 */
export default class App {
    /**
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
        this._appController = new AppController(this.$element);
        this.eventBus = EventBus;

        window.prop = prop;

        this.prop = prop;
        this.prop.complete = false;
        this.prop.version = VERSION;
        this.prop.time = {};
        this.prop.time.start = time();
        this.prop.time.frames = 0;
        this.prop.time.frame = {};
        this.prop.time.frame.start = time();
        this.prop.time.frame.count = 0;
        this.prop.time.frame.last = time();
        this.prop.time.frame.delta = 0;
        this.prop.time.fps = 0;
        this.prop.log = LOG.DEBUG;
        this.prop.loaded = false;

        return this.createHandlers()
            .initiateDataLoad(airportLoadList, initialAirportToLoad);
    }

    /**
     * Create event handlers
     *
     * @for App
     * @method createHandlers
     * @chainable
     */
    createHandlers() {
        this.eventBus.on(EVENT.SHOULD_PAUSE_UPDATE_LOOP, this.updateRun);

        return this;
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
        this._appController.setupChildren(
            airportLoadList,
            initialAirportData,
            airlineList,
            aircraftTypeDefinitionList
        );

        this.enable();
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
        console.info(`openScope Air Traffic Control Simulator, Version v${this.prop.version}`);

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
        this._appController.init_pre(this.getDeltaTime);

        return this;
    }

    /**
     * @for App
     * @method init
     */
    init() {
        this._appController.init();

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
        this._appController.done();

        $(window).resize(this._appController.resize);
        this._appController.resize();

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
     * @method complete
     */
    complete() {
        this._appController.complete();

        return this;
    }

    /**
     * @for App
     * @method updatePre
     */
    updatePre() {
        this._appController.updatePre();

        return this;
    }

    /**
     * @for App
     * @method updatePost
     */
    updatePost() {
        this._appController.updatePost();

        return this;
    }

    /**
     * @for App
     * @method update
     */
    update() {
        if (!this.prop.complete) {
            this.complete();

            this.prop.complete = true;
        }

        if (!UPDATE) {
            return this;
        }

        requestAnimationFrame(() => this.update());

        this.updatePre();
        this.updatePost();
        this.incrementFrame();

        return this;
    }

    /**
     * @for App
     * @method incrementFrame
     */
    incrementFrame() {
        // the framerate is updated this often (seconds)
        const frameDelay = 1;
        const currentTime = time();
        const elapsed = currentTime - this.prop.time.frame.start;

        this.prop.time.frames += 1;
        this.prop.time.frame.count += 1;

        if (elapsed > frameDelay) {
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
}
