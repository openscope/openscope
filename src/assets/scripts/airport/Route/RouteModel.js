import _uniqueId from 'lodash/uniqueId';

/**
 * Symbol that divides each route segment
 *
 * @property SEGMENT_SEPERATION_SYMBOL
 * @type {string}
 * @final
 */
const SEGMENT_SEPERATION_SYMBOL = '.';

/**
 * @class RouteModel
 */
export default class RouteModel {
    /**
     * 'BETHL.GRNPA1.KLAS'
     *
     * @for RouteModel
     * @constructor
     * @param routeString {string}
     */
    constructor(routeString) {
        if (typeof routeString === 'undefined' || typeof routeString !== 'string') {
            return;
        }

        if (!this._isValidRouteString(routeString)) {
            throw new TypeError(`Invalid routeString passed to RouteModel. Expected a routeString of the shape ORIGIN.BASE.DESTINATION but instead received ${routeString}`);
        }

        /**
         * @property
         * @type {string}
         */
        this._id = _uniqueId();

        /**
         * @property origin
         * @type {string}
         * @default ''
         */
        this.origin = '';

        /**
         * @property base
         * @type {string}
         * @default ''
         */
        this.base = '';

        /**
         * @property destination
         * @type {string}
         * @default ''
         */
        this.destination = '';

        return this._init(routeString);
    }

    /**
     * Lifecycle method. Should be run only once on instantiation
     *
     * @for RouteModel
     * @method _init
     * @param routeString {string}
     * @private
     */
    _init(routeString) {
        const { origin, base, destination } = this._extractSegmentsFromRouteString(routeString);

        this.origin = origin;
        this.base = base;
        this.destination = destination;

        return this;
    }

    /**
     * Destroy this instance
     *
     * @for RouteModel
     * @method destroy
     */
    destroy() {
        this._id = '';
        this.origin = '';
        this.base = '';
        this.destination = '';
    }

    /**
     *
     * @for RouteModel
     * @method _extractSegmentsFromRouteString
     * @param routeString {string}
     * @return {object}
     * @private
     */
    _extractSegmentsFromRouteString(routeString) {
        const routeSegments = routeString.split(SEGMENT_SEPERATION_SYMBOL);

        return {
            origin: routeSegments[0],
            base: routeSegments[1],
            destination: routeSegments[2]
        };
    }

    /**
     *
     *
     */
    _isValidRouteString(routeString) {
        return routeString.split(SEGMENT_SEPERATION_SYMBOL).length === 3;
    }
}
