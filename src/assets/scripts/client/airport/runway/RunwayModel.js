import _without from 'lodash/without';
import BaseModel from '../../base/BaseModel';
import StaticPositionModel from '../../base/StaticPositionModel';
import { abs, tan } from '../../math/core';
import { km, km_ft, degreesToRadians } from '../../utilities/unitConverters';

/**
 *
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
    constructor(options = {}, end, airportPositionModel) {
        super();

        /**
         *
         * @property
         * @type
         * @default
         */
        this.airportPositionModel = null;

        /**
         *
         * @property
         * @type
         * @default
         */
        this._positionModel = null;

        /**
         *
         * @property
         * @type
         * @default
         */
        this.name = '';

        /**
         *
         * @property
         * @type
         * @default
         */
        this.angle = null;

        /**
         *
         * @property
         * @type
         * @default
         */
        this.delay = 2;

        /**
         *
         * @property
         * @type
         * @default
         */
        this.ils = {
            // TODO: what do these numbers mean? enumerate the magic numbers
            enabled: true,
            loc_maxDist: km(25),
            gs_maxHeight: 9999,
            gs_gradient: degreesToRadians(3)
        };

        /**
         *
         * @property
         * @type
         * @default
         */
        this.labelPos = [];

        /**
         *
         * @property
         * @type
         * @default
         */
        this.length = null;

        /**
         *
         * @property
         * @type
         * @default
         */
        this.sepFromAdjacent = km(3);

        /**
         *
         * @property
         * @type
         * @default
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
     * @return {array<number>} gps coordinates of the runway
     */
    get gps() {
        return this._positionModel.gps;
    }

    /**
     * @for RunwayModel
     * @method elevation
     * @return {number}
     */
    get elevation() {
        return this._positionModel.elevation || this.airportPositionModel.elevation;
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

        if (data.delay) {
            this.delay = data.delay[end];
        }

        if (data.end) {
            const farSideIndex = end === 0
                ? 1
                : 0;
            const thisSide = new StaticPositionModel(
                data.end[end],
                this.airportPositionModel.positionModel,
                this.airportPositionModel.magneticNorth
            );
            const farSide = new StaticPositionModel(
                data.end[farSideIndex],
                this.airportPositionModel.positionModel,
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

        if (data.ils_gs_maxHeight) {
            this.ils.gs_maxHeight = data.ils_gs_maxHeight[end];
        }

        if (data.glideslope) {
            this.ils.gs_gradient = degreesToRadians(data.glideslope[end]);
        }

        if (data.name_offset) {
            this.labelPos = data.name_offset[end];
        }

        if (data.sepFromAdjacent) {
            this.sepFromAdjacent = km(data.sepFromAdjacent[end]);
        }
    }

    /**
    * Calculate the height of the glideslope for a runway's ILS at a given distance on final
    *
    * @for RunwayModel
    * @method getGlideslopeAltitude
    * @param distance {number}                distance from the runway threshold, in kilometers
    * @param gs_gradient {number} [optional]  gradient of the glideslope in radians
    *                                         (typically equivalent to 3.0 degrees)
    * @return {number}
    */
    getGlideslopeAltitude(distance, gs_gradient) {
        if (!gs_gradient) {
            gs_gradient = this.ils.gs_gradient;
        }

        distance = Math.max(0, distance);
        const rise = tan(abs(gs_gradient));

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
        return this.positionOfAircraftInQueue(aircraftId) !== -1;
    }

    /**
     * Returns whether the specified aircraft is the first still waiting for takeoff clearance
     *
     * @for RunwayModel
     * @method isAircraftNextInQueue
     * @param  aircraft {AircraftInstanceModel}
     * @return {Boolean}
     */
    isAircraftNextInQueue(aircraft) {
        return this.positionOfAircraftInQueue(aircraft) === 0;
    }

    /**
     * Returns the position of a specified aircraft in the runway's queue
     *
     * @for RunwayModel
     * @method positionOfAircraftInQueue
     * @param  aircraft {AircraftInstanceModel}
     * @return {number}
     */
    positionOfAircraftInQueue(aircraft) {
        return this.queue.indexOf(aircraft);
    }
}
