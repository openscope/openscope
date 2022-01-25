import _ceil from 'lodash/ceil';
import BaseModel from '../base/BaseModel';
import StaticPositionModel from '../base/StaticPositionModel';
import { degreesToRadians, km, km_ft } from '../utilities/unitConverters';
import { abs, tan } from '../math/core';
import { AIRPORT_CONSTANTS } from '../constants/airportConstants';

/**
 * Defines a navigational `LocalizerModel`
 *
 * A `LocalizerModel` represents characteristics for a single physical localizer and associated glideslope.
 * A `LocalizerModel` is referenced as a default for a specific `RunwayModel` or used as part of an IAP.
 *
 * @class LocalizerModel
 */
export default class LocalizerModel extends BaseModel {
    /**
     * @constructor
     * @for LocalizerModel
     * @param name {string},
     * @param data {object},
     * @param runwayCourse {number} Used as default localizer angle if no angle is provided.
     * @param referencePosition {StaticPositionModel}
     */
    // istanbul ignore next
    constructor(name, data = {}, referencePosition) {
        super();

        /**
         * Name of the runway
         *
         * @property name
         * @type {string}
         * @default ''
         */
        this.name = '';

        /**
         * Angle\Course of the localizer
         *
         * @property angle
         * @type {number}
         * @default 0
         */
        this.angle = 0;

        /**
         * Maximum useable length of localizer signal
         *
         * @property maxDist
         * @type {number}
         * @default 25km
         */
        this._distance = km(25);

        /**
         * Name of the runway
         *
         * @property name
         * @type {number}
         * @default 3deg
         */
        this._glideslopeAngle = degreesToRadians(3);

        /**
         * Location of the localizer itself
         *
         * @property _positionModel
         * @type {StaticPositionModel}
         * @default null
         * @private
         */
        this._positionModel = null;


        this._init(name, data, referencePosition);
    }

    /**
     * Provides access to the position data of the instance
     *
     * @property positionModel
     * @return {StaticPositionModel}
     */
    get positionModel() {
        return this._positionModel;
    }

    /**
     * Provides access to the glideslope angle of the instance
     *
     * @property glideslopeAngle
     * @return {number}
     */
    get glideslopeAngle() {
        return this._glideslopeAngle;
    }

    /**
     * Facade to access relative position
     *
     * @for LocalizerModel
     * @return {array<number>} [kilometersNorth, kilometersEast]
     */
    get relativePosition() {
        return this._positionModel.relativePosition;
    }

    /**
     * @for LocalizerModel
     * @property elevation
     * @type {number}
     */
    get elevation() {
        return this._positionModel.elevation;
    }

    /**
     * @for LocalizerModel
     * @property distance
     * @type {number}
     */
    get distance() {
        return this._distance;
    }

    /**
     * Lifecycle method. Should be run only once on instantiation.
     *
     * @for LocalizerModel
     * @method _init
     * @param name {String}
     * @param data {Object}
     * @param referencePosition {StaticPositionModel}
     */
    _init(name, data, referencePosition) {
        this.name = name.toUpperCase();

        if (data.angle) {
            this.angle = degreesToRadians(data.angle);
        }

        if (data.distance) {
            this._distance = km(data.distance);
        }

        if (data.glideslopeAngle) {
            this._glideslopeAngle = degreesToRadians(data.glideslopeAngle);
        }

        this._positionModel = new StaticPositionModel(
            data.position,
            referencePosition,
            referencePosition.magneticNorth
        );
    }

    /**
     * reset the current instance
     *
     * @for LocalizerModel
     * @method reset
     * @chainable
     */
    reset() {
        this.name = '';
        this._positionModel = null;

        return this;
    }

    /**
     * Calculate the height of the glideslope for a localizer at a given distance on final
     *
     * @for LocalizerModel
     * @method getGlideslopeAltitude
     * @param distance {number}                       distance from the runway, in kilometers
     * @param glideslopeGradient {number} [optional]  gradient of the glideslope in radians
     *                                                (typically equivalent to 3.0 degrees)
     * @return {number}
     */
    getGlideslopeAltitude(distance) {
        distance = Math.max(0, distance);
        const rise = tan(abs(this._glideslopeAngle));

        // TODO: this logic could be abstracted to a helper.
        return this.elevation + (rise * km_ft(distance));
    }

    /**
     * Calculate the height of the glideslope at (or abeam) the final approach fix
     *
     * @for LocalizerModel
     * @method getGlideslopeAltitudeAtFinalApproachFix
     * @param distance {number}                       distance from the runway, in kilometers
     * @return {number} glideslope altitude in ft MSL
     */
    getGlideslopeAltitudeAtFinalApproachFix(distance) {
        if (distance) {
            return this.getGlideslopeAltitude(distance);
        }
        return this.getGlideslopeAltitude(km(AIRPORT_CONSTANTS.FINAL_APPROACH_FIX_DISTANCE_NM));
    }

    /**
     * Calculate the height of the lowest 100-ft-increment altitude which is along the glideslope and beyond the FAF
     *
     * @for LocalizerModel
     * @method getMinimumGlideslopeInterceptAltitude
     * @return {number} glideslope altitude in ft MSL
     */
    getMinimumGlideslopeInterceptAltitude() {
        const altitudeAtFinalApproachFix = this.getGlideslopeAltitudeAtFinalApproachFix();
        const minimumInterceptAltitude = _ceil(altitudeAtFinalApproachFix, -2);

        return minimumInterceptAltitude;
    }
}
