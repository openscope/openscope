import ava from 'ava';

import { getGrouping } from '../../../src/assets/scripts/client/utilities/radioUtilities';

ava('getGrouping() returns appropriate string for "00"', (t) => {
    t.true(getGrouping('00') === 'hundred');
});

ava('getGrouping() returns appropriate string for "05"', (t) => {
    t.true(getGrouping('05') === 'zero five');
});

ava('getGrouping() returns appropriate string for "10"', (t) => {
    t.true(getGrouping('10') === 'ten');
});

ava('getGrouping() returns appropriate string for "17"', (t) => {
    t.true(getGrouping('17') === 'seventeen');
});

ava('getGrouping() returns appropriate string for "30"', (t) => {
    t.true(getGrouping('30') === 'thirty');
});

ava('getGrouping() returns appropriate string for "31"', (t) => {
    t.true(getGrouping('31') === 'thirty one');
});
