import _round from 'lodash/round';
import EventBus from '../lib/EventBus';
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
import GameController from '../game/GameController';
import FixModel from '../navigationLibrary/FixModel';
import { EVENT } from '../constants/eventNames';
import { MEASURE_TOOL_STYLE } from '../constants/inputConstants';
import { GAME_OPTION_NAMES } from '../constants/gameOptionConstants';
import { TIME } from '../constants/globalConstants';

/**
 * Defines a `MeasureTool`
 *
 * The `MeasureTool` is used by the `InputController` to
 * accept user input and build a list of `MeasureLegModels`
 * which calculate distances, durations and bearings
 */
class MeasureTool {
    /**
     * @for MeasureLeg
     * @constructor
     */
    constructor() {
        /**
         * @for MeasureTool
         * @property _eventBus
         * @type {EventBus}
         * @private
         */
        this._eventBus = EventBus;

        /**
         * Indicates whether the tool should be receiving input
         *
         * @for MeasureTool
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
         * @for MeasureTool
         * @property _points
         * @type {AircraftModel|FixModel|array<number>}
         * @default []
         * @private
         */
        this._points = [];

        /**
         * The style of how the path is rendered
         *
         * @for MeasureTool
         * @property _style
         * @type {MEASURE_TOOL_STYLE}
         * @default null;
         * @private
         */
        this._style = null;

        this._init()
            ._setupHandlers()
            .enable();
    }

    /** Gets the aircraft at the beginning of the path
     *
     * @for MeasureTool
     * @property aircraft
     * @type {AircraftModel|null}
     */
    get aircraft() {
        if (!this.hasStarted || !(this._points[0] instanceof AircraftModel)) {
            return null;
        }

        return this._points[0];
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

    /**
     * Gets a flag indicating whether the '#style' indicates that
     * the initial turn should be used when building the path
     *
     * @for MeasureTool
     * @property hasStyleInitialTurn
     * @returns {boolean}
     */
    get hasStyleInitialTurn() {
        return this._style === MEASURE_TOOL_STYLE.ARC_TO_NEXT ||
            this._style === MEASURE_TOOL_STYLE.ALL_ARCED;
    }

    /**
     * Gets a flag indicating whether the '#style' indicates that
     * the arcs should be used when building the path
     *
     * @for MeasureTool
     * @property hasStyleArced
     * @returns {boolean}
     */
    get hasStyleArced() {
        return this._style === MEASURE_TOOL_STYLE.ALL_ARCED;
    }

    // ------------------------------ LIFECYCLE ------------------------------

    /**
     * @for MeasureTools
     * @method _init
     * @chainable
     * @private
     */
    _init() {
        this.setStyle(GameController.getGameOption(GAME_OPTION_NAMES.MEASURE_TOOL_PATH));

        return this;
    }

    /**
     * @for MeasureTool
     * @method _setupHandlers
     * @chainable
     * @private
     */
    _setupHandlers() {
        this._onMeasureToolStyleChangeHandler = this._onMeasureToolStyleChange.bind(this);

        return this;
    }

    /**
     * @for MeasureTool
     * @method disable
     * @chainable
     */
    disable() {
        this._eventBus.off(EVENT.MEASURE_TOOL_STYLE_CHANGE, this._onMeasureToolStyleChangeHandler);

        return this;
    }

    /**
     * @for MeasureTool
     * @method enable
     * @chainable
     */
    enable() {
        this._eventBus.on(EVENT.MEASURE_TOOL_STYLE_CHANGE, this._onMeasureToolStyleChangeHandler);

        return this;
    }

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
        this._throwIfNotMeasuring();
        this._throwIfPointInvalid(value);

        this._points.push(value);
    }

    /**
     * Gets the information for the path that should be drawn on the `CanvasController`
     *
     * @for MeasureTool
     * @method buildPathInfo
     * @returns {object}
     */
    buildPathInfo() {
        if (!this.hasLegs) {
            return null;
        }

        // Ground speed is only known if the first point is an AircraftModel
        const { aircraft } = this;
        const groundSpeed = aircraft === null ? null : aircraft.groundSpeed;
        const initialTurn = this._buildInitialTurnParameters();
        const pointsList = [...this._points]; // Shallow copy as the first point may be replaced
        let radius = 0;

        if (initialTurn !== null && this.hasStyleArced) {
            radius = initialTurn.turnRadius;
        }

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
            const duration = _round((distance / groundSpeed) * TIME.ONE_HOUR_IN_MINUTES, 1);

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
                radius,
                previousLeg
            );
            const distance = nm(leg.distance);
            const bearing = heading_to_string(leg.bearing);
            let duration = 0;

