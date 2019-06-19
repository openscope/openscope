import ava from 'ava';

import {
    radio_trend
} from '../../../src/assets/scripts/client/utilities/radioUtilities';

ava('.radio_trend() returns `descend and maintain` when measured > target', (t) => {
    t.true(radio_trend('altitude', 1, 0) === 'descend and maintain');
});

ava('.radio_trend() returns `climb and maintain` when measured < target', (t) => {
    t.true(radio_trend('altitude', 0, 1) === 'climb and maintain');
});

ava('.radio_trend() returns `maintain` when measured === target', (t) => {
    t.true(radio_trend('altitude', 0, 0) === 'maintain');
});

ava('.radio_trend() returns `reduce speed to` when measured > target', (t) => {
    t.true(radio_trend('speed', 1, 0) === 'reduce speed to');
});

ava('.radio_trend() returns `increase spped to` when measured < target', (t) => {
    t.true(radio_trend('speed', 0, 1) === 'increase speed to');
});

ava('.radio_trend() returns `maintain present speed of` when measured === target', (t) => {
    t.true(radio_trend('speed', 0, 0) === 'maintain present speed of');
});
