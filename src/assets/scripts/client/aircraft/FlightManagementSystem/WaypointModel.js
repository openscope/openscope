import _get from 'lodash/get';
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
        this.name = '';

        /**
         * Lat/Long position of the waypoint
         *
         * @property _position
         * @type {string}
         * @default null
         * @private
         */
        this._position = null;

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
         * @private
         */
        this.timer = -1;

        this.init(waypointProps);
    }

    /**
     * Return the position array from `#_position` object.
     *
     * @property position
     * @return {array<number>}
     */
    get position() {
        return this._position.position;
    }

    /**
     * Provides properties needed for an aircraft to execute a
     * holding pattern.
     *
     * This is currently setup to match an existing API
     *
     * @propert hold
     * @return {object}
     */
    get hold() {
        return {
            dirTurns: this._turnDirection,
            fixName: this.name,
            fixPos: this.position,
            inboundHd: null,
            legLength: this._legLength,
            timer: this.timer
        };
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
        this.name = waypointProps.name.toLowerCase();
        this._position = waypointProps.position;
        this.speedRestriction = parseInt(waypointProps.speedRestriction, 10);
        this.altitudeRestriction = parseInt(waypointProps.altitudeRestriction, 10);

        // these properties will only be available for holding pattern waypoints
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
        this.name = '';
        this._position = null;
        this.speedRestriction = -1;
        this.altitudeRestriction = -1;
        this._turnDirection = '';
        this._legLength = '';
        this.timer = -1;
    }

    /**
     * Add hold-specific properties to an existing `WaypointModel`
     *
     * @for WaypointModel
     * @method createHoldAtWaypoint
     * @param turnDirection {string}
     * @param legLength {string}
     */
    createHoldAtWaypoint(turnDirection, legLength) {
        this._turnDirection = turnDirection;
        this._legLength = legLength;
    }
}
