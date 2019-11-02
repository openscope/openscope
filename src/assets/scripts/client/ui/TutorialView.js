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
            text: ['Welcome to the OpenScope Air Traffic Control simulator. It\'s not easy',
                   'to control dozens of aircraft while maintaining safe distances',
                   'between them; to get started with the ATC simulator tutorial, click the arrow on',
                   'the right. You can click the graduation cap icon in the lower right corner',
                   'of the window at any time to close this tutorial.'
                ].join(' '),
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Moving Around',
            text: ['To move the middle of the radar screen, use the right click button and drag.',
                'Zoom in and out by scrolling, and press the middle mouse button or scroll wheel to reset the zoom.',
                'To select an aircraft when it is in flight, simply left-click.'
            ].join(' '),
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Departing aircraft',
            text: ['Let\'s route some planes out of here. On the right side of the screen, there',
                   'should be a strip with a blue bar on the left, meaning the strip represents a departing aircraft.',
                   'Click the first one ({CALLSIGN}). The aircraft\'s callsign will appear in the command entry box',
                   'and the strip will move slightly to the side. This means that the aircraft is selected.'
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
            text: ['Now type in "taxi {RUNWAY}" or "wait {RUNWAY}" into the command box after the callsign and hit Return;',
                   'the messages area above it will show that the aircraft is taxiing to runway ({RUNWAY}) in',
                   'preparation for takeoff.'
            ].join(' '),
            parse: (t) => {
                if (prop.aircraft.list.length < 0) {
                    return t;
                }

                return t.replace(/{RUNWAY}/g, departureAircraft.fms.departureRunwayModel.name);
            },
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Takeoff, part 1',
            text: ['When it appears at the start of runway ({RUNWAY}) (which may take a couple of seconds), click it (or press the up arrow once)',
                   'and type in "caf" (for "cleared as filed"). This tells the aircraft it is cleared to follow its flightplan.',
                   'Just as in real life, this step must be done before clearing the aircraft for takeoff, so they know where they\'re supposed to go.'
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
            title: 'Takeoff, part 2',
            text: ['Now the aircraft is ready for take off. Click the aircraft again (or press up arrow once)',
                   'and type "takeoff" (or "to") to clear the aircraft for take off.',
                   'Once it\'s going fast enough, it should lift off the ground and you should',
                   'see its altitude increasing. Meanwhile, read the next step.'
            ].join(' '),
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Aircraft strips, part 1',
            text: ['On the right, there\'s a row of strips, one for each aircraft. You may need to pull it out with the',
                   '\'|<\' tab. Each strip has a bar on its left side, colored blue for departures and red for arrivals.'
            ].join(' '),
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Aircraft strips, part 2',
            text: ['The strip is split into four parts: the left section shows te aircraft\'s callsign, model number',
                   '(in this case {MODEL}, representing {MODELNAME}), and computer identification number.',
                   'The next column has the aircraft\' transponder code, assigned altitude, and flight plan altitude',
                   'and the two rightmost blocks contain the departure airport code and flight plan route.'
            ].join(' '),
            parse: (t) => {
                if (prop.aircraft.list.length <= 0) {
                    return t;
                }

                return t.replace('{MODEL}', departureAircraft.model.icao)
                        .replace('{MODELNAME}', departureAircraft.model.name);
            },
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Moving aircraft',
            text: ['Once {CALLSIGN} has taken off, you\'ll notice it will climb to {INIT_ALT} by itself. This is one of the instructions ',
                    'we gave them when we cleared them "as filed". Aircraft perform better when they are able to climb directly',
                    'from the ground to their cruise altitude without leveling off, so let\'s keep them climbing! Click it and type "cvs" (for',
                    '"climb via SID"). Then they will follow the altitudes and speeds defined in the {SID_NAME} departure',
                    'procedure. Feel free to click the speedup button on the right side of the input box (it\'s two small arrows)',
                    'to watch the departure climb along the SID. Then just click it again to return to 1x speed.'
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
            title: 'Departure destinations',
            text: ['If you zoom out (using the mouse wheel) and click',
                   'on {CALLSIGN}, you will see a solid blue line that shows where they are heading. At the end of the',
                   'planned route is its "departure fix". Your goal is to get every departure cleared to their filed departure fix. As',
                   'you have probably noticed, this is very easy with SIDs, as the aircraft do all the hard work themselves.'
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
            text: ['Speed control is the TRACON controller\'s best friend. Making good use of speed control can help keep the pace manageable and allow',
                   'you to carefully squeeze aircraft closer and closer to minimums while still maintaining safety. To enter speed instructions, use the',
                   '"+" and "-" keys on the numpad, followed by the speed, in knots. Note that this assigned speed is indicated',
                   'airspeed, and our radar scope can only display groundspeed; so, the values may be different.'
            ].join(' '),
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Route',
            text: ['Instead of guiding each aircraft based on heading, you can also clear each aircraft to proceed to a fix or navaid (shown on the map',
                   'as a small triangle). Just use the command "route" and the name of a fix, and the aircraft will fly to it. Upon passing the',
                   'fix, it will continue flying along its present heading.'
            ].join(' '),
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Proceed Direct',
            text: ['The proceed direct command "pd" instructs an aircraft to go directly to a waypoint in the flight plan. For example, if an',
                   'aircraft is flying to fixes [A, B, C], issuing the command "pd B" will cause the aircraft to go to B, then C.'
            ].join(' '),
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Bon voyage, aircraft!',
            text: ['When the aircraft crosses the airspace boundary, it will ',
                   'automatically remove itself from the flight strip bay on the right.',
                   'Congratulations, you\'ve successfully taken off one aircraft.'
            ].join(' '),
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Arrivals',
            text: ['Now, onto arrivals. Click on any arriving aircraft in the radar screen; after',
                   'you\'ve selected it, use the altitude/heading/speed controls you\'ve learned in',
                   'order to guide it to be in front of a runway. Make sure to get the aircraft down to',
                   'around 4,000ft, and 10-15 nautical miles (2-3 range rings) away from the airport.',
                   'While you work the airplane, read the next step.'
            ].join(' '),
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Approach Clearances, part 1',
            text: ['You can clear aircraft for an ILS approach with the "ILS" command, followed by a runway name.',
                   'When you do so, the aircraft will try to find a route that intercepts the localiser, represented by the',
                   'extended centerline. Try giving radar vectors to get the aircraft on shallow intercept with this marking',
                   'and then issue the instruction "i {RUNWAY}" to clear it to land. It should then guide itself',
                   'the rest of the way to the runway, managing its own height and direction.'
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
            title: 'Approach Clearances, part 2',
            text: ['You may choose to enter one command at a time, but air traffic controllers usually do multiple. Particularly in approach clearances,',
                   'they follow an acronym "PTAC" for the four elements of an approach clearance, the "T" and "C" of which',
                   'stand for "Turn" and "Clearance", both of which we entered separately in this tutorial. Though longer, it is both ',
                   'easier and more real-world accurate to enter them together, like this: "fh 250 i 28r".'
            ].join(' '),
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            // TODO: the windsock will be moving soon. Update this when that happens
            title: 'Wind sock',
            text: ['In the lower right corner of the map is a small circle with a line. You may need to collapse the',
                   'the flight strips with the \'>|\' tab. It\'s like a flag: the line trails in the direction',
                   'the wind is blowing toward. If it\'s pointing straight down, the wind is blowing from the North',
                   'to the South. Aircraft must be assigned to different runways such that they always take off and land into the wind, unless the',
                   'wind is less than 5 knots.'
            ].join(' '),
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Scope Commands',
            text: ['There are also various commands that can be entered into your "scope" which deal with moving',
                   'aircraft data blocks (labels), transferring control of aircraft, etc. To toggle between aircraft',
                   'commands and scope commands, press the tab key.'
            ].join(' '),
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Score',
            text: ['The lower-right corner of the page has a small number in it; this is your score.',
                   'Whenever you successfully route an aircraft to the ground or out of the screen, you earn points. As you make mistakes,',
                   'like directing aircraft to a runway with a strong crosswind/tailwind, losing separation between aircraft, or ignoring an',
                   'aircraft, you will also lose points. If you\'d like, you can just ignore the score; it doesn\'t have any effect',
                   'with the simulation.'
            ].join(' '),
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Good job!',
            text: ['If you\'ve gone through this entire tutorial, you should do pretty well with the pressure.',
                   'In the TRACON, minimum separation is 3 miles laterally or 1000 feet vertically. Keep them separated,',
                   'keep them moving, and you\'ll be a controller in no time!',
                   'A full list of commands can be found <a title="openScope Command Reference" href="https://github.com/openscope/openscope/blob/develop/documentation/commands.md" target="_blank">here</a>.'
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
