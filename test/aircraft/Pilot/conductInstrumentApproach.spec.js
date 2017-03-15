import ava from 'ava';
// import sinon from 'sinon';
// import _isArray from 'lodash/isArray';
// import _isEqual from 'lodash/isEqual';
// import _isObject from 'lodash/isObject';
//
// import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
// import {
//     fmsArrivalFixture,
//     modeControllerFixture
// } from '../../fixtures/aircraftFixtures';
//
// const runwayMock = '19L';

ava.todo('.conductInstrumentApproach() returns error when no runway is provided');
ava.todo('.conductInstrumentApproach() calls .flyPresentHeading() if the mcp.headingMode !== HOLD');
ava.todo('.conductInstrumentApproach() calls .interceptCourseAndGlidepath() if the mcp.headingMode !== HOLD');
