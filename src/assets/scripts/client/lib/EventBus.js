import _has from 'lodash/has';
import EventModel from './EventModel';

/**
 *
 *
 */
class EventBus {
    /**
     * @constructor
     */
    constructor() {
        /**
         * @property _events
         * @type {object}
         * @default {}
         * @private
         */
        this._events = {};
    }

    /**
     *
     * @for EventBus
     * @method destroy
     */
    destroy() {
        this._events = {};
    }

    /**
     * register and event with a callback
     *
     * if an eventName already exists, add the observer to the observers list
     *
     * @for EventBus
     * @method on
     */
    on(eventName, callback) {
        if (this.has(eventName)) {
            this._events[eventName].addObserver(callback);

            return;
        }

        this._events[eventName] = new EventModel(eventName);
        this._events[eventName].addObserver(callback);
    }

    /**
     *
     * remove a a callback from the observers list
     *
     * if multiple observers exist, remove only the one callback from that list
     *
     * in a full implementation, if this is the only observer, the event should be destroyed
     * and removed from this._events too.
     *
     * @for EventBus
     * @method off
     */
    off(eventName, callback) {
        if (!this.has(eventName)) {
            return;
        }

        this._events[eventName].removeObserver(callback);
    }

    /**
     *
     * trigger an event
     *
     * will result in calling all of the observers listed for a particular
     * event with the provided arguments
     *
     * @for EventBus
     * @method trigger
     */
    trigger(eventName, args) {
        const event = this._events[eventName];
        const observers = event.observers;
        const length = observers.length;

        for (let i = 0; i < length; i++) {
            observers[i](args);
        }
    }

    /**
     *
     * @for EventBus
     * @method has
     * @return {boolean}
     */
    has(eventName) {
        return _has(this._events, eventName);
    }
}

export default new EventBus();
