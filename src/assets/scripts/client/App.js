import $ from 'jquery';
import AppController from './AppController';
import EventBus from './lib/EventBus';
import TimeKeeper from './engine/TimeKeeper';
import { DEFAULT_AIRPORT_ICAO } from './constants/airportConstants';
import { EVENT } from './constants/eventNames';
import { LOG } from './constants/logLevel';

window.zlsa = {};
window.zlsa.atc = {};

// TODO: KILL THE PROP!
const prop = {};

// IIEFs are pulled in here to add functions to the global space.
//
// This will need to be re-worked, and current global functions should be exported and
// imported as needed in each file.
require('./util');

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
        this.prop.log = LOG.DEBUG;
        this.prop.loaded = false;

        return this.setupHandlers()
            .loadInitialAirport(airportLoadList, initialAirportToLoad);
    }

    /**
     * Create event handlers
     *
     * @for App
     * @method setupHandlers
     * @chainable
     */
    setupHandlers() {
        this.loadDefaultAiportAfterStorageIcaoFailureHandler = this.loadDefaultAiportAfterStorageIcaoFailure.bind(this);
        this.loadAirlinesAndAircraftHandler = this.loadAirlinesAndAircraft.bind(this);
        this.setupChildrenHandler = this.setupChildren.bind(this);
        this.onPauseHandler = this._onPause.bind(this);
        this.onUpdateHandler = this.update.bind(this);

        this.eventBus.on(EVENT.PAUSE_UPDATE_LOOP, this.onPauseHandler);

        return this;
    }

    /**
     * Used to load data for the initial airport using an icao from
     * either localStorage or `DEFAULT_AIRPORT_ICAO`
     *
     * If a localStorage airport cannot be found, we will attempt
     * to load the `DEFAULT_AIRPORT_ICAO`
     *
     * Lifecycle method. Should be called only once on initialization
     *
     * @for App
     * @method loadInitialAirport
     * @param airportLoadList {array<object>}  List of airports to load
     */
    loadInitialAirport(airportLoadList, initialAirportToLoad) {
        const initialAirportIcao = initialAirportToLoad.toLowerCase();

        $.getJSON(`assets/airports/${initialAirportIcao}.json`)
            .then((response) => this.loadAirlinesAndAircraftHandler(airportLoadList, initialAirportIcao, response))
            .catch((error) => this.loadDefaultAiportAfterStorageIcaoFailureHandler(airportLoadList));
    }

    /**
     * Used only when an attempt to load airport data with an icao in localStorage fails.
     * In this case we attempt to load the default airport with this method
     *
     * Lifecycle method. Should be called only once on initialization
     *
     * @for App
     * @method onLoadDefaultAirportAfterStorageIcaoFailure
     * @param {array<object>} airportLoadList
     */
    loadDefaultAiportAfterStorageIcaoFailure(airportLoadList) {
        $.getJSON(`assets/airports/${DEFAULT_AIRPORT_ICAO}.json`)
            .then((defaultAirportResponse) => this.loadAirlinesAndAircraftHandler(
                airportLoadList,
                DEFAULT_AIRPORT_ICAO,
                defaultAirportResponse
            ));
    }

    /**
     * Handler method called after data has loaded for the airline and aircraftTypeDefinitions datasets.
     *
     * Lifecycle method. Should be called only once on initialization
     *
     * @for App
     * @method loadAirlinesAndAircraft
     * @param {array>object>} airportLoadList
     * @param {string} initialAirportIcao
     * @param {object<string>} initialAirportResponse
     */
    loadAirlinesAndAircraft(airportLoadList, initialAirportIcao, initialAirportResponse) {
        const airlineListPromise = $.getJSON('assets/airlines/airlines.json');
        const aircraftListPromise = $.getJSON('assets/aircraft/aircraft.json');

        // This is provides a way to get async data from several sources in the app before anything else runs
        // we need to resolve data from two sources before the app can proceede. This data should always
        // exist, if it doesn't, something has gone terribly wrong.
        $.when(airlineListPromise, aircraftListPromise)
            .done((airlineResponse, aircraftResponse) => {
                this.setupChildrenHandler(
                    airportLoadList,
                    initialAirportIcao,
                    initialAirportResponse,
                    airlineResponse[0].airlines,
                    aircraftResponse[0].aircraft
                );
            });
    }

    /**
     * Callback for a successful data load
     *
     * A first load of data occurs on startup where we load the initial airport, airline definitions and
     * aircraft type definitiions. this method is called onComplete of that data load and is used to
     * instantiate various classes with the loaded data.
     *
     * This method will fire `.enable()` that will finish the initialization lifecycle and begine the game loop.
     * Lifecycle method. Should be called only once on initialization
     *
     * @for App
     * @method setupChildren
     * @param airportLoadList {array}         List of all airports
     * @param initialAirportData {object}     Airport json for the initial airport, could be default or stored airport
     * @param airlineList {array}             List of all Airline definitions
     * @param aircraftTypeDefinitionList {array}  List of all Aircraft definitions
     */
    setupChildren(airportLoadList, initialAirportIcao, initialAirportData, airlineList, aircraftTypeDefinitionList) {
        this._appController.setupChildren(
            airportLoadList,
            initialAirportIcao,
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
        this._appController.init_pre();

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
        this._appController.resize();

        this.prop.loaded = true;

        if (UPDATE) {
            requestAnimationFrame(this.onUpdateHandler);
        }

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

        requestAnimationFrame(this.onUpdateHandler);

        this.updatePre();
        this.updatePost();
        TimeKeeper.update();

        return this;
    }

    /**
     * @for App
     * @method _onPause
     * @param shouldUpdate {boolean}
     */
    _onPause(shouldUpdate) {
        if (!UPDATE && shouldUpdate) {
            requestAnimationFrame(this.onUpdateHandler);
        }

        UPDATE = shouldUpdate;
    }
}
