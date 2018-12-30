import EventBus from '../lib/EventBus';
import GameController, { GAME_EVENTS } from './GameController';
import UiController from '../ui/UiController';
import { nm_ft } from '../utilities/unitConverters';
import { AIRCRAFT_EVENT } from '../constants/eventNames';
import { AIRPORT_CONTROL_POSITION_NAME } from '../constants/airportConstants';
import { MCP_MODE } from '../aircraft/ModeControl/modeControlConstants';

/**
 * @class ScoreController
 */
export default class ScoreController {
    constructor(aircraftController) {
        /**
         * Whether the aircraft has received a clearance to conduct an approach to a runway
         *
         * @for ScoreController
         * @property _aircraftController
         * @type {boolean}
         * @private
         */
        this._aircraftController = aircraftController;

        this.init()
            .setupHandlers()
            .enable();
    }

    init() {
        return this;
    }

    /**
     * @for ScoreController
     * @method setupHandler
     * @chainable
     */
    setupHandlers() {
        this._onTakeoffHandler = this._onTakeoff.bind(this);
        this._onApproachHandler = this._onApproach.bind(this);
        this._onLandingHandler = this._onLanding.bind(this);
        this._onExitAirspaceHandler = this._onExitAirspace.bind(this);

        return this;
    }

    /**
     * @for ScoreController
     * @method enable
     * @chainable
     */
    enable() {
        EventBus.on(AIRCRAFT_EVENT.TAKEOFF, this._onTakeoffHandler);
        EventBus.on(AIRCRAFT_EVENT.APPROACH, this._onApproachHandler);
        EventBus.on(AIRCRAFT_EVENT.FULLSTOP, this._onLandingHandler);
        EventBus.on(AIRCRAFT_EVENT.AIRSPACE_EXIT, this._onExitAirspaceHandler);

        return this;
    }

    /**
     * @for ScoreController
     * @method disable
     * @chainable
     */
    disable() {
        EventBus.off(AIRCRAFT_EVENT.TAKEOFF, this._onTakeoffHandler);
        EventBus.off(AIRCRAFT_EVENT.APPROACH, this._onApproachHandler);
        EventBus.off(AIRCRAFT_EVENT.FULLSTOP, this._onLandingHandler);
        EventBus.off(AIRCRAFT_EVENT.AIRSPACE_EXIT, this._onExitAirspaceHandler);

        return this;
    }

    /**
     * @for ScoreController
     * @method _onTakeoff
     * @param aircraftModel {AircraftModel}
     * @param runwayModel {RunwayModel}
     */
    _onTakeoff(aircraftModel, runwayModel) {
        this._scoreWind(aircraftModel, 'taking off');
        this._scoreRunwaySeparation(aircraftModel, runwayModel, 'taking off');
    }

    /**
     * @for ScoreController
     * @method _onApproach
     * @param aircraftModel {AircraftModel}
     */
    _onApproach(aircraftModel) {
        this._penalizeLocalizerInterceptAltitude(aircraftModel);

        // TODO: How can we evaluate the intercept angle?
        // if () {
        //     this._penalizeLocalizerInterceptAngle();
        // }
    }

    /**
     * @for ScoreController
     * @method _onLanding
     * @param aircraftModel {AircraftModel}
     * @param runwayModel {RunwayModel}
     */
    _onLanding(aircraftModel, runwayModel) {
        this._scoreWind(aircraftModel, 'landed');
        this._scoreRunwaySeparation(aircraftModel, runwayModel, 'landed');
    }

    /**
     * @for ScoreController
     * @method _onExitAirspace
     * @param aircraftModel {AircraftModel}
     */
    _onExitAirspace(aircraftModel) {
        if (aircraftModel.isArrival()) {
            this._onAirspaceExitForArrival(aircraftModel);

            return;
        }

        if (aircraftModel.mcp.headingMode !== MCP_MODE.HEADING.LNAV) {
            this._onAirspaceExitWithoutClearance(aircraftModel);

            return;
        }

        this._onAirspaceExitWithClearance(aircraftModel);
    }

    /**
     * An arriving aircraft is exiting the airpsace
     *
     * @for ScoreController
     * @method _onAirspaceExitForArrival
     * @param aircraftModel {AircraftModel}
     * @private
     */
    _onAirspaceExitForArrival(aircraftModel) {
        aircraftModel.radioCall('leaving radar coverage as arrival', AIRPORT_CONTROL_POSITION_NAME.APPROACH, true);
        GameController.events_recordNew(GAME_EVENTS.AIRSPACE_BUST);
    }

