import { angle_offset } from '../math/circle';
import { bearingToPoint } from '../math/flightMath';
import { distance2d } from '../math/distance';

/**
 * Describes a single leg of a path being measured, used by the
 * `MeasureTool` to draw the path on the `CanvasController`
 *
 * These form a doubly linked list, that allows each leg to reference
 * the `#previous` and `#next` legs.
 */
export default class MeasureLegModel {
    /**
     * @for MeasureLeg
     * @constructor
     * @param endPoint {array<number>}
     * @param previousLeg {MeasureLegModel|null}
     */
    constructor(endPoint, radius = 0, previousLeg = null) {
        /**
         * The bearing along the leg (in radians)
         *
         * @for MeasureLegModel
         * @property _bearing
         * @type {number}
         * @default null
         * @private
         */
        this._bearing = null;

        /**
         * The end point of the leg
         *
         * @for MeasureLegModel
         * @property endPoint
         * @type {array<number>}
         * @default endPoint
         */
        this.endPoint = endPoint;

        /**
         * The length of the leg (in km)
         *
         * @for MeasureLegModel
         * @property _distance
         * @type {number}
         * @default null
         * @private
         */
        this._distance = null;

        /**
         * The list of text labels to be displayed
         *
         * @for MeasureLegModel
         * @property labels
         * @type {labels}
         * @default null;
         */
        this.labels = null;

        /**
         * The end point of the leg
         *
         * @for MeasureLegModel
         * @property _midPoint
         * @type {array<number>|null}
         * @default null
         * @private
         */
        this._midPoint = null;

        /**
         * The midpoint of this leg
         *
         * @for MeasureLegModel
         * @property _next
         * @type {MeasureLegModel}
         * @default null;
         * @private
         */
        this._next = null;

        /**
         * The previous leg
         *
         * @for MeasureLegModel
         * @property _previous
         * @type {MeasureLegModel}
         * @default previousLeg
         * @private
         */
        this._previous = previousLeg;

        /**
         * The turn radius (in km)
         *
         * @for MeasureLegModel
         * @property _radius
         * @type {number}
         * @default radius
         * @private
         */
        this._radius = radius;

        this._init(previousLeg);
    }

    /**
     * The bearing along the leg (in radians)
     *
     * @for MeasureLegModel
     * @property bearing
     * @type {number}
     */
    get bearing() {
        return this._bearing;
    }

    /**
     * The length of the leg (in km)
     *
     * @for MeasureLegModel
     * @property distance
     * @type {number}
     */
    get distance() {
        return this._distance;
    }

    /**
     * The midpoint of this leg
     *
     * @for MeasureLegModel
     * @property midPoint
     * @type {array<number>|null}
     */
    get midPoint() {
        return this._midPoint;
    }

    /**
     * The next leg
     *
     * @for MeasureLegModel
     * @property next
     * @type {MeasureLegModel}
     */
    get next() {
        return this._next;
    }

    /**
     * The previous leg
     *
     * @for MeasureLegModel
     * @property next
     * @type {MeasureLegModel}
     */
    get previous() {
        return this._previous;
    }

    /**
     * The turn radius (in km)
     *
     * @for MeasureLegModel
     * @property radius
     * @type {number}
     */
    get radius() {
        const radius = this._radius;

        // No point in validating if the radius is empty
        if (radius === 0) {
            return radius;
        }

        return this._hasValidRadius() ? radius : 0;
    }

    /**
     * The start point of this leg
     *
     * @for MeasureLegModel
     * @property startPoint
     * @type {array<number>|null}
     */
    get startPoint() {
        return this._previous === null ? null : this._previous.endPoint;
    }

    // ------------------------------ LIFECYCLE ------------------------------

    /**
     * @for MeasureLegModel
     * @method _init
     * @param previousLeg {MeasureLegModel|null}
     * @private
     */
    _init(previousLeg) {
        if (previousLeg !== null) {
            previousLeg._next = this;

            this._calculateLegParameters();
        }
    }

    // ------------------------------ PUBLIC ------------------------------

    // ------------------------------ PRIVATE ------------------------------

    /**
     * Calculates the metrics of the leg, `#_midPoint`, `#_distance`, `#_bearing`
     *
     * @for MeasureLegTool
     * @method _calculateLegParameters
     * @private
     */
    _calculateLegParameters() {
        const start = this.startPoint;
        const end = this.endPoint;

        this._midPoint = [
            (start[0] + end[0]) / 2,
            (start[1] + end[1]) / 2
        ];
        this._bearing = bearingToPoint(start, end);
        this._distance = distance2d(start, end);
    }

    /**
     * Returns a flag that indicates whether the radius is valid for this leg
     *
     * The arcTo command gives strange results when the relative radius is too large
     *
     * @for MeasureLegMode
     * @method _hasValidRadius
     * @returns {boolean}
     * @private
     */
    _hasValidRadius() {
        const nextLeg = this.next;

        if (nextLeg === null) {
            return false;
        }

        // Test if the angle required to fillet the corner (ensuring the fillet
        // doesn't extend pass the midpoint of the shortest line) is smaller
        // than the angle between the two lines
        const a1 = this.bearing;
        const a2 = this.next.bearing + Math.PI;
        const halfLength = Math.min(this.distance, nextLeg.distance) / 2;
        const angularDifference = Math.abs(angle_offset(a1, a2));
        const filletAngle = 2 * Math.atan2(this._radius, halfLength);

        return angularDifference >= filletAngle;
    }
}
