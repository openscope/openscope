/* eslint-disable import/no-extraneous-dependencies, arrow-parens */
import ava from 'ava';
import _isEqual from 'lodash/isEqual';

import FixCollection from '../../../src/assets/scripts/client/navigationLibrary/Fix/FixCollection';
import FixModel from '../../../src/assets/scripts/client/navigationLibrary/Fix/FixModel';
import { airportPositionFixtureKSFO } from '../../fixtures/airportFixtures';
import {
    FIX_LIST_MOCK,
    SMALL_FIX_LIST_MOCK
} from '../Fix/_mocks/fixMocks';

ava.before(() => {
    FixCollection.removeItems();
});

ava.after(() => {
    FixCollection.removeItems();
});

ava.serial('FixCollection throws when an attempt to instantiate is made with invalid params', t => {
    t.throws(() => new FixCollection());

    t.true(FixCollection._items.length === 0);
    t.true(FixCollection.length === 0);
});

ava.serial('FixCollection sets its properties when it receives a valid fixList', t => {
    FixCollection.addItems(FIX_LIST_MOCK, airportPositionFixtureKSFO);

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

ava.serial('.findFixByName() returns a FixMode if it exists within the collection and is passed as lowercase', t => {
    const result = FixCollection.findFixByName('bakrr');

    t.true(result.name === 'BAKRR');
    t.true(result instanceof FixModel);
});

ava.serial('.findFixByName() returns a FixMode if it exists within the collection and is passed as mixed case', t => {
    const result = FixCollection.findFixByName('bAkRr');

    t.true(result.name === 'BAKRR');
    t.true(result instanceof FixModel);
});

ava.serial('.findFixByName() returns null if a FixModel does not exist within the collection', t => {
    const result = FixCollection.findFixByName('');

    t.true(result === null);
});

ava.serial('.getFixRelativePosition() returns the position of a FixModel', t => {
    const result = FixCollection.getFixRelativePosition('BAKRR');
    const expectedResult = [675.477318026648, -12.012221291734532];

    t.true(_isEqual(result, expectedResult));
});

ava.serial('.getFixRelativePosition() returns null if a FixModel does not exist within the collection', t => {
    const result = FixCollection.getFixRelativePosition('');

    t.true(result === null);
});

ava.serial('.findRealFixes() returns a list of fixes that dont have `_` prepending thier name', t => {
    const result = FixCollection.findRealFixes();

    t.true(result.length === 104);
});

ava.serial('.addItems() resets _items when it is called with an existing collection', t => {
    t.true(FixCollection.length === 105);

    FixCollection.addItems(SMALL_FIX_LIST_MOCK);

    t.false(FixCollection.length === 105);
    t.true(FixCollection.length === 2);
});
