import ava from 'ava';
import sinon from 'sinon';
import _isArray from 'lodash/isArray';

import SidCollection from '../../../src/assets/scripts/airport/StandardRoute/SidCollection';
import { SID_LIST_MOCK } from './_mocks_/sidListMock';

ava('SidCollection does not throw when no parameters are passed', t => t.notThrows(() => new SidCollection()));

ava('SidCollection exits early when no paramaters are passed', t => {
    const collection = new SidCollection();

    t.true(typeof collection._sids === 'undefined');
});

ava('SidCollection adds a list of SIDs to the collection and updates the .length property', t => {
    const collection = new SidCollection(SID_LIST_MOCK);

    t.true(collection._sids.length === collection.length);
});

ava('SidCollection.getSID() returns a list of fixes that make up a SID when given an id, exit and runway paramater', t => {
    const collection = new SidCollection(SID_LIST_MOCK);
    const ID = 'SHEAD9';
    const EXIT = 'KENNO';
    const RUNWAY = '19R';

    const result = collection.getSID(ID, EXIT, RUNWAY);

    console.log(result);
    // t.true(_isArray(result));
});
