import $ from 'jquery';
import _cloneDeep from 'lodash/cloneDeep';
import _filter from 'lodash/filter';
import _has from 'lodash/has';
import _inRange from 'lodash/inRange';
import AirportController from '../airport/AirportController';
import CanvasStageModel from './CanvasStageModel';
import EventBus from '../lib/EventBus';
import GameController from '../game/GameController';
import MeasureTool from '../measurement/MeasureTool';
import NavigationLibrary from '../navigationLibrary/NavigationLibrary';
import TimeKeeper from '../engine/TimeKeeper';
import { tau } from '../math/circle';
import {
    round,
    clamp
} from '../math/core';
import {
    positive_intersection_with_rect,
    vectorize2dFromRadians,
    vectorize2dFromDegrees,
    vadd,
    vscale
} from '../math/vector';
import {
    FLIGHT_PHASE,
    FLIGHT_CATEGORY
} from '../constants/aircraftConstants';
import {
    BASE_CANVAS_FONT,
    CANVAS_NAME
} from '../constants/canvasConstants';
import { THEME } from '../constants/themes';
import { EVENT } from '../constants/eventNames';
import {
    INVALID_INDEX,
    INVALID_NUMBER,
    TIME
} from '../constants/globalConstants';
import { GAME_OPTION_NAMES } from '../constants/gameOptionConstants';
import { PROCEDURE_TYPE } from '../constants/routeConstants';
import { leftPad } from '../utilities/generalUtilities';
import {
    DECIMAL_RADIX,
    degreesToRadians,
    km,
    nm
} from '../utilities/unitConverters';

/**
 * @class CanvasController
 */
export default class CanvasController {
    /**
     * @constructor
     * @param $element {JQuery|HTML Element}
     * @param aircraftController {AircraftController}
     * @param scopeModel {ScopeModel}
     */
    constructor($element, aircraftController, scopeModel) {
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
         * Flag used to determine if airspace polygons should be displayed and labeled
         *
         * @property _shouldDrawAirspace
         * @type {boolean}
         * @default false
         */
        this._shouldDrawAirspace = false;

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
         * Flag used to determine if the star map should be displayed
         *
         * @property _shouldDrawStarMap
         * @type {boolean}
         * @default false
         */
        this._shouldDrawStarMap = false;

        /**
         * Flag used to determine if terrain should be displayed
         *
         * @property _shouldDrawTerrain
         * @type {boolean}
         * @default true
         */
        this._shouldDrawTerrain = true;

        /**
         * Flag used to determine if the video map should be displayed
         *
         * @property _shouldDrawVideoMap
         * @type {boolean}
         * @default true
         */
        this._shouldDrawVideoMap = true;

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
         * @default null
         */
        this.theme = null;

        return this._init()
            ._setupHandlers()
            .enable();
    }

    /**
     * @for CanvasController
     * @method _init
     * @private
     * @chainable
     */
    _init() {
        this._setTheme(GameController.getGameOption(GAME_OPTION_NAMES.THEME));

        return this;
    }

    /**
     * @for CanvasController
     * @method _setupHandlers
     * @chainable
     * @private
     */
    _setupHandlers() {
        this._onSelectAircraftHandler = this._onSelectAircraft.bind(this);
        this._onDeselectAircraftHandler = this._onDeselectAircraft.bind(this);
        this._onCenterPointInViewHandler = this._onCenterPointInView.bind(this);
        this._onChangeViewportPanHandler = this._onChangeViewportPan.bind(this);
        this._onChangeViewportZoomHandler = this._onChangeViewportZoom.bind(this);
        this._onMarkDirtyCanvasHandler = this._onMarkDirtyCanvas.bind(this);
        this._onToggleAirspaceHandler = this._onToggleAirspace.bind(this);
        this._onToggleLabelsHandler = this._onToggleLabels.bind(this);
        this._onToggleRestrictedAreasHandler = this._onToggleRestrictedAreas.bind(this);
        this._onToggleSidMapHandler = this._onToggleSidMap.bind(this);
        this._onToggleStarMapHandler = this._onToggleStarMap.bind(this);
        this._onAirportChangeHandler = this._onAirportChange.bind(this);
        this._onToggleTerrainHandler = this._onToggleTerrain.bind(this);
        this._onToggleVideoMapHandler = this._onToggleVideoMap.bind(this);
        this._onRangeRingsChangeHandler = this._onRangeRingsChange.bind(this);
        this._onResizeHandler = this.canvas_resize.bind(this);

        this._setThemeHandler = this._setTheme.bind(this);

        return this;
    }

    /**
     * @for CanvasController
     * @method enable
     * @chainable
     */
    enable() {
        this._eventBus.on(EVENT.SELECT_AIRCRAFT, this._onSelectAircraftHandler);
        this._eventBus.on(EVENT.DESELECT_AIRCRAFT, this._onDeselectAircraftHandler);
        this._eventBus.on(EVENT.REQUEST_TO_CENTER_POINT_IN_VIEW, this._onCenterPointInViewHandler);
        this._eventBus.on(EVENT.PAN_VIEWPORT, this._onChangeViewportPanHandler);
        this._eventBus.on(EVENT.ZOOM_VIEWPORT, this._onChangeViewportZoomHandler);
        this._eventBus.on(EVENT.MARK_SHALLOW_RENDER, this._onMarkDirtyCanvasHandler);
        this._eventBus.on(EVENT.TOGGLE_AIRSPACE, this._onToggleAirspaceHandler);
        this._eventBus.on(EVENT.TOGGLE_LABELS, this._onToggleLabelsHandler);
        this._eventBus.on(EVENT.TOGGLE_RESTRICTED_AREAS, this._onToggleRestrictedAreasHandler);
        this._eventBus.on(EVENT.TOGGLE_SID_MAP, this._onToggleSidMapHandler);
        this._eventBus.on(EVENT.TOGGLE_STAR_MAP, this._onToggleStarMapHandler);
        this._eventBus.on(EVENT.TOGGLE_TERRAIN, this._onToggleTerrainHandler);
        this._eventBus.on(EVENT.TOGGLE_VIDEO_MAP, this._onToggleVideoMapHandler);
        this._eventBus.on(EVENT.RANGE_RINGS_CHANGE, this._onRangeRingsChangeHandler);
        this._eventBus.on(EVENT.AIRPORT_CHANGE, this._onAirportChangeHandler);
        this._eventBus.on(EVENT.SET_THEME, this._setThemeHandler);
        window.addEventListener('resize', this._onResizeHandler);

        this.$element.addClass(this.theme.CLASSNAME);

        return this;
    }

    /**
     * @for CanvasController
     * @method disable
     */
    disable() {
        this._eventBus.off(EVENT.SELECT_AIRCRAFT, this._onSelectAircraftHandler);
        this._eventBus.off(EVENT.DESELECT_AIRCRAFT, this._onDeselectAircraftHandler);
        this._eventBus.off(EVENT.REQUEST_TO_CENTER_POINT_IN_VIEW, this._onCenterPointInView);
        this._eventBus.off(EVENT.PAN_VIEWPORT, this._onChangeViewportPan);
        this._eventBus.off(EVENT.ZOOM_VIEWPORT, this._onChangeViewportZoom);
        this._eventBus.off(EVENT.MARK_SHALLOW_RENDER, this._onMarkDirtyCanvas);
        this._eventBus.off(EVENT.TOGGLE_AIRSPACE, this._onToggleAirspaceHandler);
        this._eventBus.off(EVENT.TOGGLE_LABELS, this._onToggleLabels);
        this._eventBus.off(EVENT.TOGGLE_RESTRICTED_AREAS, this._onToggleRestrictedAreas);
        this._eventBus.off(EVENT.TOGGLE_SID_MAP, this._onToggleSidMap);
        this._eventBus.off(EVENT.TOGGLE_STAR_MAP, this._onToggleStarMap);
        this._eventBus.off(EVENT.TOGGLE_TERRAIN, this._onToggleTerrain);
        this._eventBus.off(EVENT.TOGGLE_VIDEO_MAP, this._onToggleVideoMapHandler);
        this._eventBus.off(EVENT.RANGE_RINGS_CHANGE, this._onRangeRingsChangeHandler);
        this._eventBus.off(EVENT.AIRPORT_CHANGE, this._onAirportChangeHandler);
        this._eventBus.off(EVENT.SET_THEME, this._setTheme);
        window.removeEventListener('resize', this._onResizeHandler);

        return this.destroy();
    }

    /**
     * @for CanvasController
     * @method destroy
     */
    destroy() {
        this.$window = null;
        this.$element = null;
        this._context = {};
        this._shouldResize = true;
        this._shouldShallowRender = true;
        this._shouldDeepRender = true;
        this._shouldDrawFixLabels = false;
        this._shouldDrawRestrictedAreas = false;
        this._shouldDrawSidMap = false;
        this._shouldDrawStarMap = false;
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
        this._addCanvas(CANVAS_NAME.STATIC);
        this._addCanvas(CANVAS_NAME.DYNAMIC);
    }

    /**
     * Called by `AppController.complete()`
     *
     * @for CanvasController
     * @method
     */
    canvas_complete() {
        // TODO: not sure what the rationale is here. this should be removed/reworked if possible
        setTimeout(() => {
            this._markDeepRender();
        }, 500);
    }

    /**
     * A `resize` event was captured by the `AppController`
     *
     * Here we re-calculate the canvas dimensions
     *
     * @for CanvasController
     * @method canvas_resize
     */
    canvas_resize() {
        if (this._shouldResize) {
            CanvasStageModel.updateHeightAndWidth(
                this.$window.height(),
                this.$window.width()
            );
        }

        for (const canvasName in this._context) {
            const context = this._context[canvasName];
            context.canvas.height = CanvasStageModel.height;
            context.canvas.width = CanvasStageModel.width;

            this._adjustHidpi(canvasName);
        }

        this._markDeepRender();
    }

