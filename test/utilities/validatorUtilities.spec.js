/* eslint-disable arrow-parens, max-len, import/no-extraneous-dependencies*/
import ava from 'ava';
import {
    isEmptyOrNotObject,
    isEmptyOrNotArray
} from '../../src/assets/scripts/client/utilities/validatorUtilities';

ava('.isEmptyOrNotObject() returns true when passed a non object', (t) => {
    t.true(isEmptyOrNotObject());
    t.true(isEmptyOrNotObject(null));
    t.true(isEmptyOrNotObject(42));
    t.true(isEmptyOrNotObject('threeve'));
    t.true(isEmptyOrNotObject(false));
});

ava('.isEmptyOrNotObject returns true when passed an empty object', (t) => {
    t.true(isEmptyOrNotObject({}));
    t.true(isEmptyOrNotObject([]));
});

ava('.isEmptyOrNotObject() returns false when passed a non-empty object', (t) => {
    t.false(isEmptyOrNotObject([1, 2, 3]));
    t.false(isEmptyOrNotObject({
        a: 'threeve',
        b: 42,
        c: false
    }));
});

ava('.isEmptyOrNotArray() returns true when passed a non array', (t) => {
    t.true(isEmptyOrNotArray());
    t.true(isEmptyOrNotArray(null));
    t.true(isEmptyOrNotArray({}));
    t.true(isEmptyOrNotArray(42));
    t.true(isEmptyOrNotArray('threeve'));
    t.true(isEmptyOrNotArray(false));
});

ava('.isEmptyOrNotArray returns true when passed an empty array', (t) => {
    t.true(isEmptyOrNotArray([]));
});

ava('.isEmptyOrNotArray return false when passed an array with values', (t) => {
    t.false(isEmptyOrNotArray([1, 2, 3]));
});

ava('.isEmptyOrNotArray() returns true when passed an object with properties', (t) => {
    t.true(isEmptyOrNotArray({
        a: 'threeve',
        b: 42,
        c: false
    }));
});
