import { radians_normalize } from '../math/circle';
import { bearingToPoint } from '../math/flightMath';
import { distance2d } from '../math/distance';
import {
    heading_to_string,
    km,
    nm
} from '../utilities/unitConverters';
import MeasureLegModel from './MeasureLegModel';
import AircraftModel from '../aircraft/AircraftModel';
import { TIME } from '../constants/globalConstants';

/**
 * Defines a `MeasureTool`
 *
 * The `MeasureTool` is used by the `InputController` to
 * accept user input and build a list of `MeasureLegModels`
 * which calculate distances, durations and bearings
 */
export default class MeasureTool {
    /**
     * @for MeasureLeg
     * @constructor
     */
    constructor() {
        /**
         * Indicates whether the tool should be receiving input
         *
         * @for `MeasureTool`
         * @property isMeasuring
         * @type {boolean}
         * @default false
         */
        this.isMeasuring = false;

        /**
         * The list of points that make up the path being measured
         * This can be an object with a `#relativePosition` property,
         * or a array of numbers that represent a `relativePosition`
         *
         * @for `MeasureTool`
         * @property _points
         * @type {AircraftModel|FixModel|array<number>}
         * @default []
         * @private
         */
        this._points = [];
    }

    /** Gets the aircraft at the beginning of the path
     *
     * @for MeasureTool
     * @property aircraft
     * @type {AircraftModel|null}
     */
    get aircraft() {
        if (this.hasStarted && this._points[0] instanceof AircraftModel) {
            return this._points[0];
        }

        return null;
    }

    /**
     * Indicates whether there are any valid legs
     *
     * @for MeasureTool
     * @property hasLegs
     * @type {boolean}
     */
    get hasLegs() {
        return this._points.length > 1;
    }

    /**
     * Indicates the `MeasureTool` has started measuring
     *
     * @for MeasureTool
     * @property hasLegs
     * @type {boolean}
     */
    get hasStarted() {
        return this._points.length !== 0;
    }

    // ------------------------------ LIFECYCLE ------------------------------

    /**
     * @for MeasureTool
     * @method reset
     */
    reset() {
        this._points = [];
        this.isMeasuring = false;
    }

    // ------------------------------ PUBLIC ------------------------------

    /**
     * Adds a point to the path being measured
     *
     * The value can be an object with a `#relativePosition` property,
     * or a array of numbers that represent a `relativePosition`
     *
     * @for MeasureTool
     * @method addPoint
     * @param value {AircraftModel|FixModel|array<number>}
     */
    addPoint(value) {
        this._points.push(value);
    }

    /**
     * Gets the information for the path that should be drawn on the `CanvasController`
     *
     * @for MeasureTool
     * @method getPathInfo
     * @returns {object}
     */
    getPathInfo() {
        if (!this.hasLegs) {
            return [];
        }

        // Ground speed is only known if the first point is an AircraftModel
        const { aircraft } = this;
        const groundSpeed = aircraft === null ? null : aircraft.groundSpeed;
        const initialTurn = this._getInitialTurnParameters();
        const pointsList = [...this._points]; // Shallow copy as the first point may be replaced

        // These are the values used when reducing the points array
        const initialValues = {
            previousLeg: null,
            totalDistance: 0,
            totalDuration: 0
        };

        // If there is an initialTurn (eg. a turn onto the first leg), then the exit point is used
        // as the first point in the path
        // We also calculate the distance and time take to fly the turn
        if (initialTurn !== null) {
            const { exitPoint, arcLength } = initialTurn;
            const distance = nm(arcLength);
            const duration = Math.round((distance / groundSpeed) * TIME.ONE_HOUR_IN_SECONDS);

            initialValues.lastPoint = exitPoint;
            initialValues.totalDistance = distance;
            initialValues.totalDuration = duration;

            pointsList[0] = exitPoint;
        }

        // The first leg is just an end point
        const firstPoint = this._getRelativePosition(pointsList.shift());
        const firstLeg = new MeasureLegModel(firstPoint);
        initialValues.previousLeg = firstLeg;

        pointsList.reduce((lastValues, point) => {
            const { previousLeg } = lastValues;
            let { totalDistance, totalDuration } = lastValues;
            const leg = new MeasureLegModel(
                this._getRelativePosition(point),
                0, // don't radius the vertices
                previousLeg
            );
            const distance = nm(leg.distance);
            const bearing = heading_to_string(leg.bearing);
            let duration = 0;

            if (groundSpeed !== null) {
                duration = Math.round((distance / groundSpeed) * TIME.ONE_HOUR_IN_SECONDS);
            }

            const labels = [
                this._getLabel(distance, duration, bearing)
            ];

            totalDistance += distance;
            totalDuration += duration;

            if (totalDistance !== distance) {
                labels.push(this._getLabel(totalDistance, totalDuration));
            }

            leg.labels = labels;

            return {
                previousLeg: leg,
                totalDistance,
                totalDuration
            };
        }, initialValues);

        return {
            initialTurn,
            firstLeg
        };
    }