    /**
     * Main update method called by `AppController.update_post()` within the game loop
     *
     * All methods called from this function should accept a canvas context argument.
     * The rationale here is that each method sets up and tears down any origin or state
     * transformations themselves. This way the methods can be organized or moved any
     * way we choose without having to worry about what the current state of the `context`
     *
     * It is important for code in this method, or called by this method, to be as
     * performant as possible so as not to degrade performance.
     *
     * @for CanvasController
     * @method canvasUpdatePost
     */
    canvasUpdatePost() {
        if (!this._shouldShallowRender && !TimeKeeper.shouldUpdate()) {
            return;
        }

        if (this._shouldDeepRender) {
            // we should only ever enter this block as a result of a change in the view
            // or an airport change. these methods involve much more complicated drawing
            // and can degrade performance if called too frequently.
            const staticCanvasCtx = this._getCanvasContextByName(CANVAS_NAME.STATIC);

            this._clearCanvasContext(staticCanvasCtx);
            this._drawVideoMap(staticCanvasCtx);
            this._drawTerrain(staticCanvasCtx);
            this._drawRestrictedAirspace(staticCanvasCtx);
            this._drawRunways(staticCanvasCtx);
            this._drawAirportFixesAndLabels(staticCanvasCtx);
            this._drawSids(staticCanvasCtx);
            this._drawStars(staticCanvasCtx);
            this._drawAirspaceAndRangeRings(staticCanvasCtx);
            this._drawAirspaceShelvesAndLabels(staticCanvasCtx);
            this._drawRunwayLabels(staticCanvasCtx);
            this._drawCurrentScale(staticCanvasCtx);
        }

        const dynamicCanvasCtx = this._getCanvasContextByName(CANVAS_NAME.DYNAMIC);

        this._clearCanvasContext(dynamicCanvasCtx);
        this._drawSelectedAircraftCompass(dynamicCanvasCtx);
        this._drawRadarTargetList(dynamicCanvasCtx);
        this._drawAircraftDataBlocks(dynamicCanvasCtx);
        this._drawMeasureTool(dynamicCanvasCtx);

        this._shouldShallowRender = false;
        this._shouldDeepRender = false;
    }

    /**
     * Used primarily for the data block
     *
     * This provides a way to know when to show the primary
     * dataBlock or the secondary dataBlock
     *
     * @method shouldShowSecondaryDataBlock
     * @returns {boolean}
     */
    shouldShowSecondaryDataBlock() {
        return _inRange(TimeKeeper.gameTimeMilliseconds % 3000, 2000, 3000);
    }

    /**
     * Add a `canvas` element to the DOM
     *
     * @for CanvasController
     * @method _addCanvas
     * @param name {CANVAS_NAME|string}
     * @private
     */
    _addCanvas(name) {
        const canvasTemplate = `<canvas id='${name}-canvas'></canvas>`;

        this.$element.append(canvasTemplate);

        this._context[name] = $(`#${name}-canvas`).get(0).getContext('2d');
    }

    /**
     * @for CanvasController
     * @method _adjustHidpi
     * @private
     */
    _adjustHidpi(canvasName) {
        const devicePixelRatio = window.devicePixelRatio || 1;
        const canvasContext = this._context[canvasName];

        if (devicePixelRatio <= 1) {
            return;
        }

        const $canvasElement = $(`#${canvasContext.canvas.id}`).get(0);

        $($canvasElement).attr('height', CanvasStageModel.height * devicePixelRatio);
        $($canvasElement).css('height', CanvasStageModel.height);
        $($canvasElement).attr('width', CanvasStageModel.width * devicePixelRatio);
        $($canvasElement).css('width', CanvasStageModel.width);

        canvasContext.scale(devicePixelRatio, devicePixelRatio);
    }

    /**
     * Clear the current canvas context
     *
     * @for CanvasController
     * @method _clearCanvasContext
     * @param cc {HTMLCanvasContext}
     * @private
     */
    _clearCanvasContext(cc) {
        cc.clearRect(0, 0, CanvasStageModel.width, CanvasStageModel.height);
    }

    /**
     * Draw the specified RunwayModel (line only)
     *
     * POSITIONING: Before calling this method, translate to the AIRPORT CENTER
     *
     * @for CanvasController
     * @method _drawSingleRunway
     * @param cc {HTMLCanvasContext}
     * @param runwayModel {RunwayModel}
     * @param mode {boolean}               flag to switch between drawing a runway or just a runway centerline
     * @returns undefined
     * @private
     */
    _drawSingleRunway(cc, runwayModel, mode) {
        const runwayLength = round(CanvasStageModel._translateKilometersToPixels(runwayModel.length / 2)) * -2;
        const { angle, relativePosition } = runwayModel;
        const runwayCanvasPosition = CanvasStageModel.calculateRoundedCanvasPositionFromRelativePosition(relativePosition);

        cc.save();
        cc.translate(...runwayCanvasPosition);
        cc.rotate(angle);

        // runway body
        if (!mode) {
            cc.strokeStyle = '#899';
            cc.lineWidth = 2.8;

            cc.beginPath();
            cc.moveTo(0, 0);
            cc.lineTo(0, runwayLength);
            cc.stroke();
        } else { // extended centerlines
            if (!runwayModel.ils.enabled) {
                cc.restore();

                return;
            }

            cc.strokeStyle = this.theme.SCOPE.RUNWAY_EXTENDED_CENTERLINE;
            cc.lineWidth = 1;

            cc.beginPath();
            cc.moveTo(0, 0);
            cc.lineTo(0, CanvasStageModel._translateKilometersToPixels(runwayModel.ils.loc_maxDist));
            cc.stroke();
        }

        cc.restore();
    }

    /**
     * Draw labels for all runways, but NOT the runways themselves (see _drawRunways())
     *
     * POSITIONING: Before calling this method, translate to the AIRPORT CENTER
     *
     * @for CanvasController
     * @method _drawRunwayLabel
     * @param cc {HTMLCanvasContext}
     * @param runway {RunwayModel}
     * @returns undefined
     * @private
     */
    _drawRunwayLabel(cc, runwayModel) {
        const length2 = round(CanvasStageModel._translateKilometersToPixels(runwayModel.length / 2)) + 0.5;
        const { angle, relativePosition } = runwayModel;
        const runwayCanvasPosition = CanvasStageModel.calculateRoundedCanvasPositionFromRelativePosition(relativePosition);
        const textHeight = 14;

        cc.save();
        cc.textAlign = 'center';
        cc.textBaseline = 'middle';
        cc.translate(...runwayCanvasPosition);
        cc.rotate(angle);
        cc.translate(0, length2 + textHeight);
        cc.rotate(-angle);
        cc.fillText(runwayModel.name, 0, 0);
        cc.restore();
    }

    /**
     * Draw all runways, but NOT their labels (see _drawRunwayLabels())
     *
     * POSITIONING: Before calling this method, ensure NO TRANSLATION has occurred
     *
     * @for CanvasController
     * @method _drawRunways
     * @param cc {HTMLCanvasContext}
     * @returns undefined
     * @private
     */
    _drawRunways(cc) {
        if (!this._shouldDrawFixLabels) {
            return;
        }

        cc.save();
        this._ccTranslateFromCanvasOriginToAirportCenter(cc);
        cc.font = '11px monoOne, monospace';
        cc.strokeStyle = this.theme.SCOPE.RUNWAY;
        cc.fillStyle = this.theme.SCOPE.RUNWAY;
        cc.lineWidth = 4;

        const airportModel = AirportController.airport_get();

        // TODO: we should try to consolidate this so we aren't looping over the runway collection multiple times
        // Extended Centerlines
        for (let i = 0; i < airportModel.runways.length; i++) {
            this._drawSingleRunway(cc, airportModel.runways[i][0], true);
            this._drawSingleRunway(cc, airportModel.runways[i][1], true);
        }

        // Runways
        for (let i = 0; i < airportModel.runways.length; i++) {
            this._drawSingleRunway(cc, airportModel.runways[i][0], false);
        }

        cc.restore();
    }

    /**
     * Draw runway label text
     *
     * POSITIONING: Before calling this method, ensure NO TRANSLATION has occurred
     *
     * @for CanvasController
     * @method _drawRunwayLabels
     * @param cc {HTMLCanvasContext}
     * @returns undefined
     * @private
     */
    _drawRunwayLabels(cc) {
        if (!this._shouldDrawFixLabels) {
            return;
        }

        const airportModel = AirportController.airport_get();

        cc.save();
        this._ccTranslateFromCanvasOriginToAirportCenter(cc);
        cc.fillStyle = this.theme.SCOPE.RUNWAY_LABELS;

        for (let i = 0; i < airportModel.runways.length; i++) {
            this._drawRunwayLabel(cc, airportModel.runways[i][0]);
            this._drawRunwayLabel(cc, airportModel.runways[i][1]);
        }

        cc.restore();
    }

    /**
     * Draw scale in the top right corner of the scope
     *
     * POSITIONING: Before calling this method, ensure NO TRANSLATION has occurred
     *
     * @for CanvasController
     * @method _drawCurrentScale
     * @param cc {HTMLCanvasContext}
     * @returns undefined
     * @private
     */
    _drawCurrentScale(cc) {
        cc.save();

        const offsetX = 35;
        const offsetY = 10;
        const height = 5;
        const lengthNm = round(nm(1 / CanvasStageModel.scale * 50));
        const lengthKm = km(lengthNm);
        const px_length = round(CanvasStageModel._translateKilometersToPixels(lengthKm));
        const widthLessOffset = CanvasStageModel.width - offsetX;

        cc.font = '10px monoOne, monospace';
        cc.fillStyle = this.theme.SCOPE.TOP_ROW_TEXT;
        cc.strokeStyle = this.theme.SCOPE.TOP_ROW_TEXT;
        cc.lineWidth = 1;
        cc.textAlign = 'center';
        cc.beginPath();
        cc.moveTo(widthLessOffset, offsetY);
        cc.lineTo(widthLessOffset, offsetY + height);
        cc.lineTo(widthLessOffset - px_length, offsetY + height);
        cc.lineTo(widthLessOffset - px_length, offsetY);
        cc.stroke();
        cc.fillText(
            `${lengthNm} nm`,
            widthLessOffset - px_length * 0.5,
            offsetY + height + 17
        );
        cc.restore();
    }

    /**
     * Draw the provided `FixModel`, including triangle marker AND text label
     *
     * POSITIONING: Before calling this method, translate to the AIRPORT CENTER
     *
     * @for CanvasController
     * @method _drawSingleFixAndLabel
     * @param cc {HTMLCanvasContext}
     * @param fixModel {FixModel}
     * @returns undefined
     * @private
     */
    _drawSingleFixAndLabel(cc, fixModel) {
        const fixCanvasPosition = CanvasStageModel.calculateRoundedCanvasPositionFromRelativePosition(fixModel.relativePosition);

        cc.save();
        cc.translate(...fixCanvasPosition);
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
        cc.fillText(fixModel.name, 0, 6);
        cc.restore();
    }

