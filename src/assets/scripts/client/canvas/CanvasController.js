import $ from 'jquery';
import _cloneDeep from 'lodash/cloneDeep';
import _has from 'lodash/has';
import _filter from 'lodash/filter';
import AirportController from '../airport/AirportController';
import CanvasStageModel from './CanvasStageModel';
import EventBus from '../lib/EventBus';
import GameController from '../game/GameController';
import TimeKeeper from '../engine/TimeKeeper';
import UiController from '../UiController';
import { tau } from '../math/circle';
import { distance2d } from '../math/distance';
import {
    sin,
    cos,
    round,
    calculateMiddle,
    extrapolate_range_clamp,
    clamp
} from '../math/core';
import {
    positive_intersection_with_rect,
    vadd,
    vectorize_2d,
    vscale
} from '../math/vector';
import { leftPad } from '../utilities/generalUtilities';
import {
    degreesToRadians,
    km
} from '../utilities/unitConverters';
import {
    FLIGHT_PHASE,
    FLIGHT_CATEGORY
} from '../constants/aircraftConstants';
import {
    BASE_CANVAS_FONT,
    DEFAULT_CANVAS_SIZE
} from '../constants/canvasConstants';
import { THEME } from '../constants/themes';
import { EVENT } from '../constants/eventNames';
import {
    INVALID_INDEX,
    INVALID_NUMBER,
    TIME
} from '../constants/globalConstants';
import { LOG } from '../constants/logLevel';

// Temporary const declaration here to attach to the window AND use as internal property
const canvas = {};

/**
 * Enumeration of canvas names
 *
 * @property CANVAS_NAME
 * @final
 */
const CANVAS_NAME = {
    STATIC: 'static',
    DYNAMIC: 'dynamic'
};

/**
 * @class CanvasController
 */
export default class CanvasController {
    /**
     * @constructor
     * @param $element {JQuery|HTML Element}
     * @param aircraftController {AircraftController}
     * @param navigationLibrary {NavigationLibrary}
     * @param scopeModel {ScopeModel}
     */
    constructor($element, aircraftController, navigationLibrary, scopeModel) {
        /**
         * Reference to the `window` object
         *
         * @property $window
         * @type {JQuery|HTML Element}
         */
        this.$window = $(window);

        /**
         * Reference to the `#canvases` tag which acts as the container
         * element for all the `<canvas />` elements
         *
         * @property $element
         * @type $element {JQuery|HTML Element}
         * @default $element
         */
        this.$element = $element;

        /**
         * @property _aircraftController
         * @type {AircraftController}
         * @private
         */
        this._aircraftController = aircraftController;

        /**
         * @property _navigationLibrary
         * @type {NavigationLibrary}
         * @private
         */
        this._navigationLibrary = navigationLibrary;

        /**
         * @property _scopeModel
         * @type {ScopeModel}
         * @private
         */
        this._scopeModel = scopeModel;

        /**
         * @property _eventBus
         * @type {EventBus}
         * @private
         */
        this._eventBus = EventBus;

        prop.canvas = canvas;
        this.canvas = canvas;

        /**
         * @property _context
         * @type {object<string, HTMLCanvasContext>}
         * @private
         */
        this._context = {};

        /**
         * Flag used to determine if the canvas dimensions should be resized
         *
         * @property _shouldResize
         * @type {boolean}
         * @default true
         * @private
         */
        this._shouldResize = true;

        // TODO: this property will be moving out of the `CanvasController` under issue:
        // [#726](https://github.com/openscope/openscope/issues/726)
        /**
         * Enum used for storing canvas size values
         *
         * @property size
         * @type {object}
         */
        this.canvas.size = {
            height: DEFAULT_CANVAS_SIZE.HEIGHT,
            width: DEFAULT_CANVAS_SIZE.WIDTH
        };

        /**
         * timestamp of the previous frame
         *
         * @property _lastFrameTimestamp
         * @type {number}
         * @private
         */
        this._lastFrameTimestamp = TimeKeeper.gameTimeInSeconds;

        /**
         * Flag used to determine if the Aircraft canvas should be updated
         *
         * @property _shouldShallowRender
         * @type {boolean}
         * @default true
         */
        this._shouldShallowRender = true;

        /**
         * Flag used to determine if _all_ canvases should be updated
         *
         * When this is true, the non-updating canvases like terrain, fix labels,
         * video map, etc will be recalculated and re-drawn.
         *
         * This should only be true when the view changes via zoom/pan or airport change
         *
         * @property _shouldDeepRender
         * @type {boolean}
         * @default true
         */
        this._shouldDeepRender = true;

        /**
         * Flag used to determine if fix labels should be displayed
         *
         * @property _shouldDrawFixLabels
         * @type {boolean}
         * @default false
         */
        this._shouldDrawFixLabels = false;

        /**
         * Flag used to determine if restricted areas should be displayed
         *
         * @property _shouldDrawRestrictedAreas
         * @type {boolean}
         * @default false
         */
        this._shouldDrawRestrictedAreas = false;

        /**
         * Flag used to determine if the sid map should be displayed
         *
         * @property _shouldDrawSidMap
         * @type {boolean}
         * @default false
         */
        this._shouldDrawSidMap = false;

        /**
         * Flag used to determine if terrain should be displayed
         *
         * @property _shouldDrawTerrain
         * @type {boolean}
         * @default true
         */
        this._shouldDrawTerrain = true;

        /**
         * has a console.warn been output for terrain?
         *
         * This is meant for airport contributors designing new airports
         *
         * @property _hasSeenTerrainWarning
         * @type {boolean}
         * @default false
         */
        this._hasSeenTerrainWarning = false;

        /**
         * container property for the current canvas theme
         *
         * @property theme
         * @type {object}
         */
        this.theme = THEME.DEFAULT;

        return this._init()
            .enable();
    }

    /**
     * @for CanvasController
     * @method _init
     * @private
     * @chainable
     */
    _init() {
        return this;
    }

    /**
     * @for CanvasController
     * @method enable
     * @chainable
     */
    enable() {
        this._eventBus.on(EVENT.REQUEST_TO_CENTER_POINT_IN_VIEW, this._onCenterPointInView);
        this._eventBus.on(EVENT.PAN_VIEWPORT, this._onChangeViewportPan);
        this._eventBus.on(EVENT.ZOOM_VIEWPORT, this._onChangeViewportZoom);
        this._eventBus.on(EVENT.MARK_CANVAS_DIRTY, this._onMarkDirtyCanvas);
        this._eventBus.on(EVENT.TOGGLE_LABELS, this._onToggleLabels);
        this._eventBus.on(EVENT.TOGGLE_RESTRICTED_AREAS, this._onToggleRestrictedAreas);
        this._eventBus.on(EVENT.TOGGLE_SID_MAP, this._onToggleSidMap);
        this._eventBus.on(EVENT.TOGGLE_TERRAIN, this._onToggleTerrain);
        this._eventBus.on(EVENT.SET_THEME, this._setTheme);

        // TODO: abstract to method
        this.$element.addClass(this.theme.CLASSNAME);

        return this;
    }

    /**
     * @for CanvasController
     * @method disable
     */
    disable() {
        this._eventBus.off(EVENT.REQUEST_TO_CENTER_POINT_IN_VIEW, this._onCenterPointInView);
        this._eventBus.off(EVENT.PAN_VIEWPORT, this._onChangeViewportPan);
        this._eventBus.off(EVENT.ZOOM_VIEWPORT, this._onChangeViewportZoom);
        this._eventBus.off(EVENT.MARK_CANVAS_DIRTY, this._onMarkDirtyCanvas);
        this._eventBus.off(EVENT.TOGGLE_LABELS, this._onToggleLabels);
        this._eventBus.off(EVENT.TOGGLE_RESTRICTED_AREAS, this._onToggleRestrictedAreas);
        this._eventBus.off(EVENT.TOGGLE_SID_MAP, this._onToggleSidMap);
        this._eventBus.off(EVENT.TOGGLE_TERRAIN, this._onToggleTerrain);
        this._eventBus.off(EVENT.SET_THEME, this._setTheme);

        return this.destroy();
    }

    /**
     * @for CanvasController
     * @method destroy
     */
    destroy() {
        this.$window = null;
        this.$element = null;
        this.canvas = {};
        this._context = {};
        CanvasStageModel._panY = 0;
        CanvasStageModel._panX = 0;
        // resize canvas to fit window?
        this._shouldResize = true;
        // all canvases are the same size
        this.canvas.size = {
            height: DEFAULT_CANVAS_SIZE.HEIGHT,
            width: DEFAULT_CANVAS_SIZE.WIDTH
        };
        this._lastFrameTimestamp = TimeKeeper.gameTimeInSeconds;
        this._shouldShallowRender = true;
        this._shouldDeepRender = true;
        this._shouldDrawFixLabels = false;
        this._shouldDrawRestrictedAreas = false;
        this._shouldDrawSidMap = false;
        this._shouldDrawTerrain = true;

        return this;
    }

    /**
     * Called by `AppController.init()`
     *
     * Creates canvas elements and stores context
     *
     * @for CanvasController
     * @method canvas_init
     */
    canvas_init() {
        this.canvas_add(CANVAS_NAME.STATIC);
        this.canvas_add(CANVAS_NAME.DYNAMIC);
    }

