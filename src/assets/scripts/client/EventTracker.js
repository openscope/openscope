// typescript

class EventTracker {

    get _isEnabled() {
        return typeof window.ga !== 'undefined';
    }

    constructor() {
        if (!this._isEnabled) {
            console.error('Event tracking is disabled because we couldn\'t find `ga` on the window');

            return;
        }

        this._ga = window.ga;
    }

    sendEvent(category, action, label, value = null) {
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
}

export default new EventTracker();
