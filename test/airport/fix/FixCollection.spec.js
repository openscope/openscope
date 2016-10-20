import ava from 'ava';

import FixCollection from '../../../src/assets/scripts/airport/Fix/FixCollection';
import FixModel from '../../../src/assets/scripts/airport/Fix/FixModel';
import { airportPositionFixture } from '../../fixtures/airportFixtures';
import { FIX_LIST_MOCK } from './_mocks/fixMocks';


ava.serial('FixCollection throws when an attempt to instantiate is made', t => {
    t.throws(() => new FixCollection());

    t.true(FixCollection._id === '');
    t.true(FixCollection._items.length === 0);
    t.true(FixCollection.length === -1);
});

ava.serial('FixCollection sets its properties when it receives a valid fixList', t => {
    FixCollection.init(FIX_LIST_MOCK, airportPositionFixture);

    t.false(FixCollection._id === '');
    t.true(FixCollection._items.length > 0);
    t.true(FixCollection.length === FixCollection._items.length);
});

ava.serial('.addFixToCollection() throws if it doesnt receive a FixModel instance', t => {
    t.throws(() => FixCollection.addFixToCollection({}));
});

ava.serial('.findFixByName() returns a FixModel if it exists within the collection', t => {
    const result = FixCollection.findFixByName('BAKRR');

    t.true(result.name === 'BAKRR');
    t.true(result instanceof FixModel);
});

ava.serial('.findFixByName() returns null if a FixModel does not exist within the collection', t => {
    const result = FixCollection.findFixByName('');

    t.true(result === null);
});

ava.serial('.findRealFixes() returns a list of fixes that dont have `_` prepedning thier name', t => {
    const result = FixCollection.findRealFixes();

    t.true(result.length === 104);
});