    /**
     * Add a `canvas` element to the DOM
     *
     * @for CanvasController
     * @method canvas_add
     * @param name {CANVAS_NAME|string}
     */
    canvas_add(name) {
        const canvasTemplate = `<canvas id='${name}-canvas'></canvas>`;

        this.$element.append(canvasTemplate);

        this._context[name] = $(`#${name}-canvas`).get(0).getContext('2d');
    }

    /**
     * Called by `AppController.complete()`
     *
     * @for CanvasController
     * @method
     */
    canvas_complete() {
        setTimeout(() => {
            this._markDeepRender();
        }, 500);

        this._lastFrameTimestamp = TimeKeeper.gameTimeInSeconds;
    }

    /**
     * A `resize` event was captured by the `AppController`.
     *
     * Here we re-calculate the canvas dimensions.
     *
     * Called by `AppController.resize()`
     *
     * @for CanvasController
     * @method canvas_resize
     */
    canvas_resize() {
        if (this._shouldResize) {
            this.canvas.size.width = this.$window.width();
            this.canvas.size.height = this.$window.height();
        }

        // offset for footer
        this.canvas.size.height -= 36;

        for (const canvasName in this._context) {
            const context = this._context[canvasName];
            context.canvas.height = this.canvas.size.height;
            context.canvas.width = this.canvas.size.width;

            this.canvas_adjust_hidpi(canvasName);
        }

        this._markDeepRender();
    }

    /**
     * @for CanvasController
     * @method canvas_adjust_hidpi
     */
    canvas_adjust_hidpi(canvasName) {
        const devicePixelRatio = window.devicePixelRatio || 1;
        const canvasContext = this._context[canvasName];

        if (devicePixelRatio <= 1) {
            return;
        }

        const $canvasElement = $(`#${canvasContext.canvas.id}`).get(0);

        $($canvasElement).attr('height', this.canvas.size.height * devicePixelRatio);
        $($canvasElement).css('height', this.canvas.size.height);
        $($canvasElement).attr('width', this.canvas.size.width * devicePixelRatio);
        $($canvasElement).css('width', this.canvas.size.width);

        canvasContext.scale(devicePixelRatio, devicePixelRatio);
    }

    /**
     * Main update method called by `AppController.update_post()` within the game loop
     *
     * It is important for code in this method, or called by this method, to be as
     * performant as possible so as not to degrade the animation loop.
     *
     * @for CanvasController
     * @method canvas_update_post
     */
    canvas_update_post() {
        const elapsed = TimeKeeper.accumulatedDeltaTime - AirportController.airport_get().start;
        const alpha = extrapolate_range_clamp(0.1, elapsed, 0.4, 0, 1);
        const shouldUpdate = !GameController.game_paused() && TimeKeeper.shouldUpdate();
        const fading = elapsed < 1;

        // TODO: to be implemented in the future as, potentially, another method `.deepRenderUpdate()` or something
        // if (this._shouldDeepRender) {
        //     this is where we update static drawings like terrain, airspace, video map, etc
        //     updates that happen here should be infrequent because they are considered expensive
        // }

        if (this._shouldShallowRender || shouldUpdate || fading) {
            const cc = this.canvas_get(CANVAS_NAME.STATIC);
            const middleHeight = calculateMiddle(this.canvas.size.height);
            const middleWidth = calculateMiddle(this.canvas.size.width);

            cc.font = '11px monoOne, monospace';

            // TODO: what is the rationale here? with two ors and a true, this block will always be exectuted.
            cc.save();

            this.canvas_clear(cc);

            cc.translate(middleWidth, middleHeight);
            cc.save();
            cc.globalAlpha = alpha;

            this.canvas_draw_videoMap(cc);
            this.canvas_draw_terrain(cc);
            this.canvas_draw_restricted(cc);
            this.canvas_draw_runways(cc);

            cc.restore();
            cc.save();
            cc.globalAlpha = alpha;

            this.canvas_draw_fixes(cc);
            this.canvas_draw_sids(cc);

            cc.restore();
            cc.restore();

            // Controlled traffic region - (CTR)
            cc.save();
            // translate to airport center
            cc.translate(
                round(this.canvas.size.width / 2 + CanvasStageModel._panX),
                round(this.canvas.size.height / 2 + CanvasStageModel._panY)
            );

            this.canvas_draw_airspace_border(cc);
            this.canvas_draw_range_rings(cc);
            cc.restore();

            // Special markings for ENGM point merge
            if (AirportController.airport_get().icao === 'ENGM') {
                cc.save();
                cc.translate(middleWidth, middleHeight);
                this.canvas_draw_engm_range_rings(cc);
                cc.restore();
            }

            // Compass
            cc.font = 'bold 10px monoOne, monospace';
            cc.save();
            cc.translate(middleWidth, middleHeight);

            this.canvas_draw_compass(cc);
            cc.restore();

            cc.font = BASE_CANVAS_FONT;

            if (this.canvas_should_draw() || true) {
                cc.save();
                cc.globalAlpha = alpha;
                cc.translate(middleWidth, middleHeight);

                this.canvas_draw_radar_targets(cc);

                cc.restore();
            }

            cc.save();
            cc.globalAlpha = alpha;
            cc.translate(middleWidth, middleHeight);

            this.canvas_draw_data_blocks(cc);

            cc.restore();

            cc.save();
            cc.globalAlpha = alpha;
            cc.translate(middleWidth, middleHeight);

            this.canvas_draw_runway_labels(cc);
            cc.restore();

            cc.save();
            cc.globalAlpha = alpha;
            this.canvas_draw_scale(cc);
            cc.restore();

            cc.save();
            cc.globalAlpha = alpha;
            this.canvas_draw_directions(cc);
            cc.restore();

            this._shouldShallowRender = false;
            this._shouldDeepRender = false;
        }
    }

    /**
     * Find a canvas context stored within `#_context`
     *
     * @for CanvasController
     * @method canvas_get
     * @param name {string}
     */
    canvas_get(name) {
        return this._context[name];
    }

    /**
     * Clear the current canvas
     *
     * @for CanvasController
     * @method canvas_clear
     * @param cc {HTMLCanvasContext}
     */
    canvas_clear(cc) {
        cc.clearRect(0, 0, this.canvas.size.width, this.canvas.size.height);
    }

    // TODO: logic should be updated here to exclusively use `TimeKeeper`
    /**
     * Flag used to determine if we should draw a new frame.
     *
     * @for CanvasController
     * @method canvas_should_draw
     * @return {boolean}
     */
    canvas_should_draw() {
        // FIXME: move this to a simple method in TimeKeeper
        const { currentTime, timewarp } = TimeKeeper;
        const elapsed = currentTime - this._lastFrameTimestamp;

        if (elapsed > (1 / timewarp)) {
            this._lastFrameTimestamp = currentTime;

            return true;
        }

        return false;
    }

    /**
     * @for CanvasController
     * @method canvas_draw_runway
     * @param cc {HTMLCanvasContext}
     * @param runway {RunwayModel}
     * @param mode {boolean}  flag to determine if the runway extended lines should be drawn
     */
    canvas_draw_runway(cc, runway, mode) {
        const length2 = round(CanvasStageModel.translateKilometersToPixels(runway.length / 2));
        const angle = runway.angle;

        cc.translate(
            round(CanvasStageModel.translateKilometersToPixels(runway.relativePosition[0])) + CanvasStageModel._panX,
            -round(CanvasStageModel.translateKilometersToPixels(runway.relativePosition[1])) + CanvasStageModel._panY
        );
        cc.rotate(angle);

        // runway body
        if (!mode) {
            cc.strokeStyle = '#899';
            cc.lineWidth = 2.8;

            cc.beginPath();
            cc.moveTo(0, 0);
            cc.lineTo(0, -2 * length2);
            cc.stroke();
        } else {
            // extended centerlines
            if (!runway.ils.enabled) {
                return;
            }

            cc.strokeStyle = this.theme.SCOPE.RUNWAY_EXTENDED_CENTERLINE;
            cc.lineWidth = 1;

            cc.beginPath();
            cc.moveTo(0, 0);
            cc.lineTo(0, CanvasStageModel.translateKilometersToPixels(runway.ils.loc_maxDist));
            cc.stroke();
        }
    }

    /**
     * @for CanvasController
     * @method canvas_draw_runway_label
     * @param cc {HTMLCanvasContext}
     * @param runway
     */
    canvas_draw_runway_label(cc, runway) {
        const length2 = round(CanvasStageModel.translateKilometersToPixels(runway.length / 2)) + 0.5;
        const angle = runway.angle;
        const text_height = 14;

        cc.translate(
            round(CanvasStageModel.translateKilometersToPixels(runway.relativePosition[0])) + CanvasStageModel._panX,
            -round(CanvasStageModel.translateKilometersToPixels(runway.relativePosition[1])) + CanvasStageModel._panY
        );
        cc.rotate(angle);

        cc.textAlign = 'center';
        cc.textBaseline = 'middle';

        cc.save();
        cc.translate(
            0,
            length2 + text_height
        );
        cc.rotate(-angle);
        cc.translate(
            round(CanvasStageModel.translateKilometersToPixels(runway.labelPos[0])),
            -round(CanvasStageModel.translateKilometersToPixels(runway.labelPos[1]))
        );
        cc.fillText(runway.name, 0, 0);
        cc.restore();
    }

