import _without from 'lodash';
import BaseCollection from '../../base/BaseCollection';

/**
 *
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

        // this._items
        // this.length

        return this._init();
    }

    /**
     *
     *
     * @for StripViewCollection
     * @method _init
     */
    _init() {

    }

    /**
     *
     *
     * @for StripViewCollection
     * @method reset
     */
    reset() {
        this._items = [];
    }

    /**
     *
     *
     * @for StripViewCollection
     * @method update
     */
    update() {

    }

    /**
     *
     *
     * @for StripViewCollection
     * @method addItem
     */
    addItem(stripViewModel) {
        this._items.push(stripViewModel);
    }

    /**
     *
     *
     * @for StripViewCollection
     * @method removeItem
     */
    removeItem(stripViewModel) {
        this._items = _without(this._items, stripViewModel);
    }
}
