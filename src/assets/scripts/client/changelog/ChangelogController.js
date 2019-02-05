import $ from 'jquery';
import { SELECTORS } from '../constants/selectors';
import { STORAGE_KEY } from '../constants/storageKeys';

/**
 * A div template for the changelog for the container.
 * Compare to the container elements for option selection and airport switching.
 *
 * @property CHANGELOG_CONTAINER
 * @final
 */
const CHANGELOG_CONTAINER = '<div class="changelog-container nice-scrollbar"></div>';

/**
 * The HTML element for the changelog entries themselves.
 *
 * @property CHANGELOG_CONTENT
 * @final
 */
const CHANGELOG_CONTENT = '<p class="changelog"></p>';

/**
 * HTML element that allows the changelog to be dismissed.
 *
 * @property CHANGELOG_DISMISS
 * @final
 */
const CHANGELOG_DISMISS = '<a class="dismiss-changelog">Dismiss</a>';

/**
 * The controller class for the in-game changelog.
 *
 * @class ChangelogController
 */
export default class ChangelogController {
    /**
     * @constructor
     * @param {JQuery|HTMLElement} $element
     * @param {ContentQueue} contentQueue
     */
    constructor($element, contentQueue) {
        /**
         * Root DOM element
         *
         * @property $element
         * @type {JQuery|HTMLElement}
         */
        this.$element = $element;

        /**
         * The content queue, used to load in the changelog data
         *
         * @property contentQueue
         * @type {ContentQueue}
         */
        this.contentQueue = contentQueue;

        /**
         * Our changelog container element
         *
         * @property $changelogContainer
         * @type {JQuery|HTMLElement}
         */
        this.$changelogContainer = $(CHANGELOG_CONTAINER);

        /**
         * Changelog data element - where the text goes
         *
         * @property $changelogData
         * @type {JQuery|HTMLElement}
         */
        this.$changelogData = $(CHANGELOG_CONTENT);

        /**
         * The link at the bottom of the container to
         * dismiss the changelog.
         *
         * @property $changelogDismiss
         * @type {JQuery|HTMLElement}
         */
        this.$changelogDismiss = $(CHANGELOG_DISMISS);

        /**
         * Toggle selector for the changelog
         * You know, the button thing
         *
         * @property $changelogTrigger
         * @type {JQuery|HTMLElement}
         */
        this.$changelogTrigger = $(SELECTORS.DOM_SELECTORS.CHANGELOG_TOGGLE);

        /**
         * A string representation of the actual changelog.
         *
         * @property content
         * @type {String}
         */
        this.content = null;

        /**
         * The current version of openScope.
         *
         * @property version
         * @type {String}
         */
        this.version = null;

        /**
         * A boolean flag, to determine whether or not
         * we've loaded the changelog
         *
         * @property isLoaded
         * @type {Boolean}
         */
        this.isLoaded = false;

        this._setupHandlers()
            .enable();
    }

    /**
     * Sets up the event handlers
     *
     * @for ChangelogController
     * @method _setupHandlers
     * @private
     * @chainable
     */
    _setupHandlers() {
        this._onChangelogToggleHandler = this._onChangelogToggle.bind(this);

        this.$changelogTrigger.on('click', this._onChangelogToggleHandler);
        this.$changelogDismiss.on('click', this._onChangelogToggleHandler);

        return this;
    }

    /**
     * Sets the changelog data
     *
     * @for ChangelogController
     * @method enable
     */
    enable() {
        this.content = '<p>Loading...</p>';
        this.version = window.GLOBAL.VERSION;

        this.$changelogData.html(this.content);
        this.$changelogContainer.append(this.$changelogData);
        this.$changelogContainer.append(this.$changelogDismiss);
        this.$element.append(this.$changelogContainer);

        this.loadChangelogContent();
    }

    /**
     * Toggles visibility.
     *
     * @for ChangelogController
     * @method _onChangelogToggle
     * @private
     */
    _onChangelogToggle() {
        console.log('toggled changelog recieved')
        this.$changelogContainer.toggleClass(SELECTORS.CLASSNAMES.CHANGELOG_VISIBLE);
    }

    /**
     * Determines whether the user has played this version before,
     * and if the changelog should display on load.
     *
     * @for ChangelogController
     * @method _shouldToggleOnStart
     * @returns {Boolean} if the user has not played this version
     */
    _shouldToggleOnStart() {
        const lastPlayedVersion = localStorage[STORAGE_KEY.ATC_LAST_VERSION];
        const currentVersion = this.version;
        const shouldDisplayChangelog = lastPlayedVersion !== currentVersion;

        if (shouldDisplayChangelog) {
            localStorage[STORAGE_KEY.ATC_LAST_VERSION] = currentVersion;
        }

        return shouldDisplayChangelog;
    }

    /**
     * Calls a changelog loader asynchronously. Calls `load_complete` when
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

        changelogPromise.done((data, textStatus, jqXHR) => {
            this.content = data.changelog;
            this.load_complete();
        });
    }

    /**
     * Called when the changelog is loaded (the promise was resolved).
     *
     * @for ChangelogController
     * @method load_complete
     */
    load_complete() {
        this.isLoaded = true;
        this.$changelogData.html(this.content);

        if (this._shouldToggleOnStart()) {
            this._onChangelogToggle();
        }
    }
}