import { MCP_MODES } from './modeControlConstants';

/**
 *
 *
 * @class ModeController
 */
export default class ModeController {
    /**
     * @constructor
     * @for ModeController
     * @param typeDefinitionModel {AircraftTypeDefinitionModel}
     */
    constructor(typeDefinitionModel) {
        this._model = typeDefinitionModel;

        this.altitudeMode = MCP_MODES.ALTITUDE.OFF;
        this.autopilotMode = MCP_MODES.AUTOPILOT.OFF;
        this.headingMode = MCP_MODES.HEADING.OFF;
        this.speedMode = MCP_MODES.SPEED.OFF;

        this.altitude = -1;
        this.course = -1;
        this.heading = -1;
        this.speed = -1;
    }

    /**
     *
     *
     */
    setForArrival() {
        this.altitudeMode = MCP_MODES.ALTITUDE.OFF;
        this.headingMode = MCP_MODES.HEADING.OFF;
        this.speedMode = MCP_MODES.SPEED.VNAV;
    }

    /**
     *
     *
     */
    setForDeparture() {
        this.altitudeMode = MCP_MODES.ALTITUDE.VNAV;
        this.headingMode = MCP_MODES.HEADING.LNAV;
        this.speedMode = MCP_MODES.SPEED.VNAV;
    }
}
