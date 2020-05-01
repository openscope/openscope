/* eslint-disable max-len, indent, no-undef, prefer-destructuring */
import $ from 'jquery';
import _has from 'lodash/has';
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
    '<div id="tutorial">' +
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
     * Reloads the tutorial when the airport is changed.
     *
     * @for TutorialView
     * @method onAirportChange
     */
    onAirportChange() {
        this.tutorial_init_pre();
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

        const tutorial_position = [0.1, 0.85];
        const departureAircraft = prop.aircraft.list.filter((aircraftModel) => aircraftModel.isDeparture())[0];

        this.tutorial_step({
            title: 'Welcome!',
            text: ['Welcome to the tutorial for the openScope Air Traffic Control Simulator. You can show/hide this',
                'tutorial at any time by expanding the "?" icon at the bottom right.'
                ].join(' '),
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Moving Around',
            text: ['To move the middle of the radar screen, use the right click button and drag.',
                'Zoom in and out by scrolling, and press the middle mouse button or scroll wheel to reset the zoom.',
                'To select an aircraft when it is in your airspace, simply left-click.'
            ].join(' '),
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Flight Strip Bay',
            text: ['On the right, there\'s a row of strips, one for each aircraft. You may need to pull it out with the',
                '\'|<\' tab. Each strip has a bar on its left side, colored blue for departures and red for arrivals.'
            ].join(' '),
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Reading Flight Strips',
            text: ['Click the bottom departure strip ({CALLSIGN}).The aircraft\'s callsign will appear in the command',
                'entry box, and the strip will be offset (indicating the aircraft is selected).',
                'The left column shows the callsign, aircraft type (in this case "{MODEL}", for a "{MODELNAME}"), and the CID.',
                'The next column shows the assigned squawk code, assigned altitude, and filed cruise altitude.',
                'The last two columns show the arrival/departure airport, and the flight plan route, respectively.'
            ].join(' '),
            parse: (t) => {
                if (prop.aircraft.list.length <= 0) {
                    return t;
                }

                return t.replace('{CALLSIGN}', departureAircraft.callsign)
                    .replace('{MODEL}', departureAircraft.model.icao.toUpperCase())
                    .replace('{MODELNAME}', departureAircraft.model.name);
            },
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Departures: Issuing IFR Clearance',
            text: ['Let\'s work on getting some departures moving. The first step is always to clear the aircraft to its destination.',
                'With {CALLSIGN} selected, simply type "caf" (for "cleared as filed") and press enter. As needed, you can also change the aircraft\'s',
                'routing, and much more-- refer to the full list of commands <a title="openScope Command Reference" href="https://github.com/openscope/openscope/blob/develop/documentation/commands.md" target="_blank">here</a>.'
            ].join(' '),
            parse: (t) => {
                if (prop.aircraft.list.length <= 0) {
                    return t;
                }

                return t.replace('{CALLSIGN}', departureAircraft.callsign);
            },
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Taxiing',
            text: ['Now tell them "taxi {RUNWAY}" to have them taxi to the runway.',
                   'The aircraft should appear on the scope after about 3 seconds.'
            ].join(' '),
            parse: (t) => {
                if (prop.aircraft.list.length <= 0) {
                    return t;
                }

                return t.replace('{RUNWAY}', departureAircraft.fms.departureRunwayModel.name);
            },
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Takeoff',
            text: ['Now the aircraft is ready for takeoff. Click the aircraft again (or use the PgUp key)',
                   'and type "takeoff" (or "to") to clear the aircraft for takeoff.',
                   'Once it\'s going fast enough, it should lift off the ground and you should',
                   'see its altitude increasing. Meanwhile, read the next step.'
            ].join(' '),
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Moving aircraft',
            text: ['Once {CALLSIGN} has taken off, you\'ll notice it will climb to {INIT_ALT} by itself. This is one of the instructions ',
                    'we gave them when we cleared them "as filed". Aircraft get better fuel efficiency when they are able to climb directly',
                    'from the ground to their cruise altitude without leveling off, so let\'s keep them climbing! Click it and type "cvs" (for',
                    '"climb via SID"). Then they will follow the altitudes and speeds defined in the {SID_NAME} departure. You can also simply',
                    'give a direct climb, lifting the restrictions on the SID. Feel free to click the speedup button on the right side of the ',
                    'input box (it\'s two small arrows) to watch the departure climb along the SID. Then just click it again to return to 1x speed.'
            ].join(' '),
            parse: (t) => {
                if (prop.aircraft.list.length <= 0) {
                    return t;
                }

                return t.replace('{CALLSIGN}', departureAircraft.callsign)
                        .replace('{INIT_ALT}', AirportController.airport_get().initial_alt)
                        .replace('{SID_NAME}', departureAircraft.destination);
            },
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Projection Lines',
            text: ['If you zoom out and click on {CALLSIGN}, you will see a solid blue line that shows their flight plan',
                   'route. You will see the SID and some initial waypoints and airways represented by the blue line. To keep',
                   'traffic manageable, it is in your best interest to get them out of your airspace! To do this, you can',
                   'issue the "pd" command (later on in this tutorial) to give them a shortcut and get them out of your',
                   'airspace faster!'
            ].join(' '),
            parse: (t) => {
                if (prop.aircraft.list.length <= 0) {
                    return t;
                }

                return t.replace('{CALLSIGN}', departureAircraft.callsign);
            },
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Basic Control Instructions: Altitude',
            text: ['You can assign altitudes with the "climb" command, or any of its aliases (other words that',
                   'act identically). Running the command "climb" is the same as the commands "descend", "d",',
                   '"clear", "c", "altitude", or "a". Just use whichever feels correct in your situation.',
                   'Remember, just as in real ATC, altitudes are ALWAYS written in hundreds of feet, eg. "descend 30" for 3,000ft or "climb',
                   ' 100" for 10,000ft.'
            ].join(' '),
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Basic Control Instructions: Radar Vectors',
            text: ['Radar vectors are an air traffic controller\'s way of telling aircraft to fly a specific magnetic heading. We can give aircraft radar',
                   'vectors in three ways. Usually, you will use "t l ###" or "t r ###". Be careful, as it is both easy',
                   'and dangerous to give a turn in the wrong direction. If the heading is only slightly left or right, to avoid choosing the wrong direction,',
                   'you can tell them to "fly heading" by typing "fh ###", and the aircraft will simply turn the shortest direction',
                   'to face that heading. You can also instruct an aircraft to turn left and right by a given number of degrees if you give only a two-digit number.'
            ].join(' '),
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Basic Control Instructions: Speed',
            text: ['Making good use of speed control can also help keep the pace manageable and allow you to carefully',
                'squeeze aircraft closer and closer to minimums while still maintaining safety. To enter speed instructions,',
                'use the "+" and "-" keys on the numpad or "sp", followed by the speed, in knots. Note that this assigned',
                'speed is indicated airspeed, and our radar scope can only display groundspeed; so, the values may be different.'
            ].join(' '),
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Proceed Direct',
            text: ['The proceed direct command ("pd") instructs an aircraft to go directly to a waypoint which already',
                'exists in their flight plan. For example, if an aircraft is flying to fixes [A, B, C, D, ...], issuing',
                'the command "pd B" will cause the aircraft to skip A and go directly to B, then to C, D, and the rest',
                'of their route.'
            ].join(' '),
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Bon voyage, aircraft!',
            text: ['When the aircraft leaves your airspace, it will switch to center and',
                   'automatically be removed from your flight strip bay.'
            ].join(' '),
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Arrivals',
            text: ['Now, onto arrivals. Click on any arriving aircraft in the radar screen; after you\'ve',
                   'selected it, use the altitude/heading/speed controls you\'ve learned in order to',
                   'guide it to the intercept of the ILS for the runway. The aircraft must be at an appropriate',
                   'altitude and flying an appropriate heading (more on this later) in order for it to catch the ILS and land!'
            ].join(' '),
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Approach Clearances',
            text: ['You can clear aircraft for an ILS approach with the "i" command, followed by a runway name.',
                   'When you do so, the aircraft will attempt to intercept the localiser, represented by the',
                   'extended centerline. Try giving radar vectors to aim the aircraft across the final approach course, with ',
                   'an intercept angle of 30 degrees or less, then tell them "i {RUNWAY}" to clear it for the ILS approach.',
                   'It should then guide itself down to the runway without any further input from us. If you have trouble,',
                   'get the airplane lower and have them join the approach further out from the airport.'
            ].join(' '),
            parse: (t) => {
                // This isn't robust. If there are multiple runways in use, or the arrival a/c has filed to land
                // elsewhere then the tutorial message will not be correct. However, it's not a bad guess, and hopefully
                // the player hasn't dicked with it too much.
                return t.replace('{RUNWAY}', AirportController.airport_get().arrivalRunwayModel.name);
            },
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Combining Instructions',
            text: ['You can combine as many commands into a single instruction as you\'d like, for example',
            '"caf cvs taxi 30C" for departures, "fh 250 d 30 i 26 - 180" for arrivals, or any other time you need.'
            ].join(' '),
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Projected Track Lines (PTLs)',
            text: ['Called "PTLs" in approach controls, and "vector lines" in centers, a useful tool is a line pointing',
                'directly ahead of an aircraft, whose length is determined by the aircraft\'s speed. To increment these',
                'PTLs up/down, use the F1/F2 keys, and they will be adjusted based on the increments specified in the',
                'settings menu.'
            ].join(' '),
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Range/Bearing Measurement Tool',
            text: ['To easily determine the heading/distance between two points/fixes/aircraft, simply hold the "Ctrl"',
                'button and left click two points. Pressing Shift+Ctrl will cause the click to snap to the nearest aircraft',
                'or fix. If snapped to an aircraft, a time will also be displayed, based on the aircraft\'s current speed.',
                'To clear all range/bearing lines, press the ESC key.'
            ].join(' '),
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Airport Guides & Command Reference',
            text: ['For further help on how any particular airport or command works, check out the airport guide',
                '(through the "?" menu), or see the <a title="openScope Command Reference" href="https://github.com/openscope/openscope/blob/develop/documentation/commands.md" target="_blank">openScope Command Reference</a>',
                'for a comprehensive list of the available aircraft and scope commands.'
            ].join(' '),
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'That\'s it!',
            text: ['Remember, minimum separation in an approach control is 3 miles laterally or 1000 feet vertically. Keep them separated,',
                   'keep them moving, and you\'ll be a controller in no time!'
            ].join(' '),
            side: 'left',
            position: tutorial_position
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
