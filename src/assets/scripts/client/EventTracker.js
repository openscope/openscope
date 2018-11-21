/**
 * Provide methods to send tracking events to google analytics
 *
 * Exported as a singleton
 *
 * @class EventTracker
 */
class EventTracker {
    /**
     * @for EventTracker
     * @constructor
     */
    constructor() {
        if (!this._isEnabled()) {
            console.error('Event tracking is disabled because we couldn\'t find `ga` on the window');

            return;
        }

        this._ga = window.ga;
    }

    /**
     * Send a custom event to google analytics
     *
     * @for EventTracker
     * @method trackEvent
     * @param category {TRACKABLE_EVENT}
     * @param action {string}
     * @param label {string}
     * @param value {string|null} [optional]
     */
    trackEvent(category, action, label, value = null) {
        if (!this._isEnabled()) {
            console.error('Event tracking is disabled because we couldn\'t find `ga` on the window');

            return;
        }

        const event = {
            hitType: 'event',
            eventCategory: category,
            eventAction: action,
            eventLabel: label
        };

        if (value) {
            event.value = value;
        }

        return this._ga('send', event);
    }

    /**
     * Track a click on an outbound link
     *
     * @for EventTracker
     * @method trackOutboundLink
     * @param url {string}
     */
    trackOutboundLink(url) {
        if (!this._isEnabled()) {
            console.error('Event tracking is disabled because we couldn\'t find `ga` on the window');

            return;
        }

        const event = {
            hitType: 'Outbound Link',
            eventCategory: 'click',
            eventAction: url,
            beacon: true
        };

        return this._ga('send', event);
    }

    /**
     * @private
     * @method _isEnabled
     * @returns {boolean}
     */
    _isEnabled() {
        return typeof window.ga !== 'undefined';
    }
}

export default new EventTracker();
