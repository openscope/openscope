import _isString from 'lodash/isString';
import BaseModel from '../base/BaseModel';
import { radians_normalize } from '../math/circle';
import { isValidCourseString, isValidDirectionString } from '../parsers/aircraftCommandParser/argumentValidators';
import { directionNormalizer, isLegLengthArg } from '../parsers/aircraftCommandParser/argumentParsers';
import { parseSpeedRestriction } from '../utilities/navigationUtilities';
import { degreesToRadians } from '../utilities/unitConverters';

/**
 * Defines a navigational `HoldModel`
 *
 * A `HoldModel` is used to specify how a hold executed at
 * a specific fix
 *
 * @class HoldModel
 */
export default class HoldModel extends BaseModel {
    /**
     * @for HoldModel
     * @constructor
     * @param fixName {string}
     * @param holdString {string}
     */
    constructor(fixName, holdString) {
        super();

        if (!_isString(fixName)) {
            throw new TypeError(
                `Invalid parameter, fixName must be a string, but found ${typeof fixName}`
            );
        } else if (!_isString(holdString)) {
            throw new TypeError(
                `Invalid parameter, holdString must be a string, but found ${typeof holdString}`
            );
        }

        /**
         * Name of the Fix
         *
         * @property fixName
         * @type {string}
         * @default ''
         */
        this.fixName = '';

        /**
         * The parameters of the hold
         *
         * @property holdParameters
         * @type {object}
         * @default null
         */
        this.holdParameters = null;

        this._init(fixName, holdString);
    }

    // ------------------------------ LIFECYCLE ------------------------------

    /**
     * Initialize the model
     *
     * @for HoldModel
     * @method _init
     * @param fixName {string}
     * @param holdString {string}
     * @private
     */
    _init(fixName, holdString) {
        this.fixName = fixName;
        this.holdParameters = this._buildHoldParameters(holdString);

        return this;
    }

    /**
     * @for MapModel
     * @method reset
     */
    reset() {
        this.fixName = '';
        this.holdParameters = null;
    }

    // ------------------------------ LIFECYCLE ------------------------------

    /**
     * Builds the HoldParameters from the specified string
     *
     * @for HoldModel
     * @method _buildHoldParameters
     * @param holdString {string}
     * @returns {object}
     * @private
     */
    _buildHoldParameters(holdString) {
        const holdParameters = {};

        const [radial, turn, length, speed] = holdString.split('|');
        const [parsedSpeed, limit] = parseSpeedRestriction(speed);

        if (!isValidCourseString(radial)) {
            throw new Error(`Invalid radial parameter for Fix '${this.fixName}': ${radial} is not valid`);
        }

        if (!isValidDirectionString(turn)) {
            throw new Error(`Invalid turnDirection parameter for Fix '${this.fixName}': ${turn} is not valid`);
        }

        if (!isLegLengthArg(length)) {
            throw new Error(`Invalid legLength parameter for Fix '${this.fixName}': ${length} is not valid`);
        }

        if (parsedSpeed == null || limit !== '-') {
            throw new Error(`Invalid speedMaximum parameter for Fix '${this.fixName}': ${speed} is not valid`);
        }

        // Heading is given as the radial in degrees, so invert to get inboundHeading
        holdParameters.inboundHeading = radians_normalize(degreesToRadians(180 + parseInt(radial, 10)));
        holdParameters.turnDirection = directionNormalizer(turn);
        holdParameters.legLength = length;
        holdParameters.speedMaximum = parsedSpeed;

        return holdParameters;
    }
}
