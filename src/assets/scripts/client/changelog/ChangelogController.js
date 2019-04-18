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
        this.$changelogContainer = null;

        /**
         * Changelog data element - where the text goes
         *
         * @property $changelogData
         * @type {JQuery|HTMLElement}
         */
        this.$changelogData = null;

        /**
         * The link at the bottom of the container to
         * dismiss the changelog.
         *
         * @property $changelogDismiss
         * @type {JQuery|HTMLElement}
         */
        this.$changelogDismiss = null;

        /**
         * Toggle selector for the changelog
         * You know, the button thing
         *
         * @property $changelogToggle
         * @type {JQuery|HTMLElement}
         */
        this.$changelogToggle = null;

        /**
         * A string representation of the actual changelog.
         *
         * @property content
         * @type {String}
         */
        this.content = null;

        this.init()
            ._createChildren()
            ._setupHandlers()
            .enable();
    }

    /**
     * Init method
     *
     * @for ChangelogController
     * @method init
     * @chainable
     */
    init() {
        return this;
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
        this.$changelogDismiss = $(SELECTORS.DOM_SELECTORS.CHANGELOG_DISMISS);
        this.$changelogToggle = $(SELECTORS.DOM_SELECTORS.CHANGELOG_TOGGLE);

        return this;
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

        return this;
    }

    /**
     * Sets the changelog data
     *
     * @for ChangelogController
     * @method enable
     */
    enable() {
        this.$changelogToggle.on('click', this._onChangelogToggleHandler);
        this.$changelogDismiss.on('click', this._onChangelogToggleHandler);

        this.content = '<p>Loading...</p>';
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
        this.$changelogToggle.toggleClass(SELECTORS.CLASSNAMES.ACTIVE);
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
}