    /**
     * * @for CanvasController
     * @method canvas_draw_runways
     * @param cc {HTMLCanvasContext}
     */
    canvas_draw_runways(cc) {
        if (!this._shouldDrawFixLabels) {
            return;
        }

        cc.strokeStyle = this.theme.SCOPE.RUNWAY;
        cc.fillStyle = this.theme.SCOPE.RUNWAY;
        cc.lineWidth = 4;

        const airport = AirportController.airport_get();

        // TODO: we should try to consolidate this so we aren't looping over the runway collection multiple times
        // Extended Centerlines
        for (let i = 0; i < airport.runways.length; i++) {
            cc.save();
            this.canvas_draw_runway(cc, airport.runways[i][0], true);
            cc.restore();

            cc.save();
            this.canvas_draw_runway(cc, airport.runways[i][1], true);
            cc.restore();
        }

        // Runways
        for (let i = 0; i < airport.runways.length; i++) {
            cc.save();
            this.canvas_draw_runway(cc, airport.runways[i][0], false);
            cc.restore();
        }
    }

    /**
     * @for CanvasController
     * @method canvas_draw_runway_labels
     * @param cc {HTMLCanvasContext}
     */
    canvas_draw_runway_labels(cc) {
        if (!this._shouldDrawFixLabels) {
            return;
        }

        const airport = AirportController.airport_get();

        cc.fillStyle = this.theme.SCOPE.RUNWAY_LABELS;

        for (let i = 0; i < airport.runways.length; i++) {
            cc.save();

            this.canvas_draw_runway_label(cc, airport.runways[i][0]);

            cc.restore();
            cc.save();

            this.canvas_draw_runway_label(cc, airport.runways[i][1]);

            cc.restore();
        }
    }

    /**
     * Draw scale in the top right corner of the scope
     *
     * @for CanvasController
     * @method canvas_draw_scale
     * @param cc {HTMLCanvasContext}
     */
    canvas_draw_scale(cc) {
        const offset = 10;
        const height = 5;
        const length = round(1 / UiController.scale * 50);
        const px_length = round(CanvasStageModel.translateKilometersToPixels(length));
        const widthLessOffset = this.canvas.size.width - offset;

        cc.fillStyle = this.theme.SCOPE.TOP_ROW_TEXT;
        cc.strokeStyle = this.theme.SCOPE.TOP_ROW_TEXT;

        cc.translate(0.5, 0.5);

        cc.lineWidth = 1;
        cc.textAlign = 'center';

        cc.moveTo(widthLessOffset, offset);
        cc.lineTo(widthLessOffset, offset + height);
        cc.lineTo(widthLessOffset - px_length, offset + height);
        cc.lineTo(widthLessOffset - px_length, offset);
        cc.stroke();
        cc.translate(-0.5, -0.5);

        cc.fillText(
            `${length} km`, widthLessOffset - px_length * 0.5,
            offset + height + 17
        );
    }

    /**
     * @for CanvasController
     * @method canvas_draw_fix
     * @param cc {HTMLCanvasContext}
     * @param name {string}     name of a fix
     */
    canvas_draw_fix(cc, name) {
        cc.fillStyle = this.theme.SCOPE.FIX_FILL;
        cc.globalCompositeOperation = 'source-over';
        cc.lineWidth = 1;

        cc.beginPath();
        cc.moveTo(0, -5);
        cc.lineTo(4, 3);
        cc.lineTo(-4, 3);
        cc.closePath();
        cc.fill();

        cc.fillStyle = this.theme.SCOPE.FIX_TEXT;
        cc.textAlign = 'center';
        cc.textBaseline = 'top';

        cc.fillText(name, 0, 6);
    }

    /**
     * @for CanvasController
     * @method canvas_draw_fixes
     * @param cc {HTMLCanvasContext}
     */
    canvas_draw_fixes(cc) {
        if (!this._shouldDrawFixLabels) {
            return;
        }

        cc.lineJoin = 'round';
        cc.font = BASE_CANVAS_FONT;

        for (let i = 0; i < this._navigationLibrary.realFixes.length; i++) {
            const fix = this._navigationLibrary.realFixes[i];
            const fixPositionX = round(CanvasStageModel.translateKilometersToPixels(fix.relativePosition[0])) + CanvasStageModel._panX;
            const fixPositionY = -round(CanvasStageModel.translateKilometersToPixels(fix.relativePosition[1])) + CanvasStageModel._panY;

            cc.save();
            cc.translate(fixPositionX, fixPositionY);

            this.canvas_draw_fix(cc, fix.name);

            cc.restore();
        }
    }

    // TODO: break this method up into smaller chunks
    /**
     * @for CanvasController
     * @method canvas_draw_sids
     * @param cc {HTMLCanvasContext}
     */
    canvas_draw_sids(cc) {
        if (!this._shouldDrawSidMap) {
            return;
        }

        // Store the count of sid text drawn for a specific transition
        const textAtPoint = [];
        const { sidLines } = this._navigationLibrary;

        cc.strokeStyle = this.theme.SCOPE.SID;
        cc.fillStyle = this.theme.SCOPE.SID;
        cc.setLineDash([1, 10]);
        cc.font = 'italic 14px monoOne, monospace';

        for (let i = 0; i < sidLines.length; i++) {
            const sid = sidLines[i];
            let shouldDrawProcedureName = true;
            let fixX = null;
            let fixY = null;

            if (!_has(sid, 'draw')) {
                return;
            }

            for (let j = 0; j < sid.draw.length; j++) {
                const fixList = sid.draw[j];
                let exitName = null;

                for (let k = 0; k < fixList.length; k++) {
                    // write exitPoint name
                    if (fixList[k].indexOf('*') !== INVALID_INDEX) {
                        exitName = fixList[k].replace('*', '');
                        shouldDrawProcedureName = false;
                    }

                    // TODO: this is duplicated in the if block above. need to consolidate
                    const fixName = fixList[k].replace('*', '');
                    const fixPosition = this._navigationLibrary.getFixRelativePosition(fixName);

                    if (!fixPosition) {
                        log(`Unable to draw line to '${fixList[k]}' because its position is not defined!`, LOG.WARNING);
                    }

                    fixX = CanvasStageModel.translateKilometersToPixels(fixPosition[0]) + CanvasStageModel._panX;
                    fixY = -CanvasStageModel.translateKilometersToPixels(fixPosition[1]) + CanvasStageModel._panY;

                    if (k === 0) {
                        cc.beginPath();
                        cc.moveTo(fixX, fixY);
                    } else {
                        cc.lineTo(fixX, fixY);
                    }
                }

                cc.stroke();

                if (exitName) {
                    // Initialize count for this transition
                    if (isNaN(textAtPoint[exitName])) {
                        textAtPoint[exitName] = 0;
                    }

                    // Move the y point for drawing depending on how many sids we have drawn text for
                    // at this point already
                    const y_point = fixY + (15 * textAtPoint[exitName]);
                    cc.fillText(`${sid.identifier}.${exitName}`, fixX + 10, y_point);

                    textAtPoint[exitName] += 1;  // Increment the count for this transition
                }
            }

            if (shouldDrawProcedureName) {
                const labelOffsetX = fixX + 10;
                cc.fillText(sid.identifier, labelOffsetX, fixY);
            }
        }
    }

    /**
     * Draw a trailing indicator 2.5 NM (4.6km) behind landing aircraft to help with traffic spacing
     *
     * @for CanvasController
     * @method canvas_draw_separation_indicator
     * @param cc {HTMLCanvasContext}
     * @param aircraft {AircraftModel}
     */
    canvas_draw_separation_indicator(cc, aircraft) {
        if (!GameController.shouldUseTrailingSeparationIndicator(aircraft)) {
            return;
        }

        const runway = aircraft.fms.currentRunway;
        const oppositeOfRunwayHeading = runway.oppositeAngle;
        cc.strokeStyle = this.theme.RADAR_TARGET.TRAILING_SEPARATION_INDICATOR;
        cc.lineWidth = 3;

        cc.translate(
            CanvasStageModel.translateKilometersToPixels(aircraft.relativePosition[0]) + CanvasStageModel._panX,
            -CanvasStageModel.translateKilometersToPixels(aircraft.relativePosition[1]) + CanvasStageModel._panY
        );
        cc.rotate(oppositeOfRunwayHeading);
        cc.beginPath();
        // TODO: this should use constants
        cc.moveTo(-5, -CanvasStageModel.translateKilometersToPixels(5.556));  // 5.556km = 3.0nm
        cc.lineTo(+5, -CanvasStageModel.translateKilometersToPixels(5.556));  // 5.556km = 3.0nm
        cc.stroke();
    }

