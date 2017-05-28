import _isNil from 'lodash/isNil';
import BaseModel from '../../base/BaseModel';
import FixCollection from '../Fix/FixCollection';
import WaypointModel from '../../aircraft/FlightManagementSystem/WaypointModel';
import { REGEX } from '../../constants/globalConstants';
import {
    FLY_OVER_WAYPOINT_PREFIX,
    VECTOR_WAYPOINT_PREFIX
} from '../../constants/navigation/routeConstants';
import {
    ALTITUDE_RESTRICTION_PREFIX,
    DECIMAL_RADIX,
    FL_TO_THOUSANDS_MULTIPLIER,
    NAME_INDEX,
    RESTRICTION_INDEX,
    RESTRICTION_SEPARATOR,
    SPEED_RESTRICTION_PREFIX
} from '../../constants/navigation/waypointConstants';

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
        super();

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
         * Required altitude for a waypoint
         *
         * @property _altitude (optional)
         * @type {number}
         * @default null
         * @private
         */
        this._altitude = -1;

        /**
         * Flag used to determine if the waypoint must be flown over before the
         * aircraft may proceed to the next fix on their route.
         *
         * @for StandardRouteWaypointModel
         * @property _isFlyOverWaypoint
         * @type {boolean}
         * @default false
         */
        this._isFlyOverWaypoint = false;

        /**
         * Required speed for a waypoint
         *
         * @property _speed (optional)
         * @type {string}
         * @default null
         * @private
         */
        this._speed = -1;

        // TODO: This will need to be implemented in the future as an emuneration. Something to the effect of: {BELOW|AT|ABOVE}
        /**
         * NOT IN USE
         *
         * Altitude constraint, if any, for a waypoint.
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
         * Speed constraint, if any, for a waypoint.
         *
         * @property _speedConstraint (optional)
         * @type {string}
         * @default null
         * @private
         */
        this._speedConstraint = '';

        /**
         * Positon information for the current waypoint
         *
         * Specific bits of this property are exposed via public getters.
         * This property should never be modified by an exteral method.
         *
         * @property _positionModel
         * @type {StaticPositionModel}
         * @default null
         * @private
         */
        this._positionModel = null;

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
     * Return this waypoint's `gps` position property
     *
     * @property gps
     * @return {array}
     */
    get gps() {
        return this._positionModel.gps;
    }

    /**
     * Return this waypoint's `gpsXY` position property
     *
     * @property gps
     * @return {array}
     */
    get gpsXY() {
        return this._positionModel.gpsXY;
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
     * Provide read-only public access to this._positionModel
     *
     * @for SpawnPatternModel
     * @property positionModel
     * @type {StaticPositionModel}
     */
    get positionModel() {
        return this._positionModel;
    }

    /**
     * Fascade to access relative position
     *
     * @for StandardRouteWaypointModel
     * @property relativePosition
     * @type {array<number>} [kilometersNorth, kilometersEast]
     */
    get relativePosition() {
        return this._positionModel.relativePosition;
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
            this.name = routeWaypoint.replace(FLY_OVER_WAYPOINT_PREFIX, '');
            this._isVector = routeWaypoint.indexOf(VECTOR_WAYPOINT_PREFIX) !== -1;
            this._isFlyOverWaypoint = routeWaypoint.indexOf(FLY_OVER_WAYPOINT_PREFIX) !== -1;

            return this;
        }

        this.name = routeWaypoint[NAME_INDEX].replace(FLY_OVER_WAYPOINT_PREFIX, '');
        this._isVector = routeWaypoint[NAME_INDEX].indexOf(VECTOR_WAYPOINT_PREFIX) !== -1;
        this._isFlyOverWaypoint = routeWaypoint[NAME_INDEX].indexOf(FLY_OVER_WAYPOINT_PREFIX) !== -1;

        // temporary property. should end up as a getter that wraps private methods
        this._restrictions = routeWaypoint[RESTRICTION_INDEX];

        this._parseWaypointRestrictions(routeWaypoint[RESTRICTION_INDEX]);

        return this;
    }

    /**
     * reset the current model instance
     *
     * @for StandardRouteWaypointModel
     * @method reset
     */
    reset() {
        this.name = '';
        this._restrictions = null;
        this._altitude = -1;
        this._altitudeConstraint = '';
        this._speed = -1;
        this._speedConstraint = '';

        return this;
    }

    // TODO: why do we need to clone?
    // TODO ClonePoisitonFromFix -> clonePositionFromFix
    /**
     * Find the matching fix from the `FixCollection` and clone its `StaticPositionModel` this `_positionModel`
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

        this._positionModel = fixModel.clonePosition();

        return this;
    }

    /**
     * Build a new `WaypointModel` from the current instance.
     *
     * This method provides a way to create a `WaypointModel` with the current
     * properties of a `StandardRouteWaypointModel` instance.
     *
     * This is used by `LegModel` when building a flight plan from a `routeString`. A `procedureRouteString`
     * will result in finding a list of `StandardRouteWaypointModel`s. From those `StandardRouteWaypointModel`
     * we need to be able to create `WaypointModel`s that the Fms can consume.
     *
     * There is a method of the same name in the `FixModel` that does this same thing
     * but will be used only for `directRouteStrings`.
     *
     * @for StandardRouteWaypointModel
     * @method toWaypointModel
     * @return {WaypointModel}
     */
    toWaypointModel() {
        const waypointProps = {
            altitudeRestriction: this._altitude,
            isFlyOverWaypoint: this._isFlyOverWaypoint,
            isVector: this._isVector,
            name: this.name,
            positionModel: this.positionModel,
            speedRestriction: this._speed
        };

        return new WaypointModel(waypointProps);
    }

    /**
     * Parse any waypoint restrictions
     *
     * Parse a single string into:
     * - `this._altitude`            = expressed in feet
     * - `this._altitudeConstraint`  = {BELOW|AT|ABOVE}
     * - `this._speed`               = expressed in kts
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
    _setAltitudeRestriction(rawAltitudeStr) {
        const altitudeRestriction = rawAltitudeStr.replace(REGEX.ALT_SPEED_RESTRICTION, '');

        this._altitude = parseInt(altitudeRestriction, DECIMAL_RADIX) * FL_TO_THOUSANDS_MULTIPLIER;
    }

    /**
     * @for StandardRouteWaypointModel
     * @method _setSpeedRestriction
     * @param speedRestriction {string}
     * @private
     */
    _setSpeedRestriction(rawSpeedRestrictionStr) {
        const speedRestriction = rawSpeedRestrictionStr.replace(REGEX.ALT_SPEED_RESTRICTION, '');

        this._speed = parseInt(speedRestriction, DECIMAL_RADIX);
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
