/* eslint-disable arrow-parens, max-len, import/no-extraneous-dependencies*/
import ava from 'ava';
import {
    isEmptyObject,
    isEmptyOrNotObject,
    isEmptyOrNotArray
} from '../../src/assets/scripts/client/utilities/validatorUtilities';

ava('.isEmptyObject() returns false when passed an non object', (t) => {
    t.false(isEmptyObject('threeve'));
    t.false(isEmptyObject(false));
    t.false(isEmptyObject(true));
    t.false(isEmptyObject(42));
    t.false(isEmptyObject(undefined));
});

ava('.isEmptyObject() returns false when passed an object with properties', (t) => {
    t.false(isEmptyObject({
        a: 'threeve',
        b: 42,
        c: false
    }));
});

ava('.isEmptyObject() returns true when passed an empty object', (t) => {
    t.true(isEmptyObject({}));
    t.true(isEmptyObject([]));
});

ava('.isEmptyOrNotObject() returns true when passed an non object', (t) => {
    t.true(isEmptyOrNotObject('threeve'));
    t.true(isEmptyOrNotObject(false));
    t.true(isEmptyOrNotObject(true));
    t.true(isEmptyOrNotObject(42));
    t.true(isEmptyOrNotObject(undefined));
    t.true(isEmptyOrNotObject({}));
});

ava('.isEmptyOrNotObject returns true when passed an empty object', (t) => {
    t.true(isEmptyOrNotObject({}));
    t.true(isEmptyOrNotObject([]));
    t.true(isEmptyOrNotObject(null));
});

ava('.isEmptyOrNotObject() returns false when passed a non-empty object', (t) => {
    t.false(isEmptyOrNotObject([1, 2, 3]));
    t.false(isEmptyOrNotObject({
        a: 'threeve',
        b: 42,
        c: false
    }));
});

ava('.isEmptyOrNotArray() returns true when passed an non Array', (t) => {
    t.true(isEmptyOrNotArray('threeve'));
    t.true(isEmptyOrNotArray(false));
    t.true(isEmptyOrNotArray(true));
    t.true(isEmptyOrNotArray(42));
    t.true(isEmptyOrNotArray(undefined));
    t.true(isEmptyOrNotArray({}));
});

ava('.isEmptyOrNotArray returns true when passed an empty object', (t) => {
    t.true(isEmptyOrNotArray({}));
    t.true(isEmptyOrNotArray([]));
    t.true(isEmptyOrNotArray(null));
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
