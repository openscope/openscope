import _get from 'lodash/get';

/**
 * Symbol used to denote an RNAV waypoint
 *
 * @property RNAV_WAYPOINT_SYMBOL
 * @type {string}
 * @final
 */
const RNAV_WAYPOINT_SYMBOL = '_';

/**
 * @property RNAV_WAYPOINT
 * @type {string}
 * @final
 */
const RNAV_WAYPOINT = 'RNAV';

/**
 * A representation of navigation point within a flight plan.
 *
 * // TODO: needs more info here
 * This navigation point can originate from one of several sources:
 * - `FixModel`, when flying to a specific fix or holding at a specific fix
 * - `StandardRouteWaypointModel`, when flying a standardRoute (SID/STAR)
 *
 * @class WaypointModel
 */
export default class WaypointModel {
    /**
     *
     * @constructor
     * @for WaypointModel
     * @param waypointProps {object}
     */
    constructor(waypointProps) {
        /**
         * Name of the waypoint
         *
         * Should be an ICAO identifier
         *
         * @property name
         * @type {string}
         * @default ''
         */
        this._name = '';

        /**
         * `StaticPositionModel` of the waypoint.
         *
         * @property _positionModel
         * @type {StaticPositionModel}
         * @default null
         * @private
         */
        this._positionModel = null;

        /**
         * Speed restriction for the waypoint.
         *
         * This speed cannot be exceeded.
         *
         * @property speedRestriction
         * @type {number}
         * @default -1
         */
        this.speedRestriction = -1;

        /**
         * Altitude restriction for the waypoint.
         *
         * This altitude cannot be exceeded.
         *
         * @property altitudeRestriction
         * @type {number}
         * @default -1
         */
        this.altitudeRestriction = -1;

        /**
         * Direction to turn for a holding pattern
         *
         * Used only when waypoint is a holding pattern
         *
         * @property _turnDirection
         * @type {string}
         * @private
         */
        this._turnDirection = '';

        /**
         * Length of each leg in holding pattern.
         *
         * Measured in either minutes or nautical miles
         * Used only when waypoint is a holding pattern
         *
         * @property _legLength
         * @type {string}
         * @private
         */
        this._legLength = '';

        /**
         * Timer id for holding pattern
         *
         * Used only when waypoint is a holding pattern
         *
         * @property timer
         * @type {number}
         * @default -999
         * @private
         */
        this.timer = -999;

        /**
         * Flag used to determine if a waypoint is for a holding pattern
         *
         * Typically used from the fms as `fms#currentWaypoint`
         *
         * @property
         * @type {boolean}
         * @default false
         */
        this.isHold = false;

        this.init(waypointProps);
    }

    /**
     * Returns the name of the waypoint
     *
     * Will return `RNAV` if the waypoint is a specific point in space
     * and not a named fixed. These waypoints are prefixed with a
     * `_` symbol.
     *
     * @property name
     * @type {string}
     * @return {string}
     */
    get name() {
        if (this._name.indexOf(RNAV_WAYPOINT_SYMBOL) !== -1) {
            return RNAV_WAYPOINT;
        }

        return this._name;
    }

    /**
     * @property name
     * @type {string}
     */
    set name(nameUpdate) {
        this._name = name;
    }

    /**
     * Provides properties needed for an aircraft to execute a
     * holding pattern.
     *
     * This is used to match an existing API
     *
     * @propert hold
     * @return {object}
     */
    get hold() {
        return {
            dirTurns: this._turnDirection,
            fixName: this._name,
            fixPos: this._positionModel.relativePosition,
            inboundHd: null,
            legLength: parseInt(this._legLength.replace('min', ''), 10),
            timer: this.timer
        };
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
     * @for WaypointModel
     * @return {array<number>} [kilometersNorth, kilometersEast]
     */
    get relativePosition() {
        return this._positionModel.relativePosition;
    }

    /**
     * Initialize the class properties
     *
     * Should be run only on instantiation
     *
     * @For WaypointModel
     * @method init
     * @param waypointProps {object}
     */
    init(waypointProps) {
        this._name = waypointProps.name.toLowerCase();
        this._positionModel = waypointProps.positionModel;
        this.speedRestriction = parseInt(waypointProps.speedRestriction, 10);
        this.altitudeRestriction = parseInt(waypointProps.altitudeRestriction, 10);

        // these properties will only be available for holding pattern waypoints
        this.isHold = _get(waypointProps, 'isHold', this.isHold);
        this._turnDirection = _get(waypointProps, 'turnDirection', this._turnDirection);
        this._legLength = _get(waypointProps, 'legLength', this._legLength);
        this.timer = _get(waypointProps, 'timer', this.timer);
    }

    /**
     * Tear down the instance and reset class properties
     *
     * @for WaypointModel
     * @method destroy
     */
    destroy() {
        this._name = '';
        this._turnDirection = '';
        this._legLength = '';
        this._positionModel = null;

        this.isHold = false;
        this.speedRestriction = -1;
        this.altitudeRestriction = -1;
        this.timer = -999;
    }

    /**
     * Add hold-specific properties to an existing `WaypointModel` instance
     *
     * @for WaypointModel
     * @method updateWaypointWithHoldProps
     * @param turnDirection {string}
     * @param legLength {string}
     */
    updateWaypointWithHoldProps(turnDirection, legLength) {
        this.isHold = true;
        this._turnDirection = turnDirection;
        this._legLength = legLength;
    }
}
