import _without from 'lodash/without';
import BaseModel from '../../base/BaseModel';
import StaticPositionModel from '../../base/StaticPositionModel';
import { PERFORMANCE } from '../../constants/aircraftConstants';
import { INVALID_NUMBER } from '../../constants/globalConstants';
import {
    angle_offset,
    radians_normalize
} from '../../math/circle';
import {
    abs,
    tan
} from '../../math/core';
import {
    calculateCrosswindAngle,
    getOffset
} from '../../math/flightMath';
import {
    km,
    km_ft,
    nm,
    degreesToRadians
} from '../../utilities/unitConverters';

/**
 * Describes a single runway at an airport
 *
 * @class RunwayModel
 * @extends BaseModel
 */
export default class RunwayModel extends BaseModel {
    /**
     * @for RunwayModel
     * @constructor
     * @param options {object}
     * @param end {number}
     * @param airportPositionModel {StaticPositionModel}
     */
     // istanbul ignore next
    constructor(options = {}, end, airportPositionModel) {
        super();

        /**
         * @property airportPositionModel
         * @type {StaticPositionModel|null}
         * @default null
         */
        this.airportPositionModel = null;

        /**
         * @property _positionModel
         * @type {StaticPositionModel|null}
         * @default null
         * @private
         */
        this._positionModel = null;

        /**
         * Name of the runway
         *
         * @property name
         * @type {string}
         * @default ''
         */
        this.name = '';

        /**
         * Angle (heading) of the runway in radians
         *
         * @property angle
         * @type {number}
         * @default null
         */
        this.angle = -999;

        /**
         * @property delay
         * @type {number}
         * @default 2
         */
        this.delay = 2;

        /**
         * @property ils
         * @type {object}
         */
        this.ils = {
            enabled: true,
            loc_maxDist: km(25),
            // gs_maxHeight: 9999,
            glideslopeGradient: degreesToRadians(3)
        };

        /**
         * @property labelPos
         * @type {array<number>}
         * @default []
         */
        this.labelPos = [];

        /**
         * @property length
         * @type
         * @default
         */
        this.length = null;

        /**
         * @property sepFromAdjacent
         * @type {number}
         */
        this.sepFromAdjacent = km(3);

        /**
         * Aircraft queue
         *
         * A list of aircraft that have taxied to the end of
         * the runway and are waiting to takeoff
         *
         * @property queue
         * @type {array<string>}
         * @default []
         */
        this.queue = [];

        this._init(options, end, airportPositionModel);
    }