    /**
     * @for ScoreController
     * @method _onAirspaceExitWithClearance
     * @param aircraftModel {AircraftModel}
     * @private
     */
    _onAirspaceExitWithClearance(aircraftModel) {
        aircraftModel.radioCall('switching to center, good day', AIRPORT_CONTROL_POSITION_NAME.DEPARTURE);
        GameController.events_recordNew(GAME_EVENTS.DEPARTURE);
    }

    /**
     * @for ScoreController
     * @method _onAirspaceExitWithoutClearance
     * @param aircraftModel {AircraftModel}
     * @private
     */
    _onAirspaceExitWithoutClearance(aircraftModel) {
        aircraftModel.radioCall('leaving airspace without being on our route', AIRPORT_CONTROL_POSITION_NAME.DEPARTURE, true);
        GameController.events_recordNew(GAME_EVENTS.NOT_CLEARED_ON_ROUTE);
    }

    /**
     * @for ScoreController
     * @method _scoreWind
     * @param aircraftModel {AircraftModel}
     * @param action {string}
     */
    _scoreWind(aircraftModel, action) {
        const isWarning = true;
        const wind = aircraftModel.getWind();

        // TODO: these two if blocks could be done in a single switch statement
        if (wind.cross >= 20) {
            GameController.events_recordNew(GAME_EVENTS.EXTREME_CROSSWIND_OPERATION);
            UiController.ui_log(`${aircraftModel.callsign} ${action} with major crosswind`, isWarning);
        } else if (wind.cross >= 10) {
            GameController.events_recordNew(GAME_EVENTS.HIGH_CROSSWIND_OPERATION);
            UiController.ui_log(`${aircraftModel.callsign} ${action} with crosswind`, isWarning);
        }

        if (wind.head <= -10) {
            GameController.events_recordNew(GAME_EVENTS.EXTREME_TAILWIND_OPERATION);
            UiController.ui_log(`${aircraftModel.callsign} ${action} with major tailwind`, isWarning);
        } else if (wind.head <= -5) {
            GameController.events_recordNew(GAME_EVENTS.HIGH_TAILWIND_OPERATION);
            UiController.ui_log(`${aircraftModel.callsign} ${action} with tailwind`, isWarning);
        }
    }

    /**
     * @for ScoreController
     * @method _scoreRunwaySeparation
     * @param aircraftModel {AircraftModel}
     * @param runwayModel {RunwayModel}
     * @param action {string}
     */
    _scoreRunwaySeparation(aircraftModel, runwayModel, action) {
        const previousAircraft = this._aircraftController.findAircraftByCallsign(runwayModel.lastDepartedAircraftCallsign);

        if (!previousAircraft) {
            return;
        }

        const actualDistance = nm_ft(aircraftModel.distanceToAircraft(previousAircraft));
        const requiredDistance = aircraftModel.model.calculateSameRunwaySeparationDistanceInFeet(previousAircraft.model);

        if (actualDistance < requiredDistance || previousAircraft.isOnGround()) {
            const isWarning = true;

            GameController.events_recordNew(GAME_EVENTS.NO_TAKEOFF_SEPARATION);
            UiController.ui_log(`${aircraftModel.callsign} ${action} without adequate separation from another aircraft using the same runway`, isWarning);
        }
    }

    /**
     * Display a waring and record an illegal glideslope intercept event
     *
     * @for ScoreController
     * @method _penalizeLocalizerInterceptAltitude
     * @param aircraftModel {AircraftModel}
     */
    _penalizeLocalizerInterceptAltitude(aircraftModel) {
        if (!aircraftModel.isAboveGlidepath()) {
            return;
        }

        const isWarning = true;

        UiController.ui_log(`${aircraftModel.callsign} intercepted localizer above glideslope`, isWarning);
        GameController.events_recordNew(GAME_EVENTS.LOCALIZER_INTERCEPT_ABOVE_GLIDESLOPE);
    }

    /**
     * Display a waring and record an illegal approach event
     *
     * @for ScoreController
     * @method _penalizeLocalizerInterceptAngle
     * @param aircraftModel {AircraftModel}
     */
    _penalizeLocalizerInterceptAngle(aircraftModel) {
        const isWarning = true;

        UiController.ui_log(`${aircraftModel.callsign} approach course intercept angle was greater than 30 degrees`, isWarning);
        GameController.events_recordNew(GAME_EVENTS.ILLEGAL_APPROACH_CLEARANCE);
    }
}
