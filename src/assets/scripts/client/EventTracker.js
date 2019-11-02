import { TRACKABLE_EVENT } from './constants/trackableEvents';

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

    // TODO: UiController.onToggleTerrain() and other toggle methods seem to be expecting a
    // different order to these arguments, possibly screwing up the way events are reported to GA
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
            console.error('Event tracking is disabled because we couldn\'t find `gtag` on the window');

            return;
        }

        // using underscores here to match google analytics api
        const event = {
            event_category: category,
            event_action: action,
            event_label: label
        };

        if (value) {
            event.value = value;
        }

        return this._gtag('event', event.event_category, event);
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
            console.error('Event tracking is disabled because we couldn\'t find `gtag` on the window');

            return;
        }

        // using underscores here to match google analytics api
        const event = {
            event_category: TRACKABLE_EVENT.OUTBOUND,
            event_label: url,
            transport_type: 'beacon'
        };

        return this._gtag('event', 'click', event);
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
