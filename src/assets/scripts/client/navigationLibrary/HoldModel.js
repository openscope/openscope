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

        holdString.split('|').forEach((item) => {
            if (holdParameters.inboundHeading == null && isValidCourseString(item)) {
                holdParameters.inboundHeading = radians_normalize(degreesToRadians(180 + parseInt(item, 10)));

                return;
            }

            if (holdParameters.turnDirection == null && isValidDirectionString(item)) {
                holdParameters.turnDirection = directionNormalizer(item);

                return;
            }

            if (holdParameters.legLength == null && isLegLengthArg(item)) {
                holdParameters.legLength = item;

                return;
            }

            // The speed limit can be optional, but it tends to imply ICAO speed restrictions
            const [value, limit] = parseSpeedRestriction(item);
            if (value != null) {
                if (limit !== '-') {
                    throw new Error(`Invalid speedMaximum parameter for Fix '${this.fixName}': ${item} is not valid`);
                }

                holdParameters.speedMaximum = value;

                return;
            }

            throw new Error(`Unexpected parameter for Fix '${this.fixName}': ${item}`);
        });

        if (holdParameters.inboundHeading == null) {
            throw new Error(`Missing radial parameter for Fix '${this.fixName}': ${holdString}`);
        }

        if (holdParameters.turnDirection == null) {
            throw new Error(`Missing turnDirection parameter for Fix '${this.fixName}': ${holdString}`);
        }

        if (holdParameters.legLength == null) {
            throw new Error(`Missing legLength parameter for Fix '${this.fixName}': ${holdString}`);
        }

        return holdParameters;
    }
}
