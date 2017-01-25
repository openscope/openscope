import ava from 'ava';
import sinon from 'sinon';

import AirportController from '../../src/assets/scripts/client/airport/AirportController';
import { navigationLibraryFixture } from '../fixtures/navigationLibraryFixtures';

ava('throws when passed invalid parameters', (t) => {
    t.throws(() => new AirportController());
});
