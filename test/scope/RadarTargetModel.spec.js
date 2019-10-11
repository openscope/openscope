import ava from 'ava';
import sinon from 'sinon';
import EventBus from '../../src/assets/scripts/client/lib/EventBus';
import RadarTargetModel from '../../src/assets/scripts/client/scope/RadarTargetModel';
import {
    ARRIVAL_AIRCRAFT_MODEL_MOCK,
    ARRIVAL_AIRCRAFT_MODEL_MOCK_HEAVY,
    ARRIVAL_AIRCRAFT_MODEL_MOCK_SUPER,
    DEPARTURE_AIRCRAFT_MODEL_MOCK
} from '../aircraft/_mocks/aircraftMocks';
import { INVALID_NUMBER } from '../../src/assets/scripts/client/constants/globalConstants';
import { THEME } from '../../src/assets/scripts/client/constants/themes';

let sandbox; // using the sinon sandbox ensures stubs are restored after each test

ava.beforeEach(() => {
    sandbox = sinon.createSandbox();
});

ava.afterEach(() => {
    sandbox.restore();
});

ava('throws when called to instantiate with no parameters', (t) => {
    t.throws(() => new RadarTargetModel());
});

ava('initializes correctly when called to instantiate with correct parameters', (t) => {
    const model = new RadarTargetModel(THEME.DEFAULT, ARRIVAL_AIRCRAFT_MODEL_MOCK);

    t.deepEqual(model.aircraftModel, ARRIVAL_AIRCRAFT_MODEL_MOCK);
    t.true(model._cruiseAltitude === 28000);
    t.true(model._dataBlockLeaderDirection === THEME.DEFAULT.DATA_BLOCK.LEADER_DIRECTION);
    t.true(model._dataBlockLeaderLength === THEME.DEFAULT.DATA_BLOCK.LEADER_LENGTH);
    t.deepEqual(model._eventBus, EventBus);
    t.true(model._hasFullDataBlock === true);
    t.true(model._haloRadius === INVALID_NUMBER);
    t.true(model._hasSuppressedDataBlock === false);
    t.true(model._interimAltitude === INVALID_NUMBER);
    t.true(model._isUnderOurControl === true);
    t.true(model._routeString === 'DAG.KEPEC3.KLAS07R');
    t.true(model._scratchPadText === 'LAS');
    t.true(model._theme === THEME.DEFAULT);
});

ava('#dataBlockLeaderDirection returns appropriate value', (t) => {
    const model = new RadarTargetModel(THEME.DEFAULT, ARRIVAL_AIRCRAFT_MODEL_MOCK);

    t.true(model.dataBlockLeaderDirection === model._dataBlockLeaderDirection);
});

ava('#dataBlockLeaderLength returns appropriate value', (t) => {
    const model = new RadarTargetModel(THEME.DEFAULT, ARRIVAL_AIRCRAFT_MODEL_MOCK);

    t.true(model.dataBlockLeaderLength === model._dataBlockLeaderLength);
});

ava('#positionModel returns appropriate value', (t) => {
    const model = new RadarTargetModel(THEME.DEFAULT, ARRIVAL_AIRCRAFT_MODEL_MOCK);

    t.deepEqual(model.positionModel, model.aircraftModel.positionModel);
});

ava('#indicatedAltitude returns appropriate value', (t) => {
    const model = new RadarTargetModel(THEME.DEFAULT, ARRIVAL_AIRCRAFT_MODEL_MOCK);

    t.true(model.indicatedAltitude === model.aircraftModel.altitude);
});

ava('.amendAltitude() sets #_cruiseAltitude to the specified altitude', (t) => {
    const model = new RadarTargetModel(THEME.DEFAULT, ARRIVAL_AIRCRAFT_MODEL_MOCK);
    const expectedResponse = [true, 'AMEND ALTITUDE'];
    const newAltitude = 210;

    const response = model.amendAltitude(newAltitude);

    t.deepEqual(response, expectedResponse);
    t.true(model._cruiseAltitude === newAltitude);
});

ava('.markAsNotOurControl() sets #_isUnderOurControl to false', (t) => {
    const model = new RadarTargetModel(THEME.DEFAULT, ARRIVAL_AIRCRAFT_MODEL_MOCK);

    model.markAsNotOurControl();

    t.false(model._isUnderOurControl);
});

