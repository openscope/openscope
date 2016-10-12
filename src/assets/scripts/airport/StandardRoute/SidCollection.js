import _find from 'lodash/find';
import _forEach from 'lodash/forEach';
import _random from 'lodash/random';
import SidModel from './SidModel';

/**
 * @class SidCollection
 */
export default class SidCollection {
    /**
     * @constructor
     * @param sidList {object}
     */
    constructor(sidList) {
        if (typeof sidList === 'undefined') {
            return;
        }

        /**
         * List of `SidModel` objects
         *
         * @property _items
         * @type {array}
         * @default []
         * @private
         */
        this._items = [];

        /**
         * Current size of the collection
         *
         * @property legth
         * @type {number}
         * @default 0
         */
        this.length = 0;

        return this._init(sidList);
    }

    /**
     * Lifecycle method. Should be run only once on instantiation.
     *
     * @for SidCollection
     * @method _init
     * @param sidList {object}
     * @private
     */
    _init(sidList) {
        this._addSidListToCollection(sidList);

        return this;
    }

    /**
     * Destroy the current instance
     *
     * @for SidCollection
     * @method destroy
     */
    destroy() {
        this._items = [];
        this.length = 0;

        return this;
    }

    /**
     * Find a list of fixes for a route, given an `icao`, `exit` and `runway` parameter.
     *
     * @for SidCollection
     * @method getSID
     * @param icao {string}
     * @param exit {string}
     * @param runway {string}
     * @return {array}
     */
    findFixesForSidByRunwayAndExit(icao, exit, runway) {
        if (!icao) {
            return;
        }

        const sid = this.findSidByIcao(icao);

        return sid.findFixesAndRestrictionsForRunwayWithExit(runway, exit);
    }

    /**
     * Find a random name of an `exitPoint` segment that exists within the collection.
     *
     * @for SidCollection
     * @method findRandomExitPointForSIDIcao
     * @param icao {string}
     * @return {string}
     */
    findRandomExitPointForSIDIcao(icao) {
        const sid = this.findSidByIcao(icao);

        // if sid doesnt have any exit points it ends at fix for which the SID is named
        if (!sid.hasExitPoints()) {
            return sid.icao;
        }

        // if has exitPoints, return a randomly selected one
        const exitPointIcaos = sid.gatherExitPointNames();
        const randomIndex = _random(0, exitPointIcaos.length);

        return exitPointIcaos[randomIndex];
    }

    /**
     * Find a sid within the collection given an icao
     *
     * @for SidCollection
     * @method findSidByIcao
     * @param icao {string}
     * @return {SidModel|undefined}
     */
    findSidByIcao(icao) {
        return _find(this._items, { icao: icao });
    }

    /**
     * Add a list of sids to the collection
     *
     * @for SidCollection
     * @method _addSidListToCollection
     * @param sidList {object}
     * @private
     */
    _addSidListToCollection(sidList) {
        _forEach(sidList, (sid) => {
            const sidModel = new SidModel(sid);

            this._addSidToCollection(sidModel);
        });

        return this;
    }

    /**
     * Add a `SidModel` to the collection and update length.
     *
     * @for SidCollection
     * @method _addSidToCollection
     * @param sidModel {SidModel}
     * @private
     */
    _addSidToCollection(sidModel) {
        if (!(sidModel instanceof SidModel)) {
            throw new TypeError(`Expected sidModel to be an instance of SidModel, instead received ${sidModel}`);
        }

        this._items.push(sidModel);
        this.length = this._items.length;

        return this;
    }
}
