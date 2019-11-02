import $ from 'jquery';
import EventBus from '../lib/EventBus';
import { SELECTORS } from '../constants/selectors';
import { STORAGE_KEY } from '../constants/storageKeys';
import { EVENT } from '../constants/eventNames';

/**
 * The controller class for the in-game changelog.
 *
 * @class ChangelogController
 */
export default class ChangelogController {
    /**
     * @constructor
     * @param {ContentQueue} contentQueue
     */
    constructor(contentQueue) {
        /**
         * A string representation of the actual changelog.
         *
         * @property content
         * @type {String}
         */
        this.content = null;

        /**
         * The content queue, used to load in the changelog data
         *
         * @property contentQueue
         * @type {ContentQueue}
         */
        this.contentQueue = null;

        /**
         * The DOM of the changelog container, containing version, data, and dismiss.
         *
         * @property $changelogContainer
         * @type {JQuery|HTMLElement}
         */
        this.$changelogContainer = null;

        /**
         * Changelog data element - where the text goes
         *
         * @property $changelogData
         * @type {JQuery|HTMLElement}
         */
        this.$changelogData = null;

        /**
         * Toggle selector for the changelog
         * You know, the button thing
         *
         * @property $changelogToggle
         * @type {JQuery|HTMLElement}
         */
        this.$changelogToggle = null;

        /**
         * local reference to the EventBus
         *
         * @property _eventBus
         * @type {EventBus}
         */
        this._eventBus = null;

        this.init(contentQueue);
    }

    // ------------------------------ LIFECYCLE ------------------------------

    /**
     * @for ChangelogController
     * @method init
     * @chainable
     */
    init(contentQueue) {
        this.content = '<p>Loading...</p>';
        this.contentQueue = contentQueue;
        this._eventBus = EventBus;

        this._createChildren();
        this.$changelogData.html(this.content);
        this._createHandlers();
        this.enable();
        this.loadChangelogContent();

        return this;
    }

    /**
     * @for ChangelogController
     * @method reset
     * @chainable
     */
    reset() {
        this.content = null;
        this.contentQueue = null;
        this.$changelogContainer = null;
        this.$changelogData = null;
        this.$changelogToggle = null;
        this._eventBus = null;

        this._resetHandlers();
        this.disable();

        return this;
    }

    /**
     * @for ChangelogController
     * @method enable
     */
    enable() {
        this._eventBus.on(EVENT.TOGGLE_CHANGELOG, this._onChangelogToggleHandler);
    }

    /**
     * @for ChangelogController
     * @method disable
     */
    disable() {
        this.$changelogToggle.off(EVENT.TOGGLE_CHANGELOG, this._onChangelogToggleHandler);
    }

    /**
     * Sets up the DOM class properties
     *
     * @for ChangelogController
     * @method _createChildren
     * @private
     * @chainable
     */
    _createChildren() {
        this.$changelogContainer = $(SELECTORS.DOM_SELECTORS.CHANGELOG_CONTAINER);
        this.$changelogData = $(SELECTORS.DOM_SELECTORS.CHANGELOG_CONTENT);
        this.$changelogToggle = $(SELECTORS.DOM_SELECTORS.TOGGLE_CHANGELOG);

        return this;
    }

    /**
     * Sets up the event handlers
     *
     * @for ChangelogController
     * @method _createHandlers
     * @private
     * @chainable
     */
    _createHandlers() {
        this._onChangelogToggleHandler = this._onChangelogToggle.bind(this);

        return this;
    }


    /**
     * Sets up the event handlers
     *
     * @for ChangelogController
     * @method _resetHandlers
     * @private
     * @chainable
     */
    _resetHandlers() {
        this._onChangelogToggleHandler = null;

        return this;
    }

    // ------------------------------ PUBLIC ------------------------------

    /**
     * Calls a changelog loader asynchronously. Calls `onLoadComplete` when
     * the changelog data is successfully loaded. Stores data in
     * `this.content`.
     *
     * @for ChangelogController
     * @method loadChangelogContent
     */
    loadChangelogContent() {
        const options = {
            url: 'assets/changelog.json',
            immediate: true
        };
        const changelogPromise = this.contentQueue.add(options);

        changelogPromise.done((data /* , textStatus, jqXHR */) => {
            this.content = data.changelog;
            this.onLoadComplete();
        });
    }

    /**
     * Called when the changelog is loaded (the promise was resolved) as the
     * callback from the deferred promise.
     *
     * @for ChangelogController
     * @method onLoadComplete
     */
    onLoadComplete() {
        this.isLoaded = true;
        this.$changelogData.html(this.content);

        if (this._shouldShowOnLoad()) {
            this._onChangelogToggle();
        }
    }

    // ------------------------------ PRIVATE ------------------------------

    /**
     * Toggles visibility.
     *
     * @for ChangelogController
     * @method _onChangelogToggle
     * @private
     */
    _onChangelogToggle() {
        this.$changelogToggle.toggleClass(SELECTORS.CLASSNAMES.ACTIVE);
        this.$changelogContainer.toggleClass(SELECTORS.CLASSNAMES.OPEN);
    }

    /**
     * Determines whether the user has played this version before,
     * and if the changelog should display on load.
     *
     * @for ChangelogController
     * @method _shouldShowOnLoad
     * @returns {Boolean} if the user has not played this version
     */
    _shouldShowOnLoad() {
        const lastPlayedVersion = localStorage[STORAGE_KEY.ATC_LAST_VERSION];
        const currentVersion = this.version;
        const shouldDisplayChangelog = lastPlayedVersion !== currentVersion;

        if (shouldDisplayChangelog) {
            localStorage[STORAGE_KEY.ATC_LAST_VERSION] = currentVersion;
        }

        return shouldDisplayChangelog;
    }
}
