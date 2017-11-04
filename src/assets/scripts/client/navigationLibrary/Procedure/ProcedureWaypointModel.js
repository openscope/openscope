import _isArray from 'lodash/isArray';
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
// import { extractHeadingFromVectorSegment } from '../../navigationLibrary/Route/routeStringFormatHelper';
import {
    degreesToRadians,
    DECIMAL_RADIX
} from '../../utilities/unitConverters';

/**
 * A navigation point within an aircraft's flight plan
 *
 * This may include various types of restrictions or holding information, all
 * of which are used by the aircraft to follow various routes and procedures
 * utilized by the controller.
 *
 * @class ProcedureWaypointModel
 */
export default class ProcedureWaypointModel {
    /**
     * @for ProcedureWaypointModel
     * @constructor
     */
    constructor(data) {
        if (typeof data !== 'string' && !_isArray(data)) {
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
     * @for ProcedureWaypointModel
     * @property hasAltitudeRestriction
     * @type {boolean}
     */
    get hasAltitudeRestriction() {
        return this.altitudeMaximum !== INVALID_NUMBER || this.altitudeMinimum !== INVALID_NUMBER;
    }

    /**
     * @for ProcedureWaypointModel
     * @property hasRestriction
     * @type {boolean}
     */
    get hasRestriction() {
        return this.hasAltitudeRestriction || this.hasSpeedRestriction;
    }

    /**
     * @for ProcedureWaypointModel
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
     * @for ProcedureWaypointModel
     * @property hold
     * @return {object}
     */
    get holdParameters() {
        if (!this._isHoldWaypoint) {
            return;
        }

        return this._holdParameters;
    }


        /**
         * Returns whether `this` is a fly-over waypoint
         * @for ProcedureWaypointModel
         * @property isFlyOverWaypoint
         * @return {boolean}
         */
        get isFlyOverWaypoint() {
            return this._isFlyOverWaypoint;
        }

        /**
        * Returns whether `this` is a hold waypoint
        *
        * @for ProcedureWaypointModel
        * @property isHoldWaypoint
        * @type {boolean}
        */
        get isHoldWaypoint() {
            return this._isHoldWaypoint;
        }

        /**
        * Returns whether `this` is a vector waypoint
        *
        * @for ProcedureWaypointModel
        * @property isVector
        * @return {boolean}
        */
        get isVectorWaypoint() {
            return this._isVectorWaypoint;
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
     * @for ProcedureWaypointModel
     * @property relativePosition
     * @return {array<number>} [kilometersNorth, kilometersEast]
     */
    get relativePosition() {
        return this._positionModel.relativePosition;
    }

    /**
     * Initialize waypoint properties
     *
     * @for ProcedureWaypointModel
     * @method _init
     * @param data {object}
     * @private
     * @chainable
     */
    _init(data) {
        let fixName = data;
        let restrictions = '';

        if (_isArray(data)) {
            if (data.length !== 2) {
                throw new TypeError(`Expected restricted fix to have restrictions, but received ${data}`);
            }

            fixName = data[0];
            restrictions = data[1];
        }

        this._name = fixName.replace('@', '').replace('^', '');

        this._initSpecialWaypoint(fixName);
        this._applyRestrictions(restrictions);
        this._initializePosition();

        return;
    }


    /**
     * Initialize properties to make this waypoint a fly-over waypoint
     *
     * @for ProcedureWaypointModel
     * @method _initFlyOverWaypoint
     * @private
     */
    _initFlyOverWaypoint() {
        this._isFlyOverWaypoint = true;
    }

    /**
     * Initialize properties to make this waypoint a hold waypoint
     *
     * @for ProcedureWaypointModel
     * @method _initHoldWaypoint
     * @private
     */
    _initHoldWaypoint() {
        this._isHoldWaypoint = true;
        // FIXME: These should be coming from a const file somewhere instead of being hard-coded
        this._holdParameters = {
            inboundHeading: undefined,
            legLength: 1,
            timer: INVALID_NUMBER,
            turnDirection: 'right'
        };
    }

    /**
     * Perform additional initialization tasks as needed if waypoint is a flyover/hold/vector/etc waypoint
     *
     * @for ProcedureWaypointModel
     * @method _initSpecialWaypoint
     * @param fixname {string} name of the fix, including any special characters
     */
    _initSpecialWaypoint(fixName) {
        if (fixName.indexOf('^') !== INVALID_INDEX) {
            this._initFlyOverWaypoint();

            return;
        }

        if (fixName.indexOf('@') !== INVALID_INDEX) {
            this._initHoldWaypoint();

            return;
        }

        if (fixName.indexOf('#') !== INVALID_INDEX) {
            this._initVectorWaypoint();

            return;
        }
    }

    /**
     * Initialize properties to make this waypoint a vector waypoint
     *
     * @for ProcedureWaypointModel
     * @method _initVectorWaypoint
     * @private
     */
    _initVectorWaypoint() {
        this._isVectorWaypoint = true;
    }

    /**
     * When `#_isVector` is true, this gets the heading that should be flown
     *
     * @for ProcedureWaypointModel
     * @method _getVector
     * @type {number}
     */
    getVector() {
        if (!this._isVectorWaypoint) {
            return;
        }

        const fixNameWithOutPoundSign = this._name.replace('#', '');
        const headingInDegrees = parseInt(fixNameWithOutPoundSign, DECIMAL_RADIX);
        const headingInRadians = degreesToRadians(headingInDegrees);

        return headingInRadians;
    }

    /**
     * Check for a maximum altitude restriction below the given altitude
     *
     * @for ProcedureWaypointModel
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
     * @for ProcedureWaypointModel
     * @method hasMinimumAltitudeAbove
     * @param altitude {number} in feet
     * @return {boolean}
     */
    hasMinimumAltitudeAbove(altitude) {
        return this.altitudeMinimum !== INVALID_NUMBER
            && this.altitudeMinimum > altitude;
    }

    /**
     * Stores provided parameters for holding pattern, and marks this as a hold waypoint
     *
     * @for ProcedureWaypointModel
     * @method setHoldParametersAndArmHold
     * @param inboundHeading {number} in radians
     * @param turnDirection {string} either left or right
     * @param legLength {string} length of the hold leg in minutes or nm
     */
    setHoldParametersAndArmHold(inboundHeading, turnDirection, legLength) {
        this._isHoldWaypoint = true;
        this._holdParameters = {
            turnDirection: turnDirection,
            inboundHeading: inboundHeading,
            legLength: legLength,
            timer: INVALID_NUMBER
        };
    }

    /**
     * Apply an altitude restriction in the appropriate properties
     *
     * @for ProcedureWaypointModel
     * @method _applyAltitudeRestriction
     * @param restriction {string}
     */
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

    /**
     * Parse the restrictions, and store the inferred meaning in the appropriate properties
     *
     * @for ProcedureWaypointModel
     * @method _applyRestrictions
     * @param restrictions {string} restrictions, separated by pipe symbol: '|'
     */
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
            } else {
                throw new TypeError('Expected "A" or "S" prefix on restriction, ' +
                    `but received prefix '${restriction[0]}'`);
            }
        }
    }

    /**
     * Apply a speed restriction in the appropriate properties
     *
     * @for ProcedureWaypointModel
     * @method _applySpeedRestriction
     * @param restriction {string}
     */
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

    /**
     * Initialize the waypoint's position model based on #_name
     *
     * @for ProcedureWaypointModel
     * @method _initializePosition
     */
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
