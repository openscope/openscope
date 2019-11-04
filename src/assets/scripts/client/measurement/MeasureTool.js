import EventBus from '../lib/EventBus';
import MeasurePath from './MeasurePath';
import GameController from '../game/GameController';
import { EVENT } from '../constants/eventNames';
import { MEASURE_TOOL_STYLE } from '../constants/inputConstants';
import { GAME_OPTION_NAMES } from '../constants/gameOptionConstants';

/**
 * Defines a `MeasureTool`
 *
 * The `MeasureTool` is used by the `InputController` to
 * accept user input and build a list of `MeasurePath`s
 * which calculate distances, durations and bearings
 */
class MeasureTool {
    /**
     * @for MeasureLeg
     * @constructor
     */
    constructor() {
        /**
         * The current path being measured
         *
         * @for MeasureTool
         * @property _currentPath
         * @type {MeasurePath}
         * @default null
         * @private
         */
        this._currentPath = null;

        /**
         * @for MeasureTool
         * @property _eventBus
         * @type {EventBus}
         * @private
         */
        this._eventBus = EventBus;

        /**
         * The list of `MeasurePath` objects that the tools is
         * measuring
         *
         * @for MeasureTool
         * @property _paths
         * @type {array<MeasurePath>}
         * @default []
         * @private
         */
        this._paths = [];

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

    /**
     * Indicates whether the `MeasureTool` has any paths
     *
     * @for MeasureTool
     * @property hasPaths
     * @type {boolean}
     */
    get hasPaths() {
        return this._paths.length !== 0;
    }

    /**
     * Indicates the `MeasureTool`s current path has started measuring
     * eg. the path has at least one point
     *
     * @for MeasureTool
     * @property hasLegs
     * @type {boolean}
     */
    get hasStarted() {
        return this.isMeasuring && this._currentPath.hasStarted;
    }

    /**
     * Indicates whether the tool should be receiving input
     *
     * @for MeasureTool
     * @property isMeasuring
     * @type {boolean}
     */
    get isMeasuring() {
        return this._currentPath !== null;
    }

    // ------------------------------ LIFECYCLE ------------------------------

    /**
     * @for MeasureTool
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
        this._onMeasureTooltyleChangeHandler = this._onMeasureTooltyleChange.bind(this);

        return this;
    }

    /**
     * @for MeasureTool
     * @method disable
     * @chainable
     */
    disable() {
        this._eventBus.off(EVENT.MEASURE_TOOL_STYLE_CHANGE, this._onMeasureTooltyleChangeHandler);

        return this;
    }

    /**
     * @for MeasureTool
     * @method enable
     * @chainable
     */
    enable() {
        this._eventBus.on(EVENT.MEASURE_TOOL_STYLE_CHANGE, this._onMeasureTooltyleChangeHandler);

        return this;
    }

    /**
     * @for MeasureTool
     * @method reset
     */
    reset() {
        this._paths = [];
        this._currentPath = null;
    }

    // ------------------------------ PUBLIC ------------------------------

    /**
     * Adds a point to the current path being measured
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

        this._currentPath.addPoint(value);
    }

    /**
     * Gets the information for the paths that should be drawn on the `CanvasController`
     *
     * @for MeasureTool
     * @method buildPathInfo
     * @returns {array<object>}
     */
    buildPathInfo() {
        return this._paths.reduce((list, path) => {
            if (path.hasLegs) {
                list.push(path.buildPathInfo());
            }

            return list;
        }, []);
    }

    /**
     * Signals that the editing the current path has finished
     *
     * @for MeasureTool
     * @method endPath
     */
    endPath() {
        this._throwIfNotMeasuring();

        // Discard the point which is attached to the cursor, and keep
        // only those points which have been clicked into place
        this._currentPath.removeLastPoint();

        // If the path isn't valid, then don't keep it
        if (!this._currentPath.hasLegs) {
            this._paths.pop();
        }

        this._currentPath = null;
    }

    /**
     * Removes the second-to-last point from the current path
     *
     * @for MeasureTool
     * @method removePreviousPoint
     */
    removePreviousPoint() {
        this._throwIfNotMeasuring();

        this._currentPath.removePreviousPoint();
    }

    /**
     * Signals that a new path should be created for measurement
     *
     * @for MeasureTool
     * @method startNewPath
     */
    startNewPath() {
        if (this.isMeasuring) {
            throw new Error('Cannot start a new path. The current path hasn\'t been ended.');
        }

        const path = new MeasurePath(this._style);

        this._paths.push(path);
        this._currentPath = path;
    }

    /**
     * Sets the style that should be used for path generation and rendering
     *
     * If an invalid valid for MEASURE_TOOL_STYLE is passed, it will default to
     * `MEASURE_TOOL_STYLE.STRAIGHT`
     *
     * @for MeasureTool
     * @method setStyle
     * @param style {MEASURE_TOOL_STYLE}
     */
    setStyle(style) {
        const isValid = Object.keys(MEASURE_TOOL_STYLE).some((k) => {
            return MEASURE_TOOL_STYLE[k] === style;
        });

        this._style = isValid ? style : MEASURE_TOOL_STYLE.STRAIGHT;

        this._paths.forEach((path) => path.setStyle(style));
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

        this._currentPath.updateLastPoint(value);
    }

    // ------------------------------ PRIVATE ------------------------------

    /**
     * Update the `#_style` property
     *
     * This method should only be called via the `EventBus`
     *
     * @for MeasureTool
     * @method _onMeasureTooltyleChange
     * @param style {MEASURE_TOOL_STYLE}
     * @private
     */
    _onMeasureTooltyleChange(style) {
        this.setStyle(style);
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