ava('.markAsOurControl() sets #_isUnderOurControl to false', (t) => {
    const model = new RadarTargetModel(THEME.DEFAULT, ARRIVAL_AIRCRAFT_MODEL_MOCK);

    model.markAsOurControl();

    t.true(model._isUnderOurControl);
});

ava('.moveDataBlock() returns syntax error when no arguments provided', (t) => {
    const model = new RadarTargetModel(THEME.DEFAULT, ARRIVAL_AIRCRAFT_MODEL_MOCK);
    const expectedResponse = [false, 'ERR: BAD SYNTAX'];
    const response = model.moveDataBlock('');

    t.deepEqual(response, expectedResponse);
    t.true(model._dataBlockLeaderDirection === THEME.DEFAULT.DATA_BLOCK.LEADER_DIRECTION);
    t.true(model._dataBlockLeaderLength === THEME.DEFAULT.DATA_BLOCK.LEADER_LENGTH);
});

ava('.moveDataBlock() returns syntax error when invalid direction provided', (t) => {
    const model = new RadarTargetModel(THEME.DEFAULT, ARRIVAL_AIRCRAFT_MODEL_MOCK);
    const expectedResponse = [false, 'ERR: BAD SYNTAX'];
    const response = model.moveDataBlock('0');

    t.deepEqual(response, expectedResponse);
    t.true(model._dataBlockLeaderDirection === THEME.DEFAULT.DATA_BLOCK.LEADER_DIRECTION);
    t.true(model._dataBlockLeaderLength === THEME.DEFAULT.DATA_BLOCK.LEADER_LENGTH);
});

ava('.moveDataBlock() returns error when a leader length greater than 6 is requested', (t) => {
    const model = new RadarTargetModel(THEME.DEFAULT, ARRIVAL_AIRCRAFT_MODEL_MOCK);
    const expectedResponse = [false, 'ERR: LEADER LENGTH 0-6 ONLY'];
    const response = model.moveDataBlock('/7');

    t.deepEqual(response, expectedResponse);
    t.true(model._dataBlockLeaderDirection === THEME.DEFAULT.DATA_BLOCK.LEADER_DIRECTION);
    t.true(model._dataBlockLeaderLength === THEME.DEFAULT.DATA_BLOCK.LEADER_LENGTH);
});

ava('.moveDataBlock() correctly sets properties when only a direction is provided', (t) => {
    const model = new RadarTargetModel(THEME.DEFAULT, ARRIVAL_AIRCRAFT_MODEL_MOCK);
    const expectedResponse = [true, 'ADJUST DATA BLOCK'];
    const response = model.moveDataBlock('1');

    t.deepEqual(response, expectedResponse);
    t.true(model._dataBlockLeaderDirection === 225);
    t.true(model._dataBlockLeaderLength === THEME.DEFAULT.DATA_BLOCK.LEADER_LENGTH);
});

ava('.moveDataBlock() correctly sets properties when only a length is provided', (t) => {
    const model = new RadarTargetModel(THEME.DEFAULT, ARRIVAL_AIRCRAFT_MODEL_MOCK);
    const expectedResponse = [true, 'ADJUST DATA BLOCK'];
    const response = model.moveDataBlock('/3');

    t.deepEqual(response, expectedResponse);
    t.true(model._dataBlockLeaderDirection === THEME.DEFAULT.DATA_BLOCK.LEADER_DIRECTION);
    t.true(model._dataBlockLeaderLength === 3);
});

ava('.moveDataBlock() correctly sets properties when both a direction and length are provided', (t) => {
    const model = new RadarTargetModel(THEME.DEFAULT, ARRIVAL_AIRCRAFT_MODEL_MOCK);
    const expectedResponse = [true, 'ADJUST DATA BLOCK'];
    const response = model.moveDataBlock('3/2');

    t.deepEqual(response, expectedResponse);
    t.true(model._dataBlockLeaderDirection === 135);
    t.true(model._dataBlockLeaderLength === 2);
});

ava('.setScratchpad() sets #_scratchPadText to the specified string', (t) => {
    const model = new RadarTargetModel(THEME.DEFAULT, ARRIVAL_AIRCRAFT_MODEL_MOCK);
    const expectedResponse = [true, 'SET SCRATCHPAD'];
    const newScratchPadText = 'V6R';

    const response = model.setScratchpad(newScratchPadText);

    t.deepEqual(response, expectedResponse);
    t.true(model._scratchPadText === newScratchPadText);
});

