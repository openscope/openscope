/* eslint-disable max-len, indent, no-undef, prefer-destructuring */
import $ from 'jquery';
import _has from 'lodash/has';
import _flow from 'lodash/flow';
import AirportController from '../airport/AirportController';
import EventBus from '../lib/EventBus';
import EventTracker from '../EventTracker';
import TimeKeeper from '../engine/TimeKeeper';
import TutorialStep from './TutorialStep';
import { round, clamp } from '../math/core';
import { EVENT } from '../constants/eventNames';
import { STORAGE_KEY } from '../constants/storageKeys';
import { SELECTORS } from '../constants/selectors';
import { TRACKABLE_EVENT } from '../constants/trackableEvents';

const tutorial = {};

const TUTORIAL_TEMPLATE = '' +
    '<div id="tutorial" class="notSelectable">' +
    '   <h1></h1>' +
    '   <main></main>' +
    '   <div class="prev"><img src="assets/images/prev.png" title="Previous step" /></div>' +
    '   <div class="next"><img src="assets/images/next.png" title="Next step" /></div>' +
    '</div>';

/**
 * @class TutorialView
 */
export default class TutorialView {
    /**
     * @constructor
     */
    constructor($element = null) {
        /**
         * @property EventBus
         * @type {EventBus}
         * @default EventBus
         * @private
         */
        this._eventBus = EventBus;

        /**
         * @property tutorial
         * @type {}
         * @private
         */
        this.tutorial = null;

        /**
         * Root DOM element
         *
         * @property $element
         * @type {jquery|HTML Element}
         * @default $element
         */
        this.$element = $element;

        /**
         * Root tutorial DOM element
         *
         * @property $tutorialView
         * @type {jquery|HTML Element}
         * @default `#tutorial`
         */
        this.$tutorialView = null;

        /**
         * Previous tutorial step button
         *
         * @property $tutorialPrevious
         * @type {jquery|HTML Element}
         * @default `.prev`
         */
        this.$tutorialPrevious = null;

        /**
         * Next tutorial step button
         *
         * @property $tutorialNext
         * @type {jquery|HTML Element}
         * @default `.next`
         */
        this.$tutorialNext = null;


        /**
         * Command bar button to toggle the tutorial on/off
         *
         * @for TutorialView
         * @property $toggleTutorial
         * @type {jquery|HTML Element}
         */
        this.$toggleTutorial = null;

        this._init()
            ._setupHandlers()
            .layout()
            .enable();
    }

    /**
     * Lifecycle method should be run once on application init.
     *
     * Caches selectors in variabls so they only need to be looked up one time.
     *
     * @for TutorialView
     * @method _init
     * @chainable
     */
    _init() {
        this.$tutorialView = $(TUTORIAL_TEMPLATE);
        this.$tutorialPrevious = this.$tutorialView.find(SELECTORS.DOM_SELECTORS.PREV);
        this.$tutorialNext = this.$tutorialView.find(SELECTORS.DOM_SELECTORS.NEXT);
        this.$toggleTutorial = $(SELECTORS.DOM_SELECTORS.TOGGLE_TUTORIAL);

        this.tutorial = tutorial;
        this.tutorial.steps = [];
        this.tutorial.step = 0;
        this.tutorial.liverefs = {};
        this.tutorial.open = false;

        return this;
    }

    /**
     * Create event handlers
     *
     * Should be run once only on instantiation
     *
     * @for TutorialView
     * @method _setupHandlers
     * @chainable
     */
    _setupHandlers() {
        this._onAirportChangeHandler = this.onAirportChange.bind(this);
        this._onTutorialToggleHandler = this.tutorial_toggle.bind(this);

        return this;
    }

    /**
     * Lifecycle method should be run once on application init.
     *
     * Adds the TUTORIAL_TEMPLATE to the view
     *
     * @for TutorialView
     * @method layout
     * @chainable
     */
    layout() {
        if (!this.$element) {
            throw new Error('Expected $element to be defined. `body` tag does not exist in the DOM');
        }

        this.tutorial.html = this.$tutorialView;
        this.$element.append(this.$tutorialView);

        return this;
    }