    /**
     * Draw fixes and labels
     *
     * POSITIONING: Before calling this method, ensure NO TRANSLATION has occurred
     *
     * @for CanvasController
     * @method _drawAirportFixesAndLabels
     * @param cc {HTMLCanvasContext}
     * @returns undefined
     * @private
     */
    _drawAirportFixesAndLabels(cc) {
        if (!this._shouldDrawFixLabels) {
            return;
        }

        cc.save();
        this._ccTranslateFromCanvasOriginToAirportCenter(cc);

        cc.lineJoin = 'round';
        cc.font = BASE_CANVAS_FONT;

        for (let i = 0; i < NavigationLibrary.realFixes.length; i++) {
            const fixModel = NavigationLibrary.realFixes[i];

            this._drawSingleFixAndLabel(cc, fixModel);
        }

        cc.restore();
    }

    // TODO: break this method up into smaller chunks
    /**
     * Draw SID lines and labels
     *
     * POSITIONING: Before calling this method, ensure NO TRANSLATION has occurred
     *
     * @for CanvasController
     * @method _drawSids
     * @param cc {HTMLCanvasContext}
     * @returns undefined
     * @private
     */
    _drawSids(cc) {
        if (!this._shouldDrawSidMap) {
            return;
        }

        const textAtFix = [];
        const sidLines = NavigationLibrary.getProcedureLines(PROCEDURE_TYPE.SID);

        cc.save();
        this._ccTranslateFromCanvasOriginToAirportCenter(cc);
        cc.strokeStyle = this.theme.SCOPE.SID;
        cc.fillStyle = this.theme.SCOPE.SID;
        cc.setLineDash([1, 10]);
        cc.font = 'italic 14px monoOne, monospace';

        for (let i = 0; i < sidLines.length; i++) {
            const sid = sidLines[i];
            let shouldDrawProcedureName = true;

            for (let j = 0; j < sid.lines.length; j++) {
                this._drawPolyLineFromRelativePositions(cc, sid.lines[j]);
            }

            for (let j = 0; j < sid.exits.length; j++) {
                const exitName = sid.exits[j];

                if (!(exitName in textAtFix)) {
                    textAtFix[exitName] = [];
                }

                textAtFix[exitName].push(`${sid.identifier}.${exitName}`);

                shouldDrawProcedureName = false;
            }

            if (shouldDrawProcedureName) {
                const { lastFixName } = sid;

                if (!(lastFixName in textAtFix)) {
                    textAtFix[lastFixName] = [];
                }

                textAtFix[lastFixName].push(sid.identifier);
            }
        }

        // draw labels
        for (const fix in textAtFix) {
            const textItemsToPrint = textAtFix[fix];
            const fixPosition = NavigationLibrary.getFixRelativePosition(fix);

            this._drawText(cc, fixPosition, textItemsToPrint);
        }

        cc.restore();
    }

    /**
     * Draw STAR lines and labels
     *
     * POSITIONING: Before calling this method, ensure NO TRANSLATION has occurred
     *
     * @for CanvasController
     * @method _drawStars
     * @param cc {HTMLCanvasContext}
     * @returns undefined
     * @private
     */
    _drawStars(cc) {
        if (!this._shouldDrawStarMap) {
            return;
        }

        const starLines = NavigationLibrary.getProcedureLines(PROCEDURE_TYPE.STAR);
        const textAtFix = [];

        cc.save();
        this._ccTranslateFromCanvasOriginToAirportCenter(cc);
        cc.strokeStyle = this.theme.SCOPE.STAR;
        cc.fillStyle = this.theme.SCOPE.STAR;
        cc.setLineDash([1, 10]);
        cc.font = 'italic 14px monoOne, monospace';
        cc.textAlign = 'right';

        for (let i = 0; i < starLines.length; i++) {
            const star = starLines[i];

            for (let j = 0; j < star.lines.length; j++) {
                this._drawPolyLineFromRelativePositions(cc, star.lines[j]);
            }

            const { firstFixName } = star;

            if (!(firstFixName in textAtFix)) {
                textAtFix[firstFixName] = [];
            }

            textAtFix[firstFixName].push(star.identifier);
        }

        // draw labels
        for (const fix in textAtFix) {
            const textItemsToPrint = textAtFix[fix];
            const fixPosition = NavigationLibrary.getFixRelativePosition(fix);

            this._drawText(cc, fixPosition, textItemsToPrint);
        }

        cc.restore();
    }

    /**
     * Draw the provided polyline (includes 2 or more points)
     *
     * POSITIONING: Before calling this method, translate to the AIRPORT CENTER
     *
     * @for CanvasController
     * @method _drawPolyLineFromRelativePositions
     * @param cc {HTMLCanvasContext}
     * @param relativePositions {array<array<number, number>>} position coordinates (in km)
     * @returns undefined
     * @private
     */
    _drawPolyLineFromRelativePositions(cc, relativePositions) {
        if (relativePositions.length < 2) {
            return;
        }

        const lineStartPosition = CanvasStageModel.calculateRoundedCanvasPositionFromRelativePosition(relativePositions[0]);

        cc.beginPath();
        cc.moveTo(...lineStartPosition);

        for (let k = 0; k < relativePositions.length; k++) {
            const relativePosition = relativePositions[k];
            const canvasPosition = CanvasStageModel.calculateRoundedCanvasPositionFromRelativePosition(relativePosition);

            cc.lineTo(...canvasPosition);
        }

        cc.stroke();
    }

    /**
     * Draw the provided text at the specified relative position
     *
     * POSITIONING: Before calling this method, translate to the AIRPORT CENTER
     *
     * @for CanvasController
     * @method _drawText
     * @param cc {HTMLCanvasContext}
     * @param relativePosition {array<number, number>} offset coordinates from airport center (in km)
     * @param labels {array}
     * @param lineHeight {number} in pixels
     * @returns undefined
     * @private
     */
    _drawText(cc, relativePosition, labels, lineHeight = 15) {
        const canvasPosition = CanvasStageModel.calculateRoundedCanvasPositionFromRelativePosition(relativePosition);
        let dx = cc.textAlign === 'right' ? -10 : 10;

        if (cc.textAlign === 'center') {
            dx = 0;
        }

        for (let k = 0; k < labels.length; k++) {
            const textItem = labels[k];
            const drawCanvasPositionX = canvasPosition[0] + dx;
            const drawCanvasPositionY = canvasPosition[1] + (lineHeight * k);

            cc.fillText(textItem, drawCanvasPositionX, drawCanvasPositionY);
        }
    }

    /**
     * Draw a trailing indicator 2.5 NM (4.6km) behind landing aircraft to help with traffic spacing
     *
     * POSITIONING: Before calling this method, translate to the AIRPORT CENTER
     *
     * @for CanvasController
     * @method _drawSeparationIndicator
     * @param cc {HTMLCanvasContext}
     * @param aircraftModel {AircraftModel}
     * @returns undefined
     * @private
     */
    _drawSeparationIndicator(cc, aircraftModel) {
        if (!GameController.shouldUseTrailingSeparationIndicator(aircraftModel)) {
            return;
        }

        cc.save();

        const { fms, relativePosition } = aircraftModel;
        const oppositeOfRunwayHeading = fms.arrivalRunwayModel.oppositeAngle;
        const aircraftCanvasPosition = CanvasStageModel.calculateRoundedCanvasPositionFromRelativePosition(relativePosition);
        cc.strokeStyle = this.theme.RADAR_TARGET.TRAILING_SEPARATION_INDICATOR;
        cc.lineWidth = 3;

        cc.translate(...aircraftCanvasPosition);
        cc.rotate(oppositeOfRunwayHeading);
        cc.beginPath();

        const indicatorPaddingPx = 5;
        const indicatorKmInTrail = 5.556; // 5.556km = 3.0nm
        const pixelsInTrail = CanvasStageModel._translateKilometersToPixels(indicatorKmInTrail);

        cc.moveTo(-indicatorPaddingPx, -pixelsInTrail);
        cc.lineTo(indicatorPaddingPx, -pixelsInTrail);
        cc.stroke();

        cc.restore();
    }

    /**
     * Draws circle around aircraft that are in (or soon to be in) conflict with another aircraft
     *
     * POSITIONING: Before calling this method, translate to the AIRCRAFT POSITION
     *
     * These rings are drawn independently of user-set halos
     *
     * @for CanvasController
     * @method _drawAircraftConflictRings
     * @param cc {HTMLCanvasContext}
     * @param radarTargetModel {RadarTargetModel}
     * @returns undefined
     * @private
     */
    _drawAircraftConflictRings(cc, radarTargetModel) {
        const { aircraftModel } = radarTargetModel;
        const aircraftAlerts = aircraftModel.getAlerts();
        const radiusNm = 3;

        if (!aircraftAlerts[0]) {
            return;
        }

        let strokeStyle = this.theme.RADAR_TARGET.RING_CONFLICT;

        if (aircraftAlerts[1]) {
            strokeStyle = this.theme.RADAR_TARGET.RING_VIOLATION;
        }

        cc.strokeStyle = strokeStyle;

        cc.beginPath();
        cc.arc(0, 0, CanvasStageModel._translateKilometersToPixels(km(radiusNm)), 0, tau());
        cc.stroke();
    }

    /**
     * Draws circle around aircraft with radius as requested by the user
     *
     * POSITIONING: Before calling this method, translate to the AIRCRAFT POSITION
     *
     * @for CanvasController
     * @method _drawAircraftHalo
     * @param cc {HTMLCanvasContext}
     * @param radarTargetModel {RadarTargetModel}
     * @returns undefined
     * @private
     */
    _drawAircraftHalo(cc, radarTargetModel) {
        if (!radarTargetModel.hasHalo) {
            return;
        }

        const radiusNm = radarTargetModel.haloRadius;
        cc.strokeStyle = this.theme.RADAR_TARGET.HALO;

        cc.beginPath();
        cc.arc(0, 0, CanvasStageModel._translateKilometersToPixels(km(radiusNm)), 0, tau());
        cc.stroke();
    }

