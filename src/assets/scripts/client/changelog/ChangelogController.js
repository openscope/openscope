import $ from 'jquery';
import { SELECTORS } from '../constants/selectors';
import { STORAGE_KEY } from '../constants/storageKeys';

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
         * The content queue, used to load in the changelog data
         *
         * @property contentQueue
         * @type {ContentQueue}
         */
        this.contentQueue = contentQueue;

        /**
         * The DOM of the changelog container, containing version, data, and dismiss.
         *
         * @property $changelogContainer
         * @type {JQuery|HTMLElement}
         */
        this.$changelogContainer = $(SELECTORS.DOM_SELECTORS.CHANGELOG_CONTAINER);

        /**
         * The DOM element that displays the version above the changelog
         *
         * @property $changelogVersion
         * @type {JQuery|HTMLElement}
         */
        this.$changelogVersion = $(SELECTORS.DOM_SELECTORS.CHANGELOG_VERSION);

        /**
         * Changelog data element - where the text goes
         *
         * @property $changelogData
         * @type {JQuery|HTMLElement}
         */
        this.$changelogData = $(SELECTORS.DOM_SELECTORS.CHANGELOG_CONTENT);

        /**
         * The link at the bottom of the container to
         * dismiss the changelog.
         *
         * @property $changelogDismiss
         * @type {JQuery|HTMLElement}
         */
        this.$changelogDismiss = $(SELECTORS.DOM_SELECTORS.CHANGELOG_DISMISS);

        /**
         * Toggle selector for the changelog
         * You know, the button thing
         *
         * @property $changelogToggle
         * @type {JQuery|HTMLElement}
         */
        this.$changelogToggle = $(SELECTORS.DOM_SELECTORS.CHANGELOG_TOGGLE);

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

        this.$changelogToggle.on('click', this._onChangelogToggleHandler);
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

        this.$changelogVersion.text(`openScope v${this.version}`);
        this.$changelogData.html(this.content);

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
        this.$changelogContainer.toggleClass(SELECTORS.CLASSNAMES.CHANGELOG_VISIBLE);
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

        changelogPromise.done((data, textStatus, jqXHR) => {
            let loadedContent = data.changelog;

            // Strip out the version, as it's already in the title
            loadedContent = loadedContent.split('</h1>')[1];

            this.content = loadedContent;
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
}