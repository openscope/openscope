/* eslint-disable arrow-parens, max-len, import/no-extraneous-dependencies*/
import ava from 'ava';

import {
    UNIT_CONVERSION_CONSTANTS,
    km,
    nm,
    m_ft,
    km_ft,
    ft_km,
    kn_ms,
    heading_to_string,
    radiansToDegrees,
    degreesToRadians,
    convertMinutesToSeconds,
    parseCoordinate,
    parseElevation
} from '../../src/assets/scripts/client/utilities/unitConverters';

ava('.km() converts kilometers to nautical miles', t => {
    const result = km(10);
    const expectedResult = 10 * UNIT_CONVERSION_CONSTANTS.NM_KM;

    t.true(result === expectedResult);
});

ava('.km() sets a default for the nm parameter', t => {
    const result = km();
    const expectedResult = 0 * UNIT_CONVERSION_CONSTANTS.NM_KM;

    t.true(result === expectedResult);
});

ava('.nm() converts nautical miles to kilometers', t => {
    const result = nm(10);
    const expectedResult = 10 / UNIT_CONVERSION_CONSTANTS.NM_KM;

    t.true(result === expectedResult);
});

ava('.nm() sets a default for the km parameter', t => {
    const result = nm();
    const expectedResult = 0 / UNIT_CONVERSION_CONSTANTS.NM_KM;

    t.true(result === expectedResult);
});

ava('.m_ft() converts meters to feet', t => {
    const result = m_ft(10);
    const expectedResult = 10 / UNIT_CONVERSION_CONSTANTS.M_FT;

    t.true(result === expectedResult);
});

ava('.km_ft() converts kilometers to feet', t => {
    const result = km_ft(10);
    const expectedResult = 10 / UNIT_CONVERSION_CONSTANTS.KM_FT;

    t.true(result === expectedResult);
});

ava('.km_ft() sets a default for the km parameter', t => {
    const result = km_ft();
    const expectedResult = 0 / UNIT_CONVERSION_CONSTANTS.KM_FT;

    t.true(result === expectedResult);
});

ava('.ft_km() converts feet to kilometers', t => {
    const result = ft_km(10);
    const expectedResult = 10 * UNIT_CONVERSION_CONSTANTS.KM_FT;

    t.true(result === expectedResult);
});

ava('.ft_km() sets a default for the ft parameter', t => {
    const result = ft_km();
    const expectedResult = 0 * UNIT_CONVERSION_CONSTANTS.KM_FT;

    t.true(result === expectedResult);
});

ava('.kn_ms() converts knots to m/s', t => {
    const speed = 190;
    const expectedResult = speed * UNIT_CONVERSION_CONSTANTS.KN_MS;
    const result = kn_ms(speed);

    t.true(result === expectedResult);
});

ava('.heading_to_string() converts a heading in radians to a degree heading that has a leading zero', (t) => {
    const headingMock = 0.698132;
    const expectedResult = '040';
    const result = heading_to_string(headingMock);

    t.true(result === expectedResult);
});

ava('.heading_to_string() converts a heading in radians to a degree heading', (t) => {
    const headingMock = -1.6302807335875378;
    const expectedResult = '267';
    const result = heading_to_string(headingMock);

    t.true(result === expectedResult);
});

ava('.radiansToDegrees() converts radians to degrees', t => {
    const result = radiansToDegrees(2.1467549799530254);
    const expectedResult = 123;

    t.true(result === expectedResult);
});

ava('.degreesToRadians() converts degrees to radians', t => {
    const result = degreesToRadians(123);
    const expectedResult = 2.1467549799530254;

    t.true(result === expectedResult);
});

ava('.convertMinutesToSeconds() converts minutes to seconds', t => {
    const result = convertMinutesToSeconds(10);
    const expectedResult = 10 * 60;

    t.true(result === expectedResult);
});

ava('.parseCoordinate() should accept a lat/long coordinate and convet it to decimal notation', t => {
    const latitudeMock = 'N35d57m50.000';
    const longitudeMock = 'W115d51m15.000';

    t.true(parseCoordinate(latitudeMock) === 35.96388888888889);
    t.true(parseCoordinate(longitudeMock) === -115.85416666666666);
});

ava('.parseElevation() should parse a string elevation into an elevation in feet', t => {
    t.false(parseElevation('5.5m') === 5.5);
    t.false(parseElevation('-23m') === -23);

    t.true(parseElevation('13.3ft') === 13.3);
    t.true(parseElevation('13ft') === 13);
    t.true(parseElevation(13) === 13);
    t.true(parseElevation('5.5m') === 18.04461942257218);
    t.true(parseElevation(5.5) === 5.5);
    t.true(parseElevation('-11ft') === -11);
    t.true(parseElevation('-23m') === -75.45931758530183);
    t.true(parseElevation(Infinity) === Infinity);
    t.true(parseElevation(-Infinity) === -Infinity);
    t.true(parseElevation('Infinity') === Infinity);
    t.true(parseElevation('-Infinity') === -Infinity);
});
