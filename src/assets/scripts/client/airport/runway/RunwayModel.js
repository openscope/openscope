import _ceil from 'lodash/ceil';
import _without from 'lodash/without';
import BaseModel from '../../base/BaseModel';
import LocalizerModel from '../../navigationLibrary/LocalizerModel';
import LocalizerCollection from '../../navigationLibrary/LocalizerCollection';
import StaticPositionModel from '../../base/StaticPositionModel';
import { PERFORMANCE } from '../../constants/aircraftConstants';
import { AIRPORT_CONSTANTS } from '../../constants/airportConstants';
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
import { radio_runway } from '../../utilities/radioUtilities';
import {
    km,
    km_ft,
    nm,
    radiansToDegrees
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
         * Runway magnetic heading (from landing end to liftoff end), in radians
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
         * @property defaultLocalizer
         * @type {LocalizerModel}
         */
        this.defaultLocalizer = null;

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

        /**
         * The flight number of the last aircraft that used the runway for takeoff.
         *
         * @property lastDepartedAircraftModel
         * @type {AircraftModel}
         * @default null
         */
        this.lastDepartedAircraftModel = null;

        this._init(options, end, airportPositionModel);
    }

    /**
     * Reset the runway queue
     *
     * @for RunwayModel
     * @method resetQueue
     * @returns undefined
     */
    resetQueue() {
        this.queue = [];
        this.lastDepartedAircraftModel = null;
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
     * Reverse of runway magnetic heading, in radians
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
            const farSideIndex = end === 0 ?
                1 :
                0;

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

        // if the localizer collection is not empty and a default is specified use that,
        // otherwise check if ils is true and set default
        if (data.defaultLocalizer && data.defaultLocalizer[end].length > 0 && LocalizerCollection.length > 0) {
            this.defaultLocalizer = LocalizerCollection.findLocalizerByName(data.defaultLocalizer[end]);
        }

        if (data.ils && data.ils[end] && !this.defaultLocalizer) {
            const locName = `LOC${this.name}`;
            const locData = {
                angle: radiansToDegrees(this.angle),
                position: data.end[end]
            };

            if (data.ils_distance) {
                locData.distance = data.ils_distance[end];
            }

            if (data.glideslope) {
                locData.glideslopeAngle = data.glideslope[end];
            }

            this.defaultLocalizer = new LocalizerModel(locName, locData, this.airportPositionModel);
        }

        // TODO: property is not defined in any airport json files
        //
        // if (data.sepFromAdjacent) {
        //     this.sepFromAdjacent = km(data.sepFromAdjacent[end]);
        // }
    }

    /**
     * Return the spoken name of the runway, spelled out into words
     *
     * Ex: "two six left"
     *
     * @for RunwayModel
     * @method getRadioName
     * @return {string}
     */
    getRadioName() {
        return radio_runway(this.name);
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
}
