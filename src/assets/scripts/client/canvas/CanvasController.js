import $ from 'jquery';
import _cloneDeep from 'lodash/cloneDeep';
import _has from 'lodash/has';
import _filter from 'lodash/filter';
import AirportController from '../airport/AirportController';
import CanvasStageModel from './CanvasStageModel';
import EventBus from '../lib/EventBus';
import GameController from '../game/GameController';
import TimeKeeper from '../engine/TimeKeeper';
import { tau } from '../math/circle';
import {
    sin,
    cos,
    round,
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
    CANVAS_NAME
} from '../constants/canvasConstants';
import { THEME } from '../constants/themes';
import { EVENT } from '../constants/eventNames';
import {
    INVALID_INDEX,
    INVALID_NUMBER,
    TIME
} from '../constants/globalConstants';

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
        return this;
    }

    /**
     * @for CanvasController
     * @method _setupHandlers
     * @chainable
     * @private
     */
    _setupHandlers() {
        this._onCenterPointInViewHandler = this._onCenterPointInView.bind(this);
        this._onChangeViewportPanHandler = this._onChangeViewportPan.bind(this);
        this._onChangeViewportZoomHandler = this._onChangeViewportZoom.bind(this);
        this._onMarkDirtyCanvasHandler = this._onMarkDirtyCanvas.bind(this);
        this._onToggleLabelsHandler = this._onToggleLabels.bind(this);
        this._onToggleRestrictedAreasHandler = this._onToggleRestrictedAreas.bind(this);
        this._onToggleSidMapHandler = this._onToggleSidMap.bind(this);
        this._onAirportChangeHandler = this._onAirportChange.bind(this);
        this._onToggleTerrainHandler = this._onToggleTerrain.bind(this);
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
        this._eventBus.on(EVENT.REQUEST_TO_CENTER_POINT_IN_VIEW, this._onCenterPointInViewHandler);
        this._eventBus.on(EVENT.PAN_VIEWPORT, this._onChangeViewportPanHandler);
        this._eventBus.on(EVENT.ZOOM_VIEWPORT, this._onChangeViewportZoomHandler);
        this._eventBus.on(EVENT.MARK_CANVAS_DIRTY, this._onMarkDirtyCanvasHandler);
        this._eventBus.on(EVENT.TOGGLE_LABELS, this._onToggleLabelsHandler);
        this._eventBus.on(EVENT.TOGGLE_RESTRICTED_AREAS, this._onToggleRestrictedAreasHandler);
        this._eventBus.on(EVENT.TOGGLE_SID_MAP, this._onToggleSidMapHandler);
        this._eventBus.on(EVENT.TOGGLE_TERRAIN, this._onToggleTerrainHandler);
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
        this._eventBus.off(EVENT.REQUEST_TO_CENTER_POINT_IN_VIEW, this._onCenterPointInView);
        this._eventBus.off(EVENT.PAN_VIEWPORT, this._onChangeViewportPan);
        this._eventBus.off(EVENT.ZOOM_VIEWPORT, this._onChangeViewportZoom);
        this._eventBus.off(EVENT.MARK_CANVAS_DIRTY, this._onMarkDirtyCanvas);
        this._eventBus.off(EVENT.TOGGLE_LABELS, this._onToggleLabels);
        this._eventBus.off(EVENT.TOGGLE_RESTRICTED_AREAS, this._onToggleRestrictedAreas);
        this._eventBus.off(EVENT.TOGGLE_SID_MAP, this._onToggleSidMap);
        this._eventBus.off(EVENT.TOGGLE_TERRAIN, this._onToggleTerrain);
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
        this._canvas_add(CANVAS_NAME.STATIC);
        this._canvas_add(CANVAS_NAME.DYNAMIC);
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
     * @method canvas_update_post
     */
    canvas_update_post() {
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
            this._drawAirspaceAndRangeRings(staticCanvasCtx);
            this._drawWindVane(staticCanvasCtx);
            this._drawRunwayLabels(staticCanvasCtx);
            this._drawCurrentScale(staticCanvasCtx);
            this._drawSelectedAircraftCompass(staticCanvasCtx);
        }

        const dynamicCanvasCtx = this._getCanvasContextByName(CANVAS_NAME.DYNAMIC);

        this._clearCanvasContext(dynamicCanvasCtx);
        this._drawRadarTargetList(dynamicCanvasCtx);
        this._drawAircraftDataBlocks(dynamicCanvasCtx);

        this._shouldShallowRender = false;
        this._shouldDeepRender = false;
    }

    /**
     * Add a `canvas` element to the DOM
     *
     * @for CanvasController
     * @method _canvas_add
     * @param name {CANVAS_NAME|string}
     * @private
     */
    _canvas_add(name) {
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
     * @for CanvasController
     * @method _drawSingleRunway
     * @param cc {HTMLCanvasContext}
     * @param runwayModel {RunwayModel}
     * @param mode {boolean}               flag to switch between drawing a runway or just a runway centerline
     * @private
     */
    _drawSingleRunway(cc, runwayModel, mode) {
        const runwayLength = round(CanvasStageModel.translateKilometersToPixels(runwayModel.length / 2)) * -2;
        const angle = runwayModel.angle;
        const runwayPosition = CanvasStageModel.translatePostionModelToRoundedCanvasPosition(runwayModel.relativePosition);

        cc.save();
        cc.translate(runwayPosition.x, runwayPosition.y);
        cc.rotate(angle);

        // runway body
        if (!mode) {
            cc.strokeStyle = '#899';
            cc.lineWidth = 2.8;

            cc.beginPath();
            cc.moveTo(0, 0);
            cc.lineTo(0, runwayLength);
            cc.stroke();
        } else {
            // extended centerlines
            if (!runwayModel.ils.enabled) {
                return;
            }

            cc.strokeStyle = this.theme.SCOPE.RUNWAY_EXTENDED_CENTERLINE;
            cc.lineWidth = 1;

            cc.beginPath();
            cc.moveTo(0, 0);
            cc.lineTo(0, CanvasStageModel.translateKilometersToPixels(runwayModel.ils.loc_maxDist));
            cc.stroke();
        }

        cc.restore();
    }

    /**
     * @for CanvasController
     * @method _drawRunwayLabel
     * @param cc {HTMLCanvasContext}
     * @param runway {RunwayModel}
     * @private
     */
    _drawRunwayLabel(cc, runwayModel) {
        const length2 = round(CanvasStageModel.translateKilometersToPixels(runwayModel.length / 2)) + 0.5;
        const runwayPosition = CanvasStageModel.translatePostionModelToRoundedCanvasPosition(runwayModel.relativePosition);
        const { angle } = runwayModel;
        const textHeight = 14;

        cc.save();
        cc.translate(runwayPosition.x, runwayPosition.y);
        cc.rotate(angle);
        cc.textAlign = 'center';
        cc.textBaseline = 'middle';
        cc.save();
        cc.translate(0, length2 + textHeight);
        cc.rotate(-angle);
        cc.fillText(runwayModel.name, 0, 0);
        cc.restore();
        cc.restore();
    }

    /**
     * @for CanvasController
     * @method _drawRunways
     * @param cc {HTMLCanvasContext}
     * @private
     */
    _drawRunways(cc) {
        if (!this._shouldDrawFixLabels) {
            return;
        }

        cc.save();
        cc.translate(CanvasStageModel.halfWidth, CanvasStageModel.halfHeight);
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
     * @for CanvasController
     * @method _drawRunwayLabels
     * @param cc {HTMLCanvasContext}
     * @private
     */
    _drawRunwayLabels(cc) {
        if (!this._shouldDrawFixLabels) {
            return;
        }

        const airportModel = AirportController.airport_get();

        cc.save();
        cc.translate(CanvasStageModel.halfWidth, CanvasStageModel.halfHeight);
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
     * @for CanvasController
     * @method _drawCurrentScale
     * @param cc {HTMLCanvasContext}
     * @private
     */
    _drawCurrentScale(cc) {
        cc.save();

        const offsetX = 35;
        const offsetY = 10;
        const height = 5;
        const length = round(1 / CanvasStageModel.scale * 50);
        const px_length = round(CanvasStageModel.translateKilometersToPixels(length));
        const widthLessOffset = CanvasStageModel.width - offsetX;

        cc.font = '10px monoOne, monospace';
        cc.fillStyle = this.theme.SCOPE.TOP_ROW_TEXT;
        cc.strokeStyle = this.theme.SCOPE.TOP_ROW_TEXT;
        cc.translate(0.5, 0.5);
        cc.lineWidth = 1;
        cc.textAlign = 'center';
        cc.moveTo(widthLessOffset, offsetY);
        cc.lineTo(widthLessOffset, offsetY + height);
        cc.lineTo(widthLessOffset - px_length, offsetY + height);
        cc.lineTo(widthLessOffset - px_length, offsetY);
        cc.stroke();
        cc.translate(-0.5, -0.5);
        cc.fillText(
            `${length} km`,
            widthLessOffset - px_length * 0.5,
            offsetY + height + 17
        );
        cc.restore();
    }

    /**
     * @for CanvasController
     * @method _drawSingleFixAndLabel
     * @param cc {HTMLCanvasContext}
     * @param fixName {string}              name of a fix
     * @param fixPosition {array<number>}   x, y canvas position of fix
     * @private
     */
    _drawSingleFixAndLabel(cc, fixModel) {
        const fixPosition = CanvasStageModel.translatePostionModelToRoundedCanvasPosition(fixModel.relativePosition);

        cc.save();
        cc.translate(fixPosition.x, fixPosition.y);
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
     * @for CanvasController
     * @method _drawAirportFixesAndLabels
     * @param cc {HTMLCanvasContext}
     * @private
     */
    _drawAirportFixesAndLabels(cc) {
        if (!this._shouldDrawFixLabels) {
            return;
        }

        cc.save();
        cc.translate(CanvasStageModel.halfWidth, CanvasStageModel.halfHeight);
        cc.lineJoin = 'round';
        cc.font = BASE_CANVAS_FONT;

        for (let i = 0; i < this._navigationLibrary.realFixes.length; i++) {
            const fixModel = this._navigationLibrary.realFixes[i];

            this._drawSingleFixAndLabel(cc, fixModel);
        }

        cc.restore();
    }

    // TODO: break this method up into smaller chunks
    /**
     * @for CanvasController
     * @method _drawSids
     * @param cc {HTMLCanvasContext}
     * @private
     */
    _drawSids(cc) {
        if (!this._shouldDrawSidMap) {
            return;
        }

        const textAtPoint = [];
        const { sidLines } = this._navigationLibrary;

        cc.save();
        cc.translate(CanvasStageModel.halfWidth, CanvasStageModel.halfHeight);
        cc.strokeStyle = this.theme.SCOPE.SID;
        cc.fillStyle = this.theme.SCOPE.SID;
        cc.setLineDash([1, 10]);
        cc.font = 'italic 14px monoOne, monospace';

        // FIXME: simplify/rector these nested loops. can we prepare the result elsewhere and store it
        // to be retrieved here? seems wasteful to calculate all this _every_ frame
        for (let i = 0; i < sidLines.length; i++) {
            const sid = sidLines[i];
            let shouldDrawProcedureName = true;
            let fixCanvasPosition;

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
                        console.warning(`Unable to draw line to '${fixList[k]}' because its position is not defined!`);
                    }

                    fixCanvasPosition = CanvasStageModel.translatePostionModelToRoundedCanvasPosition(fixPosition);

                    if (k === 0) {
                        cc.beginPath();
                        cc.moveTo(fixCanvasPosition.x, fixCanvasPosition.y);
                    } else {
                        cc.lineTo(fixCanvasPosition.x, fixCanvasPosition.y);
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
                    const y_point = fixCanvasPosition.y + (15 * textAtPoint[exitName]);
                    cc.fillText(`${sid.identifier}.${exitName}`, fixCanvasPosition.x + 10, y_point);

                    // Increment the count for this transition
                    textAtPoint[exitName] += 1;
                }
            }

            if (shouldDrawProcedureName) {
                const labelOffsetX = fixCanvasPosition.x + 10;

                cc.fillText(sid.identifier, labelOffsetX, fixCanvasPosition.y);
            }
        }

        cc.restore();
    }

    /**
     * Draw a trailing indicator 2.5 NM (4.6km) behind landing aircraft to help with traffic spacing
     *
     * @for CanvasController
     * @method _drawSeparationIndicator
     * @param cc {HTMLCanvasContext}
     * @param aircraftModel {AircraftModel}
     * @private
     */
    _drawSeparationIndicator(cc, aircraftModel) {
        if (!GameController.shouldUseTrailingSeparationIndicator(aircraftModel)) {
            return;
        }

        const runway = aircraftModel.fms.currentRunway;
        const oppositeOfRunwayHeading = runway.oppositeAngle;
        const aircraftCanvasPosition = CanvasStageModel.translatePostionModelToRoundedCanvasPosition(aircraftModel.relativePosition);
        cc.strokeStyle = this.theme.RADAR_TARGET.TRAILING_SEPARATION_INDICATOR;
        cc.lineWidth = 3;

        cc.translate(aircraftCanvasPosition.x, aircraftCanvasPosition.y);
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
     * @method _drawAircraftRings
     * @param cc {HTMLCanvasContext}
     * @param aircraftModel {AircraftModel}
     */
    _drawAircraftRings(cc, aircraftModel) {
        const aircraftAlerts = aircraftModel.hasAlerts();

        cc.save();

        let strokeStyle = cc.fillStyle;
        // TODO: this block should be simplified
        if (aircraftAlerts[0]) {
            if (aircraftAlerts[1]) {
                // red violation circle
                strokeStyle = this.theme.RADAR_TARGET.RING_VIOLATION;
            } else {
                // white warning circle
                strokeStyle = this.theme.RADAR_TARGET.RING_CONFLICT;
            }
        }

        cc.strokeStyle = strokeStyle;
        cc.beginPath();
        cc.arc(0, 0, CanvasStageModel.translateKilometersToPixels(km(3)), 0, tau());  // 3nm RADIUS
        cc.stroke();
        cc.restore();
    }

    /**
     * Draw the RADAR RETURN AND HISTORY DOTS ONLY of the specified radar target model
     *
     * @for CanvasController
     * @method _drawSingleRadarTarget
     * @param cc {HTMLCanvasContext}
     * @param radarTargetModel {RadarTargetModel}
     * @private
     */
    _drawSingleRadarTarget(cc, radarTargetModel) {
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
            const canvasPosition = CanvasStageModel.translatePostionModelToRoundedCanvasPosition(position);

            cc.beginPath();
            cc.arc(
                canvasPosition.x,
                canvasPosition.y,
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

            this._drawSeparationIndicator(cc, aircraftModel);

            cc.restore();
        }

        // Draw the future path
        switch (GameController.game.option.getOptionByName('drawProjectedPaths')) {
            case 'always':
                this._drawAircraftFuturePath(cc, aircraftModel);

                break;
            case 'selected':
                if (match) {
                    this._drawAircraftFuturePath(cc, aircraftModel);
                }

                break;
            default:
                break;
        }

        const alerts = aircraftModel.hasAlerts();
        const aircraftCanvasPosition = CanvasStageModel.translatePostionModelToRoundedCanvasPosition(aircraftModel.relativePosition);

        cc.translate(aircraftCanvasPosition.x, aircraftCanvasPosition.y);

        this._drawAircraftVectorLines(cc, aircraftModel);

        if (aircraftModel.notice || alerts[0]) {
            this._drawAircraftRings(cc, aircraftModel);
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
     * @method _drawAircraftVectorLines
     * @param cc {HTMLCanvasContext}
     * @param aircraft {AircraftModel}
     * @private
     */
    _drawAircraftVectorLines(cc, aircraft) {
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
     * @method _drawAircraftFuturePath
     * @param cc {HTMLCanvasContext}
     * @param aircraft {AircraftModel}
     * @private
     */
    _drawAircraftFuturePath(cc, aircraft) {
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
            const trackPosition = CanvasStageModel.translatePostionModelToPreciseCanvasPosition(track);

            if (ils_locked && !was_locked) {
                cc.lineTo(trackPosition.x, trackPosition.y);
                // end the current path, start a new path with lockedStroke
                cc.stroke();
                cc.strokeStyle = this.theme.RADAR_TARGET.PROJECTION_ESTABLISHED_ON_APPROACH;
                cc.lineWidth = 3;
                cc.beginPath();
                cc.moveTo(trackPosition.x, trackPosition.y);

                was_locked = true;

                continue;
            }

            if (i === 0) {
                cc.moveTo(trackPosition.x, trackPosition.y);
            } else {
                cc.lineTo(trackPosition.x, trackPosition.y);
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
     * @method _drawRadarTargetList
     * @param cc {HTMLCanvasContext}
     * @private
     */

    _drawRadarTargetList(cc) {
        cc.font = BASE_CANVAS_FONT;
        cc.save();
        cc.translate(CanvasStageModel.halfWidth, CanvasStageModel.halfHeight);

        const radarTargetModels = this._scopeModel.radarTargetCollection.items;

        for (let i = 0; i < radarTargetModels.length; i++) {
            cc.save();

            this._drawSingleRadarTarget(cc, radarTargetModels[i]);

            cc.restore();
        }

        cc.restore();
    }

    /**
     * Draw an aircraft's data block
     * (box that contains callsign, altitude, speed)
     *
     * @for CanvasController
     * @method _drawSingleAircraftDataBlock
     * @param cc {HTMLCanvasContext}
     * @param radarTargetModel {RadarTargetModel}
     * @private
     */
    _drawSingleAircraftDataBlock(cc, radarTargetModel) {
        const { aircraftModel } = radarTargetModel;

        if (!aircraftModel.isVisible() || aircraftModel.hit) {
            return;
        }

        cc.save();

        // FIXME: logic and math here should be done once and not every frame. this could be moved to the `RadarTargetModel`
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
        cc.strokeStyle = white;
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
     * @method _drawAircraftDataBlocks
     * @param cc {HTMLCanvasContext}
     * @private
     */
    _drawAircraftDataBlocks(cc) {
        const radarTargetModels = this._scopeModel.radarTargetCollection.items;

        cc.save();
        cc.translate(CanvasStageModel.halfWidth, CanvasStageModel.halfHeight);

        for (let i = 0; i < radarTargetModels.length; i++) {
            this._drawSingleAircraftDataBlock(cc, radarTargetModels[i]);
        }

        cc.restore();
    }

    /**
     * Draw wind vane in lower right section of the scope view
     *
     * @for CanvasController
     * @method _drawWindVane
     * @param cc {HTMLCanvasContext}
     * @private
     */
    _drawWindVane(cc) {
        cc.save();
        cc.font = 'bold 10px monoOne, monospace';
        cc.translate(
            CanvasStageModel.width,
            CanvasStageModel.height
        );

        const airportModel = AirportController.airport_get();
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
        cc.fillText(airportModel.wind.speed, 0, 3.8);
        cc.font = 'bold 10px monoOne, monospace';

        // Wind line
        if (airportModel.wind.speed > 8) {
            windspeed_line = airportModel.wind.speed / 2;
            highwind = true;
        } else {
            windspeed_line = airportModel.wind.speed;
            highwind = false;
        }

        cc.save();
        cc.translate(
            -dot / 2 * sin(airportModel.wind.angle),
            dot / 2 * cos(airportModel.wind.angle)
        );
        cc.beginPath();
        cc.moveTo(0, 0);
        cc.rotate(airportModel.wind.angle);
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

        cc.restore();
    }

    /**
     * @for CanvasController
     * @method _drawAirspaceAndRangeRings
     * @param cc {HTMLCanvasContext}
     * @private
     */
    _drawAirspaceAndRangeRings(cc) {
        cc.save();
        // translate to airport center
        // FIXME: create method in CanvasStageModel to returns an array with these values
        cc.translate(
            round(CanvasStageModel.halfWidth + CanvasStageModel._panX),
            round(CanvasStageModel.halfHeight + CanvasStageModel._panY)
        );

        // FIXME: is this still needed?
        // Special markings for ENGM point merge
        // if (AirportController.airport_get().icao === 'ENGM') {
        //     cc.save();
        //     cc.translate(CanvasStageModel.halfWidth, CanvasStageModel.halfHeight);

        //     this.canvas_draw_engm_range_rings(cc);

        //     cc.restore();
        // }

        this._drawAirspaceBorder(cc);
        this._drawRangeRings(cc);

        cc.restore();
    }

    /**
     * Draw polygonal airspace border
     *
     * @for CanvasController
     * @method _drawAirspaceBorder
     * @param cc {HTMLCanvasContext}
     * @private
     */
    _drawAirspaceBorder(cc) {
        const airport = AirportController.airport_get();

        cc.strokeStyle = this.theme.SCOPE.AIRSPACE_PERIMETER;
        cc.fillStyle = this.theme.SCOPE.AIRSPACE_FILL;

        for (let i = 0; i < airport.airspace.length; i++) {
            const poly = $.map(airport.perimeter.poly, (v) => {
                return [v.relativePosition];
            });

            this._drawPoly(cc, poly);
            cc.clip();
        }
    }

    // FIXME: are these two methods still needed? why?
    // /**
    //  * @for CanvasController
    //  * @method canvas_draw_engm_range_rings
    //  * @param cc {HTMLCanvasContext}
    //  */
    // // Draw range rings for ENGM airport to assist in point merge
    // canvas_draw_engm_range_rings(cc) {
    //     cc.strokeStyle = this.theme.SCOPE.RANGE_RING_COLOR;
    //     cc.setLineDash([3, 6]);

    //     this.canvas_draw_fancy_rings(cc, 'BAVAD', 'GM428', 'GM432');
    //     this.canvas_draw_fancy_rings(cc, 'TITLA', 'GM418', 'GM422');
    //     this.canvas_draw_fancy_rings(cc, 'INSUV', 'GM403', 'GM416');
    //     this.canvas_draw_fancy_rings(cc, 'VALPU', 'GM410', 'GM402');
    // }

    //  /**
    //  * Draw range rings for `ENGM`
    //  *
    //  * This method is used exclusively by `.canvas_draw_engm_range_rings()`
    //  *
    //  * @for CanvasController
    //  * @method canvas_draw_fancy_rings
    //  * @param cc {HTMLCanvasContext}
    //  * @param fix_origin
    //  * @param fix1
    //  * @param fix2
    //  */
    // canvas_draw_fancy_rings(cc, fix_origin, fix1, fix2) {
    //     const airport = AirportController.airport_get();
    //     const origin = airport.getFixPosition(fix_origin);
    //     const f1 = airport.getFixPosition(fix1);
    //     const f2 = airport.getFixPosition(fix2);
    //     const minDist = Math.min(distance2d(origin, f1), distance2d(origin, f2));
    //     const halfPI = Math.PI / 2;
    //     const extend_ring = degreesToRadians(10);
    //     const start_angle = Math.atan2(f1[0] - origin[0], f1[1] - origin[1]) - halfPI - extend_ring;
    //     const end_angle = Math.atan2(f2[0] - origin[0], f2[1] - origin[1]) - halfPI + extend_ring;
    //     const x = round(CanvasStageModel.translateKilometersToPixels(origin[0])) + CanvasStageModel._panX;
    //     const y = -round(CanvasStageModel.translateKilometersToPixels(origin[1])) + CanvasStageModel._panY;
    //     // 5NM = 9.27km
    //     const radius = 9.27;

    //     for (let i = 0; i < 4; i++) {
    //         cc.beginPath();
    //         cc.arc(
    //             x,
    //             y,
    //             CanvasStageModel.translateKilometersToPixels(minDist - (i * radius)),
    //             start_angle, end_angle
    //         );

    //         cc.stroke();
    //     }
    // }

    /**
     * @for CanvasController
     * @method _drawRangeRings
     * @param cc {HTMLCanvasContext}
     * @private
     */
    _drawRangeRings(cc) {
        const airportModel = AirportController.airport_get();
        const rangeRingRadius = km(airportModel.rr_radius_nm);

        cc.linewidth = 1;
        cc.strokeStyle = this.theme.SCOPE.RANGE_RING_COLOR;

        // Fill up airportModel's ctr_radius with rings of the specified radius
        for (let i = 1; i * rangeRingRadius < airportModel.ctr_radius; i++) {
            cc.beginPath();
            cc.arc(0, 0, rangeRingRadius * CanvasStageModel.scale * i, 0, tau());
            cc.stroke();
        }
    }

    /**
     * @for CanvasController
     * @method _drawPoly
     * @param cc {HTMLCanvasContext}
     * @param poly {array<array<number, number>>}
     * @private
     */
    _drawPoly(cc, poly) {
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

    /**
     * @param cc {HTMLCanvasContext}
     * @param terrainLevel {object}
     * @param elevation {number}
     * @private
     */
    _drawTerrainAtElevation(cc, terrainLevel, elevation) {
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
     * @method _drawTerrainElevationLegend
     * @param  cc  {HTMLCanvasContext}
     * @param max_elevation {number}
     * @private
     */
    _drawTerrainElevationLegend(cc, max_elevation) {
        cc.save();
        cc.font = BASE_CANVAS_FONT;
        cc.lineWidth = 1;

        const offset = 10;
        const width = CanvasStageModel.width;
        const height = CanvasStageModel.height;
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

        cc.restore();
    }

    /**
     * @for CanvasController
     * @method _drawTerrain
     * @param cc {HTMLCanvasContext}
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
        cc.translate(CanvasStageModel.halfWidth, CanvasStageModel.halfHeight);
        // Terrain key rectangles' outline stroke color
        // Also determines color of terrain outline drawn at '0ft'
        cc.strokeStyle = this.theme.SCOPE.FIX_FILL;
        // Somehow used to tint the terrain key rectangles' fill color
        // Also determines color of terrain fill at '0ft'
        cc.fillStyle = this.theme.SCOPE.FIX_FILL;
        cc.lineWidth = clamp(0.5, (CanvasStageModel.scale / 10), 2);
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

            this._drawTerrainAtElevation(cc, terrainLevel, elevation);
        }

        cc.restore();

        if (max_elevation === 0) {
            return;
        }

        this._drawTerrainElevationLegend(cc, max_elevation);

        cc.restore();
    }

    /**
     * @for CanvasController
     * @method _drawRestrictedAirspace
     * @param cc {HTMLCanvasContext}
     * @private
     */
    _drawRestrictedAirspace(cc) {
        if (!this._shouldDrawRestrictedAreas) {
            return;
        }

        cc.save();
        cc.translate(
            CanvasStageModel.halfWidth + CanvasStageModel._panX,
            CanvasStageModel.halfHeight + CanvasStageModel._panY
        );
        cc.strokeStyle = this.theme.SCOPE.RESTRICTED_AIRSPACE;
        cc.lineWidth = Math.max(CanvasStageModel.scale / 3, 2);
        cc.lineJoin = 'round';
        cc.font = BASE_CANVAS_FONT;

        const airportModel = AirportController.airport_get();

        for (let i = 0; i < airportModel.restricted_areas.length; i++) {
            const area = airportModel.restricted_areas[i];
            cc.fillStyle = 'transparent';

            this._drawPoly(cc, area.coordinates);

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
     * @method _drawVideoMap
     * @param cc {HTMLCanvasContext}
     * @private
     */
    _drawVideoMap(cc) {
        const airportModel = AirportController.airport_get();

        if (!_has(airportModel, 'maps')) {
            return;
        }

        cc.save();
        cc.translate(CanvasStageModel.halfWidth, CanvasStageModel.halfHeight);
        cc.strokeStyle = this.theme.SCOPE.VIDEO_MAP;
        cc.lineWidth = CanvasStageModel.scale / 15;
        cc.lineJoin = 'round';
        cc.font = BASE_CANVAS_FONT;
        cc.translate(CanvasStageModel._panX, CanvasStageModel._panY);

        for (let i = 0; i < airportModel.maps.base.length; i++) {
            const mapItem = airportModel.maps.base[i];
            cc.moveTo(
                CanvasStageModel.translateKilometersToPixels(mapItem[0]),
                -CanvasStageModel.translateKilometersToPixels(mapItem[1])
            );
            cc.lineTo(
                CanvasStageModel.translateKilometersToPixels(mapItem[2]),
                -CanvasStageModel.translateKilometersToPixels(mapItem[3])
            );
        }

        cc.stroke();
        cc.restore();
    }

    // TODO: this method should be removed or reworked.
    /**
     * Draw the compass around the edge of the scope view
     *
     * @for CanvasController
     * @method _drawSelectedAircraftCompass
     * @param cc {HTMLCanvasContext}
     * @private
     */
    _drawSelectedAircraftCompass(cc) {
        if (GameController.game_paused()) {
            return;
        }

        cc.save();

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

        const pos = this._toCanvasPosition(aircraft.relativePosition);
        const rectPos = [0, 0];
        const rectSize = [CanvasStageModel.width, CanvasStageModel.height];

        // cc.save();
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
     * Find a canvas context stored within `#_context`
     *
     * @for CanvasController
     * @method _getCanvasContextByName
     * @param name {string}
     * @private
     */
    _getCanvasContextByName(name) {
        return this._context[name];
    }

    // TODO: this should be moved to the `CanvasStageModel`
    /**
     * Calculate an aircraft's position within the canvas from
     *
     * @for CanvasController
     * @method _toCanvasPosition
     * @param pos {DynamicPositionModel}
     */
    _toCanvasPosition(pos) {
        return [
            CanvasStageModel.halfWidth + CanvasStageModel._panX + km(pos[0]),
            CanvasStageModel.halfHeight + CanvasStageModel._panY - km(pos[1])
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
     * @param mouseDelta {array<number, number>}
     * @private
     */
    _onChangeViewportZoom() {
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
     * @private
     */
    _onToggleSidMap() {
        this._shouldDrawSidMap = !this._shouldDrawSidMap;

        this._markDeepRender();
    }

    /**
     * Toogle current value of `#draw_terrain`
     *
     * This method will only be `trigger`ed by some other
     * class via the `EventBus`
     * @for CanvasController
     * @method _onToggleTerrain
     * @private
     */
    _onToggleTerrain() {
        this._shouldDrawTerrain = !this._shouldDrawTerrain;

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
        this._shouldDeepRender = true;

        this._markShallowRender();
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
    _onCenterPointInView({ x, y }) {
        CanvasStageModel._panX = 0 - round(CanvasStageModel.translateKilometersToPixels(x));
        CanvasStageModel._panY = round(CanvasStageModel.translateKilometersToPixels(y));

        this._markShallowRender();
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
     */
    _setTheme(themeName) {
        if (!_has(THEME, themeName)) {
            console.error(`Expected valid theme to change to, but received '${themeName}'`);

            return;
        }

        // TODO: abstract to method
        this.$element.removeClass(this.theme.CLASSNAME);

        this.theme = THEME[themeName];
        // TODO: abstract to method
        this.$element.addClass(this.theme.CLASSNAME);
    }
}
