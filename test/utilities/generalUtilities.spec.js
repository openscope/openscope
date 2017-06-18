import ava from 'ava';

import { leftPad } from '../../src/assets/scripts/client/utilities/generalUtilities';

const lengthMock = 3;

ava('.leftPad() returns a string prepended with zeros when value provided is less than length', (t) => {
    const result = leftPad(1, lengthMock);

    t.true(result === '001');
});

ava('.leftPad() returns original string when value.length is > length', (t) => {
    const result = leftPad(1234, lengthMock);

    t.true(result === '1234');
});

ava('.leftPad() returns original string when value.length === length', (t) => {
    const result = leftPad(123, lengthMock);

    t.true(result === '123');
});
