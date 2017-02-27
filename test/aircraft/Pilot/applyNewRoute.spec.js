import ava from 'ava';
// import sinon from 'sinon';
// import _isArray from 'lodash/isArray';
// import _isEqual from 'lodash/isEqual';
// import _isObject from 'lodash/isObject';

import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import {
    fmsArrivalFixture,
    modeControllerFixture
} from '../../fixtures/aircraftFixtures';

const complexRouteString = 'COWBY..BIKKR..DAG.KEPEC3.KLAS';

ava('.applyNewRoute()', (t) => {
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    const result = pilot.applyNewRoute(complexRouteString);


});
