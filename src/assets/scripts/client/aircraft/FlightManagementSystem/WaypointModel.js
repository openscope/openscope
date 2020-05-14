import _isArray from 'lodash/isArray';
import _isEmpty from 'lodash/isEmpty';
import _isNumber from 'lodash/isNumber';
import FixCollection from '../../navigationLibrary/FixCollection';
import {
    INVALID_INDEX,
    INVALID_NUMBER
} from '../../constants/globalConstants';
import {
    DEFAULT_HOLD_PARAMETERS,
    RNAV_WAYPOINT_DISPLAY_NAME,
    RNAV_WAYPOINT_PREFIX
} from '../../constants/waypointConstants';
// import { extractHeadingFromVectorSegment } from '../../navigationLibrary/Route/routeStringFormatHelper';
import { parseAltitudeRestriction, parseSpeedRestriction } from '../../utilities/navigationUtilities';
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
 * @class WaypointModel
 */
export default class WaypointModel {
    /**
     * @for WaypointModel
     * @constructor
     */
    constructor(data) {
        if (typeof data !== 'string' && !_isArray(data)) {
            throw new TypeError(`Expected valid data to create WaypointModel but received ${data}`);
        }

        this.altitudeMaximum = INVALID_NUMBER;
        this.altitudeMinimum = INVALID_NUMBER;
        this._speedMaximum = INVALID_NUMBER;
        this._speedMinimum = INVALID_NUMBER;
        this._defaultHoldParameters = Object.assign({}, DEFAULT_HOLD_PARAMETERS);
        this._holdParameters = Object.assign({}, DEFAULT_HOLD_PARAMETERS);
        this._isFlyOverWaypoint = false;
        this._isHoldWaypoint = false;
        this._isVectorWaypoint = false;
        this._name = '';
        this._positionModel = null;

        this.init(data);
    }

    /**
     * Returns whether this waypoint has a value for #altitudeMaximum
     *
     * @for WaypointModel
     * @property hasAltiudeMaximumRestriction
     * @type {boolean}
     */
    get hasAltiudeMaximumRestriction() {
        return this.altitudeMaximum !== INVALID_NUMBER;
    }

    /**
     * Returns whether this waypoint has a value for #altitudeMinimum
     *
     * @for WaypointModel
     * @property hasAltiudeMinimumRestriction
     * @type {boolean}
     */
    get hasAltiudeMinimumRestriction() {
        return this.altitudeMinimum !== INVALID_NUMBER;
    }

    /**
     * Returns whether this waypoint has an altitude restriction of any kind
     *
     * @for WaypointModel
     * @property hasAltitudeRestriction
     * @type {boolean}
     */
    get hasAltitudeRestriction() {
        return this.hasAltiudeMaximumRestriction || this.hasAltiudeMinimumRestriction;
    }

    /**
     * Returns whether this waypoint has a restriction of any kind
     *
     * @for WaypointModel
     * @property hasRestriction
     * @type {boolean}
     */
    get hasRestriction() {
        return this.hasAltitudeRestriction || this.hasSpeedRestriction;
    }

    /**
     * Returns whether this waypoint has a value for #speedMaximum
     *
     * @for WaypointModel
     * @property hasSpeedMaximumRestriction
     * @type {boolean}
     */
    get hasSpeedMaximumRestriction() {
        return this.speedMaximum !== INVALID_NUMBER;
    }

    /**
     * Returns whether this waypoint has a value for #speedMinimum
     *
     * @for WaypointModel
     * @property hasSpeedMinimumRestriction
     * @type {boolean}
     */
    get hasSpeedMinimumRestriction() {
        return this.speedMinimum !== INVALID_NUMBER;
    }

