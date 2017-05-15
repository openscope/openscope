import ava from 'ava';
import _isEqual from 'lodash/isEqual';

import {
    routeStringFormatHelper,
    extractFixnameFromHoldSegment,
    extractHeadingFromVectorSegment
} from '../../../src/assets/scripts/client/navigationLibrary/Route/routeStringFormatHelper';

ava('.routeStringFormatHelper() throws when passed invalid parameters', (t) => {
    t.throws(() => routeStringFormatHelper());
    t.throws(() => routeStringFormatHelper([]));
    t.throws(() => routeStringFormatHelper({}));
    t.throws(() => routeStringFormatHelper(42));
    t.throws(() => routeStringFormatHelper(false));
});

ava('.routeStringFormatHelper() does not throw when it receives a string', (t) => {
    t.notThrows(() => routeStringFormatHelper('a.b.c e.f.g'));
    t.notThrows(() => routeStringFormatHelper('a.b.c'));
});

ava('.routeStringFormatHelper() returns an array when passed a Direct route string', (t) => {
    const result = routeStringFormatHelper('a..b..c');

    t.true(_isEqual(result, ['a', 'b', 'c']));
});

ava('.routeStringFormatHelper() returns an array when passed a Procedure route string ', (t) => {
    const result = routeStringFormatHelper('a.b.c');

    t.true(_isEqual(result, ['a.b.c']));
});

ava('.routeStringFormatHelper() returns an array when passed a mix of Direct and Procedure route strings', (t) => {
    const result = routeStringFormatHelper('a.b.c..d..e.f.g');

    t.true(_isEqual(result, ['a.b.c', 'd', 'e.f.g']));
});

ava('.routeStringFormatHelper() returns an array when passed a Procedure route string with multilinks', (t) => {
    const result = routeStringFormatHelper('a.b.c.d.e.f.g');

    t.true(_isEqual(result, ['a.b.c', 'c.d.e', 'e.f.g']));
});

ava('.routeStringFormatHelper() returns an array when passed a Procedure route string with multilinks and Direct route strings', (t) => {
    const result = routeStringFormatHelper('a.b.c..d..e.f.g.h.i..j..k');

    t.true(_isEqual(result, ['a.b.c', 'd', 'e.f.g', 'g.h.i', 'j', 'k']));
});

ava('.extractFixnameFromHoldSegment() returns a fixname when passed a holdSegment', (t) => {
    const expectedResult = 'COWBY';
    const holdStringMock = '@COWBY';
    const result = extractFixnameFromHoldSegment(holdStringMock);

    t.true(result === expectedResult);
});

ava('.extractHeadingFromVectorSegment() returns the correct number when passed a vectorSegment', (t) => {
    const vectorRouteStringMock = '#230';
    const expectedResult = '230';
    const result = extractHeadingFromVectorSegment(vectorRouteStringMock);

    t.true(result === expectedResult);
});
