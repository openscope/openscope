import ava from 'ava';

import FixCollection from '../../../src/assets/scripts/airport/Fix/FixCollection';
import { airportPositionFixture } from '../../fixtures/airportFixtures';
import { FIX_LIST } from './_mocks/fixMocks';

ava('FixCollection returns early when instantiated with invalid parameters', t => {
    t.notThrows(() => new FixCollection());
    const collection = new FixCollection();

    t.true(typeof collection._id === 'undefined');
    t.true(typeof collection._items === 'undefined');
});

ava('FixCollection accepts an object `fixList` as the only paramater', t => {
    t.notThrows(() => new FixCollection(FIX_LIST, airportPositionFixture));
});

ava('FixCollection sets its properties when it receives a valid fixList', t => {
    const collection = new FixCollection(FIX_LIST, airportPositionFixture);

    t.false(typeof collection._id === 'undefined');
    t.true(collection._items.length > 0);
    t.true(collection.length === collection._items.length);
});
