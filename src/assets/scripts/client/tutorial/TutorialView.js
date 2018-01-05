/* eslint-disable max-len, no-undef, indent */
import $ from 'jquery';
import _has from 'lodash/has';
import AirportController from '../airport/AirportController';
import EventBus from '../lib/EventBus';
import TimeKeeper from '../engine/TimeKeeper';
import TutorialStep from './TutorialStep';
import { round, clamp } from '../math/core';
import { heading_to_string } from '../utilities/unitConverters';
import { EVENT } from '../constants/eventNames';
import { STORAGE_KEY } from '../constants/storageKeys';
import { SELECTORS } from '../constants/selectors';

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
         * @property $tutorialToggle
         * @type {jquery|HTML Element}
         * @default `.toggle-tutorial`
         */
        this.$tutorialToggle = null;

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

        prop.tutorial = tutorial;
        this.tutorial = tutorial;
        this.tutorial.steps = [];
        this.tutorial.step = 0;
        this.tutorial.open = false;

        this._init()
            .layout()
            .enable();
    }

    /**
     * Lifecycle method should be run once on application init.
     *
     * Caches selectors in variabls so they only need to be looked up one time.
     *
     * @for tutorialView
     * @method _init
     * @chainable
     */
    _init() {
        this.$tutorialView = $(TUTORIAL_TEMPLATE);
        this.$tutorialToggle = $(SELECTORS.DOM_SELECTORS.TOGGLE_TUTORIAL);
        this.$tutorialPrevious = this.$tutorialView.find(SELECTORS.DOM_SELECTORS.PREV);
        this.$tutorialNext = this.$tutorialView.find(SELECTORS.DOM_SELECTORS.NEXT);

        return this;
    }

    /**
     * Lifecycle method should be run once on application init.
     *
     * Adds the TUTORIAL_TEMPLATE to the view
     *
     * @for tutorialView
     * @method layout
     * @chainable
     */
    layout() {
        if (!this.$element) {
            throw new Error('Expected $element to be defined. `body` tag does not exist in the DOM');
        }

        prop.tutorial.html = this.$tutorialView;
        this.$element.append(this.$tutorialView);

        return this;
    }

    /**
     * Lifecycle method should be run once on application init.
     *
     * @for tutorialView
     * @method enable
     * @chainable
     */
    enable() {
        this._eventBus.on(EVENT.TOGGLE_TUTORIAL, this.tutorial_toggle);

        this.$tutorialPrevious.on('click', (event) => this.tutorial_prev(event));
        this.$tutorialNext.on('click', (event) => this.tutorial_next(event));

        return this;
    }

    /**
     * Disable any click handlers.
     *
     * @for tutorialView
     * @method disable
     * @chainable
     */
    disable() {
        this._eventBus.off(EVENT.TOGGLE_TUTORIAL, this.tutorial_toggle);

        this.$tutorialPrevious.off('click', (event) => this.tutorial_prev(event));
        this.$tutorialNext.off('click', (event) => this.tutorial_next(event));

        return this.destroy();
    }

    /**
     * Tear down the view and unset any properties.
     *
     * @for tutorialView
     * @method destroy
     * @chainable
     */
    destroy() {
        this.$tutorialView = null;
        this.$tutorialToggle = null;
        this.$tutorialPrevious = null;
        this.$tutorialNext = null;

        this.tutorial = {};
        this.tutorial.steps = [];
        this.tutorial.step = 0;
        this.tutorial.open = false;

        return this;
    }

    /**
     * @for TutorialView
     * @method tutorial_init_pre
     */
    tutorial_init_pre() {
        prop.tutorial = {};
        prop.tutorial.steps = [];
        prop.tutorial.step = 0;
        prop.tutorial.open = false;

        const tutorial_position = [0.1, 0.85];
        const departureAircraft = prop.aircraft.list.filter((aircraftModel) => aircraftModel.isDeparture())[0];

        this.tutorial_step({
            title: 'Welcome!',
            text: ['Welcome to Air Traffic Control simulator. It&rsquo;s not easy',
                   'to control dozens of aircraft while maintaining safe distances',
                   'between them; to get started with the ATC simulator tutorial, click the arrow on',
                   'the right. You can also click the graduation cap icon in the lower right corner',
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
            text: ['Let&rsquo;s route some planes out of here. On the right side of the screen, there',
                   'should be a strip with a blue bar on the left, meaning the strip represents a departing aircraft.',
                   'Click the first one ({CALLSIGN}). The aircraft&rsquo;s callsign will appear in the command entry box',
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
            text: ['Now type in &lsquo;taxi&rsquo; or &lsquo;wait&rsquo; into the command box after the callsign and hit Return;',
                   'the messages area above it will show that the aircraft is taxiing to runway ({RUNWAY}) in',
                   'preparation for takeoff. (You could also specify to which runway to taxi the aircraft by',
                   'entering the runway name after &lsquo;taxi&rsquo; or &lsquo;wait&rsquo;.)'
               ].join(' '),
            parse: (t) => {
                if (prop.aircraft.list.length < 0) {
                    return t;
                }

                return t.replace('{RUNWAY}', departureAircraft.fms.currentRunwayName);
            },
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Takeoff, part 1',
            text: ['When it appears at the start of runway ({RUNWAY}) (which may take a couple of seconds), click it (or press the up arrow once)',
                   'and type in &lsquo;caf&rsquo; (for &lsquo;cleared as filed&rsquo;). This tells the aircraft it is cleared to follow its flightplan.',
                   'Just as in real life, this step must be done before clearing the aircraft for takeoff, so they know where they\'re supposed to go.'
                ].join(' '),
            parse: (t) => {
                if (prop.aircraft.list.length <= 0) {
                    return t;
                }

                return t.replace('{RUNWAY}', departureAircraft.fms.currentRunwayName);
            },
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Takeoff, part 2',
            text: ['Now the aircraft is ready for take off. Click the aircraft again (or press up arrow once)',
                   'and type &lsquo;takeoff&rsquo; (or &lsquo;to&rsquo;) to clear the aircraft for take off.',
                   'Once it\'s going fast enough, it should lift off the ground and you should',
                   'see its altitude increasing. Meanwhile, read the next step.'
            ].join(' '),
            parse: (t) => {
                if (prop.aircraft.list.length <= 0) {
                    return t;
                }

                return t.replace('{RUNWAY}', departureAircraft.fms.currentRunwayName);
            },
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Aircraft strips, part 1',
            text: ['On the right, there&rsquo;s a row of strips, one for each aircraft.',
                   'Each strip has a bar on its left side, colored blue for departures and',
                   'red for arrivals.'
            ].join(' '),
            parse: (t) => {
                if (prop.aircraft.list.length <= 0) {
                    return t;
                }

                return t.replace('{RUNWAY}', departureAircraft.fms.currentRunwayName);
            },
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Aircraft strips, part 2',
            text: ['The top row shows the aircraft&rsquo;s callsign, what it\'s doing (parked at apron,',
                   'using a runway, flying to a fix, on a heading, etc), and its assigned altitude. The bottom row shows the model',
                   '({MODEL} here, which is a {MODELNAME}) to the left, its destination in the middle, and its assigned speed to the right.'
            ].join(' '),
            parse: (t) => {
                if (prop.aircraft.list.length <= 0) {
                    return t;
                }

                return t.replace('{MODEL}', departureAircraft.model.icao).replace('{MODELNAME}', departureAircraft.model.name);
            },
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Moving aircraft',
            text: ['Once {CALLSIGN} has taken off, you\'ll notice it will climb to {INIT_ALT} by itself. This is one of the instructions ',
                    'we gave them when we cleared them &lsquo;as filed&rsquo;. Aircraft perform better when they are able to climb directly',
                    'from the ground to their cruise altitude without leveling off, so let\'s keep them climbing! Click it and type &lsquo;cvs&rsquo; (for',
                    '&lsquo;climb via SID&rsquo;). Then they will follow the altitudes and speeds defined in the {SID_NAME} departure',
                    'procedure. Feel free to click the speedup button on the right side of the input box (it&rsquo;s two small arrows)',
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
                   'on {CALLSIGN}, you will see a blue dashed line that shows where they are heading. At the end of the',
                   'line is its &lsquo;departure fix&rsquo;. Your goal is to get every departure cleared to their filed departure fix. As',
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
            text: ['You can assign altitudes with the &lsquo;climb&rsquo; command, or any of its aliases (other words that',
                   'act identically). Running the command &lsquo;climb&rsquo; is the same as the commands &lsquo;descend&rsquo;, &lsquo;d&rsquo;,',
                   '&lsquo;clear&rsquo;, &lsquo;c&rsquo;, &lsquo;altitude&rsquo;, or &lsquo;a&rsquo;. Just use whichever feels correct in your situation.',
                   'Remember, just as in real ATC, altitudes are ALWAYS written in hundreds of feet, eg. &lsquo;descend 30&rsquo; for 3,000ft or &lsquo;climb',
                   ' 100&rsquo; for 10,000ft.'
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
            title: 'Basic Control Instructions: Radar Vectors',
            text: ['Radar vectors are an air traffic controller\'s way of telling aircraft to fly a specific magnetic heading. We can give aircraft radar',
                   'vectors in three ways. Usually, you will use &lsquo;t l ###&rsquo; or &lsquo;t r ###&rsquo;. Be careful, as it is both easy',
                   'and dangerous to give a turn in the wrong direction. If the heading is only slightly left or right, to avoid choosing the wrong direction,',
                   'you can tell them to &lsquo;fly heading&rsquo; by typing &lsquo;fh ###&rsquo;, and the aircraft will simply turn the shortest direction',
                   'to face that heading.'
               ].join(' '),
            parse: (v) => v,
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Basic Control Instructions: Speed',
            text: ['Speed control is the TRACON controller\'s best friend. Making good use of speed control can help keep the pace manageable and allow',
                   'you to carefully squeeze aircraft closer and closer to minimums while still maintaining safety. To enter speed instructions, use the',
                   '&lsquo;+&rsquo; and &lsquo;-&rsquo; keys on the numpad, followed by the speed, in knots. Note that this assigned speed is indicated',
                   'airspeed, and our radar scope can only display groundspeed; so, the values may be different.'
            ].join(' '),
            parse: (t) => {
                if (prop.aircraft.list.length <= 0) {
                    return t;
                }

                return t.replace(/{ANGLE}/g, heading_to_string(departureAircraft.destination));
            },
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Route',
            text: ['Instead of guiding each aircraft based on heading, you can also clear each aircraft to proceed to a fix or navaid (shown on the map',
                   'as a small triangle). Just use the command &lsquo;route&rsquo; and the name of a fix, and the aircraft will fly to it. Upon passing the',
                   'fix, it will continue flying along its present heading.'
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
            title: 'Proceed Direct',
            text: ['The proceed direct command &lsquo;pd&rsquo; instructs an aircraft to go directly to a waypoint in the flight plan. For example, if an',
                   'aircraft is flying to fixes [A, B, C], issuing the command &lsquo;pd B&rsquo; will cause the aircraft to go to B, then C.'
               ].join(' '),
            parse: (t) => {
                if (prop.aircraft.list.length <= 0) {
                    return t;
                }

                return t.replace('{CALLSIGN}', prop.aircraft.list[0].callsign);
            },
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Bon voyage, aircraft!',
            text: ['When the aircraft crosses the airspace boundary, it will ',
                   'automatically remove itself from the flight strip bay on the right.',
                   'Congratulations, you&rsquo;ve successfully taken off one aircraft.'
               ].join(' '),
            parse: (v) => v,
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Arrivals',
            text: ['Now, onto arrivals. Click on any arriving aircraft in the radar screen; after',
                   'you&rsquo;ve selected it, use the altitude/heading/speed controls you\'ve learned in',
                   'order to guide it to be in front of a runway. Make sure to get the aircraft down to',
                   'around 4,000ft, and 10-15 nautical miles (2-3 range rings) away from the airport.',
                   'While you work the airplane, read the next step.'
               ].join(' '),
            parse: (v) => v,
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Approach Clearances, part 1',
            text: ['You can clear aircraft for an ILS approach with the &quot;ILS&quot; command, followed by a runway name. Before you can do so, however,',
                   'it must be on a heading that will cross the runway\'s extended centerline, that is no more than 30 degrees offset from the',
                   'runway\'s heading. Once we eventually give them an approach clearance, you can expect aircraft to capture the ILS\'s localizer',
                   'once they\'re within a few degrees of the extended centerline.'
               ].join(' '),
            parse: (v) => v,
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Approach Clearances, part 2',
            text: ['When you have the aircraft facing the right direction, just select it and type &lsquo;i &lt;runway&gt;&rsquo;',
                   'with the runway that&rsquo;s in front of it. Once it\'s close enough to capture the localizer, the assigned altitude on its strip',
                   'will change to &lsquo;ILS locked&rsquo; (meaning the aircraft is capable of guiding itself down to the runway via',
                   'the Instrument Landing System), and the assigned heading should now show the runway to which it has an approach clearance.'
               ].join(' '),
            parse: (v) => v,
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Approach Clearances, part 3',
            text: ['You may choose to enter one command at a time, but air traffic controllers usually do multiple. Particularly in approach clearances,',
                   'they follow an acronym &ldquo;PTAC&rdquo; for the four elements of an approach clearance, the &lsquo;T&rsquo; and &lsquo;C&rsquo; of which',
                   'stand for &lsquo;Turn&rsquo; and &lsquo;Clearance&rsquo;, both of which we entered separately in this tutorial. Though longer, it is both ',
                   'easier and more real-world accurate to enter them together, like this: &lsquo;fh 250 i 28r&rsquo;.'
               ].join(' '),
            parse: (v) => v,
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Wind sock',
            text: ['In the lower right corner of the map is a small circle with a line. It\'s like a flag: the line trails in the direction',
                   'the wind is blowing toward. If it&rsquo;s pointing straight down, the wind is blowing from the North',
                   'to the South. Aircraft must be assigned to different runways such that they always take off and land into the wind, unless the',
                   'wind is less than 5 knots.'
               ].join(' '),
            parse: (v) => v,
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Scope Commands',
            text: ['There are also various commands that can be entered into your "scope" which deal with moving ' +
                'aircraft data blocks (labels), transferring control of aircraft, etc. To toggle between aircraft ' +
                'commands and scope commands, press the tab key.'
               ].join(' '),
            parse: (v) => v,
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Score',
            text: ['The lower-right corner of the page has a small number in it; this is your score.',
                   'Whenever you successfully route an aircraft to the ground or out of the screen, you earn points. As you make mistakes,',
                   'like directing aircraft to a runway with a strong crosswind/tailwind, losing separation between aircraft, or ignoring an',
                   'aircraft, you will also lose points. If you&rsquo;d like, you can just ignore the score; it doesn&rsquo;t have any effect',
                   'with the simulation.'
               ].join(' '),
            parse: (v) => v,
            side: 'left',
            position: tutorial_position
        });

        this.tutorial_step({
            title: 'Good job!',
            text: ['If you&rsquo;ve gone through this entire tutorial, you should do pretty well with the pressure.',
                   'In the TRACON, minimum separation is 3 miles laterally or 1000 feet vertically. Keep them separated,',
                   'keep them moving, and you\'ll be a controller in no time!',
                   'A full list of commands can be found <a title="Command Reference | Openscope Wiki" href="https://github.com/openscope/openscope/wiki/Command-Reference">here</a>.'
               ].join(' '),
            parse: (v) => v,
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
    tutorial_toggle = () => {
        if (prop.tutorial.open) {
            this.tutorial_close();

            return;
        }

        this.tutorial_open();
    };

    /**
     * @method tutorial_get
     */
    tutorial_get(step = null) {
        if (!step) {
            step = prop.tutorial.step;
        }

        return prop.tutorial.steps[step];
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
        prop.tutorial.steps.push(new TutorialStep(options));
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
        prop.tutorial.open = true;

        this.$tutorialView.addClass(SELECTORS.CLASSNAMES.OPEN);
        this.$tutorialToggle.addClass(SELECTORS.CLASSNAMES.ACTIVE);
        this.$tutorialToggle.prop('title', 'Close tutorial');

        this.tutorial_update_content();
    }

    /**
     * @method tutorial_close
     */
    tutorial_close() {
        prop.tutorial.open = false;

        this.$tutorialView.removeClass(SELECTORS.CLASSNAMES.OPEN);
        this.$tutorialToggle.removeClass(SELECTORS.CLASSNAMES.ACTIVE);
        this.$tutorialToggle.prop('title', 'Open tutorial');

        this.tutorial_move();
    }

    // TODO: this function never gets called in this file
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
        if (prop.tutorial.step === prop.tutorial.steps.length - 1) {
            this.tutorial_close();

            return;
        }

        prop.tutorial.step = clamp(0, prop.tutorial.step + 1, prop.tutorial.steps.length - 1);

        this.tutorial_update_content();
    }

    /**
     * @method tutorial_prev
     */
    tutorial_prev() {
        prop.tutorial.step = clamp(0, prop.tutorial.step - 1, prop.tutorial.steps.length - 1);

        this.tutorial_update_content();
    }

    // TODO: this function never gets called in this file
    /**
     * @method tutorial_resize
     */
    tutorial_resize() {
        this.tutorial_move();
    }
}
