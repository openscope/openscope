import FixCollection from '../Fix/FixCollection';
import _uniqId from 'lodash/uniqueId';

/**
 * @property NAME_INDEX
 * @type {number}
 * @final
 */
const NAME_INDEX = 0;

/**
 * @property RESTRICTION_INDEX
 * @type {number}
 * @final
 */
const RESTRICTION_INDEX = 1;

/**
 * A route waypoint describes a `fixName` and any altitude or speed restrictions for that fix.
 *
 * @class StandardRouteWaypointModel
 */
export default class StandardRouteWaypointModel {
    /**
     * Expects `routeWaypoint` to be in one of these forms:
     * - ["FRAWG", "A80+|S210+"]
     * - ["FRAWG", "A80-|S210"]
     * - ["FRAWG", "A80"]
     * - ["FRAWG", "S210"]
     * - "FRAWG"
     *
     * @constructor
     * @param routeWaypoint {array|string}
     */
    constructor(routeWaypoint) {
        if (typeof routeWaypoint === 'undefined') {
            return this;
        }

        /**
         * Unigue string id that can be used to differentiate this model instance from another.
         *
         * @property _id
         * @type {string}
         * @private
         */
        this._id = _uniqId();

        /**
         * Name of the fix
         *
         * @property _name
         * @type {string}
         * @default ''
         * @private
         */
        this._name = '';

        /**
         * Any restrictions for a given fix
         *
         * ex:
         * - "A80+|S210"
         * - "A80-"
         * - "S230"
         *
         * using null here to match current api, if restrictions dont exist for a given waypoint
         * the consumers are expecting this to be null.
         *
         * @property _restrictions
         * @type {string|null}
         * @default null
         * @private
         */
        this._restrictions = null;

        /**
         * NOT IN USE
         *
         * Required altitude for a fix
         *
         * @property _alititude (optional)
         * @type {number}
         * @default -1000
         * @private
         */
        this._alititude = -1000;

        // TODO: This will need to be implemented in the future as an emuneration. Something to the effect of: {BELOW|AT|ABOVE}
        /**
         * NOT IN USE
         *
         * Altitude constraints, if any, for a fix.
         *
         * @property _alititudeConstraint (options)
         * @type {string}
         * @default ''
         * @private
         */
        this._alititudeConstraint = '';

        /**
         * NOT IN USE
         *
         * Speed constraint, if any, for a fix.
         *
         * @property _speedConstraint (optional)
         * @type {string}
         * @default -1
         * @private
         */
        this._speedConstraint = -1;

        /**
         *
         *
         * @property _waypointPosition
         * @type {PositionModel}
         * @default null
         */
        this._waypointPosition = null;

        return this._init(routeWaypoint)
                   .clonePoisitonFromFix();
    }

    /**
     * This will return a normalized fix in the shape of `[FIXNAME, FIX_RESTRICTIONS]`.
     *
     * Fixes without restrictions are brought in to the application as a single string, however, all
     * fixes are consumed as an array. `_restrictions` are initialized as null, thus if there are
     * no restrictions for a fix this getter will return `[FIXNAME, null]`
     *
     * @for StandardRouteWaypointModel
     * @property fix
     * @return {array}
     */
    get fix() {
        return [this._name, this._restrictions];
    }

    /**
     * Lifecycle method. Should be run only once on instantiation.
     *
     * @for StandardRouteWaypointModel
     * @method _init
     * @param routeWaypoint {array|string}
     * @chainable
     * @private
     */
    _init(routeWaypoint) {
        // if we receive a string, this fix doesnt have any restrictions so we only need to set `_name`
        if (typeof routeWaypoint === 'string') {
            this._name = routeWaypoint;

            return this;
        }

        this._name = routeWaypoint[NAME_INDEX];
        // temporary property. should end up as a getter that wraps private methods
        this._restrictions = routeWaypoint[RESTRICTION_INDEX];

        this._parseWaypointRestrictions(routeWaypoint[RESTRICTION_INDEX]);

        return this;
    }

    /**
     * Destroy the current model instance
     *
     * @for StandardRouteWaypointModel
     * @method destroy
     */
    destroy() {
        this._id = '';
        this._name = '';
        this._restrictions = null;
        this._alititude = -1000;
        this._alititudeConstraint = '';
        this._speedConstraint = -1;

        return this;
    }

    /**
     *
     *
     * @for StandardRouteWaypointModel
     * @method _clonePoisitonFromFix
     * @param fixCollection {FixCollection}
     * @private
     */
    clonePoisitonFromFix() {
        const fixModel = FixCollection.findFixByName(this._name);

        if (!fixModel) {
            console.warn(`The following fix was not found in the list of fixes for this Airport: ${this._name}`);

            return this;
        }

        this._waypointPosition = fixModel.clonePosition();

        return this;
    }

    /**
     * NOT IN USE
     * // TODO: implement this method. altitude and speed should be parsed into real numbers so
     *          they can be used elsewhere in the app.
     *
     * Parse a single string into:
     * - `this._alititude`            = expressed in feet
     * - `this._alititudeConstraint`  = {BELOW|AT|ABOVE}
     * - `this._speedConstraint`      = expressed in kts
     *
     * Exapmles:
     * - "A80+|S210"
     * - "A80-|S210"
     * - "A80"
     * - "S210"
     *
     * @for StandardRouteWaypointModel
     * @method _parseWaypointRestrictions
     * @param waypointRestrictions {string}
     * @private
     */
    _parseWaypointRestrictions(waypointRestrictions) {
        return this;
    }
}
