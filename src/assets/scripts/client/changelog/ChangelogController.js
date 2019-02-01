import $ from 'jquery';
import { changelogContent } from './changelogContent';
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
 * Dismisses the changelog
 */

/**
 * The controller class for the in-game changelog.
 *
 * @class ChangelogController
 */
export default class ChangelogController {
    /**
     * @constructor
     */
    constructor($element) {
        /**
         * Root DOM element
         *
         * @property $element
         * @type {JQuery|HTMLElement}
         */
        this.$element = $element;

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
        this.$changelogTrigger = $(SELECTORS.CLASSNAMES.CHANGELOG_TOGGLE);

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
        this.content = changelogContent;
        this.version = window.GLOBAL.VERSION;

        this.$changelogData.html(this.content);
        this.$changelogContainer.append(this.$changelogData);
        this.$changelogContainer.append(this.$changelogDismiss);
        this.$element.append(this.$changelogContainer);

        if (this._shouldToggleOnStart()) {
            this._onChangelogToggle();
        }
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
}