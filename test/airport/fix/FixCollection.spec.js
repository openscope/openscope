import ava from 'ava';

import FixCollection from '../../../src/assets/scripts/airport/Fix/FixCollection';
import FixModel from '../../../src/assets/scripts/airport/Fix/FixModel';
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

ava('.addFixToCollection() throws if it doesnt receive a FixModel instance', t => {
    const collection = new FixCollection(FIX_LIST, airportPositionFixture);

    t.throws(() => collection.addFixToCollection({}));
});

ava('.findFixByName() returns a FixModel if it exists within the collection', t => {
    const collection = new FixCollection(FIX_LIST, airportPositionFixture);
    const result = collection.findFixByName('BAKRR');

    t.true(result.name === 'BAKRR');
    t.true(result instanceof FixModel);
});

ava('.findFixByName() returns null if a FixModel does not exist within the collection', t => {
    const collection = new FixCollection(FIX_LIST, airportPositionFixture);
    const result = collection.findFixByName('');

    t.true(result === null);
});

ava('.findRealFixes() returns a list of fixes that dont have `_` prepedning thier name', t => {
    const collection = new FixCollection(FIX_LIST, airportPositionFixture);
    const result = collection.findRealFixes();

    t.true(result.length === 2);
    t.true(result[0].name === 'BAKRR');
    t.true(result[1].name === 'BCE');
});
