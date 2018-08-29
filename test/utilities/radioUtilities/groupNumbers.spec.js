import ava from 'ava';

import { groupNumbers } from '../../../src/assets/scripts/client/utilities/radioUtilities';

ava('groupNumbers() returns appropriate string for "5"', (t) => {
    t.true(groupNumbers('5') === 'five');
});

ava('groupNumbers() returns appropriate string for "10"', (t) => {
    t.true(groupNumbers('10') === 'ten');
});

ava('groupNumbers() returns appropriate string for "17"', (t) => {
    t.true(groupNumbers('17') === 'seventeen');
});

ava('groupNumbers() returns appropriate string for "30"', (t) => {
    t.true(groupNumbers('30') === 'thirty');
});

ava('groupNumbers() returns appropriate string for "31"', (t) => {
    t.true(groupNumbers('31') === 'thirty one');
});

ava('groupNumbers() returns appropriate string for "100"', (t) => {
    t.true(groupNumbers('100') === 'one hundred');
});

ava('groupNumbers() returns appropriate string for "107"', (t) => {
    t.true(groupNumbers('107') === 'one zero seven');
});

ava('groupNumbers() returns appropriate string for "112"', (t) => {
    t.true(groupNumbers('112') === 'one twelve');
});

ava('groupNumbers() returns appropriate string for "589"', (t) => {
    t.true(groupNumbers('589') === 'five eighty niner');
});

ava('groupNumbers() returns appropriate string for "1000"', (t) => {
    t.true(groupNumbers('1000') === 'one thousand');
});

ava('groupNumbers() returns appropriate string for "1008"', (t) => {
    t.true(groupNumbers('1008') === 'ten zero eight');
});

ava('groupNumbers() returns appropriate string for "1018"', (t) => {
    t.true(groupNumbers('1018') === 'ten eighteen');
});

ava('groupNumbers() returns appropriate string for "1020"', (t) => {
    t.true(groupNumbers('1020') === 'ten twenty');
});

ava('groupNumbers() returns appropriate string for "2216"', (t) => {
    t.true(groupNumbers('2216') === 'twenty two sixteen');
});

ava('groupNumbers() returns appropriate string for "3000"', (t) => {
    t.true(groupNumbers('3000') === 'three thousand');
});

ava('groupNumbers() returns appropriate string for "4000"', (t) => {
    t.true(groupNumbers('4000') === 'four thousand');
});

ava('groupNumbers() returns appropriate string for "5000"', (t) => {
    t.true(groupNumbers('5000') === 'five thousand');
});

ava('groupNumbers() returns appropriate string for "6641"', (t) => {
    t.true(groupNumbers('6641') === 'sixty six fourty one');
});
