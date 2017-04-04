/* eslint-disable arrow-parens, max-len, import/no-extraneous-dependencies*/
import ava from 'ava';
import { isObjectComplete,
         isObjectCompleteAndNotArray
 } from '../../src/assets/scripts/client/utilities/validatorUtilities';

ava('.isObjectComplete() returns false when passed an non object', (t) => {
    t.false(isObjectComplete('threeve'));
    t.false(isObjectComplete(false));
    t.false(isObjectComplete(true));
    t.false(isObjectComplete(42));
    t.false(isObjectComplete(undefined));
});

ava('.isObjectComplete() returns true when passed an object with properties', (t) => {
    t.true(isObjectComplete({
        a: 'threeve',
        b: 42,
        c: false
    }));
});

ava('.isObjectComplete() returns true when passed an empty object', (t) => {
    t.false(isObjectComplete({}));
    t.false(isObjectComplete([]));
    t.false(isObjectComplete(null));
});

ava('.isObjectCompleteAndNotArray() returns false when passed an non object', (t) => {
    t.false(isObjectCompleteAndNotArray('threeve'));
    t.false(isObjectCompleteAndNotArray(false));
    t.false(isObjectCompleteAndNotArray(true));
    t.false(isObjectCompleteAndNotArray(42));
    t.false(isObjectCompleteAndNotArray(undefined));
});

ava('.isObjectCompleteAndNotArray() returns false when passed an object with properties', (t) => {
    t.true(isObjectCompleteAndNotArray({
        a: 'threeve',
        b: 42,
        c: false
    }));
});

ava('.isObjectCompleteAndNotArray() returns true when passed an empty object that is not an array', (t) => {
    t.false(isObjectCompleteAndNotArray({}));
    t.false(isObjectCompleteAndNotArray(null));
});

ava('.isObjectCompleteAndNotArray() returns true when passed an array that is not empty', (t) => {
    t.false(isObjectCompleteAndNotArray([1, 2, 3]));
});