    /**
     * Fascade to access relative position
     *
     * @for RunwayModel
     * @property relativePosition
     * @type {array<number>} [kilometersNorth, kilometersEast]
     */
    get relativePosition() {
        return this._positionModel.relativePosition;
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
     * Provide gps coordinates for the runway
     *
     * @for RunwayModel
     * @property gps
     * @type {array<number>} gps coordinates of the runway
     */
    get gps() {
        return this._positionModel.gps;
    }

    /**
     * @for RunwayModel
     * @property elevation
     * @type {number}
     */
    get elevation() {
        return this._positionModel.elevation || this.airportPositionModel.elevation;
    }

    /**
     * Opposite of runway's heading, in radians
     *
     * @for RunwayModel
     * @property oppositeAngle
     * @type {number}
     */
    get oppositeAngle() {
        return radians_normalize(this.angle + Math.PI);
    }

    /**
     * @for RunwayModel
     * @method _init
     * @param data
     * @param end
     * @param airportPositionModel {AirportModel}
     */
    _init(data, end, airportPositionModel) {
        this.airportPositionModel = airportPositionModel;
        this.name = data.name[end];

        // TODO: deprecate
        if (data.delay) {
            this.delay = data.delay[end];
        }

        if (data.end) {
            const farSideIndex = end === 0
                ? 1
                : 0;

            const thisSide = new StaticPositionModel(
                data.end[end],
                this.airportPositionModel,
                this.airportPositionModel.magneticNorth
            );
            const farSide = new StaticPositionModel(
                data.end[farSideIndex],
                this.airportPositionModel,
                this.airportPositionModel.magneticNorth
            );

            // relative position, based on center of map
            this._positionModel = thisSide;
            this.length = km(thisSide.distanceToPosition(farSide));
            this.angle = thisSide.bearingToPosition(farSide);
        }

        if (data.ils) {
            this.ils.enabled = data.ils[end];
        }

        if (data.ils_distance) {
            this.ils.loc_maxDist = km(data.ils_distance[end]);
        }

        if (data.glideslope) {
            this.ils.glideslopeGradient = degreesToRadians(data.glideslope[end]);
        }

        // FIXME: neither property is defined in any airport json files
        // if (data.ils_gs_maxHeight) {
        //     this.ils.gs_maxHeight = data.ils_gs_maxHeight[end];
        // }
        //
        // if (data.sepFromAdjacent) {
        //     this.sepFromAdjacent = km(data.sepFromAdjacent[end]);
        // }
    }

    /**
    * Calculate the height of the glideslope for a runway's ILS at a given distance on final
    *
    * @for RunwayModel
    * @method getGlideslopeAltitude
    * @param distance {number}                       distance from the runway threshold, in kilometers
    * @param glideslopeGradient {number} [optional]  gradient of the glideslope in radians
    *                                                (typically equivalent to 3.0 degrees)
    * @return {number}
    */
    getGlideslopeAltitude(distance, glideslopeGradient) {
        if (!glideslopeGradient) {
            glideslopeGradient = this.ils.glideslopeGradient;
        }

        distance = Math.max(0, distance);
        const rise = tan(abs(glideslopeGradient));

        // TODO: this logic could be abstracted to a helper.
        return this.elevation + (rise * km_ft(distance));
    }

    /**
     * Adds the specified aircraft to the runway queue
     *
     * @for RunwayModel
     * @method addAircraftToQueue
     * @param aircraftId {string}
     */
    addAircraftToQueue(aircraftId) {
        this.queue.push(aircraftId);
    }

    /**
     * Remove the specified aircraft from the runway queue
     *
     * @for RunwayModel
     * @method removeAircraftFromQueue
     * @param aircraftId {string}
     */
    removeAircraftFromQueue(aircraftId) {
        this.queue = _without(this.queue, aircraftId);
    }

    /**
     * Boolean helper used to determine if a specific aircraft instance is currently in the queue
     *
     * @for RunwayModel
     * @method isAircraftInQueue
     * @param aircraftId {string}
     * @return {boolean}
     */
    isAircraftInQueue(aircraftId) {
        return this.getAircraftQueuePosition(aircraftId) !== INVALID_NUMBER;
    }

    /**
     * Returns whether the specified aircraft is the first still waiting for takeoff clearance
     *
     * @for RunwayModel
     * @method isAircraftNextInQueue
     * @param  aircraftId {string}
     * @return {boolean}
     */
    isAircraftNextInQueue(aircraftId) {
        return this.getAircraftQueuePosition(aircraftId) === 0;
    }

    /**
     * Returns the position of a specified aircraft in the runway's queue
     *
     * @for RunwayModel
     * @method getAircraftQueuePosition
     * @param  aircraftId {string}
     * @return {number}
     */
    getAircraftQueuePosition(aircraftId) {
        return this.queue.indexOf(aircraftId);
    }

    /**
     * Wrapper for `calculateCrosswindAngleForRunway()` where an implementor needs only the `windAngle`
     * to calculate the crosswind angle
     *
     * @for RunwayModel
     * @method calculateCrosswindAngleForRunway
     * @param windAngle {number}
     * @return {number}  in radians
     */
    calculateCrosswindAngleForRunway(windAngle) {
        return calculateCrosswindAngle(this.angle, windAngle);
    }

    /**
     * Boolean helper used to determine if an aircraftModel is on an approach course
     *
     * @for RunwayModel
     * @method isOnApproachCourse
     * @return {boolean}
     */
    isOnApproachCourse(aircraftModel) {
        const approachOffset = getOffset(aircraftModel, this.relativePosition, this.angle);
        const lateralDistanceFromCourse_nm = abs(nm(approachOffset[0]));

        return lateralDistanceFromCourse_nm <= PERFORMANCE.MAXIMUM_DISTANCE_CONSIDERED_ESTABLISHED_ON_APPROACH_COURSE_NM;
    }

    /**
     * Boolean helper used to determine if an aircraftModel is on the correct approach heading.
     *
     * @for RunwayModel
     * @method isOnCorrectApproachHeading
     * @param  aircraftheading {number}
     * @return {boolean}
     */
    isOnCorrectApproachHeading(aircraftheading) {
        const heading_diff = abs(angle_offset(aircraftheading, this.angle));

        return heading_diff < PERFORMANCE.MAXIMUM_ANGLE_CONSIDERED_ESTABLISHED_ON_APPROACH_COURSE;
    }
}
