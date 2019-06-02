/* eslint-disable import/no-extraneous-dependencies, arrow-parens */
import ava from 'ava';

import {
    airlineNameAndFleetHelper,
    randomAirlineSelectionHelper
} from '../../src/assets/scripts/client/airline/airlineHelpers';

const AIRLINE_LIST_WITH_SEPERATOR_MOCK = [
    ['a7/fastGA', 4]
];

const AIRLINE_LIST_WITHOUT_SEPERATOR_MOCK = [
    ['aay', 15],
    ['aay', 15]
];

ava('.airlineNameAndFleetHelper() throws when called with an invalid parameter', t => {
    t.throws(() => airlineNameAndFleetHelper());
    t.throws(() => airlineNameAndFleetHelper({}));
    t.throws(() => airlineNameAndFleetHelper(''));
    t.throws(() => airlineNameAndFleetHelper(42));
    t.throws(() => airlineNameAndFleetHelper(false));
});

ava('.airlineNameAndFleetHelper() returns an object with two keys: name and fleet when an empty string is passed', t => {
    const result = airlineNameAndFleetHelper([]);

    t.true(typeof result === 'object');
    t.true(result.name === '');
    t.true(result.fleet === 'default');
});

ava('.airlineNameAndFleetHelper() returns default as the fleet when fleet is not present in original string', t => {
    const result = airlineNameAndFleetHelper(AIRLINE_LIST_WITHOUT_SEPERATOR_MOCK[0]);

    t.true(typeof result === 'object');
    t.true(result.name === 'aay');
    t.true(result.fleet === 'default');
});

ava('.airlineNameAndFleetHelper() returns an object with two keys: name and fleet when a string is passed', t => {
    const result = airlineNameAndFleetHelper(AIRLINE_LIST_WITH_SEPERATOR_MOCK[0]);

    t.true(typeof result === 'object');
    t.true(result.name === 'a7');
    t.true(result.fleet === 'fastGA');
});

ava('.airlineNameAndFleetHelper() returns name lowercase when it receives uppercase', t => {
    const airlineListMock = ['AAL', 14];
    const result = airlineNameAndFleetHelper(airlineListMock);

    t.true(typeof result === 'object');
    t.true(result.name === 'aal');
    t.true(result.fleet === 'default');
});

ava('.randomAirlineSelectionHelper() throws when called with an invalid parameter', t => {
    t.throws(() => randomAirlineSelectionHelper());
    t.throws(() => randomAirlineSelectionHelper({}));
    t.throws(() => randomAirlineSelectionHelper(''));
    t.throws(() => randomAirlineSelectionHelper(42));
    t.throws(() => randomAirlineSelectionHelper(false));

    t.notThrows(() => randomAirlineSelectionHelper([]));
});

ava('.randomAirlineSelectionHelper() returns an object with two keys: name and fleet when an empty array is passed', t => {
    const result = randomAirlineSelectionHelper([]);

    t.true(typeof result === 'object');
    t.true(result.name === '');
    t.true(result.fleet === '');
});

ava('.randomAirlineSelectionHelper() returns an object with two keys: name and fleet when passed aline with separator', t => {
    const result = randomAirlineSelectionHelper(AIRLINE_LIST_WITHOUT_SEPERATOR_MOCK);

    t.true(typeof result === 'object');
    t.true(result.name === 'aay');
    t.true(result.fleet === '');
});

ava('.randomAirlineSelectionHelper() returns an object with two keys: name and fleet', t => {
    const result = randomAirlineSelectionHelper(AIRLINE_LIST_WITH_SEPERATOR_MOCK);

    t.true(typeof result === 'object');
    t.true(result.name === 'a7');
    t.true(result.fleet === 'fastGA');
});
