import ava from 'ava';

import ModeController from '../../../src/assets/scripts/client/aircraft/ModeControl/ModeController';
import {
    MCP_MODE,
    MCP_MODE_NAME,
    MCP_FIELD_NAME
} from '../../../src/assets/scripts/client/aircraft/ModeControl/modeControlConstants';

const mcp = new ModeController();

ava('does not throw when instantiated without parameters', (t) => {
    t.notThrows(() => new ModeController());
});

ava('does not throw when instantiated with parameters', (t) => {
    const isAircraftAirborne = true;

    t.notThrows(() => new ModeController(!isAircraftAirborne));
    t.notThrows(() => new ModeController(isAircraftAirborne));
});

ava('._setModeSelectorMode() sets modeSelector to the specified mode', (t) => {
    const speedModeMock = MCP_MODE.SPEED.VNAV;

    mcp._setModeSelectorMode(MCP_MODE_NAME.SPEED, speedModeMock);

    t.true(mcp.speedMode === MCP_MODE.SPEED.VNAV);
});

ava('._setFieldValue() sets field to the specified value', (t) => {
    const speedMock = 325;

    mcp._setFieldValue(MCP_FIELD_NAME.SPEED, speedMock);

    t.true(mcp.speed === speedMock);
});

ava('.setAltitudeApproach() sets altitude mode to approach', (t) => {
    mcp.setAltitudeApproach();

    t.true(mcp.altitudeMode === MCP_MODE.ALTITUDE.APPROACH);
});

ava('.setAltitudeHold() sets altitude mode to hold', (t) => {
    mcp.setAltitudeHold();

    t.true(mcp.altitudeMode === MCP_MODE.ALTITUDE.HOLD);
});

ava('.setAltitudeVnav() sets altitude mode to VNAV', (t) => {
    mcp.setAltitudeVnav();

    t.true(mcp.altitudeMode === MCP_MODE.ALTITUDE.VNAV);
});

ava('.setAltitudeFieldValue() sets the value of the altitude field', (t) => {
    const altitudeMock = 5500;

    mcp.setAltitudeFieldValue(altitudeMock);

    t.true(mcp.altitude === altitudeMock);
});

ava('.setCourseFieldValue() sets the value of the course field', (t) => {
    const courseMock = 125;

    mcp.setCourseFieldValue(courseMock);

    t.true(mcp.course === courseMock);
});

ava('.setHeadingHold() sets the heading mode to hold', (t) => {
    mcp.setHeadingHold();

    t.true(mcp.headingMode === MCP_MODE.HEADING.HOLD);
});

ava('.setHeadingLnav() sets the heading mode to LNAV', (t) => {
    mcp.setHeadingLnav();

    t.true(mcp.headingMode === MCP_MODE.HEADING.LNAV);
});

ava('.setHeadingVorLoc() sets the heading mode to VOR_LOC', (t) => {
    mcp.setHeadingVorLoc();

    t.true(mcp.headingMode === MCP_MODE.HEADING.VOR_LOC);
});

ava('.setHeadingFieldValue() sets the value of the heading field', (t) => {
    const headingMock = 310;

    mcp.setHeadingFieldValue(headingMock);

    t.true(mcp.heading === headingMock);
});

ava('.setSpeedHold() sets the heading mode to hold', (t) => {
    mcp.setSpeedHold();

    t.true(mcp.speedMode === MCP_MODE.SPEED.HOLD);
});

ava('.setSpeedN1() sets the heading mode to N1', (t) => {
    mcp.setSpeedN1();

    t.true(mcp.speedMode === MCP_MODE.SPEED.N1);
});

ava('.setSpeedVnav() sets the heading mode to VNAV', (t) => {
    mcp.setSpeedVnav();

    t.true(mcp.speedMode === MCP_MODE.SPEED.VNAV);
});
