import _get from 'lodash/get';
import {
    INVALID_INDEX,
    INVALID_NUMBER
} from '../../constants/globalConstants';
import {
    RNAV_WAYPOINT_DISPLAY_NAME,
    RNAV_WAYPOINT_PREFIX
} from '../../constants/navigation/routeConstants';
import { extractHeadingFromVectorSegment } from '../../navigationLibrary/Route/routeStringFormatHelper';
import { degreesToRadians } from '../../utilities/unitConverters';

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
        * Maximum altitude at which to cross this waypoint
        *
        * @for WaypointModel
        * @property altitudeMaximum
        * @type {number}
        * @default -1
        */
        this.altitudeMaximum = INVALID_NUMBER;

        /**
        * Minimum altitude at which to cross this waypoint
        *
        * @for WaypointModel
        * @property altitudeMinimum
        * @type {number}
        * @default INVALID_NUMBER
        */
        this.altitudeMinimum = INVALID_NUMBER;

        /**
        * Flag used to determine if a waypoint is for a holding pattern
        *
        * Typically used from the fms as `fms#currentWaypoint`
        *
        * @for WaypointModel
        * @property isHold
        * @type {boolean}
        * @default false
        */
        this.isHold = false;

        /**
         * Maximum speed at which to cross this waypoint
         *
         * @for WaypointModel
         * @property speedMaximum
         * @type {number}
         * @default INVALID_NUMBER
         */
        this.speedMaximum = INVALID_NUMBER;

        /**
         * Minimum speed at which to cross this waypoint
         *
         * @for WaypointModel
         * @property speedMinimum
         * @type {number}
         * @default INVALID_NUMBER
         */
        this.speedMinimum = INVALID_NUMBER;

        // TODO: Should this just be `INVALID_NUMBER`?
        /**
         * Timer id for holding pattern
         *
         * Used only when waypoint is a holding pattern
         *
         * @for WaypointModel
         * @property timer
         * @type {number}
         * @default -999
         * @private
         */
        this.timer = -999;

        /**
        * Heading to fly during the inbound leg of a holding pattern at this fix
        *
        * @for WaypointModel
        * @property _holdingPatternInboundHeading
        * @type {number}
        * @default INVALID_NUMBER
        * @private
        */
        this._holdingPatternInboundHeading = INVALID_NUMBER;

        /**
         * Flag used to determine if the waypoint must be flown over before the
         * aircraft may proceed to the next fix on their route.
         *
         * @for WaypointModel
         * @property _isFlyOverWaypoint
         * @type {boolean}
         * @default false
         * @private
         */
        this._isFlyOverWaypoint = false;

        /**
         * Flag used to determine if a waypoint is for a vector
         *
         * @for WaypointModel
         * @property _isVector
         * @type {boolean}
         * @default false
         * @private
         */
        this._isVector = false;

        /**
         * Length of each leg in holding pattern.
         *
         * Measured in either minutes or nautical miles
         * Used only when waypoint is a holding pattern
         *
         * @for WaypointModel
         * @property _legLength
         * @type {string}
         * @default ''
         * @private
         */
        this._legLength = '';

        /**
        * Name of the waypoint
        *
        * Should be an ICAO identifier
        *
        * @for WaypointModel
        * @property name
        * @type {string}
        * @default ''
        * @private
        */
        this._name = '';

        /**
        * `StaticPositionModel` of the waypoint.
        *
        * @for WaypointModel
        * @property _positionModel
        * @type {StaticPositionModel}
        * @default null
        * @private
        */
        this._positionModel = null;

        /**
         * Direction to turn for a holding pattern
         *
         * Used only when waypoint is a holding pattern
         *
         * @for WaypointModel
         * @property _turnDirection
         * @type {string}
         * @default ''
         * @private
         */
        this._turnDirection = '';

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
        if (this._name.indexOf(RNAV_WAYPOINT_PREFIX) !== INVALID_INDEX) {
            return RNAV_WAYPOINT_DISPLAY_NAME;
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
     * @for WaypointModel
     * @property hasAltitudeRestriction
     * @type {boolean}
     */
    get hasAltitudeRestriction() {
        return this.altitudeMaximum !== INVALID_NUMBER || this.altitudeMinimum !== INVALID_NUMBER;
    }

    /**
     * @for WaypointModel
     * @property hasRestriction
     * @type {boolean}
     */
    get hasRestriction() {
        return this.hasAltitudeRestriction || this.hasSpeedRestriction;
    }

    /**
     * @for WaypointModel
     * @property hasSpeedRestriction
     * @type {boolean}
     */
    get hasSpeedRestriction() {
        return this.speedMaximum !== INVALID_NUMBER || this.speedMinimum !== INVALID_NUMBER;
    }

    /**
     * Provides properties needed for an aircraft to execute a
     * holding pattern.
     *
     * This is used to match an existing API
     *
     * @for WaypointModel
     * @property hold
     * @return {object}
     */
    get hold() {
        return {
            dirTurns: this._turnDirection,
            fixName: this._name,
            fixPos: this._positionModel.relativePosition,
            inboundHeading: this._holdingPatternInboundHeading,
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
     * @property relativePosition
     * @return {array<number>} [kilometersNorth, kilometersEast]
     */
    get relativePosition() {
        return this._positionModel.relativePosition;
    }

    /**
     * Returns whether `this` is a fly-over waypoint
     * @for WaypointModel
     * @property isFlyOverWaypoint
     * @return {boolean}
     */
    get isFlyOverWaypoint() {
        return this._isFlyOverWaypoint;
    }

    /**
     * Returns whether `this` is a vector waypoint
     *
     * @for WaypointModel
     * @property isVector
     * @return {boolean}
     */
    get isVector() {
        return this._isVector;
    }

    /**
     * When `#_isVector` is true, this gets the heading that should be flown
     *
     * @for WaypointModel
     * @property vector
     * @type {number}
     */
    get vector() {
        if (!this.isVector) {
            return;
        }

        const headingInDegrees = parseInt(extractHeadingFromVectorSegment(this._name), 10);
        const headingInRadians = degreesToRadians(headingInDegrees);

        return headingInRadians;
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
        this.speedMaximum = parseInt(waypointProps.speedMaximum, 10);
        this.speedMinimum = parseInt(waypointProps.speedMinimum, 10);
        this.altitudeMaximum = parseInt(waypointProps.altitudeMaximum, 10);
        this.altitudeMinimum = parseInt(waypointProps.altitudeMinimum, 10);
        this._isFlyOverWaypoint = waypointProps.isFlyOverWaypoint;
        this._isVector = waypointProps.isVector;

        // these properties will only be available for holding pattern waypoints
        this.isHold = _get(waypointProps, 'isHold', this.isHold);
        this.timer = _get(waypointProps, 'timer', this.timer);
        this._holdingPatternInboundHeading = _get(waypointProps, '_holdingPatternInboundHeading',
            this._holdingPatternInboundHeading
        );
        this._legLength = _get(waypointProps, 'legLength', this._legLength);
        this._turnDirection = _get(waypointProps, 'turnDirection', this._turnDirection);
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
        this.speedMaximum = INVALID_NUMBER;
        this.speedMinimum = INVALID_NUMBER;
        this.altitudeMaximum = INVALID_NUMBER;
        this.altitudeMinimum = INVALID_NUMBER;
        this.timer = -999;
    }

    /**
     * Check for a maximum altitude restriction below the given altitude
     *
     * @for WaypointModel
     * @method hasMaximumAltitudeBelow
     * @param altitude {number} in feet
     * @return {boolean}
     */
    hasMaximumAltitudeBelow(altitude) {
        return this.altitudeMaximum !== INVALID_NUMBER
            && this.altitudeMaximum < altitude;
    }

    /**
     * Check for a minimum altitude restriction above the given altitude
     *
     * @for WaypointModel
     * @method hasMinimumAltitudeAbove
     * @param altitude {number} in feet
     * @return {boolean}
     */
    hasMinimumAltitudeAbove(altitude) {
        return this.altitudeMinimum !== INVALID_NUMBER
            && this.altitudeMinimum > altitude;
    }

    /**
     * Add hold-specific properties to an existing `WaypointModel` instance
     *
     * @for WaypointModel
     * @method updateWaypointWithHoldProps
     * @param inboundHeading {number}  in radians
     * @param turnDirection {string}   either left or right
     * @param legLength {string}       length of the hold leg in minutes or nm
     */
    updateWaypointWithHoldProps(inboundHeading, turnDirection, legLength) {
        this.isHold = true;
        this._holdingPatternInboundHeading = inboundHeading;
        this._turnDirection = turnDirection;
        this._legLength = legLength;
    }
}