    /**
     * Draw the RADAR RETURN AND HISTORY DOTS ONLY of the specified radar target model
     *
     * POSITIONING: Before calling this method, translate to the AIRPORT CENTER
     *
     * @for CanvasController
     * @method _drawSingleRadarTarget
     * @param cc {HTMLCanvasContext}
     * @param radarTargetModel {RadarTargetModel}
     * @returns undefined
     * @private
     */
    _drawSingleRadarTarget(cc, radarTargetModel) {
        const { aircraftModel } = radarTargetModel;

        if (!aircraftModel.isVisible()) {
            return;
        }

        cc.save();

        // TODO: death to the `prop`!!!
        const match = prop.input.callsign.length > 0 && aircraftModel.matchCallsign(prop.input.callsign);
        let fillStyle = this.theme.RADAR_TARGET.HISTORY_DOT_OUTSIDE_RANGE;

        if (aircraftModel.isControllable) {
            fillStyle = this.theme.RADAR_TARGET.HISTORY_DOT_INSIDE_RANGE;
        }

        cc.fillStyle = fillStyle;

        const positionHistory = aircraftModel.relativePositionHistory;

        for (let i = 0; i < positionHistory.length; i++) {
            const position = aircraftModel.relativePositionHistory[i];
            const canvasPosition = CanvasStageModel.calculatePreciseCanvasPositionFromRelativePosition(position);

            cc.beginPath();
            cc.arc(
                ...canvasPosition,
                CanvasStageModel._translateKilometersToPixels(this.theme.RADAR_TARGET.HISTORY_DOT_RADIUS_KM),
                0,
                tau()
            );
            cc.closePath();
            cc.fill();
        }

        cc.restore();
        cc.save();

        if (positionHistory.length > this.theme.RADAR_TARGET.HISTORY_LENGTH) {
            // TODO: This slice is being reassigned to the aircraft, which doesn't really
            // make sense as a canvas controller job. This should be done elsewhere.
            aircraftModel.relativePositionHistory = positionHistory.slice(
                positionHistory.length - this.theme.RADAR_TARGET.HISTORY_LENGTH,
                positionHistory.length
            );
        }

        if (aircraftModel.isEstablishedOnCourse()) {
            this._drawSeparationIndicator(cc, aircraftModel);
        }

        // Draw the future path
        switch (GameController.game.option.getOptionByName('drawProjectedPaths')) {
            case 'always':
                this._drawAircraftFuturePath(cc, aircraftModel, match);

                break;
            case 'selected':
                if (match) {
                    this._drawAircraftFuturePath(cc, aircraftModel, match);
                }

                break;
            default:
                break;
        }

        const aircraftCanvasPosition = CanvasStageModel.calculatePreciseCanvasPositionFromRelativePosition(
            aircraftModel.relativePosition
        );

        cc.translate(...aircraftCanvasPosition);

        this._drawAircraftVectorLines(cc, aircraftModel);
        this._drawAircraftHalo(cc, radarTargetModel);
        this._drawAircraftConflictRings(cc, radarTargetModel);

        let radarTargetRadiusKm = this.theme.RADAR_TARGET.RADIUS_KM;

        // Draw bigger circle around radar target when the aircraftModel is selected
        if (match) {
            radarTargetRadiusKm = this.theme.RADAR_TARGET.RADIUS_SELECTED_KM;
        }

        // Draw the radar target (aka aircraft position dot)
        cc.fillStyle = this.theme.RADAR_TARGET.RADAR_TARGET;
        cc.beginPath();
        cc.arc(0, 0, CanvasStageModel._translateKilometersToPixels(radarTargetRadiusKm), 0, tau());
        cc.fill();

        cc.restore();
    }

