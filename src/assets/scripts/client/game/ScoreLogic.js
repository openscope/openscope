import EventBus from '../lib/EventBus';
import GameController, { GAME_EVENTS } from './GameController';
import UiController from '../ui/UiController';
import { AIRCRAFT_EVENT } from '../constants/eventNames';
import { nm_ft } from '../utilities/unitConverters';

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
        this._onLandingHandler = this._onLanding.bind(this);

        return this;
    }

    /**
     * @for ScoreLogic
     * @method enable
     * @chainable
     */
    enable() {
        EventBus.on(AIRCRAFT_EVENT.TAKEOFF, this._onTakeoffHandler);
        EventBus.on(AIRCRAFT_EVENT.FULLSTOP, this._onLandingHandler);

        return this;
    }

    /**
     * @for ScoreLogic
     * @method disable
     * @chainable
     */
    disable() {
        EventBus.off(AIRCRAFT_EVENT.TAKEOFF, this._onTakeoffHandler);
        EventBus.off(AIRCRAFT_EVENT.FULLSTOP, this._onLandingHandler);

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
}