    /**
     * Draws circle around aircraft that are approaching, or are in,
     * conflict with another aircraft
     *
     * @for CanvasController
     * @method canvas_draw_aircraft_rings
     * @param cc {HTMLCanvasContext}
     * @param aircraft
     */
    canvas_draw_aircraft_rings(cc, aircraft) {
        const aircraftAlerts = aircraft.hasAlerts();

        cc.save();

        if (aircraftAlerts[0]) {
            if (aircraftAlerts[1]) {
                // red violation circle
                cc.strokeStyle = this.theme.RADAR_TARGET.RING_VIOLATION;
            } else {
                // white warning circle
                cc.strokeStyle = this.theme.RADAR_TARGET.RING_CONFLICT;
            }
        // TODO: what would the else be in this case?
        } else {
            cc.strokeStyle = cc.fillStyle;
        }

        cc.beginPath();
        cc.arc(0, 0, CanvasStageModel.translateKilometersToPixels(km(3)), 0, tau());  // 3nm RADIUS
        cc.stroke();
        cc.restore();
    }

    /**
     * Draw the RADAR RETURN AND HISTORY DOTS ONLY of the specified radar target model
     *
     * @for CanvasController
     * @method canvas_draw_radar_target
     * @param cc {HTMLCanvasContext}
     * @param radarTargetModel {RadarTargetModel}
     */
    canvas_draw_radar_target(cc, radarTargetModel) {
        const { aircraftModel } = radarTargetModel;
        const match = prop.input.callsign.length > 0 && aircraftModel.matchCallsign(prop.input.callsign);

        if (!aircraftModel.isVisible()) {
            return;
        }

        // Trailling
        let trailling_length = this.theme.RADAR_TARGET.HISTORY_LENGTH;
        const dpr = window.devicePixelRatio || 1;

        if (dpr > 1) {
            trailling_length *= round(dpr);
        }

        cc.save();

        let fillStyle = this.theme.RADAR_TARGET.HISTORY_DOT_INSIDE_RANGE;

        if (!aircraftModel.inside_ctr) {
            fillStyle = this.theme.RADAR_TARGET.HISTORY_DOT_OUTSIDE_RANGE;
        }

        cc.fillStyle = fillStyle;

        const positionHistory = aircraftModel.relativePositionHistory;

        for (let i = 0; i < positionHistory.length; i++) {
            const position = aircraftModel.relativePositionHistory[i];

            cc.beginPath();
            cc.arc(
                CanvasStageModel.translateKilometersToPixels(position[0]) + CanvasStageModel._panX,
                CanvasStageModel.translateKilometersToPixels(-position[1]) + CanvasStageModel._panY,
                CanvasStageModel.translateKilometersToPixels(this.theme.RADAR_TARGET.HISTORY_DOT_RADIUS_KM),
                0,
                tau()
            );
            cc.closePath();
            cc.fill();
        }

        cc.restore();

        if (positionHistory.length > trailling_length) {
            // TODO: This slice is being reassigned to the aircraft, which doesn't really
            // make sense as a canvas controller job. This should be done elsewhere.
            aircraftModel.relativePositionHistory = positionHistory.slice(
                positionHistory.length - trailling_length,
                positionHistory.length
            );
        }

        if (aircraftModel.isEstablishedOnCourse()) {
            cc.save();

            this.canvas_draw_separation_indicator(cc, aircraftModel);

            cc.restore();
        }

        // Draw the future path
        // breaking project convention here with an if/else simply for readability
        if (GameController.game.option.getOptionByName('drawProjectedPaths') === 'always') {
            this.canvas_draw_future_track(cc, aircraftModel);
        } else if (GameController.game.option.getOptionByName('drawProjectedPaths') === 'selected' && aircraftModel.warning || match) {
            this.canvas_draw_future_track(cc, aircraftModel);
        }

        const alerts = aircraftModel.hasAlerts();

        cc.translate(
            CanvasStageModel.translateKilometersToPixels(aircraftModel.relativePosition[0]) + CanvasStageModel._panX,
            -CanvasStageModel.translateKilometersToPixels(aircraftModel.relativePosition[1]) + CanvasStageModel._panY
        );

        this.canvas_draw_aircraft_vector_lines(cc, aircraftModel);

        if (aircraftModel.notice || alerts[0]) {
            this.canvas_draw_aircraft_rings(cc, aircraftModel);
        }

        let radarTargetRadiusKm = this.theme.RADAR_TARGET.RADIUS_KM;

        // Draw bigger circle around radar target when the aircraftModel is selected
        if (match) {
            radarTargetRadiusKm = this.theme.RADAR_TARGET.RADIUS_SELECTED_KM;
        }

        // Draw the radar target (aka aircraft position dot)
        cc.fillStyle = this.theme.RADAR_TARGET.RADAR_TARGET;
        cc.beginPath();
        cc.arc(0, 0, CanvasStageModel.translateKilometersToPixels(radarTargetRadiusKm), 0, tau());
        cc.fill();
    }

    /**
     * Draw aircraft vector lines (projected track lines or PTL)
     *
     * Note: These extend in front of aircraft a definable number of minutes
     *
     * @for CanvasController
     * @method canvas_draw_aircraft_vector_lines
     * @param cc {HTMLCanvasContext}
     * @param aircraft {AircraftModel}
     */
    canvas_draw_aircraft_vector_lines(cc, aircraft) {
        if (aircraft.hit) {
            return;
        }

        cc.save();

        cc.fillStyle = this.theme.RADAR_TARGET.PROJECTED_TRACK_LINES;
        cc.strokeStyle = this.theme.RADAR_TARGET.PROJECTED_TRACK_LINES;

        const ptlLengthMultiplier = GameController.getPtlLength();
        const lineLengthInHours = ptlLengthMultiplier * TIME.ONE_MINUTE_IN_HOURS;
        const lineLength_km = km(aircraft.groundSpeed * lineLengthInHours);
        const groundTrackVector = vectorize_2d(aircraft.groundTrack);
        const scaledGroundTrackVector = vscale(groundTrackVector, lineLength_km);
        const screenPositionOffsetX = CanvasStageModel.translateKilometersToPixels(scaledGroundTrackVector[0]);
        const screenPositionOffsetY = CanvasStageModel.translateKilometersToPixels(scaledGroundTrackVector[1]);

        cc.beginPath();
        cc.moveTo(0, 0);
        cc.lineTo(screenPositionOffsetX, -screenPositionOffsetY);
        cc.stroke();
        cc.restore();
    }

    // TODO: This is currently not working correctly and not in use
    /**
     * Draw dashed line from last coordinate of future track through
     * any later requested fixes.
     *
     * @for CanvasController
     * @method canvas_draw_future_track_fixes
     * @param cc {HTMLCanvasContext}
     * @param aircraft {AircraftModel}
     * @param future_track
     */
    canvas_draw_future_track_fixes(cc, aircraft, future_track) {
        // const waypointList = aircraft.fms.waypoints;
        //
        // if (waypointList.length <= 1) {
        //     return;
        // }
        // const start = future_track.length - 1;
        // const x = CanvasStageModel.translateKilometersToPixels(future_track[start][0]) + CanvasStageModel._panX;
        // const y = -CanvasStageModel.translateKilometersToPixels(future_track[start][1]) + CanvasStageModel._panY;
        //
        // cc.beginPath();
        // cc.moveTo(x, y);
        // cc.setLineDash([3, 10]);
        //
        // for (let i = 0; i < waypointList.length; i++) {
        //     const [x, y] = waypointList[i].relativePosition;
        //     const fx = CanvasStageModel.translateKilometersToPixels(x) + CanvasStageModel._panX;
        //     const fy = -CanvasStageModel.translateKilometersToPixels(y) + CanvasStageModel._panY;
        //
        //     cc.lineTo(fx, fy);
        // }
        //
        // cc.stroke();
    }

    /**
     * Run physics updates into the future, draw future track
     *
     * @for CanvasController
     * @method canvas_draw_future_track
     * @param cc {HTMLCanvasContext}
     * @param aircraft {AircraftModel
     */
    canvas_draw_future_track(cc, aircraft) {
        if (aircraft.isTaxiing() || TimeKeeper.simulationRate !== 1) {
            return;
        }

        let was_locked = false;
        const future_track = [];
        const fms_twin = _cloneDeep(aircraft.fms);
        const twin = _cloneDeep(aircraft);

        twin.fms = fms_twin;
        twin.projected = true;
        TimeKeeper.saveDeltaTimeBeforeFutureTrackCalculation();

        for (let i = 0; i < 60; i++) {
            twin.update();

            const ils_locked = twin.isEstablishedOnCourse() && twin.fms.currentPhase === FLIGHT_PHASE.APPROACH;

            future_track.push([...twin.relativePosition, ils_locked]);

            if (ils_locked && twin.altitude < 500) {
                break;
            }
        }

        TimeKeeper.restoreDeltaTimeAfterFutureTrackCalculation();

        cc.save();

        let strokeStyle = this.theme.RADAR_TARGET.PROJECTION_ARRIVAL;

        // future track colors
        if (aircraft.category === FLIGHT_CATEGORY.DEPARTURE) {
            strokeStyle = this.theme.RADAR_TARGET.PROJECTION_DEPARTURE;
        }

        cc.strokeStyle = strokeStyle;
        cc.globalCompositeOperation = 'screen';
        cc.lineWidth = 2;
        cc.beginPath();

        for (let i = 0; i < future_track.length; i++) {
            const track = future_track[i];
            const ils_locked = track[2];

            const x = CanvasStageModel.translateKilometersToPixels(track[0]) + CanvasStageModel._panX;
            const y = -CanvasStageModel.translateKilometersToPixels(track[1]) + CanvasStageModel._panY;

            if (ils_locked && !was_locked) {
                cc.lineTo(x, y);
                // end the current path, start a new path with lockedStroke
                cc.stroke();
                cc.strokeStyle = this.theme.RADAR_TARGET.PROJECTION_ESTABLISHED_ON_APPROACH;
                cc.lineWidth = 3;
                cc.beginPath();
                cc.moveTo(x, y);

                was_locked = true;

                continue;
            }

            if (i === 0) {
                cc.moveTo(x, y);
            } else {
                cc.lineTo(x, y);
            }
        }

        cc.stroke();

        // TODO: following method not in use, leaving for posterity
        // this.canvas_draw_future_track_fixes(cc, twin, future_track);

        cc.restore();
    }

