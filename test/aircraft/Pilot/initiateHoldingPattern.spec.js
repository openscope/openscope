import ava from 'ava';
import sinon from 'sinon';
// import _isArray from 'lodash/isArray';
import _isEqual from 'lodash/isEqual';
// import _isObject from 'lodash/isObject';

import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import {
    fmsArrivalFixture,
    modeControllerFixture
} from '../../fixtures/aircraftFixtures';

// const currentPositionMock = [0, 0];
// const currentHeadingMock = 3.3674436372440057;
const inboundHeadingMock = -1.62476729292438;
const turnDirectionMock = 'right';
const legLengthMock = '1min';
const fixnameMock = 'COWBY';
const holdFixLocation = [113.4636606631233, 6.12969620221002];

ava('.initiateHoldingPattern() returns error response when #holdFixLocation is undefined', (t) => {
    const expectedResult = [false, 'unable to find fix COWBY'];
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    const result = pilot.initiateHoldingPattern(
        inboundHeadingMock,
        turnDirectionMock,
        legLengthMock,
        fixnameMock,
        null
    );

    t.deepEqual(result, expectedResult);
});

ava('.initiateHoldingPattern() when fixname is null calls .createLegWithHoldingPattern() with GPS as the fixname', (t) => {
    const expectedResult = [
        -1.62476729292438,
        'right',
        '1min',
        'GPS',
        [113.4636606631233, 6.12969620221002]
    ];
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    const createLegWithHoldingPatternSpy = sinon.spy(pilot._fms, 'createLegWithHoldingPattern');

    pilot.initiateHoldingPattern(
        inboundHeadingMock,
        turnDirectionMock,
        legLengthMock,
        null,
        holdFixLocation
    );

    t.true(_isEqual(createLegWithHoldingPatternSpy.getCall(0).args, expectedResult));
    t.true(pilot._fms.currentWaypoint.name === 'gps');
});

ava('.initiateHoldingPattern() returns a success message when passed a fixName', (t) => {
    const expectedResult = [true, 'proceed direct COWBY and hold inbound, right turns, 1min legs'];
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    const result = pilot.initiateHoldingPattern(
        inboundHeadingMock,
        turnDirectionMock,
        legLengthMock,
        fixnameMock,
        holdFixLocation
    );

    t.deepEqual(result, expectedResult);
});

ava('.initiateHoldingPattern() returns a success message when passed a null fixName', (t) => {
    const expectedResult = [true, 'hold east of present position, right turns, 1min legs'];
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    const result = pilot.initiateHoldingPattern(
        inboundHeadingMock,
        turnDirectionMock,
        legLengthMock,
        null,
        holdFixLocation
    );

    t.deepEqual(result, expectedResult);
});
