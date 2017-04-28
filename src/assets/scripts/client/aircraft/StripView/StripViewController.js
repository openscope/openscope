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

        this.$strips = $(SELECTORS.DOM_SELECTORS.STRIPS);

        return this._init();
    }

    /**
     *
     *
     * @for StripViewController
     * @method _init
     */
    _init() {
        this._collection = new StripViewCollection();
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
     */
    update() {}

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

        const scrollPosition = this.$strips.scrollTop();
        this.$strips.prepend(stripViewModel.$element);
        // shift scroll down one strip's height
        this.$strips.scrollTop(scrollPosition + StripViewModel.HEIGHT);
    }

    /**
     *
     *
     * @for StripViewController
     * @method removeStripView
     * @param
     */
    removeStripView() {}
}