    /**
     * Draw the RADAR RETURN AND HISTORY DOTS ONLY of all radar target models
     *
     * @for CanvasController
     * @method canvas_draw_radar_targets
     * @param cc {HTMLCanvasContext}
     */

    canvas_draw_radar_targets(cc) {
        const radarTargetModels = this._scopeModel.radarTargetCollection.items;

        for (let i = 0; i < radarTargetModels.length; i++) {
            cc.save();

            this.canvas_draw_radar_target(cc, radarTargetModels[i]);

            cc.restore();
        }
    }

    /**
     * Draw an aircraft's data block
     * (box that contains callsign, altitude, speed)
     *
     * @for CanvasController
     * @method canvas_draw_data_block
     * @param cc {HTMLCanvasContext}
     * @param radarTargetModel {RadarTargetModel}
     */
    canvas_draw_data_block(cc, radarTargetModel) {
        const { aircraftModel } = radarTargetModel;

        if (!aircraftModel.isVisible() || aircraftModel.hit) {
            return;
        }

        // Initial Setup
        cc.save();

        const { callsign } = aircraftModel;
        const paddingLR = 5;
        // width of datablock (scales to fit callsign)
        const width = clamp(1, 5.8 * callsign.length) + (paddingLR * 2);
        const halfWidth = width / 2;
        // height of datablock
        const height = 31;
        const halfHeight = height / 2;
        // width of colored bar
        const barWidth = 3;
        const barHalfWidth = barWidth / 2;
        const ILS_enabled = aircraftModel.pilot.hasApproachClearance;
        const lock_size = height / 3;
        const lock_offset = lock_size / 8;
        const pi = Math.PI;
        const point1 = lock_size - barHalfWidth;
        const a = point1 - lock_offset;
        const b = barHalfWidth;
        const clipping_mask_angle = Math.atan(b / a);
        // describes how far around to arc the arms of the ils lock case
        const pi_slice = pi / 24;
        let match = false;

        // Callsign Matching
        if (prop.input.callsign.length > 0 && aircraftModel.matchCallsign(prop.input.callsign)) {
            match = true;
        }

        // set color, intensity, and style elements
        let red = this.theme.DATA_BLOCK.ARRIVAL_BAR_OUT_OF_RANGE;
        let green = this.theme.DATA_BLOCK.BACKGROUND_OUT_OF_RANGE;
        let blue = this.theme.DATA_BLOCK.DEPARTURE_BAR_OUT_OF_RANGE;
        let white = this.theme.DATA_BLOCK.TEXT_OUT_OF_RANGE;

        if (aircraftModel.inside_ctr) {
            red = this.theme.DATA_BLOCK.ARRIVAL_BAR_IN_RANGE;
            green = this.theme.DATA_BLOCK.BACKGROUND_IN_RANGE;
            blue = this.theme.DATA_BLOCK.DEPARTURE_BAR_IN_RANGE;
            white = this.theme.DATA_BLOCK.TEXT_IN_RANGE;

            if (match) {
                red = this.theme.DATA_BLOCK.ARRIVAL_BAR_SELECTED;
                green = this.theme.DATA_BLOCK.BACKGROUND_SELECTED;
                blue = this.theme.DATA_BLOCK.DEPARTURE_BAR_SELECTED;
                white = this.theme.DATA_BLOCK.TEXT_SELECTED;
            }
        }

        cc.textBaseline = 'middle';

        let dataBlockLeaderDirection = radarTargetModel.dataBlockLeaderDirection;

        if (dataBlockLeaderDirection === INVALID_NUMBER) {
            dataBlockLeaderDirection = this.theme.DATA_BLOCK.LEADER_DIRECTION;
        }

        let offsetComponent = [
            Math.sin(degreesToRadians(dataBlockLeaderDirection)),
            -Math.cos(degreesToRadians(dataBlockLeaderDirection))
        ];

        // `degreesToRadians('ctr')` above will yield NaN, so we override that here
        if (dataBlockLeaderDirection === 'ctr') {
            offsetComponent = [0, 0];
        }

        // Move to center of where the data block is to be drawn
        const ac_pos = [
            round(CanvasStageModel.translateKilometersToPixels(aircraftModel.relativePosition[0])) + CanvasStageModel._panX,
            -round(CanvasStageModel.translateKilometersToPixels(aircraftModel.relativePosition[1])) + CanvasStageModel._panY
        ];

        const leaderLength = this._calculateLeaderLength(radarTargetModel);
        const blockPadding = this.theme.DATA_BLOCK.LEADER_PADDING_FROM_BLOCK_PX;
        const targetPadding = this.theme.DATA_BLOCK.LEADER_PADDING_FROM_TARGET_PX;
        const leaderStart = [
            ac_pos[0] + (offsetComponent[0] * targetPadding),
            ac_pos[1] + (offsetComponent[1] * targetPadding)
        ];
        const leaderEnd = [
            ac_pos[0] + offsetComponent[0] * (leaderLength - blockPadding),
            ac_pos[1] + offsetComponent[1] * (leaderLength - blockPadding)
        ];
        const leaderIntersectionWithBlock = [
            ac_pos[0] + offsetComponent[0] * leaderLength,
            ac_pos[1] + offsetComponent[1] * leaderLength
        ];

        cc.moveTo(...leaderStart);
        cc.lineTo(...leaderEnd);
        cc.stroke();

        const blockCenterOffset = {
            ctr: [0, 0],
            360: [0, -halfHeight],
            45: [halfWidth, -halfHeight],
            90: [halfWidth, 0],
            135: [halfWidth, halfHeight],
            180: [0, halfHeight],
            225: [-halfWidth, halfHeight],
            270: [-halfWidth, 0],
            315: [-halfWidth, -halfHeight]
        };
        const leaderEndToBlockCenter = blockCenterOffset[dataBlockLeaderDirection];
        const dataBlockCenter = vadd(leaderIntersectionWithBlock, leaderEndToBlockCenter);

        cc.translate(...dataBlockCenter);

        // Draw datablock shapes
        if (!ILS_enabled && this.theme.DATA_BLOCK.HAS_FILL) {
            // data block box background fill
            cc.fillStyle = green;
            cc.fillRect(-halfWidth, -halfHeight, width, height);

            // Draw colored bar
            cc.fillStyle = (aircraftModel.category === FLIGHT_CATEGORY.DEPARTURE) ? blue : red;
            cc.fillRect(-halfWidth - barWidth, -halfHeight, barWidth, height);
        } else if (this.theme.DATA_BLOCK.HAS_FILL) {
            // Box with ILS Lock Indicator
            cc.save();

            // Draw green part of box (excludes space where ILS Clearance Indicator juts in)
            cc.fillStyle = green;
            cc.beginPath();
            cc.moveTo(-halfWidth, halfHeight);  // bottom-left corner
            cc.lineTo(halfWidth, halfHeight);   // bottom-right corner
            cc.lineTo(halfWidth, -halfHeight);  // top-right corner
            cc.lineTo(-halfWidth, -halfHeight); // top-left corner
            cc.lineTo(-halfWidth, -point1);  // begin side cutout
            cc.arc(-halfWidth - barHalfWidth,
                -lock_offset, lock_size / 2 + barHalfWidth,
                clipping_mask_angle - pi / 2,
                0
            );
            cc.lineTo(-halfWidth + lock_size / 2, lock_offset);
            cc.arc(-halfWidth - barHalfWidth,
                lock_offset,
                lock_size / 2 + barHalfWidth,
                0,
                pi / 2 - clipping_mask_angle
            );
            cc.closePath();
            cc.fill();

            // Draw ILS Clearance Indicator
            cc.translate(-halfWidth - barHalfWidth, 0);
            cc.lineWidth = barWidth;
            cc.strokeStyle = red;
            cc.beginPath(); // top arc start
            cc.arc(0, -lock_offset, lock_size / 2, -pi_slice, pi + pi_slice, true);
            cc.moveTo(0, -lock_size / 2);
            cc.lineTo(0, -halfHeight);
            cc.stroke(); // top arc end
            cc.beginPath(); // bottom arc start
            cc.arc(0, lock_offset, lock_size / 2, pi_slice, pi - pi_slice);
            cc.moveTo(0, lock_size - barWidth);
            cc.lineTo(0, halfHeight);
            cc.stroke();  // bottom arc end

            if (aircraftModel.isEstablishedOnCourse()) {
                // Localizer Capture Indicator
                cc.fillStyle = white;
                cc.beginPath();
                cc.arc(0, 0, lock_size / 5, 0, pi * 2);
                cc.fill(); // Draw Localizer Capture Dot
            }

            cc.translate(halfWidth + barHalfWidth, 0);
            // unclear how this works...
            cc.beginPath(); // if removed, white lines appear on top of bottom half of lock case
            cc.stroke(); // if removed, white lines appear on top of bottom half of lock case

            cc.restore();
        }

        // Text
        const gap = 3;          // height of TOTAL vertical space between the rows (0 for touching)
        const lineheight = 4.5; // height of text row (used for spacing basis)
        const row1text = callsign;
        const aircraftAltitude = round(aircraftModel.altitude * 0.01);
        const aircraftSpeed = round(aircraftModel.groundSpeed * 0.1);
        const row2text = `${leftPad(aircraftAltitude, 3)} ${leftPad(aircraftSpeed, 2)}`;

        let fillStyle = this.theme.DATA_BLOCK.TEXT_OUT_OF_RANGE;

        if (aircraftModel.inside_ctr) {
            fillStyle = this.theme.DATA_BLOCK.TEXT_IN_RANGE;
        }

        cc.fillStyle = fillStyle;

        // Draw full datablock text
        cc.font = this.theme.DATA_BLOCK.TEXT_FONT;
        cc.textAlign = 'left';
        cc.fillText(row1text, -halfWidth + paddingLR, -gap / 2 - lineheight);
        cc.fillText(row2text, -halfWidth + paddingLR, gap / 2 + lineheight);
        cc.font = BASE_CANVAS_FONT;  // change back to normal font

        cc.restore();
    }

