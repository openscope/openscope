import _includes from 'lodash/includes';
import _without from 'lodash/without';
import BaseModel from '../base/BaseModel';
import StaticPositionModel from '../base/StaticPositionModel';
import { abs, tan } from '../math/core';
import { km, km_ft, degreesToRadians } from '../utilities/unitConverters';

/**
 * @class RunwayModel
 */
export default class RunwayModel extends BaseModel {
    /**
     * @for RunwayModel
     * @constructor
     * @param options {object}
     * @param end
     * @param airportModel {AirportModel}
     */
    constructor(options = {}, end, airportModel) {
        super();

        this.airportModel = null;
        this.angle = null;
        this.delay = 2;
        this.ils = {
            // TODO: what do these numbers mean? enumerate the magic numbers
            enabled: true,
            loc_maxDist: km(25),
            gs_maxHeight: 9999,
            gs_gradient: degreesToRadians(3)
        };
        this.labelPos = [];
        this.length = null;
        this.name = '';
        this._positionModel = null;
        this.queue = [];
        this.sepFromAdjacent = km(3);

        this.parse(options, end, airportModel);
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
        return this._positionModel.elevation || this.airportModel.elevation;
    }

    /**
     * @for RunwayModel
     * @method parse
     * @param data
     * @param end
     * @param airportModel {AirportModel}
     */
    parse(data, end, airportModel) {
        this.airportModel = airportModel;
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
                this.airportModel.positionModel,
                this.airportModel.magneticNorth
            );
            const farSide = new StaticPositionModel(
                data.end[farSideIndex],
                this.airportModel.positionModel,
                this.airportModel.magneticNorth
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
     * Adds the specified aircraft to the runway queue
     *
     * @for RunwayModel
     * @method addAircraftToQueue
     * @param {Aircraft}
     */
    addAircraftToQueue(aircraft) {
        this.queue.push(aircraft);
    }

    /**
     * Removes the specified aircraft from the runway queue
     *
     * @for RunwayModel
     * @method removeQueue
     * @param  {Aircraft}
     * @return {Boolean}
     */
    removeQueue(aircraft) {
        if (_includes(this.queue, aircraft)) {
            this.queue = _without(this.queue, aircraft);

            return true;
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
     * Boolean helper used to determine if a specific aircraft instance is currently in the queue
     *
     * @for RunwayModel
     * @method isAircraftInQueue
     * @param aircraft {AircraftInstanceModel}
     * @return {boolean}
     */
    isAircraftInQueue(aircraft) {
        return this.positionOfAircraftInQueue(aircraft) !== -1;
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
     * Remove the specified aircraft from the runway queue
     *
     * @for RunwayModel
     * @method removeAircraftFromQueue
     * @param aircraft {AircraftInstanceModel}
     */
    removeAircraftFromQueue(aircraft) {
        this.queue = _without(this.queue, aircraft);
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
