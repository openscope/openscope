import BaseModel from '../../base/BaseModel';

/**
 * Symbol that divides each route segment
 *
 * @property SEGMENT_SEPARATION_SYMBOL
 * @type {string}
 * @final
 */
const SEGMENT_SEPARATION_SYMBOL = '.';

/**
 * A route is assumed to have, at most, three parts.
 *
 * @property MAXIMUM_ROUTE_SEGMENT_LENGTH
 * @type {number}
 * @final
 */
const MAXIMUM_ROUTE_SEGMENT_LENGTH = 3;

/**
 * @class RouteModel
 */
export default class RouteModel extends BaseModel {
    /**
     * 'BETHL.GRNPA1.KLAS'
     *
     * @for RouteModel
     * @constructor
     * @param routeString {string}
     */
    constructor(routeString) {
        super();

        if (typeof routeString === 'undefined' || typeof routeString !== 'string') {
            return;
        }

        if (!this._isValidRouteString(routeString)) {
            // eslint-disable-next-line max-len
            throw new TypeError(`Invalid routeString passed to RouteModel. Expected a routeString of the shape ORIGIN.BASE.DESTINATION but instead received ${routeString}`);
        }

        /**
         * @property entry
         * @type {string}
         * @default ''
         */
        this.entry = '';

        /**
         * @property procedure
         * @type {string}
         * @default ''
         */
        this.procedure = '';

        /**
         * @property exit
         * @type {string}
         * @default ''
         */
        this.exit = '';

        return this._init(routeString);
    }

    /**
     * A single string that represents the entire route
     *
     * @property routeString
     * @return {string}
     */
    get routeString() {
        return `${this.entry}.${this.procedure}.${this.exit}`;
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
        const { entry, base, exit } = this._extractSegmentNamesFromRouteString(routeString);

        this.entry = entry;
        this.procedure = base;
        this.exit = exit;

        return this;
    }

    /**
     * reset this instance
     *
     * @for RouteModel
     * @method reset
     */
    reset() {
        this.entry = '';
        this.procedure = '';
        this.exit = '';
    }

    /**
     * @for RouteModel
     * @method _extractSegmentNamesFromRouteString
     * @param routeString {string}
     * @return {object}
     * @private
     */
    _extractSegmentNamesFromRouteString(routeString) {
        const routeSegments = routeString.split(SEGMENT_SEPARATION_SYMBOL);

        return {
            entry: routeSegments[0],
            base: routeSegments[1],
            exit: routeSegments[2]
        };
    }

    /**
     * Verify that a routestring has exactly 3 segments
     *
     * @for RouteModel
     * @method _isValidRouteString
     * @param routeString {string}
     * @return {boolean}
     * @private
     */
    _isValidRouteString(routeString) {
        return routeString.split(SEGMENT_SEPARATION_SYMBOL).length === MAXIMUM_ROUTE_SEGMENT_LENGTH;
    }
}
