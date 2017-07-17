import { INVALID_INDEX } from '../constants/globalConstants';

/**
 * Defines an event and an event's observers
 *
 * Should be used by the `EventBus` when defining new events
 *
 * @class EventModel
 */
export default class EventModel {
    /**
     * @constructor
     * @param name {string}
     */
    constructor(name) {
        /**
         * The name of an event
         *
         * @property name
         * @type {string}
         * @default ''
         */
        this.name = '';

        /**
         * Functions that will be called when this event is triggered
         *
         * @property observers
         * @type {*[]}
         * @default []
         */
        this.observers = [];

        this.init(name);
    }

    /**
     * @for EventModel
     * @method init
     * @param  name {string}
     */
    init(name) {
        this.name = name;
    }

    /**
     * @for EventModel
     * @method destroy
     */
    destroy() {
        this.name = '';
        this.observers = [];
    }

    /**
     * add a callback(s) that fires when an event is triggered
     *
     * @for EventModel
     * @method addObserver
     * @param observer
     */
    addObserver(observer) {
        if (this.hasObserver(observer)) {
            return;
        }

        this.observers.push(observer);
    }

    /**
     * remove an observer from the observers list
     *
     * @for EventModel
     * @method removeObserver
     * @param  observer
     */
    removeObserver(observer) {
        if (!this.hasObserver(observer)) {
            return;
        }

        const index = this.observers.indexOf(observer);
        this.observers.splice(index, 1);
    }

    /**
     * Determine if a passed observer exists within the current observer list
     *
     * @for EventModel
     * @method hasObserver
     * @param observer {function}
     * @return {boolean}
     */
    hasObserver(observer) {
        return this.observers.indexOf(observer) !== INVALID_INDEX;
    }
}
