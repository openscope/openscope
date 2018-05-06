import ava from 'ava';

import ModeController from '../../../src/assets/scripts/client/aircraft/ModeControl/ModeController';
import {
    MCP_MODE,
    MCP_MODE_NAME,
    MCP_FIELD_NAME
} from '../../../src/assets/scripts/client/aircraft/ModeControl/modeControlConstants';

const headingOrCourseMock = 3.141592653589793;

ava('does not throw when instantiated without parameters', (t) => {
    t.notThrows(() => new ModeController());
});

ava('does not throw when instantiated with parameters', (t) => {
    t.notThrows(() => new ModeController());
    t.notThrows(() => new ModeController());
});

ava('#isEnabled is false on instantiation', (t) => {
    const mcp = new ModeController();

    t.false(mcp.isEnabled);
});

ava('.#headingInDegrees returns a whole number', (t) => {
    const mcp = new ModeController();

    mcp.heading = 3.839724354387525;

    t.true(mcp.headingInDegrees === 220);
});

ava('.enable() sets #isEnabled to true', (t) => {
    const mcp = new ModeController();

    mcp.enable();

    t.true(mcp.isEnabled);
});

ava('.enable() does not change #isEnabled when #isEnabled is true', (t) => {
    const mcp = new ModeController();

    mcp.isEnabled = true;
    mcp.enable();

    t.true(mcp.isEnabled);
});

ava('.disable() sets #isEnabled to false', (t) => {
    const mcp = new ModeController();

    mcp.disable();

    t.false(mcp.isEnabled);
});

ava('.disable() does not change #isEnabled when #isEnabled is false', (t) => {
    const mcp = new ModeController();

    mcp.isEnabled = false;
    mcp.disable();

    t.false(mcp.isEnabled);
});

ava('.initializeForAirborneFlight() sets MCP for arrival descending via STAR which ends still above the airspace ceiling', (t) => {
    const mcp = new ModeController();
    const bottomAltitudeMock = 15000;
    const airspaceCeilingMock = 12000;
    const currentAltitudeMock = 21000;
    const currentHeadingMock = Math.PI;
    const currentSpeedMock = 290;

    mcp.initializeForAirborneFlight(
        bottomAltitudeMock,
        airspaceCeilingMock,
        currentAltitudeMock,
        currentHeadingMock,
        currentSpeedMock
    );

    t.true(mcp.altitude === airspaceCeilingMock);
    t.true(mcp.altitudeMode === MCP_MODE.ALTITUDE.VNAV);
    t.true(mcp.heading === currentHeadingMock);
    t.true(mcp.headingMode === MCP_MODE.HEADING.LNAV);
    t.true(mcp.speed === currentSpeedMock);
    t.true(mcp.speedMode === MCP_MODE.SPEED.VNAV);
});

ava('.initializeForAirborneFlight() sets MCP for arrival descending via STAR which ends below the airspace ceiling', (t) => {
    const mcp = new ModeController();
    const bottomAltitudeMock = 6000;
    const airspaceCeilingMock = 12000;
    const currentAltitudeMock = 21000;
    const currentHeadingMock = Math.PI;
    const currentSpeedMock = 290;

    mcp.initializeForAirborneFlight(
        bottomAltitudeMock,
        airspaceCeilingMock,
        currentAltitudeMock,
        currentHeadingMock,
        currentSpeedMock
    );

    t.true(mcp.altitude === bottomAltitudeMock);
    t.true(mcp.altitudeMode === MCP_MODE.ALTITUDE.VNAV);
    t.true(mcp.heading === currentHeadingMock);
    t.true(mcp.headingMode === MCP_MODE.HEADING.LNAV);
    t.true(mcp.speed === currentSpeedMock);
    t.true(mcp.speedMode === MCP_MODE.SPEED.VNAV);
});

ava('.initializeForAirborneFlight() sets MCP for arrival descending from above airspace ceiling (not via STAR)', (t) => {
    const mcp = new ModeController();
    const bottomAltitudeMock = -1;
    const airspaceCeilingMock = 12000;
    const currentAltitudeMock = 21000;
    const currentHeadingMock = Math.PI;
    const currentSpeedMock = 290;

    mcp.initializeForAirborneFlight(
        bottomAltitudeMock,
        airspaceCeilingMock,
        currentAltitudeMock,
        currentHeadingMock,
        currentSpeedMock
    );

    t.true(mcp.altitude === airspaceCeilingMock);
    t.true(mcp.altitudeMode === MCP_MODE.ALTITUDE.HOLD);
    t.true(mcp.heading === currentHeadingMock);
    t.true(mcp.headingMode === MCP_MODE.HEADING.LNAV);
    t.true(mcp.speed === currentSpeedMock);
    t.true(mcp.speedMode === MCP_MODE.SPEED.VNAV);
});