ava('.setHalo() sets halo radius correctly when no halo previously existed', (t) => {
    const radarTargetModel = new RadarTargetModel(THEME.DEFAULT, ARRIVAL_AIRCRAFT_MODEL_MOCK);
    const expectedResponse = [true, 'TOGGLE HALO'];
    const response = radarTargetModel.setHalo(7);

    t.deepEqual(response, expectedResponse);
    t.true(radarTargetModel._haloRadius === 7);
});

ava('.setHalo() adjusts halo radius correctly when a halo previously existed', (t) => {
    const radarTargetModel = new RadarTargetModel(THEME.DEFAULT, ARRIVAL_AIRCRAFT_MODEL_MOCK);

    radarTargetModel._haloRadius = 5;

    const expectedResponse = [true, 'ADJUST HALO'];
    const response = radarTargetModel.setHalo(7);

    t.deepEqual(response, expectedResponse);
    t.true(radarTargetModel._haloRadius === 7);
});

ava('.setHalo() calls .removeHalo() when a halo is requested of the same radius as the existing', (t) => {
    const radarTargetModel = new RadarTargetModel(THEME.DEFAULT, ARRIVAL_AIRCRAFT_MODEL_MOCK);
    const removeHaloStub = sinon.stub(radarTargetModel, 'removeHalo');

    radarTargetModel._haloRadius = 7;

    const expectedResponse = undefined;
    const response = radarTargetModel.setHalo(7);

    t.true(response === expectedResponse);
    t.true(removeHaloStub.calledWithExactly());
});

ava('._initializeScratchPad() sets #_scratchPadText to show aircraft\'s destination', (t) => {
    const model = new RadarTargetModel(THEME.DEFAULT, ARRIVAL_AIRCRAFT_MODEL_MOCK);
    const expectedValue = model.aircraftModel.destination.substr(1);

    model._initializeScratchPad();

    t.true(model._scratchPadText === expectedValue);
});

ava('._initializeScratchPad() sets #_scratchPadText to departure exit fix when aircraft is on departure route', (t) => {
    const model = new RadarTargetModel(THEME.DEFAULT, DEPARTURE_AIRCRAFT_MODEL_MOCK);
    const expectedValue = 'GUP';

    model._initializeScratchPad();

    t.true(model._scratchPadText === expectedValue);
});

ava('._initializeScratchPad() sets #_scratchPadText to arrival airport when aircraft is on arrival route', (t) => {
    const model = new RadarTargetModel(THEME.DEFAULT, ARRIVAL_AIRCRAFT_MODEL_MOCK);
    const expectedValue = 'LAS';

    model._initializeScratchPad();

    t.true(model._scratchPadText === expectedValue);
});

ava('._setTheme returns early when an invalid theme name is passed', (t) => {
    const model = new RadarTargetModel(THEME.DEFAULT, ARRIVAL_AIRCRAFT_MODEL_MOCK);
    const themeName = 'great googly moogly!';

    model._setTheme(themeName);

    t.true(model._theme === THEME.DEFAULT);
});

ava('._setTheme() changes the value of #_theme', (t) => {
    const model = new RadarTargetModel(THEME.DEFAULT, ARRIVAL_AIRCRAFT_MODEL_MOCK);
    const themeName = 'CLASSIC';

    model._setTheme(themeName);

    t.true(model._theme === THEME.CLASSIC);
});

ava('.buildDataBlockRowOne() creates correct first row for Large', (t) => {
    const model = new RadarTargetModel(THEME.DEFAULT, ARRIVAL_AIRCRAFT_MODEL_MOCK);
    const expectedValue = 'AAL432';

    t.true(model.buildDataBlockRowOne() === expectedValue);
});

ava('.buildDataBlockRowOne() creates correct first row for Heavy', (t) => {
    const model = new RadarTargetModel(THEME.DEFAULT, ARRIVAL_AIRCRAFT_MODEL_MOCK_HEAVY);
    const expectedValue = 'UAL99 H';

    t.true(model.buildDataBlockRowOne() === expectedValue);
});

ava('.buildDataBlockRowOne() creates correct first row for Super', (t) => {
    const model = new RadarTargetModel(THEME.DEFAULT, ARRIVAL_AIRCRAFT_MODEL_MOCK_SUPER);
    const expectedValue = 'UAE11 J';

    t.true(model.buildDataBlockRowOne() === expectedValue);
});
