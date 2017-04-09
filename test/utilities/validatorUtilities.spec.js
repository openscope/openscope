/* eslint-disable arrow-parens, max-len, import/no-extraneous-dependencies*/
import ava from 'ava';
import { isEmptyObject,
         isEmptyOrNotArray
 } from '../../src/assets/scripts/client/utilities/validatorUtilities';

ava('.isEmptyObject() returns false when passed an non object', (t) => {
    t.false(isEmptyObject('threeve'));
    t.false(isEmptyObject(false));
    t.false(isEmptyObject(true));
    t.false(isEmptyObject(42));
    t.false(isEmptyObject(undefined));
    t.false(isEmptyObject(null));
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

ava('.isEmptyOrNotArray() returns false when passed an non Array', (t) => {
    t.false(isEmptyOrNotArray('threeve'));
    t.false(isEmptyOrNotArray(false));
    t.false(isEmptyOrNotArray(true));
    t.false(isEmptyOrNotArray(42));
    t.false(isEmptyOrNotArray(undefined));
    t.false(isEmptyOrNotArray({}));
});

ava('.isEmptyOrNotArray returns true when passed an empty object', (t) => {
    t.true(isEmptyOrNotArray({}));
    t.true(isEmptyObject([]));
    t.true(isEmptyObject(null));
});

ava('.isEmptyOrNotArray return false when passed an array with arguments', (t) => {
    t.false(isEmptyOrNotArray([1, 2, 3]));
});

ava('.isEmptyOrNotArray() returns true when passed an object with properties', (t) => {
    t.true(isEmptyOrNotArray({
        a: 'threeve',
        b: 42,
        c: false
    }));
});
