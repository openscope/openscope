import $ from 'jquery';
import _random from 'lodash/random';
import _without from 'lodash/without';
import StripViewCollection from './StripViewCollection';
import StripViewModel from './StripViewModel';
import { INVALID_INDEX } from '../../constants/globalConstants';
import { SELECTORS } from '../../constants/selectors';

/**
 * The highest number allowed for a cid value
 *
 * @property CID_UPPER_BOUND
 * @type {number}
 * @final
 */
const CID_UPPER_BOUND = 999;

/**
 * Control modifications of the `$stripViewList` and coordinate
 * management of the `StripViewCollection`. Also responsible for
 * creating new `StripViewModel` instances.
 *
 * @class StripViewController
 */
export default class StripViewController {
    /**
     * @constructor
     */
    constructor() {
        /**
         * Collection class used to manage instances of `StripViewModel`s
         *
         * @property _collection
         * @type {StripViewCollection}
         * @default null
         * @private
         */
        this._collection = null;

        /**
         * Root list view element
         *
         * @property $stripView
         * @type {JQuery|HTMLElement}
         */
        this.$stripView = $(SELECTORS.DOM_SELECTORS.STRIP_VIEW);

        /**
         * List element containing each `StripViewModel` instance that is an Arrival
         *
         * @property $stripViewListArrivals
         * @type {JQuery|HTMLElement}
         */
        this.$stripViewListArrivals = $(SELECTORS.DOM_SELECTORS.STRIP_VIEW_ARRIVALS_LIST);

        /**
         * List element containing each `StripViewModel` instance that is a Departure
         *
         * @property $stripViewListDepartures
         * @type {JQuery|HTMLElement}
         */
        this.$stripViewListDepartures = $(SELECTORS.DOM_SELECTORS.STRIP_VIEW_DEPARTURES_LIST);

        /**
         * Trigger that toggles visibility of the `$stripView`
         *
         * @property $stripListTrigger
         * @type {JQuery|HTMLElement}
         */
        this.$stripListTrigger = $(SELECTORS.DOM_SELECTORS.STRIP_VIEW_TRIGGER);

        /**
         * @property _cidNumbersInUse
         * @type {array<number>}
         * @private
         */
        this._cidNumbersInUse = [];

        return this._init()
            .enable();
    }

    /**
     * Initialize the instance
     *
     * Should be run only once on instantiation
     *
     * @for StripViewController
     * @method _init
     */
    _init() {
        this._collection = new StripViewCollection();

        return this;
    }

    /**
     * Enable handlers
     *
     * @for StripViewController
     * @method enable
     * @chainable
     */
    enable() {
        this.$stripListTrigger.on('click', this._onStripListToggle);
        this.$stripViewListArrivals.on('click', this._onStripListClickOutsideStripViewModel);
        this.$stripViewListDepartures.on('click', this._onStripListClickOutsideStripViewModel);

        return this;
    }

    /**
     * Tear down handlers and destroy the instance
     *
     * @for StripViewController
     * @method destroy
     */
    destroy() {
        this._collection = null;
    }

    /**
     * Provides a way to check if a `StripViewModel` exists for a given `AircraftModel`
     *
     * @for StripViewController
     * @method hasStripViewModel
     * @param aircraftModel {AircraftModel}
     * @returns {booelan}
     */
    hasStripViewModel(aircraftModel) {
        const stripViewModel = this._collection.findStripByAircraftId(aircraftModel.id);

        return typeof stripViewModel !== 'undefined';
    }

    /**
     * Update each `StripViewModel` with new aricraft data
     *
     * The `StripViewModel` provides an early out when
     * `StripViewModel.shouldUpdate()` returns false
     *
     * This method is part of the animation loop
     *
     * @for StripViewController
     * @method update
     * @param aircraftList {array<AircraftModel>}
     */
    update(aircraftList) {
        // TODO: this should probably work the other way; loop through list items and find an aircraft.
        // We need a proper `AircraftCollection` for that to work
        for (let i = 0; i < aircraftList.length; i++) {
            const aircraftModel = aircraftList[i];

            if (!aircraftModel.isControllable) {
                continue;
            }

            let stripViewModel = this._collection.findStripByAircraftId(aircraftModel.id);

            if (typeof stripViewModel === 'undefined') {
                stripViewModel = this.createStripView(aircraftModel);
            }

            stripViewModel.update(aircraftModel);
        }
    }

    /**
     * Create a new `StripViewModel` instance and add it to the collection
     *
     * @for StripViewController
     * @method createStripView
     * @param aircraftModel {AircraftModel}
     * @return {StripViewModel}
     */
    createStripView(aircraftModel) {
        const stripViewCid = this._generateCidNumber();
        const stripViewModel = new StripViewModel(aircraftModel, stripViewCid);

        this._collection.addItem(stripViewModel);

        if (aircraftModel.isDeparture() || aircraftModel.isControllable) {
            this._addViewToStripList(stripViewModel);
        }

        return stripViewModel;
    }