    /**
     * @for CanvasController
     * @method canvas_draw_data_blocks
     * @param cc {HTMLCanvasContext}
     */
    canvas_draw_data_blocks(cc) {
        const radarTargetModels = this._scopeModel.radarTargetCollection.items;

        for (let i = 0; i < radarTargetModels.length; i++) {
            cc.save();

            this.canvas_draw_data_block(cc, radarTargetModels[i]);

            cc.restore();
        }
    }

    /**
     * Draw wind vane in lower right section of the scope view
     *
     * @for CanvasController
     * @method canvas_draw_compass
     * @param cc {HTMLCanvasContext}
     */
    canvas_draw_compass(cc) {
        cc.translate(
            calculateMiddle(this.canvas.size.width),
            calculateMiddle(this.canvas.size.height)
        );

        const airport = AirportController.airport_get();
        const size = 80;
        const size2 = size / 2;
        const padding = 16;
        const dot = 16;
        let windspeed_line;
        let highwind;

        // Shift compass location
        cc.translate(-size2 - padding, -size2 - padding);
        cc.lineWidth = 4;

        // Outer circle
        cc.fillStyle = this.theme.WIND_VANE.OUTER_RING_FILL;
        cc.beginPath();
        cc.arc(0, 0, size2, 0, tau());
        cc.fill();

        // Inner circle
        cc.lineWidth = 1;
        cc.beginPath();
        cc.arc(0, 0, dot / 2, 0, tau());
        cc.strokeStyle = this.theme.WIND_VANE.INNER_RING_STROKE;
        cc.stroke();

        // Wind Value
        cc.fillStyle = this.theme.WIND_VANE.WIND_SPEED_TEXT;
        cc.textAlign = 'center';
        cc.textBaseline = 'center';
        cc.font = '9px monoOne, monospace';
        cc.fillText(airport.wind.speed, 0, 3.8);
        cc.font = 'bold 10px monoOne, monospace';

        // Wind line
        if (airport.wind.speed > 8) {
            windspeed_line = airport.wind.speed / 2;
            highwind = true;
        } else {
            windspeed_line = airport.wind.speed;
            highwind = false;
        }

        cc.save();
        cc.translate(
            -dot / 2 * sin(airport.wind.angle),
            dot / 2 * cos(airport.wind.angle)
        );
        cc.beginPath();
        cc.moveTo(0, 0);
        cc.rotate(airport.wind.angle);
        cc.lineTo(0, extrapolate_range_clamp(0, windspeed_line, 15, 0, size2 - dot));

        // TODO: simplify. replace with initial assignment and re-assignment in if condition
        // Color wind line red for high-wind
        if (highwind) {
            cc.strokeStyle = this.theme.WIND_VANE.DIRECTION_LINE_GUSTY;
        } else {
            cc.strokeStyle = this.theme.WIND_VANE.DIRECTION_LINE;
        }

        cc.lineWidth = 2;
        cc.stroke();
        cc.restore();
        cc.fillStyle = this.theme.WIND_VANE.WIND_SPEED_TEXT;
        cc.textAlign = 'center';
        cc.textBaseline = 'top';

        for (let i = 90; i <= 360; i += 90) {
            let angle = i;

            cc.rotate(degreesToRadians(90));

            if (i === 90) {
                angle = `0${i}`;
            }

            cc.save();
            cc.fillText(angle, 0, -size2 + 4);
            cc.restore();
        }
    }

    /**
     * Draw polygonal airspace border
     *
     * @for CanvasController
     * @method canvas_draw_airspace_border
     * @param cc {HTMLCanvasContext}
     */
    canvas_draw_airspace_border(cc) {
        const airport = AirportController.airport_get();

        cc.strokeStyle = this.theme.SCOPE.AIRSPACE_PERIMETER;
        cc.fillStyle = this.theme.SCOPE.AIRSPACE_FILL;

        // draw airspace
        for (let i = 0; i < airport.airspace.length; i++) {
            const poly = $.map(airport.perimeter.poly, (v) => {
                return [v.relativePosition];
            });

            this.canvas_draw_poly(cc, poly);
            cc.clip();
        }
    }

    /**
     * Draw range rings for `ENGM`
     *
     * This method is used exclusively by `.canvas_draw_engm_range_rings()`
     *
     * @for CanvasController
     * @method canvas_draw_fancy_rings
     * @param cc {HTMLCanvasContext}
     * @param fix_origin
     * @param fix1
     * @param fix2
     */
    canvas_draw_fancy_rings(cc, fix_origin, fix1, fix2) {
        const airport = AirportController.airport_get();
        const origin = airport.getFixPosition(fix_origin);
        const f1 = airport.getFixPosition(fix1);
        const f2 = airport.getFixPosition(fix2);
        const minDist = Math.min(distance2d(origin, f1), distance2d(origin, f2));
        const halfPI = Math.PI / 2;
        const extend_ring = degreesToRadians(10);
        const start_angle = Math.atan2(f1[0] - origin[0], f1[1] - origin[1]) - halfPI - extend_ring;
        const end_angle = Math.atan2(f2[0] - origin[0], f2[1] - origin[1]) - halfPI + extend_ring;
        const x = round(CanvasStageModel.translateKilometersToPixels(origin[0])) + CanvasStageModel._panX;
        const y = -round(CanvasStageModel.translateKilometersToPixels(origin[1])) + CanvasStageModel._panY;
        // 5NM = 9.27km
        const radius = 9.27;

        for (let i = 0; i < 4; i++) {
            cc.beginPath();
            cc.arc(
                x,
                y,
                CanvasStageModel.translateKilometersToPixels(minDist - (i * radius)),
                start_angle, end_angle
            );

            cc.stroke();
        }
    }

    /**
     * @for CanvasController
     * @method canvas_draw_engm_range_rings
     * @param cc {HTMLCanvasContext}
     */
    // Draw range rings for ENGM airport to assist in point merge
    canvas_draw_engm_range_rings(cc) {
        cc.strokeStyle = this.theme.SCOPE.RANGE_RING_COLOR;
        cc.setLineDash([3, 6]);

        this.canvas_draw_fancy_rings(cc, 'BAVAD', 'GM428', 'GM432');
        this.canvas_draw_fancy_rings(cc, 'TITLA', 'GM418', 'GM422');
        this.canvas_draw_fancy_rings(cc, 'INSUV', 'GM403', 'GM416');
        this.canvas_draw_fancy_rings(cc, 'VALPU', 'GM410', 'GM402');
    }

    /**
     * @for CanvasController
     * @method canvas_draw_range_rings
     * @param cc {HTMLCanvasContext}
     */
    canvas_draw_range_rings(cc) {
        const airport = AirportController.airport_get();
        // convert input param from nm to km
        const rangeRingRadius = km(airport.rr_radius_nm);

        // Fill up airport's ctr_radius with rings of the specified radius
        for (let i = 1; i * rangeRingRadius < airport.ctr_radius; i++) {
            cc.beginPath();
            cc.linewidth = 1;
            cc.arc(0, 0, rangeRingRadius * UiController.scale * i, 0, tau());
            cc.strokeStyle = this.theme.SCOPE.RANGE_RING_COLOR;
            cc.stroke();
        }
    }

