import ava from 'ava';
import { assembleProceduralRouteString, parseAltitudeRestriction, parseSpeedRestriction } from '../../src/assets/scripts/client/utilities/navigationUtilities';

ava('assembleProceduralRouteString() concatenates provided strings with appropriate separator character', (t) => {
    const entryFixName = 'ENTRY';
    const procedureName = 'PRCDR';
    const exitFixName = 'EXITT';
    const expectedResult = 'ENTRY.PRCDR.EXITT';
    const result = assembleProceduralRouteString(entryFixName, procedureName, exitFixName);

    t.true(result === expectedResult);
});

ava('.parseAltitudeRestriction() returns empty array for invalid restrictions', (t) => {
    const empty = [];

    // Empty value
    t.deepEqual(parseAltitudeRestriction(), empty);
    t.deepEqual(parseAltitudeRestriction(null), empty);
    t.deepEqual(parseAltitudeRestriction(''), empty);
    // No prefix
    t.deepEqual(parseAltitudeRestriction('80'), empty);
    t.deepEqual(parseAltitudeRestriction('80+'), empty);
    // Invalid limit symbol
    t.deepEqual(parseAltitudeRestriction('A80@'), empty);
    // More than 99,999 ft
    t.deepEqual(parseAltitudeRestriction('A1000'), empty);
    t.deepEqual(parseAltitudeRestriction('A1000+'), empty);
    t.deepEqual(parseAltitudeRestriction('A1000-'), empty);
});

ava('.parseAltitudeRestriction() returns expected values', (t) => {
    const expectedOneDigit = [800, ''];
    const expectedAbove = [8000, '+'];
    const expectedBelow = [14000, '-'];
    const expectedExact = [16000, ''];

    t.deepEqual(parseAltitudeRestriction('A8'), expectedOneDigit);
    t.deepEqual(parseAltitudeRestriction('A80+'), expectedAbove);
    t.deepEqual(parseAltitudeRestriction('A140-'), expectedBelow);
    t.deepEqual(parseAltitudeRestriction('A160'), expectedExact);
});

ava('.parseSpeedRestriction() returns empty array for invalid restrictions', (t) => {
    const empty = [];

    // Empty value
    t.deepEqual(parseSpeedRestriction(), empty);
    t.deepEqual(parseSpeedRestriction(null), empty);
    t.deepEqual(parseSpeedRestriction(''), empty);
    // No prefix
    t.deepEqual(parseSpeedRestriction('250'), empty);
    t.deepEqual(parseSpeedRestriction('250+'), empty);
    // Speed is less than 100 kts
    t.deepEqual(parseSpeedRestriction('S50'), empty);
    t.deepEqual(parseSpeedRestriction('S50+'), empty);
    t.deepEqual(parseSpeedRestriction('S50'), empty);
    // Invalid limit symbol
    t.deepEqual(parseSpeedRestriction('S250@'), empty);
    // Speed more than 999 kts
    t.deepEqual(parseSpeedRestriction('S1000'), empty);
    t.deepEqual(parseSpeedRestriction('S1000+'), empty);
    t.deepEqual(parseSpeedRestriction('S1000-'), empty);
});

ava('.parseSpeedRestriction() returns expected values', (t) => {
    const expectedAbove = [220, '+'];
    const expectedBelow = [185, '-'];
    const expectedExact = [230, ''];

    t.deepEqual(parseSpeedRestriction('S220+'), expectedAbove);
    t.deepEqual(parseSpeedRestriction('S185-'), expectedBelow);
    t.deepEqual(parseSpeedRestriction('S230'), expectedExact);
});