    /**
     * Lifecycle method should be run once on application init.
     *
     * @for TutorialView
     * @method enable
     * @chainable
     */
    enable() {
        this._eventBus.on(EVENT.TOGGLE_TUTORIAL, this._onTutorialToggleHandler);
        this._eventBus.on(EVENT.AIRPORT_CHANGE, this._onAirportChangeHandler);

        this.$tutorialPrevious.on('click', (event) => this.tutorial_prev(event));
        this.$tutorialNext.on('click', (event) => this.tutorial_next(event));

        return this;
    }

    /**
     * Disable any click handlers.
     *
     * @for TutorialView
     * @method disable
     * @chainable
     */
    disable() {
        this._eventBus.off(EVENT.TOGGLE_TUTORIAL, this._onTutorialToggleHandler);
        this._eventBus.off(EVENT.AIRPORT_CHANGE, this._onAirportChangeHandler);

        this.$tutorialPrevious.off('click', (event) => this.tutorial_prev(event));
        this.$tutorialNext.off('click', (event) => this.tutorial_next(event));

        return this.destroy();
    }

    /**
     * Tear down the view and unset any properties.
     *
     * @for TutorialView
     * @method destroy
     * @chainable
     */
    destroy() {
        this.$tutorialView = null;
        this.$tutorialPrevious = null;
        this.$tutorialNext = null;
        this.tutorial = {};
        this.tutorial.steps = [];
        this.tutorial.step = 0;
        this.tutorial.liverefs = {};
        this.tutorial.open = false;

        return this;
    }

    /**
     * Return whether the tutorial dialog is currently open
     *
     * @for TutorialView
     * @method isTutorialDialogOpen
     * @return {boolean}
     */
    isTutorialDialogOpen() {
        return this.$tutorialView.hasClass(SELECTORS.CLASSNAMES.OPEN);
    }

    /**
     * Refresh the tutorial text contents when the airport is changed.
     *
     * @for TutorialView
     * @method onAirportChange
     */
    onAirportChange() {
        this.tutorial_update_content();
    }

    /**
     * @for TutorialView
     * @method tutorial_init_pre
     */
    tutorial_init_pre() {
        this.tutorial = {};
        this.tutorial.steps = [];
        this.tutorial.step = 0;

        // these always get evaluated on-the-fly.
        this.tutorial.liverefs = {
            airport: function() {
                return AirportController.airport_get();
            },
            departureAircraft: function() {
                return prop.aircraft.list.filter((aircraftModel) => aircraftModel.isDeparture())[0];
            }
        };

        zlsa.atc.loadAsset({ url: 'assets/tutorial/tutorial.json', immediate: true })
            .done((response) => {
                response.forEach((step) => {
                    this._loadTutorialStep(step);
                });
            })
            .fail((jqxhr, textStatus, error) => {
                console.error(`Failed to load tutorial data: ${textStatus}, ${error}`);
                this.tutorial_step({ title: 'Error', text: `The tutorial failed to load: ${textStatus}, ${error}` });
            });
    }

    /**
     * Load a single step of the tutorial data that was parsed from JSON
     *
     * @for TutorialView
     * @method _loadTutorialStep
     */
    _loadTutorialStep(step) {
        if (Array.isArray(step.replace)) {
            // take each text replacement entry, configure corresponding text.replace() function call, wrapped with checks
            step.replace.forEach((replacement) => {
                const objFetcher = this.tutorial.liverefs[replacement.replaceWith.object];
                if (!objFetcher) {
                    // don't create replace function if 'object' config is not one of valid options in liverefs
                    console.error(`Tutorial: ${step.title}: ${replacement.replaceWith.object} is not valid.`);
                    return;
                }
                const propFetcher = this._getPropFetcher(replacement.replaceWith.propPath);
                const replaceFunc = (t) => {
                    const value = propFetcher(objFetcher());
                    if (value == null) { // null or undefined; likely configured with incorrect property path
                        console.warn(`Tutorial: ${step.title}: ${replacement.replaceWith.object}.${replacement.replaceWith.propPath} has ${value} value.`);
                        return t;
                    }
                    return t.replace(replacement.findWhat, value);
                };

                if (Array.isArray(step.parse)) {
                    step.parse.push(replaceFunc);
                } else {
                    step.parse = [replaceFunc];
                }
            });

            // compose possibly multiple text replacement functions together into one
            if (Array.isArray(step.parse)) {
                step.parse = _flow(...step.parse);
            }
            // discard property not used by TutorialStep
            delete step.replace;
        }
        this.tutorial_step(step);
    }

