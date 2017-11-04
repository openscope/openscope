import _isEmpty from 'lodash/isEmpty';
import FixCollection from '../Fix/FixCollection';
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

export default class ProcedureWaypointModel {
    constructor(data) {
        if (typeof data === 'undefined') {
            throw new TypeError(`Expected valid data to create ProcedureWaypointModel but received ${data}`);
        }

        this.altitudeMaximum = -1;
        this.altitudeMinimum = -1;
        this.speedMaximum = -1;
        this.speedMinimum = -1;
        /**
         * Contains `timer`, `inboundHeading`, 'legLength', 'turnDirection'
         * @for ProcedureWaypointModel
         * @property _holdParameters
         * @type {object}
         */
        this._holdParameters = null;
        this._isFlyOverWaypoint = false;
        this._isHoldWaypoint = false;
        this._isVectorWaypoint = false;
        this._name = '';
        this._positionModel = null;

        this._init(data);
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

    _init(data) {
        let fixName = data;
        let restrictions = '';

        if (typeof data !== 'string') {
            fixName = data[0];
            restrictions = data[1];
        }

        this._name = fixName.replace('@', '').replace('^', '').replace('#', '');
        this._isFlyOverWaypoint = fixName.indexOf('^') !== -1;
        this._isHoldWaypoint = fixName.indexOf('@') !== -1;
        this._isVectorWaypoint = fixName.indexOf('#') !== -1;
        this._applyRestrictions(restrictions);
        this._initializePosition();

        return;
    }

    _applyRestrictions(restrictions) {
        if (_isEmpty(restrictions)) {
            return;
        }

        const restrictionCollection = restrictions.split('|');

        for (let i = 0; i < restrictionCollection.length; i++) {
            const restriction = restrictionCollection[i];

            // looking at the first letter of a restriction
            if (restriction[0] === 'A') {
                this._applyAltitudeRestriction(restriction.substr(1));
            } else if (restriction[0] === 'S') {
                this._applySpeedRestriction(restriction.substr(1));
            }
        }
    }

    _applyAltitudeRestriction(restriction) {
        const altitude = parseInt(restriction, 10) * 100;

        if (restriction.indexOf('+') !== -1) {
            this.altitudeMinimum = altitude;

            return;
        } else if (restriction.indexOf('-') !== -1) {
            this.altitudeMaximum = altitude;

            return;
        }

        this.altitudeMaximum = altitude;
        this.altitudeMinimum = altitude;
    }

    _applySpeedRestriction(restriction) {
        const speed = parseInt(restriction, 10);

        if (restriction.indexOf('+') !== -1) {
            this.speedMinimum = speed;

            return;
        } else if (restriction.indexOf('-') !== -1) {
            this.speedMaximum = speed;

            return;
        }

        this.speedMaximum = speed;
        this.speedMinimum = speed;
    }

    _initializePosition() {
        if (this._isVectorWaypoint) {
            return;
        }

        const fixPosition = FixCollection.getPositionModelForFixName(this._name);

        if (fixPosition === null) {
            throw new TypeError(`Expected fix with known position, but cannot find fix '${this._name}'`);
        }

        this._positionModel = fixPosition;
    }
}