    /**
     * @for CanvasController
     * @method canvas_draw_poly
     * @param cc {HTMLCanvasContext}
     * @param poly {array<array<number, number>>}
     */
    canvas_draw_poly(cc, poly) {
        cc.beginPath();

        for (let i = 0; i < poly.length; i++) {
            const singlePoly = poly[i];

            cc.lineTo(
                CanvasStageModel.translateKilometersToPixels(singlePoly[0]),
                -CanvasStageModel.translateKilometersToPixels(singlePoly[1])
            );
        }

        cc.closePath();
        cc.stroke();
        cc.fill();
    }

    drawTerrainAtElevation(cc, terrainLevel, elevation) {
        // Here we use HSL colors instead of RGB to enable easier bulk adjustments
        // to saturation/lightness of multiple elevation levels without the need
        // to use web-based color tools
        const color = `hsla(${this.theme.TERRAIN.COLOR[elevation]}`;

        cc.strokeStyle = `${color}, ${this.theme.TERRAIN.BORDER_OPACITY})`;
        cc.fillStyle = `${color}, ${this.theme.TERRAIN.FILL_OPACITY})`;

        for (let i = 0; i < terrainLevel.length; i++) {
            const terrainGroup = terrainLevel[i];

            cc.beginPath();

            for (let j = 0; j < terrainGroup.length; j++) {
                const terrainItem = terrainGroup[j];

                for (let k = 0; k < terrainItem.length; k++) {
                    if (k === 0) {
                        cc.moveTo(
                            CanvasStageModel.translateKilometersToPixels(terrainItem[k][0]),
                            -CanvasStageModel.translateKilometersToPixels(terrainItem[k][1])
                        );
                    }

                    cc.lineTo(
                        CanvasStageModel.translateKilometersToPixels(terrainItem[k][0]),
                        -CanvasStageModel.translateKilometersToPixels(terrainItem[k][1])
                    );
                }

                cc.closePath();
            }

            cc.fill();
            cc.stroke();
        }
    }

    /**
     * Draw the terrain legend in the upper right hand corner of the scope view
     *
     * @for CanvasController
     * @method drawTerrainElevationLegend
     * @param  cc  {HTMLCanvasContext}
     * @param max_elevation {number}
     */
    drawTerrainElevationLegend(cc, max_elevation) {
        const offset = 10;
        const width = this.canvas.size.width;
        const height = this.canvas.size.height;
        const box_width = 30;
        const box_height = 5;

        for (let i = 1000; i <= max_elevation; i += 1000) {
            cc.save();
            // translate coordinates for every block to not use these X & Y twice in rect and text
            // .5 in X and Y coordinates are used to make 1px rectangle fit exactly into 1 px
            // and not be blurred
            cc.translate(
                width / 2 - 140.5 - (max_elevation - i) / 1000 * (box_width + 1),
                -height / 2 + offset + 0.5
            );
            cc.beginPath();
            cc.rect(0, 0, box_width - 1, box_height);
            cc.closePath();

            // in the map, terrain of higher levels has fill of all the lower levels
            // so we need to fill it below exactly as in the map
            for (let j = 0; j <= i; j += 1000) {
                cc.fillStyle = `rgba(${this.theme.TERRAIN.COLOR[j]}, ${this.theme.TERRAIN.FILL_OPACITY})`;
                cc.fill();
            }

            cc.strokeStyle = `rgba(${this.theme.TERRAIN.COLOR[i]}, ${this.theme.TERRAIN.BORDER_OPACITY})`;
            cc.stroke();

            // write elevation signs only for the outer elevations
            if (i === max_elevation || i === 1000) {
                cc.fillStyle = this.theme.SCOPE.COMPASS_TEXT;
                cc.textAlign = 'center';
                cc.textBaseline = 'top';
                cc.fillText(`${i}'`, box_width / 2 + 0.5, offset + 2);
            }

            cc.restore();
        }
    }

    /**
     * @for CanvasController
     * @method canvas_draw_terrain
     * @param cc {HTMLCanvasContext}
     */
    canvas_draw_terrain(cc) {
        const airport = AirportController.airport_get();
        const airportTerrain = airport.terrain;
        let max_elevation = 0;

        if (!this._shouldDrawTerrain || Object.keys(airportTerrain).length === 0) {
            return;
        }

        // Terrain key rectangles' outline stroke color
        // Also determines color of terrain outline drawn at '0ft'
        cc.strokeStyle = this.theme.SCOPE.FIX_FILL;
        // Somehow used to tint the terrain key rectangles' fill color
        // Also determines color of terrain fill at '0ft'
        cc.fillStyle = this.theme.SCOPE.FIX_FILL;
        cc.lineWidth = clamp(0.5, (UiController.scale / 10), 2);
        cc.lineJoin = 'round';

        cc.save();
        cc.translate(CanvasStageModel._panX, CanvasStageModel._panY);

        for (const elevation in airportTerrain) {
            // eslint-disable-next-line
            if (!airportTerrain.hasOwnProperty(elevation)) {
                continue;
            }

            const terrainLevel = airportTerrain[elevation];

            if (elevation < 1000 && !this._hasSeenTerrainWarning) {
                console.warn(`${airport.icao}.geojson contains 'terrain' at or` +
                    ' below sea level, which is not supported!');

                this._hasSeenTerrainWarning = true;

                continue;
            }

            max_elevation = Math.max(max_elevation, elevation);

            this.drawTerrainAtElevation(cc, terrainLevel, elevation);
        }

        cc.restore();

        if (max_elevation === 0) {
            return;
        }

        cc.font = BASE_CANVAS_FONT;
        cc.lineWidth = 1;

        this.drawTerrainElevationLegend(cc, max_elevation);
    }

    /**
     * @for CanvasController
     * @method canvas_draw_restricted
     * @param cc {HTMLCanvasContext}
     */
    canvas_draw_restricted(cc) {
        if (!this._shouldDrawRestrictedAreas) {
            return;
        }

        cc.strokeStyle = this.theme.SCOPE.RESTRICTED_AIRSPACE;
        cc.lineWidth = Math.max(UiController.scale / 3, 2);
        cc.lineJoin = 'round';
        cc.font = BASE_CANVAS_FONT;

        const airport = AirportController.airport_get();

        cc.save();
        cc.translate(CanvasStageModel._panX, CanvasStageModel._panY);

        for (let i = 0; i < airport.restricted_areas.length; i++) {
            const area = airport.restricted_areas[i];
            cc.fillStyle = 'transparent';

            this.canvas_draw_poly(cc, area.coordinates);

            // TODO: Is the restricted airspace EVER filled???
            cc.fillStyle = this.theme.SCOPE.RESTRICTED_AIRSPACE;
            cc.textAlign = 'center';
            cc.textBaseline = 'top';

            const height = area.height === Infinity
                ? 'UNL'
                : `FL ${Math.ceil(area.height / 1000) * 10}`;
            let height_shift = 0;

            if (area.name) {
                height_shift = -12;

                cc.fillText(
                    area.name,
                    round(CanvasStageModel.translateKilometersToPixels(area.center[0])),
                    -round(CanvasStageModel.translateKilometersToPixels(area.center[1]))
                );
            }

            cc.fillText(
                height,
                round(CanvasStageModel.translateKilometersToPixels(area.center[0])),
                height_shift - round(CanvasStageModel.translateKilometersToPixels(area.center[1]))
            );
        }

        cc.restore();
    }

    /**
     * @for CanvasController
     * @method canvas_draw_videoMap
     * @param cc {HTMLCanvasContext}
     */
    canvas_draw_videoMap(cc) {
        if (!_has(AirportController.airport_get(), 'maps')) {
            return;
        }

        cc.strokeStyle = this.theme.SCOPE.VIDEO_MAP;
        cc.lineWidth = UiController.scale / 15;
        cc.lineJoin = 'round';
        cc.font = BASE_CANVAS_FONT;

        const airport = AirportController.airport_get();

        cc.save();
        cc.translate(CanvasStageModel._panX, CanvasStageModel._panY);

        for (let i = 0; i < airport.maps.base.length; i++) {
            const mapItem = airport.maps.base[i];
            cc.moveTo(CanvasStageModel.translateKilometersToPixels(mapItem[0]), -CanvasStageModel.translateKilometersToPixels(mapItem[1]));
            // cc.beginPath();
            cc.lineTo(CanvasStageModel.translateKilometersToPixels(mapItem[2]), -CanvasStageModel.translateKilometersToPixels(mapItem[3]));
        }

        cc.stroke();
        cc.restore();
    }

    // TODO: is this even in use?
    /**
     * Draws crosshairs that point to the currently translated location
     *
     * @for CanvasController
     * @method canvas_draw_crosshairs
     * @param cc {HTMLCanvasContext}
     */
    canvas_draw_crosshairs(cc) {
        cc.save();
        cc.strokeStyle = this.theme.SCOPE.CROSSHAIR_STROKE;
        cc.lineWidth = 3;
        cc.beginPath();
        cc.moveTo(-10, 0);
        cc.lineTo(10, 0);
        cc.stroke();
        cc.beginPath();
        cc.moveTo(0, -10);
        cc.lineTo(0, 10);
        cc.stroke();
        cc.restore();
    }

