/* eslint-disable import/no-extraneous-dependencies, arrow-parens */
import ava from 'ava';

import {
    airlineNameAndFleetHelper,
    randomAirlineSelectionHelper,
} from '../../src/assets/scripts/client/airline/randomAirlineSelectionHelper';

const AIRLINE_LIST_WITH_SEPERATOR_MOCK = [
    ['aca/long', 4],
    ['aca/long', 4]
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

    t.notThrows(() => airlineNameAndFleetHelper([]));
});

ava('.airlineNameAndFleetHelper() returns an object with two keys: name and fleet when an empty string is passed', t => {
    const result = airlineNameAndFleetHelper([]);

    t.true(typeof result === 'object');
    t.true(result.name === '');
    t.true(result.fleet === '');
});

ava('.airlineNameAndFleetHelper() returns an object with two keys: name and fleet when a string is passed', t => {
    const result = airlineNameAndFleetHelper(AIRLINE_LIST_WITH_SEPERATOR_MOCK[0]);

    t.true(typeof result === 'object');
    t.true(result.name === 'aca');
    t.true(result.fleet === 'long');
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

ava('.randomAirlineSelectionHelper() returns an object with two keys: name and fleet', t => {
    const result = randomAirlineSelectionHelper(AIRLINE_LIST_WITHOUT_SEPERATOR_MOCK);

    t.true(typeof result === 'object');
    t.true(result.name === 'aay');
    t.true(result.fleet === '');
});

ava('.randomAirlineSelectionHelper() returns an object with two keys: name and fleet', t => {
    const result = randomAirlineSelectionHelper(AIRLINE_LIST_WITH_SEPERATOR_MOCK);

    t.true(typeof result === 'object');
    t.true(result.name === 'aca');
    t.true(result.fleet === 'long');
});
