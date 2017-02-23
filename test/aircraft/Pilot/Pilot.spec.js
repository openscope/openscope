import ava from 'ava';
import sinon from 'sinon';

import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import {
    fmsFixture,
    modeControllerFixture
} from '../../fixtures/aircraftFixtures';

ava('throws when instantiated with invalid parameters', (t) => {
    t.throws(() => new Pilot());
});

ava('.maintainAltitude() ', (t) => {
    const pilot = new Pilot(modeControllerFixture, fmsFixture);
    const result = pilot.maintainAltitude(5000, 13000, false, 2181, 19000, false);

    console.log(pilot);
    console.log('::: result', result);
});