    /**
     * Draw aircraft vector lines ("projected track lines" or "PTL")
     *
     * POSITIONING: Before calling this method, translate to the AIRCRAFT POSITION
     *
     * Note: These extend in front of aircraft a definable number of minutes
     *
     * @for CanvasController
     * @method _drawAircraftVectorLines
     * @param cc {HTMLCanvasContext}
     * @param aircraftModel {AircraftModel}
     * @private
     */
    _drawAircraftVectorLines(cc, aircraftModel) {
        if (aircraftModel.hit) {
            return;
        }

        cc.save();

        cc.fillStyle = this.theme.RADAR_TARGET.PROJECTED_TRACK_LINES;
        cc.strokeStyle = this.theme.RADAR_TARGET.PROJECTED_TRACK_LINES;

        const lineLengthInMinutes = this._scopeModel.ptlLength;
        const lineLengthInHours = lineLengthInMinutes * TIME.ONE_MINUTE_IN_HOURS;
        const lineLength_km = km(aircraftModel.groundSpeed * lineLengthInHours);
        const groundTrackVector = vectorize2dFromRadians(aircraftModel.groundTrack);
        const scaledGroundTrackVector = vscale(groundTrackVector, lineLength_km);
        const screenPositionOffsetX = CanvasStageModel._translateKilometersToPixels(scaledGroundTrackVector[0]);
        const screenPositionOffsetY = CanvasStageModel._translateKilometersToPixels(scaledGroundTrackVector[1]);

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
     * POSITIONING: Before calling this method, translate to the AIRPORT CENTER
     *
     * @for CanvasController
     * @method canvas_draw_future_track_fixes
     * @param cc {HTMLCanvasContext}
     * @param aircraft {AircraftModel}
     * @param future_track
     * @returns undefined
     */
    canvas_draw_future_track_fixes(/* cc, aircraft, future_track */) {
        // const waypointList = aircraft.fms.waypoints;

        // if (waypointList.length <= 1) {
        //     return;
        // }

        // const start = future_track.length - 1;
        // const [x, y] = CanvasStageModel.calculateRoundedCanvasPositionFromRelativePosition(future_track[start]);

        // cc.beginPath();
        // cc.moveTo(x, y);
        // cc.setLineDash([3, 10]);

        // for (let i = 0; i < waypointList.length; i++) {
        //     const [fx, fy] = CanvasStageModel.calculateRoundedCanvasPositionFromRelativePosition(
        //         waypointList[i].relativePosition
        //     );

        //     cc.lineTo(fx, fy);
        // }

        // cc.stroke();
    }

    /**
     * Run physics updates into the future, draw future track
     *
     * POSITIONING: Before calling this method, translate to the AIRPORT CENTER
     *
     * @for CanvasController
     * @method _drawAircraftFuturePath
     * @param cc {HTMLCanvasContext}
     * @param aircraftModel {AircraftModel}
     * @param selected {boolean}
     * @private
     */
    _drawAircraftFuturePath(cc, aircraftModel, selected) {
        if (aircraftModel.isTaxiing() || TimeKeeper.simulationRate !== 1) {
            return;
        }

        let was_locked = false;
        const future_track = [];
        const fms_twin = _cloneDeep(aircraftModel.fms);
        const twin = _cloneDeep(aircraftModel);

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

        // future track colors
        let strokeStyle = this.theme.RADAR_TARGET.PROJECTION_ARRIVAL_ALL;

        if (aircraftModel.category === FLIGHT_CATEGORY.DEPARTURE) {
            if (selected) {
                strokeStyle = this.theme.RADAR_TARGET.PROJECTION_DEPARTURE;
            } else {
                strokeStyle = this.theme.RADAR_TARGET.PROJECTION_DEPARTURE_ALL;
            }
        } else if (selected) {
            strokeStyle = this.theme.RADAR_TARGET.PROJECTION_ARRIVAL;
        }

        cc.strokeStyle = strokeStyle;
        cc.globalCompositeOperation = 'screen';
        cc.lineWidth = 2;
        cc.beginPath();

        for (let i = 0; i < future_track.length; i++) {
            const track = future_track[i];
            const ils_locked = track[2];
            const trackPosition = CanvasStageModel.calculatePreciseCanvasPositionFromRelativePosition(track);

            if (ils_locked && !was_locked) {
                cc.lineTo(trackPosition[0], trackPosition[1]);
                // end the current path, start a new path with lockedStroke
                cc.stroke();
                cc.strokeStyle = this.theme.RADAR_TARGET.PROJECTION_ESTABLISHED_ON_APPROACH;
                cc.lineWidth = 2;
                cc.beginPath();
                cc.moveTo(trackPosition[0], trackPosition[1]);

                was_locked = true;

                continue;
            }

            if (i === 0) {
                cc.moveTo(trackPosition[0], trackPosition[1]);
            } else {
                cc.lineTo(trackPosition[0], trackPosition[1]);
            }
        }

        cc.stroke();

        // TODO: following method not in use, leaving for posterity
        // this.canvas_draw_future_track_fixes(cc, twin, future_track);

        cc.restore();
    }

    /**
     * Draw the `MeasureTool` path and text labels
     *
     * POSITIONING: Before calling this method, ensure NO TRANSLATION has occurred
     *
     * @for CanvasController
     * @method _drawMeasureTool
     * @param cc {HTMLCanvasContext}
     * @returns undefined
     * @private
     */
    _drawMeasureTool(cc) {
        if (!MeasureTool.hasPaths) {
            return;
        }

        const pathInfoList = MeasureTool.buildPathInfo();

        cc.save();
        this._ccTranslateFromCanvasOriginToAirportCenter(cc);

        pathInfoList.forEach((pathInfo) => {
            this._drawMeasureToolPath(cc, pathInfo);
            this._drawMeasureToolLabels(cc, pathInfo);
        });

        cc.restore();
    }

    /**
     * Draw the `MeasureTool` text labels
     *
     * POSITIONING: Before calling this method, translate to the AIRPORT CENTER
     *
     * @for CanvasController
     * @method _drawMeasureToolLabels
     * @param cc {HTMLCanvasContext}
     * @param pathInfo {object} as returned by `MeasureTools.getPointsAndLabels()`
     * @returns undefined
     * @private
     */
    _drawMeasureToolLabels(cc, pathInfo) {
        let leg = pathInfo.firstLeg;
        const values = [];
        const labelPadding = 5;

        // This way the points are translated only once
        while (leg != null) {
            // Ignore empty labels
            if (leg.labels !== null && leg.labels.length !== 0) {
                const position = CanvasStageModel.calculatePreciseCanvasPositionFromRelativePosition(leg.midPoint);

                values.push({
                    x: position[0],
                    y: position[1],
                    labels: leg.labels
                });
            }

            leg = leg.next;
        }

        // Shortcut if there are no labels (line is too short)
        if (values.length === 0) {
            return;
        }

        cc.save();

        // Label backgrounds
        cc.fillStyle = this.theme.SCOPE.MEASURE_BACKGROUND;
        cc.font = this.theme.DATA_BLOCK.TEXT_FONT;

        values.forEach((item) => {
            const { x, y, labels } = item;
            const height = (2 * labelPadding) + (12 * labels.length);
            const maxLabelWidth = labels.reduce((lastWidth, label) => {
                const newWidth = cc.measureText(label).width;

                return Math.max(lastWidth, newWidth);
            }, 0);
            const width = (2 * labelPadding) + maxLabelWidth;

            cc.fillRect(x, y, width, height);
        });

        // Label text
        cc.fillStyle = this.theme.SCOPE.MEASURE_TEXT;

        values.forEach((item) => {
            const { labels } = item;
            const x = item.x + labelPadding;
            const y = item.y + 15;

            labels.forEach((line, index) => {
                cc.fillText(line, x, y + (12 * index));
            });
        });

        cc.restore();
    }

    /**
     * Draw the `MeasureTool` path
     *
     * POSITIONING: Before calling this method, translate to the AIRPORT CENTER
     *
     * @for CanvasController
     * @method _drawMeasureToolPath
     * @param cc {HTMLCanvasContext}
     * @param pathInfo {object} as returned by `MeasureTools.getPointsAndLabels()`
     * @returns undefined
     * @private
     */
    _drawMeasureToolPath(cc, pathInfo) {
        const { initialTurn } = pathInfo;
        let leg = pathInfo.firstLeg;
        const firstPoint = CanvasStageModel.calculatePreciseCanvasPositionFromRelativePosition(leg.startPoint);
        const firstMidPoint = CanvasStageModel.calculatePreciseCanvasPositionFromRelativePosition(leg.midPoint);

        cc.save();

        cc.strokeStyle = this.theme.SCOPE.MEASURE_LINE;

        cc.beginPath();

        // If available, this draws the arc the a/c will fly to intercept the course to the
        // first fix
        if (initialTurn !== null) {
            const {
                isRHT, center, entryAngle, exitAngle, turnRadius
            } = initialTurn;
            const position = CanvasStageModel.calculatePreciseCanvasPositionFromRelativePosition(center);
            const radius = CanvasStageModel._translateKilometersToPixels(turnRadius);

            // The angles calculated in the `MeasureTool` are magnetic, and have to be shifted CCW 90°
            cc.arc(position[0], position[1], radius, entryAngle - Math.PI / 2, exitAngle - Math.PI / 2, !isRHT);
        }

        // Draw up to the first midpoint
        cc.moveTo(firstPoint[0], firstPoint[1]);
        cc.lineTo(firstMidPoint[0], firstMidPoint[1]);

        // Iterate through the linked list
        while (leg != null) {
            const { next } = leg;
            const radius = CanvasStageModel._translateKilometersToPixels(leg.radius);
            const position1 = CanvasStageModel.calculatePreciseCanvasPositionFromRelativePosition(leg.endPoint);

            if (next === null) {
                // This is the last leg, so simply draw to the end point
                cc.lineTo(position1[0], position1[1]);
            } else {
                // Draw an arc'd line to the next midpoint
                const position2 = CanvasStageModel.calculatePreciseCanvasPositionFromRelativePosition(next.midPoint);

                cc.arcTo(position1[0], position1[1], position2[0], position2[1], radius);
                cc.lineTo(position2[0], position2[1]);
            }

            leg = next;
        }

        cc.stroke();

        cc.restore();
    }

    /**
     * Draw the RADAR RETURN AND HISTORY DOTS ONLY of all radar target models
     *
     * POSITIONING: Before calling this method, ensure NO TRANSLATION has occurred
     *
     * @for CanvasController
     * @method _drawRadarTargetList
     * @param cc {HTMLCanvasContext}
     * @returns undefined
     * @private
     */

    _drawRadarTargetList(cc) {
        cc.font = BASE_CANVAS_FONT;
        cc.save();
        this._ccTranslateFromCanvasOriginToAirportCenter(cc);

        const radarTargetModels = this._scopeModel.radarTargetCollection.items;

        for (let i = 0; i < radarTargetModels.length; i++) {
            this._drawSingleRadarTarget(cc, radarTargetModels[i]);
        }

        cc.restore();
    }

    /**
     * Draw an aircraft's data block
     * (box that contains callsign, altitude, speed)
     *
     * POSITIONING: Before calling this method, translate to the AIRPORT CENTER
     *
     * @for CanvasController
     * @method _drawSingleAircraftDataBlock
     * @param cc {HTMLCanvasContext}
     * @param radarTargetModel {RadarTargetModel}
     * @returns undefined
     * @private
     */
    _drawSingleAircraftDataBlock(cc, radarTargetModel) {
        const { aircraftModel } = radarTargetModel;

        if (!aircraftModel.isVisible() || aircraftModel.hit) {
            return;
        }

        cc.save();

        const paddingLR = 5;
        let match = false;

        // Callsign Matching
        if (prop.input.callsign.length > 0 && aircraftModel.matchCallsign(prop.input.callsign)) {
            match = true;
        }

        let white = aircraftModel.isControllable ?
            this.theme.DATA_BLOCK.TEXT_IN_RANGE :
            this.theme.DATA_BLOCK.TEXT_OUT_OF_RANGE;

        if (match) {
            white = this.theme.DATA_BLOCK.TEXT_SELECTED;
        }

        cc.textBaseline = 'middle';

        let { dataBlockLeaderDirection } = radarTargetModel;

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
        const radarTargetPosition = CanvasStageModel.calculateRoundedCanvasPositionFromRelativePosition(
            aircraftModel.relativePosition
        );
        const leaderLength = this._calculateLeaderLength(radarTargetModel.dataBlockLeaderLength);
        const leaderStart = [
            radarTargetPosition[0] + (offsetComponent[0] * this.theme.DATA_BLOCK.LEADER_PADDING_FROM_TARGET_PX),
            radarTargetPosition[1] + (offsetComponent[1] * this.theme.DATA_BLOCK.LEADER_PADDING_FROM_TARGET_PX)
        ];
        const leaderEnd = [
            radarTargetPosition[0] + offsetComponent[0] * (leaderLength - this.theme.DATA_BLOCK.LEADER_PADDING_FROM_BLOCK_PX),
            radarTargetPosition[1] + offsetComponent[1] * (leaderLength - this.theme.DATA_BLOCK.LEADER_PADDING_FROM_BLOCK_PX)
        ];
        const leaderIntersectionWithBlock = [
            radarTargetPosition[0] + offsetComponent[0] * leaderLength,
            radarTargetPosition[1] + offsetComponent[1] * leaderLength
        ];

        cc.beginPath();
        cc.moveTo(...leaderStart);
        cc.lineTo(...leaderEnd);
        cc.strokeStyle = white;
        cc.stroke();

        const dataBlockCenterCanvasPosition = radarTargetModel.calculateDataBlockCenter(leaderIntersectionWithBlock);

        cc.translate(...dataBlockCenterCanvasPosition);

        this._drawLegacyDatablock(cc, aircraftModel);

        // height of TOTAL vertical space between the rows (0 for touching)
        const gap = 3;
        const lineheight = 4.5; // height of text row (used for spacing basis)
        const row1text = radarTargetModel.buildDataBlockRowOne();
        let row2text = radarTargetModel.buildDataBlockRowTwoPrimaryInfo();

        if (this.shouldShowSecondaryDataBlock()) {
            row2text = radarTargetModel.buildDataBlockRowTwoSecondaryInfo();
        }

        const fillStyle = aircraftModel.isControllable ?
            this.theme.DATA_BLOCK.TEXT_IN_RANGE :
            this.theme.DATA_BLOCK.TEXT_OUT_OF_RANGE;

        cc.fillStyle = fillStyle;

        // Draw full datablock text
        cc.font = this.theme.DATA_BLOCK.TEXT_FONT;
        cc.textAlign = 'left';
        cc.fillText(row1text, -this.theme.DATA_BLOCK.HALF_WIDTH + paddingLR, -gap / 2 - lineheight);
        cc.fillText(row2text, -this.theme.DATA_BLOCK.HALF_WIDTH + paddingLR, gap / 2 + lineheight);
        cc.font = BASE_CANVAS_FONT;

        cc.restore();
    }

    /**
     * Draw the legacy dataBlock
     *
     * POSITIONING: Before calling this method, translate to the AIRCRAFT'S DATA BLOCK CENTER
     *
     * @for CanvasController
     * @method
     * @param {HTMLCanvasContext} cc
     * @param {AircraftModel} aircraftModel
     * @returns undefined
     * @private
     */
    _drawLegacyDatablock(cc, aircraftModel) {
        if (!this.theme.DATA_BLOCK.HAS_FILL) {
            return;
        }

        // TODO: logic and math here should be done once and not every frame. this could be moved to the `RadarTargetModel`
        // width of datablock (scales to fit callsign)
        const width = this.theme.DATA_BLOCK.WIDTH; // clamp(1, 6 * callsign.length) + (paddingLR * 2);
        const halfWidth = this.theme.DATA_BLOCK.HALF_WIDTH; // width / 2;
        // height of datablock
        const height = this.theme.DATA_BLOCK.HEIGHT; // 31;
        const halfHeight = this.theme.DATA_BLOCK.HALF_HEIGHT; // height / 2;
        // width of colored bar
        const barWidth = 3;
        const barHalfWidth = barWidth / 2;
        // const ILS_enabled = aircraftModel.pilot.hasApproachClearance;
        const lock_size = height / 3;
        const lock_offset = lock_size / 8;
        const point1 = lock_size - barHalfWidth;
        const a = point1 - lock_offset;
        const b = barHalfWidth;
        const clipping_mask_angle = Math.atan(b / a);
        // describes how far around to arc the arms of the ils lock case
        const pi_slice = Math.PI / 24;
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

        if (aircraftModel.isControllable) {
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

        // Draw datablock shapes
        if (!aircraftModel.pilot.hasApproachClearance && this.theme.DATA_BLOCK.HAS_FILL) {
            // data block box background fill
            cc.fillStyle = green;
            cc.fillRect(-halfWidth, -halfHeight, width, height);

            // Draw colored bar
            cc.fillStyle = (aircraftModel.category === FLIGHT_CATEGORY.DEPARTURE) ? blue : red;
            cc.fillRect(-halfWidth - barWidth, -halfHeight, barWidth, height);

            return;
        }

        // Box with ILS Lock Indicator
        cc.save();

        // Draw green part of box (excludes space where ILS Clearance Indicator juts in)
        cc.fillStyle = green;
        cc.beginPath();
        cc.moveTo(-halfWidth, halfHeight); // bottom-left corner
        cc.lineTo(halfWidth, halfHeight); // bottom-right corner
        cc.lineTo(halfWidth, -halfHeight); // top-right corner
        cc.lineTo(-halfWidth, -halfHeight); // top-left corner
        cc.lineTo(-halfWidth, -point1); // begin side cutout
        cc.arc(-halfWidth - barHalfWidth,
            -lock_offset, lock_size / 2 + barHalfWidth,
            clipping_mask_angle - Math.PI / 2,
            0);
        cc.lineTo(-halfWidth + lock_size / 2, lock_offset);
        cc.arc(-halfWidth - barHalfWidth,
            lock_offset,
            lock_size / 2 + barHalfWidth,
            0,
            Math.PI / 2 - clipping_mask_angle);
        cc.closePath();
        cc.fill();

        // Draw ILS Clearance Indicator
        cc.translate(-halfWidth - barHalfWidth, 0);
        cc.lineWidth = barWidth;
        cc.strokeStyle = red;
        cc.beginPath(); // top arc start
        cc.arc(0, -lock_offset, lock_size / 2, -pi_slice, Math.PI + pi_slice, true);
        cc.moveTo(0, -lock_size / 2);
        cc.lineTo(0, -halfHeight);
        cc.stroke(); // top arc end
        cc.beginPath(); // bottom arc start
        cc.arc(0, lock_offset, lock_size / 2, pi_slice, Math.PI - pi_slice);
        cc.moveTo(0, lock_size - barWidth);
        cc.lineTo(0, halfHeight);
        cc.stroke(); // bottom arc end

        if (aircraftModel.isEstablishedOnCourse()) {
            // Localizer Capture Indicator
            cc.fillStyle = white;
            cc.beginPath();
            cc.arc(0, 0, lock_size / 5, 0, Math.PI * 2);
            cc.fill(); // Draw Localizer Capture Dot
        }

        cc.translate(halfWidth + barHalfWidth, 0);
        // unclear how this works...
        cc.beginPath(); // if removed, white lines appear on top of bottom half of lock case
        cc.stroke(); // if removed, white lines appear on top of bottom half of lock case

        cc.restore();
    }

    /**
     * Draw data blocks for each aircraft
     *
     * POSITIONING: Before calling this method, ensure NO TRANSLATION has occurred
     *
     * @for CanvasController
     * @method _drawAircraftDataBlocks
     * @param cc {HTMLCanvasContext}
     * @returns undefined
     * @private
     */
    _drawAircraftDataBlocks(cc) {
        const radarTargetModels = this._scopeModel.radarTargetCollection.items;

        cc.save();
        this._ccTranslateFromCanvasOriginToAirportCenter(cc);

        for (let i = 0; i < radarTargetModels.length; i++) {
            this._drawSingleAircraftDataBlock(cc, radarTargetModels[i]);
        }

        cc.restore();
    }

    /**
     * Draw and fill all airspace boundaries, and draw range rings clipped to that area
     *
     * POSITIONING: Before calling this method, ensure NO TRANSLATION has occurred
     *
     * @for CanvasController
     * @method _drawAirspaceAndRangeRings
     * @param cc {HTMLCanvasContext}
     * @returns undefined
     * @private
     */
    _drawAirspaceAndRangeRings(cc) {
        cc.save();

        // translate to airport center
        this._ccTranslateFromCanvasOriginToAirportCenter(cc);
        this._drawAirspaceBorder(cc); // includes the .clip() used by ._drawRangeRings()
        this._drawRangeRings(cc);

        cc.restore();
    }

    // TODO: To round, or not to round?
    /**
     * From the canvas origin, cc.translate() to the airport center, adjusting for user panning
     *
     * @for CanvasController
     * @method _ccTranslateFromCanvasOriginToAirportCenter
     * @param cc {HTMLCanvasContext}
     * @returns undefined
     * @private
     */
    _ccTranslateFromCanvasOriginToAirportCenter(cc) {
        cc.translate(
            round(CanvasStageModel.halfWidth),
            round(CanvasStageModel.halfHeight)
        );
    }

    // TODO: To round, or not to round?
    /**
     * From the airport center, cc.translate() to the canvas origin, adjusting for user panning
     *
     * @for CanvasController
     * @method _ccTranslateFromAirportCenterToCanvasOrigin
     * @param cc {HTMLCanvasContext}
     * @returns undefined
     * @private
     */
    _ccTranslateFromAirportCenterToCanvasOrigin(cc) {
        cc.translate(
            -round(CanvasStageModel.halfWidth),
            -round(CanvasStageModel.halfHeight)
        );
    }

    /**
     * Draw range rings
     *
     * POSITIONING: Before calling this method, translate to the AIRPORT CENTER
     *
     * @for CanvasController
     * @method _drawRangeRings
     * @param cc {HTMLCanvasContext}
     * @returns undefined
     * @private
     */
    _drawRangeRings(cc) {
        const airportModel = AirportController.airport_get();
        const centerCanvasPosition = CanvasStageModel.calculatePreciseCanvasPositionFromRelativePosition(
            airportModel.rangeRings.center.relativePosition
        );
        const ringRadiusKm = this._calculateRangeRingRadiusKm(airportModel);

        if (ringRadiusKm === 0) { // prevent infinite loop
            return;
        }

        cc.save();

        cc.linewidth = 1;
        cc.strokeStyle = this.theme.SCOPE.RANGE_RING_COLOR;

        // Fill up airportModel's ctr_radius with rings of the specified radius
        for (let i = 1; i * ringRadiusKm < airportModel.ctr_radius * 3; i++) {
            cc.beginPath();
            cc.arc(...centerCanvasPosition, ringRadiusKm * CanvasStageModel.scale * i, 0, tau());
            cc.stroke();
        }

        cc.restore();
    }

    /**
     * Draw polygonal airspace border
     *
     * POSITIONING: Before calling this method, translate to the AIRPORT CENTER
     *
     * @for CanvasController
     * @method _drawAirspaceBorder
     * @param cc {HTMLCanvasContext}
     * @returns undefined
     * @private
     */
    _drawAirspaceBorder(cc) {
        cc.save();

        const airport = AirportController.airport_get();
        cc.strokeStyle = this.theme.SCOPE.AIRSPACE_PERIMETER;
        cc.fillStyle = this.theme.SCOPE.AIRSPACE_FILL;

        for (let i = 0; i < airport.airspace.length; i++) {
            const airspace = airport.airspace[i];

            this._drawRelativePoly(cc, airspace.relativePoly, true);
        }

        // this only includes the last polygon... and therefore does not support multiple
        // airspace shelves, which are now supported elsewhere in the app. Removing for now.
        // cc.clip();

        cc.restore();
    }

    /**
     * Draw individual airspace shelves, each labeled by index and altitude(s)
     *
     * POSITIONING: Before calling this method, ensure NO TRANSLATION has occurred
     *
     * @for CanvasController
     * @method _drawAirspaceShelvesAndLabels
     * @param cc {HTMLCanvasContext}
     * @returns undefined
     * @private
     */
    _drawAirspaceShelvesAndLabels(cc) {
        if (!this._shouldDrawAirspace) {
            return;
        }

        cc.save();

        const airport = AirportController.airport_get();
        cc.strokeStyle = 'rgba(224, 128, 128, 1.0)';
        cc.fillStyle = 'rgba(224, 128, 128, 1.0)';
        cc.font = '12px monoOne, monospace';
        cc.textAlign = 'center';
        cc.textBaseline = 'middle';

        for (let i = 0; i < airport.airspace.length; i++) {
            const airspace = airport.airspace[i];

            cc.save(); // to allow reset of translation
            // required positioning to use _drawPoly
            this._ccTranslateFromCanvasOriginToAirportCenter(cc);
            // draw lines
            this._drawRelativePoly(cc, airspace.relativePoly, false);

            const bottomFlightLevel = leftPad(Math.floor(airspace.floor / 100), 3);
            const topFlightLevel = leftPad(Math.ceil(airspace.ceiling / 100), 3);
            const content = `${bottomFlightLevel}-${topFlightLevel} (#${i})`;

            cc.restore(); // reset from translation used for poly above
            cc.save();
            // required positioning to use _drawText
            this._ccTranslateFromCanvasOriginToAirportCenter(cc);

            // draw labels
            for (const labelRelativePosition of airspace.labelRelativePositions) {
                this._drawText(cc, labelRelativePosition, [content]);
            }

            cc.restore();
        }

        cc.restore();
    }

    /**
     * Calculates the range ring radius
     *
     * Returns radius of 0 if rings should not be drawn
     *
     * @for CanvasController
     * @method _calculateRangeRingRadiusKm
     * @param airportModel {AirportModel}
     * @returns {number} radius to use for range rings, in km
     * @private
     */
    _calculateRangeRingRadiusKm(airportModel) {
        const userValue = GameController.getGameOption(GAME_OPTION_NAMES.RANGE_RINGS);
        const useDefault = userValue === 'default';
        const defaultRangeRings = airportModel.rangeRings;

        if (userValue === 'off' || (useDefault && defaultRangeRings.enabled === false)) {
            return 0;
        }

        if (!useDefault) {
            return km(parseInt(userValue, DECIMAL_RADIX));
        }

        return km(defaultRangeRings.radius_nm);
    }

    /**
     * Draw the provided polygon to the specified canvas
     *
     * POSITIONING: Before calling this method, translate to the AIRPORT CENTER
     *
     * This method does not itself provide any specific color/width/etc properties. These must be
     * set prior to calling this method.
     *
     * @for CanvasController
     * @method _drawPoly
     * @param cc {HTMLCanvasContext}
     * @param relativePoly {array<array<number, number>>} an array of relative positions to draw as a polygon
     * @param fill {boolean} whether to fill the polygon
     * @returns undefined
     * @private
     */
    _drawRelativePoly(cc, relativePoly, fill = true) {
        cc.beginPath();

        for (let i = 0; i < relativePoly.length; i++) {
            const pointRelativePos = relativePoly[i];
            const pointCanvasPos = CanvasStageModel.calculateRoundedCanvasPositionFromRelativePosition(pointRelativePos);

            cc.lineTo(...pointCanvasPos);
        }

        cc.closePath();
        cc.stroke();

        if (fill) {
            cc.fill();
        }
    }

    /**
     * Draw terrain contours for a SPECIFIC elevation
     *
     * POSITIONING: Before calling this method, translate to the AIRPORT CENTER
     *
     * @for CanvasController
     * @method _drawTerrainAtElevation
     * @param cc {HTMLCanvasContext}
     * @param terrainLevel {object}
     * @param elevation {number} elevation, in ft
     * @returns undefined
     * @private
     */
    _drawTerrainAtElevation(cc, terrainLevel, elevation) {
        // Here we use HSL colors instead of RGB to enable easier bulk adjustments
        // to saturation/lightness of multiple elevation levels without the need
        // to use web-based color tools
        const color = `hsla(${this.theme.TERRAIN.COLOR[elevation]}`;

        cc.save();

        cc.strokeStyle = `${color}, ${this.theme.TERRAIN.BORDER_OPACITY})`;
        cc.fillStyle = `${color}, ${this.theme.TERRAIN.FILL_OPACITY})`;

        for (let i = 0; i < terrainLevel.length; i++) {
            const terrainGroup = terrainLevel[i];

            cc.beginPath();

            for (let j = 0; j < terrainGroup.length; j++) {
                const terrainItem = terrainGroup[j];

                for (let k = 0; k < terrainItem.length; k++) {
                    const canvasPosition = CanvasStageModel.calculateRoundedCanvasPositionFromRelativePosition(terrainItem[k]);

                    if (k === 0) { // .moveTo() to start the line
                        cc.moveTo(...canvasPosition);
                        // cc.moveTo(
                        //     CanvasStageModel._translateKilometersToPixels(terrainItem[k][0]),
                        //     -CanvasStageModel._translateKilometersToPixels(terrainItem[k][1])
                        // );
                    } else { // .lineTo() to draw a line segment
                        cc.lineTo(...canvasPosition);
                        // cc.lineTo(
                        //     CanvasStageModel._translateKilometersToPixels(terrainItem[k][0]),
                        //     -CanvasStageModel._translateKilometersToPixels(terrainItem[k][1])
                        // );
                    }
                }

                cc.closePath();
            }

            cc.fill();
            cc.stroke();
        }

        cc.restore();
    }

    /**
     * Draw the terrain legend in the upper right hand corner of the scope view
     *
     * POSITIONING: Before calling this method, translate to the AIRPORT CENTER
     *
     * @for CanvasController
     * @method _drawTerrainElevationLegend
     * @param  cc  {HTMLCanvasContext}
     * @param max_elevation {number}
     * @returns undefined
     * @private
     */
    _drawTerrainElevationLegend(cc, max_elevation) {
        cc.save();
        cc.font = BASE_CANVAS_FONT;
        cc.lineWidth = 1;

        const offset = 10;
        const { width } = CanvasStageModel;
        const { height } = CanvasStageModel;
        const box_width = 30;
        const box_height = 5;

        for (let i = 0; i <= max_elevation; i += 1000) {
            cc.save();
            // translate coordinates for every block to not use these X & Y twice in rect and text
            // .5 in X and Y coordinates are used to make 1px rectangle fit exactly into 1 px
            // and not be blurred
            cc.translate(
                width / 2 - 170 - (max_elevation - i) / 1000 * (box_width + 1),
                -height / 2 + offset + 0.5
            );
            cc.beginPath();
            cc.rect(0, 0, box_width - 1, box_height);
            cc.closePath();

            // in the map, terrain of higher levels has fill of all the lower levels
            // so we need to fill it below exactly as in the map
            for (let j = 0; j <= i; j += 1000) {
                cc.fillStyle = `hsla(${this.theme.TERRAIN.COLOR[j]}, ${this.theme.TERRAIN.FILL_OPACITY})`;
                cc.fill(); // 'rgba(32, 64, 72, 1.0)'
            }

            cc.strokeStyle = `hsla(${this.theme.TERRAIN.COLOR[i]}, ${this.theme.TERRAIN.BORDER_OPACITY})`;
            cc.stroke();

            // write elevation signs only for the outer elevations
            const labeledAltitudes = [0, 5000, 10000, 15000, 20000, 25000, 30000].filter((alt) => {
                return alt < max_elevation - 1001;
            });

            if (i === max_elevation || labeledAltitudes.indexOf(i) !== INVALID_INDEX) {
                cc.fillStyle = this.theme.SCOPE.FIX_FILL;
                cc.textAlign = 'center';
                cc.textBaseline = 'top';
                const text = i === 0 ? 'MSL' : `${i}'`;

                cc.fillText(text, box_width / 2 + 0.5, offset + 2);
            }

            cc.restore();
        }

        cc.restore();
    }

    /**
     * Draw all terrain contours and legend
     *
     * POSITIONING: Before calling this method, ensure NO TRANSLATION has occurred
     *
     * @for CanvasController
     * @method _drawTerrain
     * @param cc {HTMLCanvasContext}
     * @returns undefined
     * @private
     */
    _drawTerrain(cc) {
        const airport = AirportController.airport_get();
        const airportTerrain = airport.terrain;
        let max_elevation = 0;

        if (!this._shouldDrawTerrain || Object.keys(airportTerrain).length === 0) {
            return;
        }

        cc.save();
        this._ccTranslateFromCanvasOriginToAirportCenter(cc);
        // Terrain key rectangles' outline stroke color
        // Also determines color of terrain outline drawn at '0ft'
        cc.strokeStyle = this.theme.SCOPE.FIX_FILL;
        // Somehow used to tint the terrain key rectangles' fill color
        // Also determines color of terrain fill at '0ft'
        cc.fillStyle = this.theme.SCOPE.FIX_FILL;
        cc.lineWidth = clamp(0.5, (CanvasStageModel.scale / 10), 2);
        cc.lineJoin = 'round';

        for (const elevation in airportTerrain) {
            // eslint-disable-next-line
            if (!airportTerrain.hasOwnProperty(elevation)) {
                continue;
            }

            const terrainLevel = airportTerrain[elevation];

            if (elevation < 0 && !this._hasSeenTerrainWarning) {
                console.warn(`${airport.icao}.geojson contains 'terrain' ` +
                    ' below sea level, which is not supported!');

                this._hasSeenTerrainWarning = true;

                continue;
            }

            max_elevation = Math.max(max_elevation, elevation);

            this._drawTerrainAtElevation(cc, terrainLevel, elevation);
        }

        if (max_elevation !== 0) {
            this._drawTerrainElevationLegend(cc, max_elevation);
        }

        cc.restore();
    }

    /**
     * Draw restricted airspace and labels
     *
     * POSITIONING: Before calling this method, ensure NO TRANSLATION has occurred
     *
     * @for CanvasController
     * @method _drawRestrictedAirspace
     * @param cc {HTMLCanvasContext}
     * @returns undefined
     * @private
     */
    _drawRestrictedAirspace(cc) {
        if (!this._shouldDrawRestrictedAreas) {
            return;
        }

        cc.save();
        this._ccTranslateFromCanvasOriginToAirportCenter(cc);

        cc.fillStyle = this.theme.SCOPE.RESTRICTED_AIRSPACE;
        cc.strokeStyle = this.theme.SCOPE.RESTRICTED_AIRSPACE;
        cc.lineWidth = Math.max(CanvasStageModel.scale / 3, 2);
        cc.lineJoin = 'round';
        cc.font = BASE_CANVAS_FONT;
        cc.textAlign = 'center';
        cc.textBaseline = 'top';

        const airportModel = AirportController.airport_get();

        for (let i = 0; i < airportModel.restricted_areas.length; i++) {
            const area = airportModel.restricted_areas[i];
            const areaRelativePositions = area.poly;

            this._drawRelativePoly(cc, areaRelativePositions, false);

            const height = area.height === Infinity ? 'UNL' : `FL ${Math.ceil(area.height / 1000) * 10}`;

            for (let j = 0; j < area.labelRelativePositions.length; j++) {
                const canvasPosition = CanvasStageModel.calculateRoundedCanvasPositionFromRelativePosition(
                    area.labelRelativePositions[j]
                );
                let linePaddingPx = 0;

                if (area.name) {
                    linePaddingPx = 6;
                    const nameLineCanvasPosition = [canvasPosition[0], canvasPosition[1] - linePaddingPx];

                    cc.fillText(area.name, ...nameLineCanvasPosition);
                }

                const altLineCanvasPosition = [canvasPosition[0], canvasPosition[1] + linePaddingPx];

                cc.fillText(height, ...altLineCanvasPosition);
            }
        }

        cc.restore();
    }

    /**
     * Draw all active video map(s)
     *
     * POSITIONING: Before calling this method, ensure NO TRANSLATION has occurred
     *
     * @for CanvasController
     * @method _drawVideoMap
     * @param cc {HTMLCanvasContext}
     * @returns undefined
     * @private
     */
    _drawVideoMap(cc) {
        const airportModel = AirportController.airport_get();

        // Don't bother with the canvas set up if the airport has no visible maps
        if (!airportModel.mapCollection.hasVisibleMaps || !this._shouldDrawVideoMap) {
            return;
        }

        cc.save();
        this._ccTranslateFromCanvasOriginToAirportCenter(cc);

        cc.strokeStyle = this.theme.SCOPE.VIDEO_MAP;
        cc.lineWidth = Math.max(1, CanvasStageModel.scale / 15);
        cc.lineJoin = 'round';
        cc.font = BASE_CANVAS_FONT;

        cc.beginPath();

        const lines = airportModel.mapCollection.getVisibleMapLines();

        lines.forEach((mapItem) => {
            const startRelativePos = [mapItem[0], mapItem[1]];
            const startCanvasPos = CanvasStageModel.calculateRoundedCanvasPositionFromRelativePosition(startRelativePos);
            const endRelativePos = [mapItem[2], mapItem[3]];
            const endCanvasPos = CanvasStageModel.calculateRoundedCanvasPositionFromRelativePosition(endRelativePos);

            cc.moveTo(...startCanvasPos);
            cc.lineTo(...endCanvasPos);
        });

        cc.stroke();
        cc.restore();
    }

    // TODO: this method should be removed or reworked.
    /**
     * Draw the compass around the edge of the scope view
     *
     * POSITIONING: Before calling this method, ensure NO TRANSLATION has occurred
     *
     * @for CanvasController
     * @method _drawSelectedAircraftCompass
     * @param cc {HTMLCanvasContext}
     * @returns undefined
     * @private
     */
    _drawSelectedAircraftCompass(cc) {
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

        const canvasOrigin = [0, 0];
        const canvasSize = [CanvasStageModel.width, CanvasStageModel.height];
        const aircraftPosition = this._toCanvasPosition(aircraft.relativePosition);

        cc.save();

        // generic styles of the compass marks
        cc.strokeStyle = this.theme.SCOPE.COMPASS_HASH;
        cc.fillStyle = this.theme.SCOPE.COMPASS_TEXT;
        cc.textAlign = 'center';
        cc.textBaseline = 'middle';

        // Compute the intersection point between a ray originating from the
        // aircraft at a given heading angle and the canvas boundaries, for
        // each heading angle between 0 and 360 (by 1 degree increment)
        for (let heading = 1; heading <= 360; heading++) {
            // compute the 2D unit vector representing the ray direction using the given
            // heading angle
            const rayUnitVector = vectorize2dFromDegrees(heading);

            // Use the opposite of the y component of the vector because of the vertical
            // axes of the reference frames being oriented in opposite directions
            rayUnitVector[1] = -rayUnitVector[1];

            // compute the intersection point between the ray and the canvas
            const intersection = positive_intersection_with_rect(
                aircraftPosition,
                rayUnitVector,
                canvasOrigin,
                canvasSize
            );

            if (!intersection) {
                continue;
            }

            // draw a mark and label at the intersection point
            // standard marks on all headings
            // minor marks on headings multiple of 5 degrees
            // major marks on headings multiple of 10 degrees
            let markLen = 8;

            if (heading % 5 === 0) {
                markLen = heading % 10 === 0 ? 16 : 12;
            }

            const markWeight = heading % 30 === 0 ? 2 : 1;

            // use the opposite of the length to draw toward the inside of the canvas
            const markVector = vscale(rayUnitVector, -markLen);
            const markStartPoint = intersection;
            const markEndPoint = vadd(markStartPoint, markVector);

            // draw the mark
            cc.lineWidth = markWeight;
            cc.beginPath();
            cc.moveTo(...markStartPoint);
            cc.lineTo(...markEndPoint);
            cc.stroke();

            // only draw label on major marks
            if (heading % 10 !== 0) {
                continue;
            }

            // set label font heavier every 3 major marks
            cc.font = heading % 30 === 0 ?
                'bold 10px monoOne, monospace' :
                BASE_CANVAS_FONT;

            const text = `${String(heading).padStart(3, '0')}`;
            const textWidth = cc.measureText(text).width;

            // draw the label
            cc.fillText(
                text,
                markEndPoint[0] - rayUnitVector[0] * (textWidth / 2 + 4),
                markEndPoint[1] - rayUnitVector[1] * 7
            );
        }

        cc.restore();
    }

    /**
     * Find a canvas context stored within `#_context`
     *
     * @for CanvasController
     * @method _getCanvasContextByName
     * @param name {string} name of the canvas you desire
     * @returns {HTMLCanvasContext}
     * @private
     */
    _getCanvasContextByName(name) {
        return this._context[name];
    }

    // TODO: this duplicates (but is slightly different than) the more widely-used method of
    // `CanvasStageModel.calculatePreciseCanvasPositionFromRelativePosition()`. What is the
    // difference, and can _toCanvasPosition() be removed in favor of using the former?
    /**
     * Transform a scope relative position to a canvas relative position.
     *
     * NOTE: DONT USE ME! I AM BEING DEPRECATED! INSTEAD USE:
     * `CanvasStageModel.calculatePreciseCanvasPositionFromRelativePosition()`
     *
     * POSITIONING: Before calling this method, ensure NO TRANSLATION has occurred
     *
     * Create a vector "vCanvasToScope" describing the position of the canvas
     * relative to the scope, and simply add it to the given position to get the
     * position relative to the canvas.
     *
     * The vertical axes are oriented in opposite direction in our source and
     * destination frames of reference (scope versus canvas), so the y component of
     * the given position need to be "reversed".
     *
     * The given position in expressed in kilometers so it needs to be
     * translated to pixels.
     *
     * @for CanvasController
     * @method _toCanvasPosition
     * @param positionFromScope {array<number>} relative position, in km offset from airport center
     * @returns {array<number>} canvas position, in pixels
     * @private
     */
    _toCanvasPosition(positionFromScope) {
        // positionFromScope is given in kilometers so it needs to be translated
        // to pixels first

        // use the opposite of the y component of the aircraft position because
        // the vertical axes are not oriented in the same direction in the
        // scope (aircraft) frame of reference versus the canvas frame of reference
        positionFromScope = [
            CanvasStageModel._translateKilometersToPixels(positionFromScope[0]),
            -CanvasStageModel._translateKilometersToPixels(positionFromScope[1])
        ];

        const scopePositionRelativeToView = [CanvasStageModel._panX, CanvasStageModel._panY];
        const viewPositionRelativeToCanvasOrigin = [CanvasStageModel.halfWidth, CanvasStageModel.halfHeight];
        const scopePositionRelativeToCanvasOrigin = vadd(viewPositionRelativeToCanvasOrigin, scopePositionRelativeToView);

        return vadd(scopePositionRelativeToCanvasOrigin, positionFromScope);
    }

    /**
     * Calculate the length of the leader line connecting the target to the data block
     *
     * @for CanvasController
     * @method _calculateLeaderLength
     * @param dataBlockLeaderLength {number} from RadarTargetModel#dataBlockLeaderLength
     * @return {number} length, in pixels
     * @private
     */
    _calculateLeaderLength(dataBlockLeaderLength) {
        return dataBlockLeaderLength *
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
     * @returns undefined
     * @private
     */
    _onMarkDirtyCanvas() {
        this._markShallowRender();
    }

    /**
     * Update local props as a result of the user panning the view
     *
     * This method will only be `trigger`ed by some other
     * class via the `EventBus`
     *
     * @for CanvasController
     * @method _onChangeViewportPan
     * @returns undefined
     * @private
     */
    _onChangeViewportPan() {
        this._markDeepRender();
    }

    /**
     * Update local props as a result of a change in the current zoom level
     *
     * This method will only be `trigger`ed by some other
     * class via the `EventBus`
     *
     * @for CanvasController
     * @method _onChangeViewportZoom
     * @returns undefined
     * @private
     */
    _onChangeViewportZoom() {
        this._markDeepRender();
    }

    /**
     * Toogle current value of `#_shouldDrawAirspace`
     *
     * This method will only be `trigger`ed by some other
     * class via the `EventBus`
     *
     * @for CanvasController
     * @method _onToggleAirspace
     * @returns undefined
     * @private
     */
    _onToggleAirspace() {
        this._shouldDrawAirspace = !this._shouldDrawAirspace;

        this._markDeepRender();
    }

    /**
     * Toogle current value of `#draw_labels`
     *
     * This method will only be `trigger`ed by some other
     * class via the `EventBus`
     *
     * @for CanvasController
     * @method _onToggleLabels
     * @returns undefined
     * @private
     */
    _onToggleLabels() {
        this._shouldDrawFixLabels = !this._shouldDrawFixLabels;

        this._markDeepRender();
    }

    /**
     * Toogle current value of `#draw_restricted`
     *
     * This method will only be `trigger`ed by some other
     * class via the `EventBus`
     *
     * @for CanvasController
     * @method _onToggleRestrictedAreas
     * @returns undefined
     * @private
     */
    _onToggleRestrictedAreas() {
        this._shouldDrawRestrictedAreas = !this._shouldDrawRestrictedAreas;

        this._markDeepRender();
    }

    /**
     * Toogle current value of `#draw_sids`
     *
     * This method will only be `trigger`ed by some other
     * class via the `EventBus`
     *
     * @for CanvasController
     * @method _onToggleSidMap
     * @returns undefined
     * @private
     */
    _onToggleSidMap() {
        this._shouldDrawSidMap = !this._shouldDrawSidMap;

        this._markDeepRender();
    }

    /**
     * Toogle display of STAR routes
     *
     * This method will only be `trigger`ed by some other
     * class via the `EventBus`
     *
     * @for CanvasController
     * @method _onToggleStarMap
     * @returns undefined
     * @private
     */
    _onToggleStarMap() {
        this._shouldDrawStarMap = !this._shouldDrawStarMap;

        this._markDeepRender();
    }

    /**
     * Toogle current value of `#draw_terrain`
     *
     * This method will only be `trigger`ed by some other
     * class via the `EventBus`
     *
     * @for CanvasController
     * @method _onToggleTerrain
     * @returns undefined
     * @private
     */
    _onToggleTerrain() {
        this._shouldDrawTerrain = !this._shouldDrawTerrain;

        this._markDeepRender();
    }

    /**
     * Toogle display of video map
     *
     * This method will only be `trigger`ed by some other
     * class via the `EventBus`
     *
     * @for CanvasController
     * @method _onToggleVideoMap
     * @returns undefined
     * @private
     */
    _onToggleVideoMap() {
        this._shouldDrawVideoMap = !this._shouldDrawVideoMap;

        this._markDeepRender();
    }

    /**
     * Notify that the range rings value has changed by the user.
     *
     * This method will only be `trigger`ed by some other
     * class via the `EventBus`
     *
     * @for CanvasController
     * @method _onRangeRingsChange
     * @returns undefined
     * @private
     */
    _onRangeRingsChange() {
        this._markDeepRender();
    }

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
     * @returns undefined
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
     * @returns undefined
     * @private
     */
    _markDeepRender() {
        this._shouldDeepRender = true;

        this._markShallowRender();
    }

    /**
     * Trigger _markShallowRender() when an aircraft is selected, thus
     * forcing a redraw of the dynamic canvas on the next frame.
     *
     * @for CanvasController
     * @method _onSelectAircraft
     * @returns undefined
     * @private
     */
    _onSelectAircraft() {
        this._markShallowRender();
    }

    /**
     * Trigger _markShallowRender() when an aircraft is deselected, thus
     * forcing a redraw of the dynamic canvas on the next frame.
     *
     * @for CanvasController
     * @method _onDeselectAircraft
     * @returns undefined
     * @private
     */
    _onDeselectAircraft() {
        this._markShallowRender();
    }

    /**
     * Center a point in the view
     *
     * Used only for centering view on an aircraft position using
     * the x, y of an aircraft's `relativePosition`
     *
     * @for CanvasController
     * @method _onCenterPointInView
     * @param relativePosition {array<string>}
     * @returns undefined
     * @private
     */
    _onCenterPointInView(relativePosition) {
        const newPanX = -round(CanvasStageModel._translateKilometersToPixels(relativePosition[0]));
        const newPanY = round(CanvasStageModel._translateKilometersToPixels(relativePosition[1]));

        CanvasStageModel.updatePan(newPanX, newPanY);
    }

    /**
     * Callback method fired when an airport is changed
     *
     * Changing an airport will require a complete re-draw of all
     * items on all canvases, thus we call `._markDeepRender()` here
     * to initiate that process
     *
     * @for CanvasController
     * @method _onAirportChange
     * @returns undefined
     * @private
     */
    _onAirportChange() {
        this._markDeepRender();
    }

    /**
     * Change theme to the specified name
     *
     * This should ONLY be called through the EventBus during a `SET_THEME` event,
     * thus ensuring that the same theme is always in use by all app components
     *
     * This method must remain an arrow function in order to preserve the scope
     * of `this`, since it is being invoked by an EventBus callback
     *
     * @for CanvasController
     * @method _setTheme
     * @param themeName {string}
     * @returns undefined
     * @private
     */
    _setTheme(themeName) {
        if (!_has(THEME, themeName)) {
            console.error(`Expected valid theme to change to, but received '${themeName}'`);

            return;
        }

        // TODO: abstract to method
        if (this.theme !== null) {
            this.$element.removeClass(this.theme.CLASSNAME);
        }

        this.theme = THEME[themeName];
        // TODO: abstract to method
        this.$element.addClass(this.theme.CLASSNAME);
        this._markDeepRender();
    }
}
