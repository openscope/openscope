import _find from 'lodash/find';
import _forEach from 'lodash/forEach';
import _random from 'lodash/random';
import StandardRouteModel from './StandardRouteModel';

/**
 * @class StandardRouteCollection
 */
export default class StandardRouteCollection {
    /**
     * @constructor
     * @param sidList {object}
     */
    constructor(sidList) {
        if (typeof sidList === 'undefined') {
            return;
        }

        /**
         * List of `StandardRouteModel` objects
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
     * @for StandardRouteCollection
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
     * @for StandardRouteCollection
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
     * @for StandardRouteCollection
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

        return sid.findFixesAndRestrictionsForRunwayAndExit(runway, exit);
    }

    /**
     *
     *
     */
    findFixesForStarByEntryAndRunway(icao, entry, runway) {
        if (!icao) {
            return;
        }

        const sid = this.findSidByIcao(icao);

        return sid.findFixesAndRestrictionsForEntryAndRunway(entry, runway);
    }

    /**
     * Find a random name of an `exitPoint` segment that exists within the collection.
     *
     * @for StandardRouteCollection
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

        // if has exitPoints, return a randomly selected one from a list of exitFixNames
        const exitPointIcaos = sid.gatherExitPointNames();
        const maxIndex = exitPointIcaos.length - 1;
        const randomIndex = _random(0, maxIndex);

        return exitPointIcaos[randomIndex];
    }

    /**
     * Find a sid within the collection given an icao
     *
     * @for StandardRouteCollection
     * @method findSidByIcao
     * @param icao {string}
     * @return {StandardRouteModel|undefined}
     */
    findSidByIcao(icao) {
        return _find(this._items, { icao: icao });
    }

    /**
     * Add a list of sids to the collection
     *
     * @for StandardRouteCollection
     * @method _addSidListToCollection
     * @param sidList {object}
     * @private
     */
    _addSidListToCollection(sidList) {
        _forEach(sidList, (sid) => {
            const routeModel = new StandardRouteModel(sid);

            this._addSidToCollection(routeModel);
        });

        return this;
    }

    /**
     * Add a `StandardRouteModel` to the collection and update length.
     *
     * @for StandardRouteCollection
     * @method _addSidToCollection
     * @param routeModel {StandardRouteModel}
     * @private
     */
    _addSidToCollection(routeModel) {
        if (!(routeModel instanceof StandardRouteModel)) {
            throw new TypeError(`Expected routeModel to be an instance of StandardRouteModel, instead received ${routeModel}`);
        }

        this._items.push(routeModel);
        this.length = this._items.length;

        return this;
    }
}
