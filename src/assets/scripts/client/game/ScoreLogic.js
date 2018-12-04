import EventBus from '../lib/EventBus';
import GameController, { GAME_EVENTS } from './GameController';
import UiController from '../ui/UiController';
import { AIRCRAFT_EVENT } from '../constants/eventNames';
import { nm_ft } from '../utilities/unitConverters';
import AirportController from '../airport/AirportController';
import { speech_say } from '../speech';
import { AIRPORT_CONTROL_POSITION_NAME } from '../constants/airportConstants';
import { MCP_MODE } from '../aircraft/ModeControl/modeControlConstants';

/**
 * @class ScoreLogic
 */
export default class ScoreLogic {
    constructor(aircraftController) {
        /**
         * Whether the aircraft has received a clearance to conduct an approach to a runway
         *
         * @for ScoreLogic
         * @property _aircraftController
         * @type {boolean}
         * @private
         */
        this._aircraftController = aircraftController;

        this.init()
            .setupHandler()
            .enable();
    }

    init() {
        return this;
    }

    /**
     * @for ScoreLogic
     * @method setupHandler
     * @chainable
     */
    setupHandler() {
        this._onTakeoffHandler = this._onTakeoff.bind(this);
        this._onApproachHandler = this._onApproach.bind(this);
        this._onLandingHandler = this._onLanding.bind(this);
        this._onExitAirspaceHandler = this._onExitAirspace.bind(this);

        return this;
    }

    /**
     * @for ScoreLogic
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
     * @for ScoreLogic
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
     * @for ScoreLogic
     * @method _onTakeoff
     * @param aircraftModel {AircraftModel}
     * @param runwayModel {RunwayModel}
     */
    _onTakeoff(aircraftModel, runwayModel) {
        this._scoreWind(aircraftModel, 'taking off');
        this._scoreRunwaySeparation(aircraftModel, runwayModel, 'taking off');
    }

    /**
     * @for ScoreLogic
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
     * @for ScoreLogic
     * @method _onLanding
     * @param aircraftModel {AircraftModel}
     * @param runwayModel {RunwayModel}
     */
    _onLanding(aircraftModel, runwayModel) {
        this._scoreWind(aircraftModel, 'landed');
        this._scoreRunwaySeparation(aircraftModel, runwayModel, 'landed');
    }

    /**
     * @for ScoreLogic
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
     * @for ScoreLogic
     * @method _onAirspaceExitForArrival
     * @param aircraftModel {AircraftModel}
     * @private
     */
    _onAirspaceExitForArrival(aircraftModel) {
        this._radioCall(aircraftModel, 'leaving radar coverage as arrival', AIRPORT_CONTROL_POSITION_NAME.APPROACH, true);
        GameController.events_recordNew(GAME_EVENTS.AIRSPACE_BUST);
    }

    /**
     * @for ScoreLogic
     * @method _onAirspaceExitWithClearance
     * @param aircraftModel {AircraftModel}
     * @private
     */
    _onAirspaceExitWithClearance(aircraftModel) {
        this._radioCall(aircraftModel, 'switching to center, good day', AIRPORT_CONTROL_POSITION_NAME.DEPARTURE);
        GameController.events_recordNew(GAME_EVENTS.DEPARTURE);
    }

    /**
     * @for ScoreLogic
     * @method _onAirspaceExitWithoutClearance
     * @param aircraftModel {AircraftModel}
     * @private
     */
    _onAirspaceExitWithoutClearance(aircraftModel) {
        this._radioCall(aircraftModel, 'leaving radar coverage without proper clearance', AIRPORT_CONTROL_POSITION_NAME.DEPARTURE, true);
        GameController.events_recordNew(GAME_EVENTS.NOT_CLEARED_ON_ROUTE);
    }

    /**
     * @for ScoreLogic
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
     * @for ScoreLogic
     * @method _scoreRunwaySeparation
     * @param aircraftModel {AircraftModel}
     * @param runwayModel {RunwayModel}
     * @param action {string}
     */
    _scoreRunwaySeparation(aircraftModel, runwayModel, action) {
        const previousAircraft = this._aircraftController.findAircraftByCallsign(runwayModel.lastDepartedAircraftId);

        if (previousAircraft) {
            const actualDistance = nm_ft(aircraftModel.distanceToAircraft(previousAircraft));
            const requiredDistance = aircraftModel.model.calculateRunwaySeparationDistanceInFeet(previousAircraft.model);

            if (actualDistance < requiredDistance || previousAircraft.isOnGround()) {
                const isWarning = true;

                GameController.events_recordNew(GAME_EVENTS.NO_TAKEOFF_SEPARATION);
                UiController.ui_log(`${aircraftModel.callsign} ${action} while another aircraft was using the same runway`, isWarning);
            }
        }
    }

    /**
     * Display a waring and record an illegal glideslope intercept event
     *
     * @for ScoreLogic
     * @method _penalizeLocalizerInterceptAltitude
     * @param aircraftModel {AircraftModel}
     */
    _penalizeLocalizerInterceptAltitude(aircraftModel) {
        if (aircraftModel.isAboveGlidepath()) {
            const isWarning = true;

            UiController.ui_log(`${aircraftModel.callsign} intercepted localizer above glideslope`, isWarning);
            GameController.events_recordNew(GAME_EVENTS.LOCALIZER_INTERCEPT_ABOVE_GLIDESLOPE);
        }
    }

    /**
     * Display a waring and record an illegal approach event
     *
     * @for ScoreLogic
     * @method _penalizeLocalizerInterceptAngle
     * @param aircraftModel {AircraftModel}
     */
    _penalizeLocalizerInterceptAngle(aircraftModel) {
        const isWarning = true;

        UiController.ui_log(`${aircraftModel.callsign} approach course intercept angle was greater than 30 degrees`, isWarning);
        GameController.events_recordNew(GAME_EVENTS.ILLEGAL_APPROACH_CLEARANCE);
    }

    /**
     * @for ScoreLogic
     * @method _radioCall
     * @param msg {string}
     * @param sectorType {string}
     * @param isWarning {string}
     */
    _radioCall(aircraftModel, msg, sectorType, isWarning = false) {
        const writtenCallsign = aircraftModel.callsign;
        const spokenCallsign = aircraftModel.getRadioCallsign();

        const logMessage = (callsign) => `${AirportController.airport_get().radio[sectorType]}, ${callsign} ${msg}`;

        UiController.ui_log(logMessage(writtenCallsign), isWarning);

        speech_say(
            [{
                type: 'text',
                content: logMessage(spokenCallsign)
            }],
            aircraftModel.pilotVoice
        );
    }
}
