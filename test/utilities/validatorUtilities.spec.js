/* eslint-disable arrow-parens, max-len, import/no-extraneous-dependencies*/
import ava from 'ava';
import { isEmptyObject,
         isEmptyObjectOrArray
 } from '../../src/assets/scripts/client/utilities/validatorUtilities';

ava('.isEmptyObject() returns false when passed an non object', (t) => {
    t.true(isEmptyObject('threeve'));
    t.true(isEmptyObject(false));
    t.true(isEmptyObject(true));
    t.true(isEmptyObject(42));
    t.true(isEmptyObject(undefined));
});

ava('.isEmptyObject() returns true when passed an object with properties', (t) => {
    t.false(isEmptyObject({
        a: 'threeve',
        b: 42,
        c: false
    }));
});

ava('.isEmptyObject() returns true when passed an empty object', (t) => {
    t.true(isEmptyObject({}));
    t.true(isEmptyObject([]));
    t.true(isEmptyObject(null));
});

ava('.isEmptyObjectOrArray() returns true when passed an non object', (t) => {
    t.true(isEmptyObjectOrArray('threeve'));
    t.true(isEmptyObjectOrArray(false));
    t.true(isEmptyObjectOrArray(true));
    t.true(isEmptyObjectOrArray(42));
    t.true(isEmptyObjectOrArray(undefined));
});

ava('.isEmptyObjectOrArray() returns false when passed an object with properties', (t) => {
    t.false(isEmptyObjectOrArray({
        a: 'threeve',
        b: 42,
        c: false
    }));
});

ava('.isEmptyObjectOrArray() returns true when passed an empty object that is not an array', (t) => {
    t.true(isEmptyObjectOrArray({}));
    t.true(isEmptyObjectOrArray(null));
});

ava('.isEmptyObjectOrArray() returns true when passed an array that is not empty', (t) => {
    t.true(isEmptyObjectOrArray([1, 2, 3]));
});