    /**
     * Find a `StripViewModel` and attempt to add an active state
     *
     * @for StripViewController
     * @method selectStripView
     * @param  aircraftModel {AircraftModel}
     */
    selectStripView(aircraftModel) {
        const stripModel = this._collection.findStripByAircraftId(aircraftModel.id);

        if (!stripModel) {
            throw Error(`No StripViewModel found for selected Aircraft: ${aircraftModel.callsign}`);
        }

        this.findAndDeselectActiveStripView();
        stripModel.addActiveState();
    }

    /**
     * Given a `stripViewModel`, call the `.removeActiveState()` method
     * that will remove the active css classname
     *
     * @for StripViewController
     * @method deselectStripView
     * @param stripViewModel {StripViewModel}
     */
    deselectStripView(stripViewModel) {
        if (!(stripViewModel instanceof StripViewModel)) {
            throw new TypeError(`Expected stripViewModel to be an instance of StripViewModel but instead found ${typeof stripViewModel}`);
        }

        stripViewModel.removeActiveState();
    }

    /**
     * Method used to deselect an active `StripViewModel` when
     * the specific model is not known.
     *
     * This useful for when a click is registered within the
     * `stripViewList`, but not on a specific `StripViewModel`
     * or when an event is triggered to clear the active callsign
     *
     * @for StripViewController
     * @method findAndDeselectActiveStripView
     * @private
     */
    findAndDeselectActiveStripView() {
        const activeStripViewModel = this._collection.findActiveStripViewModel();

        if (!activeStripViewModel) {
            return;
        }

        this.deselectStripView(activeStripViewModel);
    }

    /**
     * Remove a `StripViewModel` from the `$stripViewList`
     *
     * @for StripViewController
     * @method removeStripView
     * @param aircraftModel {AircraftModel}
     */
    removeStripView(aircraftModel) {
        const stripViewModel = this._collection.findStripByAircraftId(aircraftModel.id);

        if (!stripViewModel) {
            console.warn(
                `Attempted to remove a StripViewModel for ${aircraftModel.callsign} that does not exist.` +
                'This is likely not a fatal problem, but if you are seeing this, please let somebody know.'
            );

            return;
        }

        this._removeCidFromUse(stripViewModel.cid);
        this._collection.removeItem(stripViewModel);
        stripViewModel.destroy();
    }

    /**
     * Add `StripViewModel` to the `$stripViewList`
     *
     * This adds a given `stripViewModel` into the DOM as a
     * child of `$stripViewList`
     *
     * @for StripViewController
     * @method _addViewToStripList
     * @param stripViewModel {StripViewModel}
     * @private
     */
    _addViewToStripList(stripViewModel) {
        if (!(stripViewModel instanceof StripViewModel)) {
            throw new TypeError(`Expected an instance of StripViewModel but received ${typeof stripViewModel}`);
        }

        const listView = stripViewModel.isDeparture ? this.$stripViewListDepartures : this.$stripViewListArrivals;
        const scrollPosition = listView.scrollTop();

        listView.prepend(stripViewModel.$element);
        // shift scroll down one strip's height
        listView.scrollTop(scrollPosition + StripViewModel.HEIGHT);
    }

    /**
     * Event handler for when a `StripViewModel` instance is clicked
     *
     * @for StripViewController
     * @method _onStripListToggle
     * @param event {JQueryEventObject}
     * @private
     */
    // eslint-disable-next-line no-unused-vars
    _onStripListToggle = (event) => {
        this.$stripView.toggleClass(SELECTORS.CLASSNAMES.STRIP_VIEW_IS_HIDDEN);
    };

    /**
     * Event handler for when a click is registered within the `$stripViewList`
     * but not targeting a specific `StripViewModel`
     *
     * @for StripViewController
     * @method _onStripListClickOutsideStripViewModel
     * @param event {JQueryEventObject}
     * @private
     */
    // eslint-disable-next-line no-unused-vars
    _onStripListClickOutsideStripViewModel = (event) => this.findAndDeselectActiveStripView();

    /**
     * Generate a unique number to represent a `CID`
     *
     * Should be displayed with leading zeros, so a `CID` value of `1` should be displayed as `001`
     *
     * @for StripViewController
     * @method _generateCidNumber
     * @return nextCid {number}
     * @private
     */
    _generateCidNumber() {
        const nextCid = _random(1, CID_UPPER_BOUND);

        if (this._cidNumbersInUse.indexOf(nextCid) !== INVALID_INDEX) {
            return this._generateCidNumber();
        }

        this._cidNumbersInUse.push(nextCid);

        return nextCid;
    }

    /**
     * Remove a given `#cid` from use
     *
     * Used when an aircraft has landed or departed controlled airspace
     *
     * @for StripViewController
     * @method _removeCidFromUse
     * @param cid {number}
     * @private
     */
    _removeCidFromUse(cid) {
        const cidIndex = this._cidNumbersInUse.indexOf(cid);

        if (cidIndex === INVALID_INDEX) {
            return;
        }

        this._cidNumbersInUse = _without(this._cidNumbersInUse, cid);
    }
}