    /**
     * Fetching descendent property of an object without using eval()
     *
     * Adapted from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval#accessing_member_properties
     *
     * @for TutorialView
     * @method _getPropFetcher
     * @return [{function}] A function that will fetch a given descendent property of an object without using eval()
     */
    _getPropFetcher(desc) {
        return ((obj) => {
            let result = obj;
            const arr = desc.split('.');
            while (arr.length) {
                if (result == null) { // null or undefined, can drill down no further
                    return result;
                }
                result = result[arr.shift()];
            }
            return result;
        });
    }

    /**
     * Open/close the tutorial modal
     *
     * This method may be triggered via `EventBus.trigger()`
     *
     * @for TutorialView
     * @method tutorial_toggle
     */
    tutorial_toggle() {
        if (this.isTutorialDialogOpen()) {
            this.tutorial_close();

            return;
        }

        this.tutorial_open();
    }

    /**
     * @method tutorial_get
     */
    tutorial_get(step = null) {
        if (!step) {
            step = this.tutorial.step;
        }

        return this.tutorial.steps[step];
    }

    /**
     * @method tutorial_move
     */
    tutorial_move() {
        const step = this.tutorial_get();
        const padding = [30, 10];
        const left = step.position[0] * ($(window).width() - this.$tutorialView.outerWidth() - padding[0]);
        let top = step.position[1] * ($(window).height());
        top -= (this.$tutorialView.outerHeight() - padding[1]);

    //  left += step.padding[0];
    //  top  += step.padding[1];

        this.$tutorialView.offset({
            top: round(top),
            left: round(left)
        });
    }

    /**
     * @method tutorial_step
     */
    tutorial_step(options) {
        this.tutorial.steps.push(new TutorialStep(options));
    }

    /**
     * @method tutorial_update_content
     */
    tutorial_update_content() {
        const step = this.tutorial_get();

        this.$tutorialView.find('h1').html(step.title);
        this.$tutorialView.find('main').html(step.getText());
        this.$tutorialView.removeClass('left right');

        if (step.side === SELECTORS.CLASSNAMES.LEFT) {
            this.$tutorialView.addClass(SELECTORS.CLASSNAMES.LEFT);
        } else if (step.side === SELECTORS.CLASSNAMES.RIGHT) {
            this.$tutorialView.addClass(SELECTORS.CLASSNAMES.RIGHT);
        }

        this.tutorial_move();
    }

    /**
     * @method tutorial_open
     */
    tutorial_open() {
        this.$tutorialView.addClass(SELECTORS.CLASSNAMES.OPEN);
        this.$toggleTutorial.addClass(SELECTORS.CLASSNAMES.ACTIVE);

        this.tutorial_update_content();
    }

    /**
     * @method tutorial_close
     */
    tutorial_close() {
        this.$tutorialView.removeClass(SELECTORS.CLASSNAMES.OPEN);
        this.$toggleTutorial.removeClass(SELECTORS.CLASSNAMES.ACTIVE);

        this.tutorial_move();
    }

    // TODO: this method never gets called anywhere else, remove
    /**
     * @method tutorial_complete
     */
    tutorial_complete() {
        if (!_has(localStorage, STORAGE_KEY.FIRST_RUN_TIME)) {
            this.tutorial_open();
        }

        localStorage[STORAGE_KEY.FIRST_RUN_TIME] = TimeKeeper.gameTimeInSeconds;
    }

    /**
     * @method tutorial_next
     */
    tutorial_next() {
        if (this.tutorial.step === this.tutorial.steps.length - 1) {
            this.tutorial_close();

            return;
        }

        this.tutorial.step = clamp(0, this.tutorial.step + 1, this.tutorial.steps.length - 1);

        EventTracker.recordEvent(TRACKABLE_EVENT.TUTORIAL, 'next', `${this.tutorial.step}`);
        this.tutorial_update_content();
    }

    /**
     * @method tutorial_prev
     */
    tutorial_prev() {
        this.tutorial.step = clamp(0, this.tutorial.step - 1, this.tutorial.steps.length - 1);

        EventTracker.recordEvent(TRACKABLE_EVENT.TUTORIAL, 'prev', `${this.tutorial.step}`);
        this.tutorial_update_content();
    }
}
