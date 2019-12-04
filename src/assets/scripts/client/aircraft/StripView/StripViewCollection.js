import _find from 'lodash/find';
import _without from 'lodash/without';
import BaseCollection from '../../base/BaseCollection';
import EventBus from '../../lib/EventBus';
import { EVENT } from '../../constants/eventNames';

/**
 * Collection used to manage `StripViewModel` objects
 *
 * @class StripViewCollection
 * @extends BaseCollection
 */
export default class StripViewCollection extends BaseCollection {
    /**
     *
     * @constructor
     */
    constructor() {
        super();

        /**
         * Inherited from `BaseCollection`
         *
         * @property _items
         * @type {array<any>}
         * @default []
         * @private
         */

        /**
         * Local reference to the event bus
         *
         * @for RadarTargetModel
         * @property _eventBus
         * @type {EventBus}
         */
        this._eventBus = EventBus;

        /**
         * Inherited from `BaseCollection`
         *
         * @property length
         * @type {number}
         */

        return this._init();
    }

    /**
     * Initialize the instance
     *
     * @for StripViewCollection
     * @method _init
     */
    _init() {

    }

    /**
     * Reset the instance
     *
     * @for StripViewCollection
     * @method reset
     */
    reset() {
        this._items = [];
    }

    /**
     * Add a `StripViewModel` instance to the collection
     *
     * @for StripViewCollection
     * @method addItem
     */
    addItem(stripViewModel) {
        this._items.push(stripViewModel);

        // Let the RadarTargetCollection know that a stripview has been added
        this._eventBus.trigger(EVENT.ADD_STRIPVIEW, stripViewModel);
    }

    /**
     * Remove a `StripViewModel` instance from the collection
     *
     * @for StripViewCollection
     * @method removeItem
     */
    removeItem(stripViewModel) {
        this._items = _without(this._items, stripViewModel);

        // Let the RadarTargetCollection know that a stripview has been removed
        this._eventBus.trigger(EVENT.REMOVE_STRIPVIEW, stripViewModel.cid);
    }

    /**
     * Find an active `StripViewModel`.
     *
     * Active is defined by the presence of a specific css classname
     *
     * @for StripViewCollection
     * @method findActiveStripViewModel
     * @return {StripViewModel}
     */
    findActiveStripViewModel() {
        return _find(this._items, { isActive: true });
    }

    /**
     * Find a `StripViewModel` in the collection by an `aircraftid`
     *
     * @for StripViewCollection
     * @method findStripByAircraftId
     * @param aircraftId {number}
     * @return {StripViewModel|undefined}
     */
    findStripByAircraftId(aircraftId) {
        return _find(this._items, { aircraftId: aircraftId });
    }
}
