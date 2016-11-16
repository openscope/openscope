import BaseModel from '../../base/BaseModel';
import FixCollection from '../Fix/FixCollection';

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
 * @extends BaseModel
 */
export default class StandardRouteWaypointModel extends BaseModel {
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
        super(routeWaypoint);

        if (typeof routeWaypoint === 'undefined') {
            return this;
        }

        /**
         * Name of the fix
         *
         * @property name
         * @type {string}
         * @default ''
         * @private
         */
        this.name = '';

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
         * Positon information for the current waypoint
         *
         * Specific bits of this property are exposed via public getters.
         * This property should never be modified by an exteral method.
         *
         * @property _waypointPosition
         * @type {PositionModel}
         * @default null
         * @private
         */
        this._waypointPosition = null;

        /**
         * Distance in nm from the previous waypoint.
         *
         * This property is set exterally by the `StandardRouteModel` and used only when called via
         * `ArrivalBase.preSpawn()`.
         *
         * This value is mutable and is not intended to be re-used after its initial use.
         *
         * @property distanceFromPreviousWaypoint
         * @type {number}
         * @default -1
         */
        this.distanceFromPreviousWaypoint = -1;

        /**
         * Name of the previous `StandardWaypointModel` object in a route
         *
         * This property is set exterally by the `StandardRouteModel` and used only when called via
         * `ArrivalBase.preSpawn()`.
         *
         * This value is mutable and is not intended to be re-used after its initial use.
         *
         * @property previousStandardWaypointName
         * @type {string}
         * @default ''
         */
        this.previousStandardWaypointName = '';

        return this._init(routeWaypoint)
                   .clonePoisitonFromFix();
    }

    /**
     * Return this waypoint's `position` propery
     *
     * @property position
     * @return {array}
     */
    get position() {
        return this._waypointPosition.position;
    }

    /**
     * Return this waypoint's `gps` position property
     *
     * @property gps
     * @return {array}
     */
    get gps() {
        return this._waypointPosition.gps;
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
        return [this.name, this._restrictions];
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
        // if we receive a string, this fix doesnt have any restrictions so we only need to set `name`
        if (typeof routeWaypoint === 'string') {
            this.name = routeWaypoint;

            return this;
        }

        this.name = routeWaypoint[NAME_INDEX];
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
        this.name = '';
        this._restrictions = null;
        this._alititude = -1000;
        this._alititudeConstraint = '';
        this._speedConstraint = -1;

        return this;
    }

    /**
     * Find the matching fix from the `FixCollection` and clone its `PositionModel` this `_waypointPosition`
     *
     * @for StandardRouteWaypointModel
     * @method _clonePoisitonFromFix
     * @param fixCollection {FixCollection}
     * @private
     */
    clonePoisitonFromFix() {
        const fixModel = FixCollection.findFixByName(this.name);

        if (!fixModel) {
            console.warn(`The following fix was not found in the list of fixes for this Airport: ${this.name}`);

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
