import _has from 'lodash/has';
import EventModel from './EventModel';

/**
 * Creates a static class that should be used for cross class communication.
 *
 * This alleviates the need for direct imports between classes. Instead, the class
 * that performs an action need only `trigger` and any listening classes can respond
 * with their own internal callback.
 *
 * As a rule, when this class is used it should be reassigned to an instance property `#eventBus`.
 *
 * Example:
 * - triggering class `this.eventBus.trigger('EVENT_NAME', DATA_TO_PASS)`
 * - responding class `this.eventBus.on('EVENT_NAME', this.onEventCallback)`
 *
 * @class EventBus
 */
class EventBus {
    /**
     * @constructor
     */
    constructor() {
        /**
         * Dictionary of `eventNames`
         *
         * @property _events
         * @type {object<string, EventModel>}
         * @default {}
         * @private
         */
        this._events = {};
    }

    /**
     * @for EventBus
     * @method destroy
     */
    destroy() {
        this._events = {};
    }

    /**
     * Register an event with a callback
     *
     * If an eventName already exists, add the observer to the observers list
     *
     * @for EventBus
     * @method on
     * @param eventName {string}   the name of an event
     * @param callback {function}  function to be called when an event is triggered
     */
    on(eventName, callback) {
        if (this.has(eventName)) {
            this._events[eventName].addObserver(callback);

            return;
        }

        this._events[eventName] = new EventModel(eventName);

        this._addObserver(eventName, callback);
    }

    /**
     * Remove a callback from the observers list
     *
     * When multiple observers exist, remove only the one callback from that list
     *
     * When `eventName` is the only observer, the event will be destroyed
     * and removed from `#_events`.
     *
     * @for EventBus
     * @method off
     * @param eventName {string}   the name of an event
     * @param callback {function}  function to remove from an events observers list
     */
    off(eventName, callback) {
        if (!this.has(eventName)) {
            return;
        }

        this._removeObserver(eventName, callback);

        if (this._events[eventName].observers.length < 1) {
            this._removeEventKey(eventName);
        }
    }

    /**
     * Trigger an event
     *
     * Will result in calling all of the observers listed for a particular
     * event with the provided argument(s)
     *
     * @for EventBus
     * @method trigger
     * @param eventName {string}
     * @param args {rest parameter}
     */
    trigger(eventName, ...args) {
        if (!this.has(eventName)) {
            return;
        }

        const { observers } = this._events[eventName];

        for (let i = 0; i < observers.length; i++) {
            observers[i](...args);
        }
    }

    /**
     * Boolean helper used to determine if `eventName` exists within `#_events`
     *
     * @for EventBus
     * @method has
     * @return {boolean}
     */
    has(eventName) {
        return _has(this._events, eventName);
    }

    /**
     * Add an observer to an event's observer list
     *
     * @for EventBus
     * @method _addObserver
     * @param eventName {string}
     * @param callback {function}
     * @private
     */
    _addObserver(eventName, callback) {
        this._events[eventName].addObserver(callback);
    }

    /**
     * Remove an observer from an event's observer list
     *
     * @for EventBus
     * @method _removeObserver
     * @param eventName {string}
     * @param callback {function}
     * @private
     */
    _removeObserver(eventName, callback) {
        this._events[eventName].removeObserver(callback);
    }

    /**
     * Remove a key from `#_events`
     *
     * This should only be called after the removal of the last observer
     * for an `eventName`.
     *
     * @for EventBus
     * @method _removeEventKey
     * @param eventName {string}
     * @private
     */
    _removeEventKey(eventName) {
        delete this._events[eventName];
    }
}

export default new EventBus();
