import FixCollection from './Fix/FixCollection';
import StandardRouteCollection from './StandardRoute/StandardRouteCollection';

/**
 * @class NavigationLibrary
 */
export default class NavigationLibrary {
    /**
     * @constructor
     * @for NavigationLibrary
     * @param
     */
    constructor(airportJson) {
        this._fixCollection = null;
        this._sidCollection = null;
        this._starColelction = null;

        this.init(airportJson);
    }

    init({ fixes, sids, stars }) {
        this._fixCollection = new FixCollection(fixes);
        this._sidCollection = new StandardRouteCollection(sids);
        this._starColelction = new StandardRouteCollection(stars);
    }

    destroy() {
        this._fixCollection = null;
        this._sidCollection = null;
        this._starColelction = null;
    }
}
