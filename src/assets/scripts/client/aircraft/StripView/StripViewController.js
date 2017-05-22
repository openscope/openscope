import $ from 'jquery';
import StripViewCollection from './StripViewCollection';
import StripViewModel from './StripViewModel';
import { SELECTORS } from '../../constants/selectors';

/**
 *
 *
 * @class StripViewController
 */
export default class StripViewController {
    /**
     * @constructor
     */
    constructor() {
        this._collection = null;

        this.$stripView = $(SELECTORS.DOM_SELECTORS.STRIP_VIEW);
        this.$stripViewList = $(SELECTORS.DOM_SELECTORS.STRIPS);
        this.$stripListTrigger = $(SELECTORS.DOM_SELECTORS.STRIP_VIEW_TRIGGER);

        return this._init()
            .enable();
    }

    /**
     *
     *
     * @for StripViewController
     * @method _init
     */
    _init() {
        this._collection = new StripViewCollection();

        return this;
    }

    enable() {
        this.$stripListTrigger.on('click', this._onStripListToggle);

        return this;
    }

    /**
     *
     *
     * @for StripViewController
     * @method reset
     */
    reset() {
        this._collection = null;
    }

    /**
     *
     *
     * @for StripViewController
     * @method update
     * @param aircraftList {array<AircraftInstanceModel>}
     */
    update(aircraftList) {
        for (let i = 0; i < aircraftList.length; i++) {
            const aircraftModel = aircraftList[i];

            if (aircraftModel.inside_ctr) {
                const stripViewModel = this._collection.findByAircraftId(aircraftModel.id);

                stripViewModel.update(aircraftModel);
            }
        }
    }

    /**
     *
     *
     * @for StripViewController
     * @method createStripView
     * @param aircraftModel {AircraftInstanceModel}
     */
    createStripView(aircraftModel) {
        const stripViewModel = new StripViewModel(aircraftModel);

        this._collection.addItem(stripViewModel);

        this.showStripView(stripViewModel);
    }

    /**
     *
     *
     * @method showStripView
     */
    showStripView(stripViewModel) {
        const scrollPosition = this.$stripViewList.scrollTop();

        this.$stripViewList.prepend(stripViewModel.$element);
        // shift scroll down one strip's height
        this.$stripViewList.scrollTop(scrollPosition + StripViewModel.HEIGHT);
    }

    /**
     * Find a `StripViewModel` and attempt to add an active state
     *
     * @for StripViewController
     * @method selectStripView
     * @param  aircraftModel {AircraftInstanceModel}
     */
    selectStripView(aircraftModel) {
        const stripModel = this._collection.findByAircraftId(aircraftModel.id);

        if (!stripModel) {
            throw Error(`No StripModel found for selected Aircraft: ${aircraftModel.callsign}`);
        }

        stripModel.addActiveState();
    }

    /**
     * Find as `StripViewModel` and attempt to remove an active state
     *
     * @for StripViewController
     * @method deselectStripView
     * @param  aircraftModel {AircraftInstanceModel}
     */
    deselectStripView(aircraftModel) {
        const stripModel = this._collection.findByAircraftId(aircraftModel.id);

        if (!stripModel) {
            throw Error(`No StripModel found for selected Aircraft: ${aircraftModel.callsign}`);
        }

        stripModel.removeActiveState();
    }

    /**
     *
     *
     * @for StripViewController
     * @method removeStripView
     * @param aircraftModel {AircraftInstanceModel}
     */
    removeStripView(aircraftModel) {
        console.log('removeStripView', aircraftModel.id, aircraftModel.callsign);
    }

    /**
     *
     *
     * @for StripViewController
     * @method _onStripListToggle
     * @param event {JQueryEventObject}
     */
    _onStripListToggle = (event) => {
        console.log('StripViewController._onStripListToggle');
        this.$stripView.toggleClass('mix-stripView_isHidden');
    };
}
