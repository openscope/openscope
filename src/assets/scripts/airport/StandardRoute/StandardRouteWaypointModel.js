import _head from 'lodash/head';
import _last from 'lodash/last';
import _isNil from 'lodash/isNil';
import _uniqId from 'lodash/uniqueId';
import FixCollection from '../Fix/FixCollection';
import Waypoint from '../../aircraft/Waypoint';

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
 * @property RESTRICTION_SEPARATOR
 * @type {string}
 * @final
 */
const RESTRICTION_SEPARATOR = '|';

/**
 * @property ALTITUDE_RESTRICTION_PREFIX
 * @type {string}
 * @final
 */
const ALTITUDE_RESTRICTION_PREFIX = 'A';

/**
 * @property SPEED_RESTRICTION_PREFIX
 * @type {string}
 * @final
 */
const SPEED_RESTRICTION_PREFIX = 'S';

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
         * @property _altitude (optional)
         * @type {number}
         * @default null
         * @private
         */
        this._altitude = null;

        // TODO: This will need to be implemented in the future as an emuneration. Something to the effect of: {BELOW|AT|ABOVE}
        /**
         * NOT IN USE
         *
         * Altitude constraints, if any, for a fix.
         *
         * @property _altitudeConstraint (options)
         * @type {string}
         * @default ''
         * @private
         */
        this._altitudeConstraint = '';

        /**
         * NOT IN USE
         *
         * Speed constraint, if any, for a fix.
         *
         * @property _speed (optional)
         * @type {string}
         * @default null
         * @private
         */
        this._speed = null;

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
        this._altitude = null;
        this._altitudeConstraint = '';
        this._speed = null;

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
     * @for StandardRouteWaypointModel
     * @method generateFmsWaypoint
     * @return {Waypoint}
     */
    generateFmsWaypoint(fms) {
        const fmsWaypoint = {
            fix: this.name,
            fixRestrictions: {
                alt: this._altitude,
                spd: this._speed
            }
        }

        return new Waypoint(fmsWaypoint, fms);
    }

    /**
     * Parse any waypoint restrictions
     *
     * Parse a single string into:
     * - `this._altitude`            = expressed in feet
     * - `this._altitudeConstraint`  = {BELOW|AT|ABOVE}
     * - `this._speed`      = expressed in kts
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
        if (_isNil(waypointRestrictions)) {
            return;
        }

        const restrictionPieces = this._extractRestrictionPieces(waypointRestrictions);

        for (let i = 0; i < restrictionPieces.length; i++) {
            const restriction = restrictionPieces[i];

            // looking at the first letter of a restrictionPiece here.
            if (restriction[0] === ALTITUDE_RESTRICTION_PREFIX) {
                this._setAltitudeRestriction(restriction);
            } else if (restriction[0] === SPEED_RESTRICTION_PREFIX) {
                this._setSpeedRestriction(restriction);
            }
        }
    }

    /**
     * @for StandardRouteWaypointModel
     * @method _setAltitudeRestriction
     * @param altitudeRestriction {string}
     * @private
     */
    _setAltitudeRestriction(altitudeRestriction) {
        this._altitude = altitudeRestriction.substr(1);
    }

    /**
     * @for StandardRouteWaypointModel
     * @method _setSpeedRestriction
     * @param speedRestriction {string}
     * @private
     */
    _setSpeedRestriction(speedRestriction) {
        this._speed = speedRestriction.substr(1);
    }

    /**
     * @for StandardRouteWaypointModel
     * @method _extractRestrictionPieces
     * @param waypointRestrictions {array<string>}
     * @@return {string}
     * @private
     */
    _extractRestrictionPieces(waypointRestrictions) {
        return waypointRestrictions.split(RESTRICTION_SEPARATOR);
    }
}
