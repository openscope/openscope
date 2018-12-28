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
            console.error('Event tracking is disabled because we couldn\'t find `gtag` on the window');

            return;
        }

        this._gtag = window.gtag;
    }

    /**
     * Send a custom event to google analytics
     *
     * @for EventTracker
     * @method recordEvent
     * @param category {TRACKABLE_EVENT}
     * @param action {string}
     * @param label {string}
     * @param value {string|null} [optional]
     */
    recordEvent(category, action, label, value = null) {
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

        return this._gtag('send', event);
    }

    /**
     * Track a click on an outbound link
     *
     * @for EventTracker
     * @method recordClickOnOutboundLink
     * @param url {string}
     */
    recordClickOnOutboundLink(url) {
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

        return this._gtag('send', event);
    }

    /**
     * @private
     * @method _isEnabled
     * @returns {boolean}
     */
    _isEnabled() {
        return typeof window.gtag !== 'undefined';
    }
}

export default new EventTracker();
