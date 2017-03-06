import ava from 'ava';

import Pilot from '../../../src/assets/scripts/client/aircraft/Pilot/Pilot';
import {
    fmsArrivalFixture,
    modeControllerFixture
} from '../../fixtures/aircraftFixtures';

ava('throws when instantiated without parameters', (t) => {
    t.throws(() => new Pilot());
    t.throws(() => new Pilot({}));
    t.throws(() => new Pilot([]));
    t.throws(() => new Pilot('threeve'));
    t.throws(() => new Pilot(42));
    t.throws(() => new Pilot(false));

    t.throws(() => new Pilot(modeControllerFixture, null));
    t.throws(() => new Pilot(modeControllerFixture, ''));
    t.throws(() => new Pilot(modeControllerFixture, {}));
});

ava('does not throw when passed valid parameters', (t) => {
    t.notThrows(() => new Pilot(modeControllerFixture, fmsArrivalFixture));
});

ava('.shouldExpediteAltitudeChange() sets #shouldExpediteAltitudeChange to true and responds with a success message', (t) => {
    const expectedResult = [true, 'expediting to assigned altitude'];
    const pilot = new Pilot(modeControllerFixture, fmsArrivalFixture);
    const result = pilot.shouldExpediteAltitudeChange();

    t.true(pilot._mcp.shouldExpediteAltitudeChange);
    t.deepEqual(result, expectedResult);
});
