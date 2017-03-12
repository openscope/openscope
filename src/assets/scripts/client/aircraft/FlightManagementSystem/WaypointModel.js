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
         * @private
         */
        this.timer = -1;

        this.init(waypointProps);
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
            fixName: this.name,
            fixPos: this._positionModel,
            inboundHd: null,
            legLength: this._legLength,
            timer: this.timer
        };
    }

    /**
     * Provide read-only public access to this._positionModel
     *
     * @for SpawnPatternModel
     * @property position
     * @type {StaticPositionModel}
     */
    get position() {
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
        this.name = waypointProps.name.toLowerCase();
        this._positionModel = waypointProps.position;
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
        this._positionModel = null;
        this.speedRestriction = -1;
        this.altitudeRestriction = -1;
        this._turnDirection = '';
        this._legLength = '';
        this.timer = -1;
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
        this._turnDirection = turnDirection;
        this._legLength = legLength;
        this._isHold = true;
    }
}
