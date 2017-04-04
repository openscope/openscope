/* eslint-disable arrow-parens, max-len, import/no-extraneous-dependencies*/
import ava from 'ava';
import { isEmptyObject,
         isEmptyObjectAndNotArray
 } from '../../src/assets/scripts/client/utilities/validatorUtilities';

ava('.isEmptyObject() returns false when passed an non object', (t) => {
    t.false(isEmptyObject('threeve'));
    t.false(isEmptyObject(false));
    t.false(isEmptyObject(true));
    t.false(isEmptyObject(42));
    t.false(isEmptyObject(undefined));
});

ava('.isEmptyObject() returns false when passed an object with properties', (t) => {
    t.true(isEmptyObject({
        a: 'threeve',
        b: 42,
        c: false
    }));
});

ava('.isEmptyObject() returns true when passed an empty object', (t) => {
    t.false(isEmptyObject({}));
    t.false(isEmptyObject([]));
    t.false(isEmptyObject(null));
});

ava('.isEmptyObjectAndNotArray() returns false when passed an non object', (t) => {
    t.false(isEmptyObjectAndNotArray('threeve'));
    t.false(isEmptyObjectAndNotArray(false));
    t.false(isEmptyObjectAndNotArray(true));
    t.false(isEmptyObjectAndNotArray(42));
    t.false(isEmptyObjectAndNotArray(undefined));
});

ava('.isEmptyObjectAndNotArray() returns false when passed an object with properties', (t) => {
    t.true(isEmptyObjectAndNotArray({
        a: 'threeve',
        b: 42,
        c: false
    }));
});

ava('.isEmptyObjectAndNotArray() returns true when passed an empty object that is not an array', (t) => {
    t.false(isEmptyObjectAndNotArray({}));
    t.false(isEmptyObjectAndNotArray(null));
});

ava('.isEmptyObjectAndNotArray() returns true when passed an array that is not empty', (t) => {
    t.false(isEmptyObjectAndNotArray([1, 2, 3]));
});