    /**
     * Removes the last point from the path
     *
     * @for MeasureTool
     * @method removeLastPoint
     */
    removeLastPoint() {
        // The "last" point is actually the 2nd last item in _points
        // This means the path will end at the cursor position when redrawn
        const { length } = this._points;
        if (length > 2) {
            this._points.splice(length - 2, 1);
        }
    }

    /**
     * Starts the measure tools for the specifeid aircraft
     * and adds an initial leg
     *
     * The startValue can be an object with a `#relativePosition` property,
     * or a array of numbers that represent a `relativePosition`
     *
     * @for MeasureTool
     * @method startMeasuring
     * @param startValue {AircraftModel|FixModel|array<number>}
     */
    startMeasuring(startValue) {
        this._points = [startValue];
    }

    /**
     * Updates the last point in the path
     *
     * The value can be an object with a `#relativePosition` property,
     * or a array of numbers that represent a `relativePosition`
     *
     * @for MeasureTool
     * @method updateEndPoint
     * @param value {array<number>}
     */
    updateLastPoint(value) {
        if (this.hasLegs) {
            this._points[this._points.length - 1] = value;
        } else {
            this.addPoint(value);
        }
    }

    // ------------------------------ PRIVATE ------------------------------

    /**
     * Gets the initial turn parameters that are needed to fly to the first fix
     *
     * @for MeasureTools
     * @method _getInitialTurnParameters
     * @returns {object}
     * @private
     */
    _getInitialTurnParameters() {
        const { aircraft } = this;

        if (aircraft === null) {
            return null;
        }

        const { groundSpeed, groundTrack } = aircraft;
        const turnRate = 3; // Turn rate seems fixed at 3°/sec // groundSpeed > 250 ? 1.5 : 3;
        const turnRadius = km(groundSpeed / (turnRate * 20 * Math.PI));
        const start = aircraft.relativePosition;
        const fix = this._getRelativePositionAtIndex(1);

        // Get the turn direction by using the basic bearing to the next point
        const bearingToFix = bearingToPoint(start, fix);
        const isRHT = radians_normalize(bearingToFix - groundTrack) < Math.PI;
        const direction = isRHT ? 1 : -1;

        // The centre of the turn circle is offset to the left or right by 90°
        const bearingToCenter = groundTrack + (direction * Math.PI / 2);
        const center = [
            start[0] + (turnRadius * Math.sin(bearingToCenter)),
            start[1] + (turnRadius * Math.cos(bearingToCenter))
        ];

        // Turn exit (tangent from turn circle to the fix)
        const centerToFixBearing = bearingToPoint(center, fix);
        const centerToFixDistance = distance2d(center, fix);
        const outboundCourse = centerToFixBearing + (direction * Math.asin(turnRadius / centerToFixDistance));

        // Entry and exit angles
        const entryAngle = bearingToCenter + Math.PI;
        const exitAngle = outboundCourse - (direction * Math.PI / 2);

        // The exit point is the point on the turn circle at the exit angle
        const exitPoint = [
            center[0] + (turnRadius * Math.sin(exitAngle)),
            center[1] + (turnRadius * Math.cos(exitAngle))
        ];

        // Length around the arc
        let turnAngle;
        if (isRHT) {
            turnAngle = exitAngle - entryAngle;
        } else {
            turnAngle = entryAngle - exitAngle;
        }
        const arcLength = turnRadius * radians_normalize(turnAngle);

        return {
            isRHT,
            turnRadius,
            arcLength,
            entryAngle,
            exitAngle,
            center,
            exitPoint
        };
    }

    /**
     * Get the text label that displays the distance and
     * optional duration and bearings
     *
     * @param distance {number}
     * @param duration {number}
     * @param bearing {number|null}
     * @private
     */
    _getLabel(distance, duration, bearing = null) {
        let label = `${distance.toFixed(1)} NM`;

        if (duration !== 0) {
            label += `, ${duration.toLocaleString()} s`;
        }

        if (bearing !== null) {
            label += `, ${bearing}° M`;
        }

        return label;
    }

    /**
     * Gets the relative position for the point at the specified index.
     *
     * @param index {number}
     * @returns {array<number>}
     */
    _getRelativePositionAtIndex(index) {
        const point = this._points[index];

        return this._getRelativePosition(point);
    }

    /**
     * Gets the relative position for the point at the specified index.
     *
     * @param point {AircraftModel|FixModel|array<number>}
     * @returns {array<number>}
     */
    _getRelativePosition(point) {
        return point.relativePosition || point;
    }
}