ava('.initializeForAirborneFlight() sets MCP for arrival spawning below airspace ceiling ', (t) => {
    const mcp = new ModeController();
    const bottomAltitudeMock = -1;
    const airspaceCeilingMock = 12000;
    const currentAltitudeMock = 9000;
    const currentHeadingMock = Math.PI;
    const currentSpeedMock = 290;

    mcp.initializeForAirborneFlight(
        bottomAltitudeMock,
        airspaceCeilingMock,
        currentAltitudeMock,
        currentHeadingMock,
        currentSpeedMock
    );

    t.true(mcp.altitude === currentAltitudeMock);
    t.true(mcp.altitudeMode === MCP_MODE.ALTITUDE.HOLD);
    t.true(mcp.heading === currentHeadingMock);
    t.true(mcp.headingMode === MCP_MODE.HEADING.LNAV);
    t.true(mcp.speed === currentSpeedMock);
    t.true(mcp.speedMode === MCP_MODE.SPEED.VNAV);
});

ava('._setModeSelectorMode() sets modeSelector to the specified mode', (t) => {
    const mcp = new ModeController();

    mcp._setModeSelectorMode(MCP_MODE_NAME.SPEED, MCP_MODE.SPEED.VNAV);

    t.true(mcp.speedMode === MCP_MODE.SPEED.VNAV);
});

ava('._setFieldValue() sets field to the specified value', (t) => {
    const speedMock = 325;
    const mcp = new ModeController();

    mcp._setFieldValue(MCP_FIELD_NAME.SPEED, speedMock);

    t.true(mcp.speed === speedMock);
});

ava('.setAltitudeApproach() sets altitude mode to approach', (t) => {
    const mcp = new ModeController();

    mcp.setAltitudeApproach();

    t.true(mcp.altitudeMode === MCP_MODE.ALTITUDE.APPROACH);
});

ava('.setAltitudeHold() sets altitude mode to hold', (t) => {
    const mcp = new ModeController();

    mcp.setAltitudeHold();

    t.true(mcp.altitudeMode === MCP_MODE.ALTITUDE.HOLD);
});

ava('.setAltitudeVnav() sets altitude mode to VNAV', (t) => {
    const mcp = new ModeController();

    mcp.setAltitudeVnav();

    t.true(mcp.altitudeMode === MCP_MODE.ALTITUDE.VNAV);
});

ava('.setAltitudeFieldValue() sets the value of the altitude field', (t) => {
    const altitudeMock = 5500;
    const mcp = new ModeController();

    mcp.setAltitudeFieldValue(altitudeMock);

    t.true(mcp.altitude === altitudeMock);
});

ava('.setCourseFieldValue() sets the value of the course field', (t) => {
    const mcp = new ModeController();

    mcp.setCourseFieldValue(headingOrCourseMock);

    t.true(mcp.course === headingOrCourseMock);
});

ava('.setHeadingHold() sets the heading mode to hold', (t) => {
    const mcp = new ModeController();

    mcp.setHeadingHold();

    t.true(mcp.headingMode === MCP_MODE.HEADING.HOLD);
});

ava('.setHeadingLnav() sets the heading mode to LNAV', (t) => {
    const mcp = new ModeController();

    mcp.setHeadingLnav();

    t.true(mcp.headingMode === MCP_MODE.HEADING.LNAV);
});

ava('.setHeadingVorLoc() sets the heading mode to VOR_LOC', (t) => {
    const mcp = new ModeController();

    mcp.setHeadingVorLoc();

    t.true(mcp.headingMode === MCP_MODE.HEADING.VOR_LOC);
});

ava('.setHeadingFieldValue() sets the value of the heading field', (t) => {
    const mcp = new ModeController();

    mcp.setHeadingFieldValue(headingOrCourseMock);

    t.true(mcp.heading === headingOrCourseMock);
});

ava('.setSpeedHold() sets the heading mode to hold', (t) => {
    const mcp = new ModeController();

    mcp.setSpeedHold();

    t.true(mcp.speedMode === MCP_MODE.SPEED.HOLD);
});

ava('.setSpeedN1() sets the heading mode to N1', (t) => {
    const mcp = new ModeController();

    mcp.setSpeedN1();

    t.true(mcp.speedMode === MCP_MODE.SPEED.N1);
});

ava('.setSpeedVnav() sets the heading mode to VNAV', (t) => {
    const mcp = new ModeController();

    mcp.setSpeedVnav();

    t.true(mcp.speedMode === MCP_MODE.SPEED.VNAV);
});
