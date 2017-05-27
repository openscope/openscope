import $ from 'jquery';
import StripViewCollection from './StripViewCollection';
import StripViewModel from './StripViewModel';
import { SELECTORS } from '../../constants/selectors';

/**
 * Controll modifications of the `$stripViewList` and coordinate
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
         * List element containing each `StripViewModel` instance
         *
         * @property $stripViewList
         * @type {JQuery|HTMLElement}
         */
        this.$stripViewList = $(SELECTORS.DOM_SELECTORS.STRIP_VIEW_LIST);

        /**
         * Trigger that toggles visibility of the `$stripView`
         *
         * @property $stripListTrigger
         * @type {JQuery|HTMLElement}
         */
        this.$stripListTrigger = $(SELECTORS.DOM_SELECTORS.STRIP_VIEW_TRIGGER);

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
     * Update each `StripViewModel` with new aricraft data
     *
     * The `StripViewModel` provides an early out when
     * `StripViewModel.shouldUpdate()` returns false
     *
     * This method is part of the animation loop
     *
     * @for StripViewController
     * @method update
     * @param aircraftList {array<AircraftInstanceModel>}
     */
    update(aircraftList) {
        // TODO: this should probably work the other way; loop through list items and find an aircraft.
        // We need a proper `AircraftCollection` for that to be feasable
        for (let i = 0; i < aircraftList.length; i++) {
            const aircraftModel = aircraftList[i];
            const stripViewModel = this._collection.findStripByAircraftId(aircraftModel.id);

            if (aircraftModel.inside_ctr && !stripViewModel.insideCenter) {
                stripViewModel.$element.detach();
                this._addViewToStripList(stripViewModel);
            }

            if (aircraftModel.inside_ctr) {
                stripViewModel.update(aircraftModel);
            } else {
                stripViewModel.hide();
            }
        }
    }

    /**
     * Create a new `StripViewModel` instance and addit to the collection
     *
     * @for StripViewController
     * @method createStripView
     * @param aircraftModel {AircraftInstanceModel}
     */
    createStripView(aircraftModel) {
        const stripViewModel = new StripViewModel(aircraftModel);

        this._collection.addItem(stripViewModel);
        this._addViewToStripList(stripViewModel);
    }

    /**
     * Find a `StripViewModel` and attempt to add an active state
     *
     * @for StripViewController
     * @method selectStripView
     * @param  aircraftModel {AircraftInstanceModel}
     */
    selectStripView(aircraftModel) {
        const stripModel = this._collection.findStripByAircraftId(aircraftModel.id);

        if (!stripModel) {
            throw Error(`No StripModel found for selected Aircraft: ${aircraftModel.callsign}`);
        }

        this.$stripViewList.children().removeClass(SELECTORS.CLASSNAMES.ACTIVE);
        stripModel.addActiveState();
    }

    /**
     * Remove a `StripViewModel` from the `$stripViewList`
     *
     * @for StripViewController
     * @method removeStripView
     * @param aircraftModel {AircraftInstanceModel}
     */
    removeStripView(aircraftModel) {
        const stripViewModel = this._collection.findStripByAircraftId(aircraftModel.id);

        if (!stripViewModel) {
            throw new TypeError(`Attempted to remove a StripViewModel for ${aircraftModel.callsign} that does not exist`);
        }

        stripViewModel.destroy();
        this._collection.removeItem(stripViewModel);
    }

    /**
     * Add `StripViewModel` to the `$stripViewList`
     *
     * @for StripViewController
     * @method _addViewToStripList
     * @param stripViewModel {StripViewModel}
     * @private
     */
    _addViewToStripList(stripViewModel) {
        if (!(stripViewModel instanceof StripViewModel)) {
            throw new TypeError(`Expected an instance of StripViewModel but reveiced ${typeof stripViewModel}`);
        }

        const scrollPosition = this.$stripViewList.scrollTop();

        this.$stripViewList.append(stripViewModel.$element);
        // shift scroll down one strip's height
        this.$stripViewList.scrollTop(scrollPosition + StripViewModel.HEIGHT);
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
        this.$stripView.toggleClass('mix-stripView_isHidden');
    };
}