            if (groundSpeed !== null) {
                duration = _round((distance / groundSpeed) * TIME.ONE_HOUR_IN_MINUTES, 1);
            }

            const labels = [
                this._buildLabel(distance, duration, bearing)
            ];

            totalDistance += distance;
            totalDuration = _round(totalDuration + duration, 1);

            if (totalDistance !== distance) {
                labels.push(this._buildLabel(totalDistance, totalDuration));
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
        this._throwIfNotMeasuring();

        // The "last" point is actually the 2nd last item in _points
        // This means the path will end at the cursor position when redrawn
        const { length } = this._points;

        if (length > 2) {
            this._points.splice(length - 2, 1);
        }
    }

    /**
     * Sets the style that should be used for path generation and rendering
     *
     * If an invalid valid for MEASURE_TOOL_STYLE is passed, it will default to
     * `MEASURE_TOOL_STYLE.STRAIGHT`
     *
     * @for MeasureTools
     * @method setStyle
     * @param style {MEASURE_TOOL_STYLE}
     */
    setStyle(style) {
        switch (style) {
            case MEASURE_TOOL_STYLE.ARC_TO_NEXT:
            case MEASURE_TOOL_STYLE.ALL_ARCED:
                this._style = style;

                break;
            default:
                this._style = MEASURE_TOOL_STYLE.STRAIGHT;

                break;
        }
    }

    /**
     * Updates the last point in the path
     *
     * The value can be an object with a `#relativePosition` property,
     * or a array of numbers that represent a `relativePosition`
     *
     * @for MeasureTool
     * @method updateEndPoint
     * @param value {AircraftModel|FixModel|array<number>}
     */
    updateLastPoint(value) {
        this._throwIfNotMeasuring();
        this._throwIfPointInvalid(value);

        if (!this.hasLegs) {
            this.addPoint(value);

            return;
        }

        this._points[this._points.length - 1] = value;
    }

    // ------------------------------ PRIVATE ------------------------------

    /**
     * Builds the initial turn parameters that are needed to fly to the first fix
     *
     * @for MeasureTools
     * @method _buildInitialTurnParameters
     * @returns {object}
     * @private
     */
    _buildInitialTurnParameters() {
        if (!this.hasStyleInitialTurn) {
            return null;
        }

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
     * Builds the text label that displays the distance and
     * optional duration and bearings
     *
     * @for MeasureTools
     * @method _buildLabel
     * @param distance {number} The distance (in NM) that the leg covers
     * @param duration {number} The length of time (in minutes) that flying the leg will take
     * @param bearing {number|null} The bearing (degrees magnetic) along the leg
     * @private
     */
    _buildLabel(distance, duration, bearing = null) {
        let label = `${distance.toPrecision(3)} NM`;

        if (duration !== 0) {
            label += `, ${duration.toFixed(1)} min`;
        }

        if (bearing !== null) {
            label += `, ${bearing}° M`;
        }

        return label;
    }

    /**
     * Gets the relative position for the point at the specified index.
     *
     * @for MeasureTools
     * @method _getRelativePositionAtIndex
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
     * @for MeasureTools
     * @method _getRelativePosition
     * @param point {AircraftModel|FixModel|array<number>}
     * @returns {array<number>}
     */
    _getRelativePosition(point) {
        return point.relativePosition || point;
    }

    /**
     * Update the `#_style` property
     *
     * This method should only be called via the `EventBus`
     *
     * @for MeasureTools
     * @method _onMeasureToolStyleChange
     * @param style {MEASURE_TOOL_STYLE}
     * @private
     */
    _onMeasureToolStyleChange(style) {
        this.setStyle(style);
    }

    /**
     * Facade for throwing a TypeError if a point value is not a valid type
     *
     * @for MeasureTool
     * @method _throwIfPointInvalid
     * @param value {AircraftModel|FixModel|array<number>}
    */
    _throwIfPointInvalid(value) {
        if (!(value instanceof Array || value instanceof AircraftModel || value instanceof FixModel)) {
            throw new TypeError(`value cannot be ${typeof value}. An Array, AircraftModel or FixModel is expected.`);
        }
    }

    /**
     * Facade for throwing an Error if the `#isMeasuring` flag is not set
     *
     * @for MeasureTool
     * @method _throwIfNotMeasuring
     */
    _throwIfNotMeasuring() {
        if (!this.isMeasuring) {
            throw Error(`Cannot add point when MeasureTool.isMeasuring is ${this.isMeasuring}`);
        }
    }
}

/**
 * The static instance of the `MeasureTool` class
 */
export default new MeasureTool();