    /**
     * Returns whether this waypoint has a speed restriction of any kind
     *
     * @for WaypointModel
     * @property hasSpeedRestriction
     * @type {boolean}
     */
    get hasSpeedRestriction() {
        return this.hasSpeedMaximumRestriction || this.hasSpeedMinimumRestriction;
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
    get holdParameters() {
        if (!this._isHoldWaypoint) {
            return;
        }

        return this._holdParameters;
    }

    /**
     * Returns whether this waypoint is a fly-over waypoint
     *
     * Fly-over waypoints are waypoints that aircraft may not begin the turn to their
     * next fix until they fully pass this waypoint
     *
     * @for WaypointModel
     * @property isFlyOverWaypoint
     * @return {boolean}
     */
    get isFlyOverWaypoint() {
        return this._isFlyOverWaypoint;
    }

    /**
    * Returns whether this waypoint includes an activated holding pattern
    *
    * @for WaypointModel
    * @property isHoldWaypoint
    * @type {boolean}
    */
    get isHoldWaypoint() {
        return this._isHoldWaypoint;
    }

    /**
    * Returns whether this waypoint is a vector waypoint
    *
    * Vector waypoints are simply an instruction to fly a particular heading
    *
    * @for WaypointModel
    * @property isVector
    * @return {boolean}
    */
    get isVectorWaypoint() {
        return this._isVectorWaypoint;
    }

    /**
     * Returns the value of #_name
     *
     * @for WaypointModel
     * @property name
     * @type {string}
     */
    get name() {
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
     * Facade to access relative position
     *
     * @for WaypointModel
     * @property relativePosition
     * @return {array<number>} [kilometersNorth, kilometersEast]
     */
    get relativePosition() {
        if (this.isVectorWaypoint) {
            return;
        }

        return this._positionModel.relativePosition;
    }

    /**
     * The maxmimum speed allowed for the Waypoint, or hold if `#isHoldwaypoint`
     *
     * @returns {number}
     */
    get speedMaximum() {
        if (this.isHoldWaypoint && this._holdParameters.speedMaximum !== undefined) {
            return this._holdParameters.speedMaximum;
        }

        return this._speedMaximum;
    }

    /**
     * The minimum speed allowed for the Waypoint
     *
     * @returns {number}
     */
    get speedMinimum() {
        return this._speedMinimum;
    }

    // ------------------------------ LIFECYCLE ------------------------------

    /**
     * Initialize instance properties
     *
     * @for WaypointModel
     * @method init
     * @param data {object}
     * @chainable
     */
    init(data) {
        let fixName = data;
        let restrictions = '';

        if (_isArray(data)) {
            if (data.length !== 2) {
                throw new TypeError(`Expected restricted fix to have restrictions, but received ${data}`);
            }

            [fixName, restrictions] = data;
        }

        this._name = fixName.replace('@', '').replace('^', '');

        this._initSpecialWaypoint(fixName);
        this._applyRestrictions(restrictions);
        this._initializePosition();
    }

    /**
     * Reset instance properties
     *
     * @for WaypointModel
     * @method reset
     * @chainable
     */
    reset() {
        this.altitudeMaximum = INVALID_NUMBER;
        this.altitudeMinimum = INVALID_NUMBER;
        this._speedMaximum = INVALID_NUMBER;
        this._speedMinimum = INVALID_NUMBER;
        this._defaultHoldParameters = Object.assign({}, DEFAULT_HOLD_PARAMETERS);
        this._holdParameters = Object.assign({}, DEFAULT_HOLD_PARAMETERS);
        this._isFlyOverWaypoint = false;
        this._isHoldWaypoint = false;
        this._isVectorWaypoint = false;
        this._name = '';
        this._positionModel = null;

        return this;
    }

    /**
     * Initialize properties to make this waypoint a fly-over waypoint
     *
     * @for WaypointModel
     * @method _initFlyOverWaypoint
     * @private
     */
    _initFlyOverWaypoint() {
        this._isFlyOverWaypoint = true;
    }

    /**
     * Initialize properties to make this waypoint a hold waypoint
     *
     * @for WaypointModel
     * @method _initHoldWaypoint
     * @private
     */
    _initHoldWaypoint() {
        this._isHoldWaypoint = true;
    }

    /**
     * Perform additional initialization tasks as needed if waypoint is a flyover/hold/vector/etc waypoint
     *
     * @for WaypointModel
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
        }
    }

    /**
     * Initialize properties to make this waypoint a vector waypoint
     *
     * @for WaypointModel
     * @method _initVectorWaypoint
     * @private
     */
    _initVectorWaypoint() {
        this._isVectorWaypoint = true;
    }

    // ------------------------------ PUBLIC ------------------------------

    /**
     * Mark this waypoint as a hold waypoint
     *
     * @for WaypointModel
     * @method activateHold
     */
    activateHold() {
        this._isHoldWaypoint = true;
    }

    /**
     * Calculate the distance between two waypoint models
     *
     * @for WaypointModel
     * @method calculateBearingToWaypoint
     * @param waypointModel {WaypointModel}
     * @return {number} bearing, in radians
     */
    calculateBearingToWaypoint(waypointModel) {
        this._ensureNonVectorWaypointsForThisAndWaypoint(waypointModel);

        return this._positionModel.bearingToPosition(waypointModel.positionModel);
    }

    /**
     * Calculate the distance between two waypoint models
     *
     * @for WaypointModel
     * @method calculateDistanceToWaypoint
     * @param waypointModel {WaypointModel}
     * @return {number} distance, in nautical miles
     */
    calculateDistanceToWaypoint(waypointModel) {
        this._ensureNonVectorWaypointsForThisAndWaypoint(waypointModel);

        return this._positionModel.distanceToPosition(waypointModel.positionModel);
    }

    /**
     * Cancel any hold at this waypoint
     *
     * @for WaypointModel
     * @method deactivateHold
     */
    deactivateHold() {
        this._isHoldWaypoint = false;
    }

    /**
     * Returns the name of the waypoint, amended for display to user
     *
     * Will return `[RNAV]` for waypoints prefixed with an underscore
     *
     * @for WaypointModel
     * @property name
     * @type {string}
     */
    getDisplayName() {
        if (this._name.indexOf(RNAV_WAYPOINT_PREFIX) !== INVALID_INDEX) {
            return RNAV_WAYPOINT_DISPLAY_NAME;
        }

        return this._name;
    }

    /**
     * When `#_isVector` is true, this gets the heading that should be flown
     *
     * @for WaypointModel
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
     * Check for a maximum altitude restriction at or below the given altitude
     *
     * @for WaypointModel
     * @method hasMaximumAltitudeAtOrBelow
     * @param altitude {number} in feet
     * @return {boolean}
     */
    hasMaximumAltitudeAtOrBelow(altitude) {
        return this.altitudeMaximum !== INVALID_NUMBER && this.altitudeMaximum <= altitude;
    }

    /**
     * Check for a minimum altitude restriction at or above the given altitude
     *
     * @for WaypointModel
     * @method hasMinimumAltitudeAtOrAbove
     * @param altitude {number} in feet
     * @return {boolean}
     */
    hasMinimumAltitudeAtOrAbove(altitude) {
        return this.altitudeMinimum !== INVALID_NUMBER && this.altitudeMinimum >= altitude;
    }

    /**
     * Check for a maximum speed restriction at or below the given speed
     *
     * @for WaypointModel
     * @method hasMaximumSpeedAtOrBelow
     * @param speed {number} in knots
     * @return {boolean}
     */
    hasMaximumSpeedAtOrBelow(speed) {
        const speedMax = this.speedMaximum;

        return speedMax !== INVALID_NUMBER && speedMax <= speed;
    }

    /**
     * Check for a minimum speed restriction at or above the given speed
     *
     * @for WaypointModel
     * @method hasMinimumSpeedAtOrAbove
     * @param speed {number} in knots
     * @return {boolean}
     */
    hasMinimumSpeedAtOrAbove(speed) {
        return this.speedMinimum !== INVALID_NUMBER && this.speedMinimum >= speed;
    }

    /**
     * Reset the value of #_holdParameters.timer to the default
     *
     * @for WaypointModel
     * @method resetHoldTimer
     */
    resetHoldTimer() {
        this._holdParameters.timer = DEFAULT_HOLD_PARAMETERS.timer;
    }

    /**
     * Set the #altitudeMinimum and #altitudeMaximum to the specified altitude
     *
     * @for WaypointModel
     * @method setAltitude
     * @param altitude {number} in feet
     */
    setAltitude(altitude) {
        this.setAltitudeMaximum(altitude);
        this.setAltitudeMinimum(altitude);
    }

    /**
     * Set the #altitudeMaximum to the specified altitude
     *
     * @for WaypointModel
     * @method setAltitudeMaximum
     * @param altitudeMaximum {number} in feet
     */
    setAltitudeMaximum(altitudeMaximum) {
        if (!_isNumber(altitudeMaximum)) {
            console.warn(`Expected number to set as max altitude of waypoint '${this._name}', ` +
                `but received '${altitudeMaximum}'`);

            return;
        }

        if (altitudeMaximum < 0 || altitudeMaximum > 60000) {
            console.warn(`Expected requested waypoint '${this._name}' max altitude to be reasonable, ` +
                `but received altitude of '${altitudeMaximum}'`);

            return;
        }

        this.altitudeMaximum = altitudeMaximum;
    }

    /**
     * Set the #altitudeMinimum to the specified altitude
     *
     * @for WaypointModel
     * @method setAltitudeMinimum
     * @param altitudeMinimum {number} in feet
     */
    setAltitudeMinimum(altitudeMinimum) {
        if (!_isNumber(altitudeMinimum)) {
            console.warn(`Expected number to set as max altitude of waypoint '${this._name}', ` +
                `but received '${altitudeMinimum}'`);

            return;
        }

        if (altitudeMinimum < 0 || altitudeMinimum > 60000) {
            console.warn(`Expected requested waypoint '${this._name}' max altitude to be reasonable, ` +
                `but received altitude altitude of '${altitudeMinimum}'`);

            return;
        }

        this.altitudeMinimum = altitudeMinimum;
    }

    /**
     * Set default parameters for the planned holding pattern at this waypoint, and will
     * set both `#_defaultHoldParameters` and `#_holdParameters` properties
     *
     * This should only be called immedately after creating a new `WaypointModel`
     *
     * @for WaypointModel
     * @method setDefaultHoldParameters
     * @param holdParameters {object}
     */
    setDefaultHoldParameters(holdParameters) {
        // The rationale behind having both _defaultHoldParameters and _holdParameters is:
        // * Without this, once a hold command is executed with specific options (eg. HOLD BPK left 225),
        //   it could overwrite the parameters for a procedural hold
        // * This would mean that if the hold was cancelled and re-requested without any specific options (eg. HOLD BPK)
        //   it would still use "left 225", and not the expected defaults from the pocedure

        // These can't be the same reference, as we don't want any changes to made _holdParameters
        // (eg. timer) to be passed onto _defaultHoldParameters
        this._defaultHoldParameters = Object.assign({}, DEFAULT_HOLD_PARAMETERS, holdParameters);
        this._holdParameters = Object.assign({}, DEFAULT_HOLD_PARAMETERS, holdParameters);
    }

    /**
     * Set parameters for the planned holding pattern at this waypoint. This does NOT
     * inherently make this a hold waypoint, but simply describes the holding pattern
     * aircraft should follow IF they are told to hold at this waypoint
     *
     * @for WaypointModel
     * @method setHoldParameters
     * @param holdParameters {object}
     * @param fallbackInboundHeading {number} an optional inboundHeading that is used if no default is available
     * @returns {object} The hold parameters set for the `WaypointModel`
     */
    setHoldParameters(holdParameters, fallbackInboundHeading) {
        const params = Object.assign({}, this._defaultHoldParameters, holdParameters);

        if (params.inboundHeading == null) {
            params.inboundHeading = fallbackInboundHeading;
        }

        this._holdParameters = params;

        return params;
    }

    /**
     * Stores provided parameters for holding pattern, and marks this as a hold waypoint
     *
     * @for WaypointModel
     * @method setHoldParametersAndActivateHold
     * @param inboundHeading {number} in radians
     * @param turnDirection {string} either left or right
     * @param legLength {string} length of the hold leg in minutes or nm
     * @param fallbackInboundHeading {number} an optional inboundHeading that is used if no default is available
     * @returns {object} The hold parameters set
     */
    setHoldParametersAndActivateHold(holdParameters, fallbackInboundHeading = undefined) {
        const params = this.setHoldParameters(holdParameters, fallbackInboundHeading);

        this.activateHold();

        return params;
    }

    /**
     * Set the value of #_holdParameters.timer
     *
     * @for WaypointModel
     * @method setHoldTimer
     * @param expirationTime {number} game time (seconds) when the timer should "expire"
     */
    setHoldTimer(expirationTime) {
        if (typeof expirationTime !== 'number') {
            throw new TypeError('Expected hold timer expiration time to be a ' +
                `number, but received type ${typeof expirationTime}`);
        }

        this._holdParameters.timer = expirationTime;
    }

    // ------------------------------ PRIVATE ------------------------------

    /**
     * Apply an altitude restriction in the appropriate properties
     *
     * @for WaypointModel
     * @method _applyAltitudeRestriction
     * @param restriction {string}
     */
    _applyAltitudeRestriction(restriction) {
        const [altitude, limit] = parseAltitudeRestriction(restriction);

        if (altitude == null) {
            throw new Error(`Expected valid altitude restriction, but received ${restriction}`);
        }

        if (limit === '+') {
            this.altitudeMinimum = altitude;

            return;
        }

        if (limit === '-') {
            this.altitudeMaximum = altitude;

            return;
        }

        this.altitudeMaximum = altitude;
        this.altitudeMinimum = altitude;
    }

    /**
     * Parse the restrictions, and store the inferred meaning in the appropriate properties
     *
     * @for WaypointModel
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
                this._applyAltitudeRestriction(restriction);
            } else if (restriction[0] === 'S') {
                this._applySpeedRestriction(restriction);
            } else {
                throw new TypeError('Expected "A" or "S" prefix on restriction, ' +
                    `but received prefix '${restriction[0]}'`);
            }
        }
    }

    /**
     * Apply a speed restriction in the appropriate properties
     *
     * @for WaypointModel
     * @method _applySpeedRestriction
     * @param restriction {string}
     */
    _applySpeedRestriction(restriction) {
        const [speed, limit] = parseSpeedRestriction(restriction);

        if (speed == null) {
            throw new Error(`Expected valid speed restriction, but received ${restriction}`);
        }

        if (limit === '+') {
            this._speedMinimum = speed;

            return;
        }

        if (limit === '-') {
            this._speedMaximum = speed;

            return;
        }

        this._speedMaximum = speed;
        this._speedMinimum = speed;
    }

    /**
     * Verify that this waypoint and the specified waypoint are both valid, non-vector waypoints
     *
     * If either are not, then throw some errors about it.
     *
     * This method is used to protect certain methods that would have undesirable
     * behaviors with vector waypoints (such as those measuring angles or distances
     * between waypoint models, etc). In those cases, we should be cognizant to
     * exclude vector (or other undesirable) waypoints from those operations, rather
     * than attempting to execute a calculation that cannot yield a logical result.
     *
     * @for WaypointModel
     * @method _ensureNonVectorWaypointsForThisAndWaypoint
     * @param waypointModel {WaypointModel}
     * @private
     */
    _ensureNonVectorWaypointsForThisAndWaypoint(waypointModel) {
        if (!(waypointModel instanceof WaypointModel)) {
            throw new TypeError(`Expected a WaypointModel instance, but received type '${waypointModel}'`);
        }

        if (this._isVectorWaypoint || waypointModel.isVectorWaypoint) {
            throw new TypeError('Expected .calculateBearingToWaypoint() to never be called with vector waypoints!');
        }
    }

    /**
     * Initialize the waypoint's position model based on #_name
     *
     * @for WaypointModel
     * @method _initializePosition
     */
    _initializePosition() {
        if (this._isVectorWaypoint) {
            return;
        }

        const fixPosition = FixCollection.getPositionModelForFixName(this._name);

        if (!fixPosition) {
            throw new TypeError(`Expected fix with known position, but cannot find fix '${this._name}'`);
        }

        this._positionModel = fixPosition;
    }
}
