/* eslint-disable arrow-parens, import/no-extraneous-dependencies*/
import ava from 'ava';

import SidCollection from '../../../src/assets/scripts/airport/StandardRoute/SidCollection';
import { SID_LIST_MOCK, SID_WITHOUT_EXIT_MOCK } from './_mocks/sidMocks';

const ID = 'SHEAD9';
const EXIT = 'KENNO';
const RUNWAY = '19R';

ava('does not throw when no parameters are passed', t => t.notThrows(() => new SidCollection()));

ava('exits early when no paramaters are passed', t => {
    const collection = new SidCollection();

    t.true(typeof collection._sids === 'undefined');
});

ava('adds a list of SIDs to the collection and updates the .length property', t => {
    const collection = new SidCollection(SID_LIST_MOCK);

    t.true(collection._items.length === collection.length);
});

ava('.findFixesForSidByRunwayAndExit() returns a list of fixes that make up a SID when given an id, exit and runway paramater', t => {
    const collection = new SidCollection(SID_LIST_MOCK);
    const result = collection.findFixesForSidByRunwayAndExit(ID, EXIT, RUNWAY);

    t.true(result.length === 8);
});

ava('.findFixesForSidByRunwayAndExit() returns early when not provided an exit parameter', t => {
    const collection = new SidCollection(SID_LIST_MOCK);
    const result = collection.findFixesForSidByRunwayAndExit(null, EXIT, RUNWAY);

    t.true(typeof result === 'undefined');
});

// This test is inconsistent and may need to be refactored. It passes sometimes and fails other.
// ava.serial('.findRandomExitPointForSIDIcao() returns the name of a random exitPoint from within a SID route', t => {
//     const ICAO = 'COWBY6';
//     const possibleResults = ['DRK', 'GUP', 'INW'];
//     const collection = new SidCollection(SID_LIST_MOCK);
//     const result = collection.findRandomExitPointForSIDIcao(ICAO);
//
//     t.true(possibleResults.indexOf(result) !== -1);
// });

ava('.findRandomExitPointForSIDIcao() returns the name of this SID if no exitPoints exist', t => {
    const ICAO = 'TRALR6';
    const collection = new SidCollection(SID_WITHOUT_EXIT_MOCK);
    const result = collection.findRandomExitPointForSIDIcao(ICAO);

    t.true(result === ICAO);
});

ava('._addSidToCollection() throws if it doesnt receive a SidModel', t => {
    const collection = new SidCollection(SID_WITHOUT_EXIT_MOCK);

    t.throws(() => collection._addSidToCollection({}));
});