    /**
     * Draw the compass around the edge of the scope view
     *
     * @for CanvasController
     * @method canvas_draw_directions
     * @param cc {HTMLCanvasContext}
     */
    canvas_draw_directions(cc) {
        if (GameController.game_paused()) {
            return;
        }

        const callsign = prop.input.callsign.toUpperCase();

        if (callsign.length === 0) {
            return;
        }

        // TODO: this should be a method on the `AircraftController` if one doesn't already exist.
        // Get the selected aircraft.
        const aircraft = _filter(this._aircraftController.aircraft.list, (p) => {
            return p.matchCallsign(callsign) && p.isVisible();
        })[0];

        if (!aircraft) {
            return;
        }

        const pos = this.to_canvas_pos(aircraft.relativePosition);
        const rectPos = [0, 0];
        const rectSize = [this.canvas.size.width, this.canvas.size.height];

        cc.save();
        cc.strokeStyle = this.theme.SCOPE.COMPASS_HASH;
        cc.fillStyle = this.theme.SCOPE.COMPASS_TEXT;
        cc.textAlign = 'center';
        cc.textBaseline = 'middle';

        for (let alpha = 0; alpha < 360; alpha++) {
            const dir = [
                sin(degreesToRadians(alpha)),
                -cos(degreesToRadians(alpha))
            ];

            const p = positive_intersection_with_rect(pos, dir, rectPos, rectSize);

            if (p) {
                const markLen = (alpha % 5 === 0 ?
                    (alpha % 10 === 0
                        ? 16
                        : 12)
                    : 8
                );
                const markWeight = (alpha % 30 === 0
                    ? 2
                    : 1
                );

                const dx = -markLen * dir[0];
                const dy = -markLen * dir[1];

                cc.lineWidth = markWeight;
                cc.beginPath();
                cc.moveTo(p[0], p[1]);

                const markX = p[0] + dx;
                const markY = p[1] + dy;

                cc.lineTo(markX, markY);
                cc.stroke();

                if (alpha % 10 === 0) {
                    cc.font = alpha % 30 === 0
                        ? 'bold 10px monoOne, monospace'
                        : BASE_CANVAS_FONT;

                    const text = '' + alpha;
                    const textWidth = cc.measureText(text).width;

                    cc.fillText(
                        text,
                        markX - dir[0] * (textWidth / 2 + 4),
                        markY - dir[1] * 7);
                }
            }
        }

        cc.restore();
    }

    /**
     * Calculate an aircraft's position within the canvas from
     *
     * @for CanvasController
     * @method to_canvas_pos
     * @param pos {DynamicPositionModel}
     */
    to_canvas_pos(pos) {
        return [
            this.canvas.size.width / 2 + CanvasStageModel._panX + km(pos[0]),
            this.canvas.size.height / 2 + CanvasStageModel._panY - km(pos[1])
        ];
    }

    /**
     * Calculate the length of the leader line connecting the target to the data block
     *
     * @for CanvasController
     * @method _calculateLeaderLength
     * @param radarTargetModel {RadarTargetModel}
     * @return {number} length, in pixels
     * @private
     */
    _calculateLeaderLength(radarTargetModel) {
        return radarTargetModel.dataBlockLeaderLength *
            this.theme.DATA_BLOCK.LEADER_LENGTH_INCREMENT_PIXELS +
            this.theme.DATA_BLOCK.LEADER_LENGTH_ADJUSTMENT_PIXELS -
            this.theme.DATA_BLOCK.LEADER_PADDING_FROM_BLOCK_PX -
            this.theme.DATA_BLOCK.LEADER_PADDING_FROM_TARGET_PX;
    }

    /**
     * Mark the canvas as dirty, forcing a redraw during the next frame
     *
     * This method should only be called via the `EventBus`
     * Facade method for `._markShallowRender()`
     *
     * @for CanvasController
     * @method _onMarkDirtyCanvas
     * @private
     */
    _onMarkDirtyCanvas = () => {
        this._markShallowRender();
    };

    /**
     * Update local props as a result of the user panning the view
     *
     * This method will only be `trigger`ed by some other
     * class via the `EventBus`
     *
     * @for CanvasController
     * @method _onChangeViewportPan
     * @private
     */
    _onChangeViewportPan = (event, mouseDelta) => {
        CanvasStageModel._panX = mouseDelta[0];
        CanvasStageModel._panY = mouseDelta[1];

        this._markDeepRender();
    };

    /**
     * Update local props as a result of a change in the current zoom level
     *
     * This method will only be `trigger`ed by some other
     * class via the `EventBus`
     *
     * @for CanvasController
     * @method _onChangeViewportZoom
     * @param mouseDelta {array<number, number>}
     * @private
     */
    _onChangeViewportZoom = () => {
        // CanvasStageModel._panX = mouseDelta[0];
        // CanvasStageModel._panY = mouseDelta[1];

        this._markDeepRender();
    };

    /**
     * Toogle current value of `#draw_labels`
     *
     * This method will only be `trigger`ed by some other
     * class via the `EventBus`
     *
     * @for CanvasController
     * @method _onToggleLabels
     * @private
     */
    _onToggleLabels = () => {
        this._shouldDrawFixLabels = !this._shouldDrawFixLabels;

        this._markDeepRender();
    };

    /**
     * Toogle current value of `#draw_restricted`
     *
     * This method will only be `trigger`ed by some other
     * class via the `EventBus`
     *
     * @for CanvasController
     * @method _onToggleRestrictedAreas
     * @private
     */
    _onToggleRestrictedAreas = () => {
        this._shouldDrawRestrictedAreas = !this._shouldDrawRestrictedAreas;

        this._markDeepRender();
    };

    /**
     * Toogle current value of `#draw_sids`
     *
     * This method will only be `trigger`ed by some other
     * class via the `EventBus`
     *
     * @for CanvasController
     * @method _onToggleSidMap
     * @private
     */
    _onToggleSidMap = () => {
        this._shouldDrawSidMap = !this._shouldDrawSidMap;

        this._markDeepRender();
    };

    /**
     * Toogle current value of `#draw_terrain`
     *
     * This method will only be `trigger`ed by some other
     * class via the `EventBus`
     * @for CanvasController
     * @method _onToggleTerrain
     * @private
     */
    _onToggleTerrain = () => {
        this._shouldDrawTerrain = !this._shouldDrawTerrain;

        this._markDeepRender();
    };

    /**
     * Update the value of `#_shouldShallowRender` to true, forcing a redraw
     * on the next frame.
     *
     * This method should be used for forcing redraws on _dynamic_ elements
     * only. In the future this will mean only items contained within the
     * `CANVAS_NAME.DYNAMIC` will be redrawn.
     *
     * @for CanvasController
     * @method _markShallowRender
     * @private
     */
    _markShallowRender() {
        this._shouldShallowRender = true;
    }

    /**
     * Update the value of `#_shouldShallowRender` and `#_shouldDeepRender` to true, thus
     * forcing a redraw of both canvases on the next frame.
     *
     * This method should be used for forcing redraws on dynamic _and_ static elements.
     * In the future this will mean both `CANVAS_NAME.STATIC` and `CANVAS_NAME.DYNAMIC`
     * will be redrawn on the next frame.
     *
     * @for CanvasController
     * @method _markDeepRender
     * @private
     */
    _markDeepRender() {
        this._markShallowRender();

        this._shouldDeepRender = true;
    }

    /**
     * Center a point in the view
     *
     * Used only for centering aircraft, this accepts
     * the x,y of an aircrafts relativePosition
     *
     * @for CanvasController
     * @method _onCenterPointInView
     * @param x {number}    relativePosition.x
     * @param y {number}    relativePosition.y
     */
    _onCenterPointInView = ({ x, y }) => {
        CanvasStageModel._panX = 0 - round(CanvasStageModel.translateKilometersToPixels(x));
        CanvasStageModel._panY = round(CanvasStageModel.translateKilometersToPixels(y));

        CanvasStageModel._panX = 0 - round(CanvasStageModel.translateKilometersToPixels(x));
        CanvasStageModel._panY = round(CanvasStageModel.translateKilometersToPixels(y));

        this._markShallowRender();
    };

    /**
     * Change theme to the specified name
     *
     * This should ONLY be called through the EventBus during a `SET_THEME` event,
     * thus ensuring that the same theme is always in use by all app components.
     *
     * This method must remain an arrow function in order to preserve the scope
     * of `this`, since it is being invoked by an EventBus callback.
     *
     * @for CanvasController
     * @method _setTheme
     * @param themeName {string}
     */
    _setTheme = (themeName) => {
        if (!_has(THEME, themeName)) {
            console.error(`Expected valid theme to change to, but received '${themeName}'`);

            return;
        }

        // TODO: abstract to method
        this.$element.removeClass(this.theme.CLASSNAME);

        this.theme = THEME[themeName];
        // TODO: abstract to method
        this.$element.addClass(this.theme.CLASSNAME);
    };
}
