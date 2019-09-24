import ava from 'ava';
import {
    isDiscreteTransponderCode
} from '../../src/assets/scripts/client/utilities/transponderUtilities';

const USA_ICAO = 'klax';
const UK_ICAO = 'egll';
const GERMAN_ICAO = 'eddf';

ava('isDiscreteTransponderCode returns false for invalid squawk code', (t) => {
    t.false(isDiscreteTransponderCode(USA_ICAO, '1239'));
});

ava('isDiscreteTransponderCode returns false when given a non-discrete squawk', (t) => {
    t.false(isDiscreteTransponderCode(UK_ICAO, '3600'));
});

ava('isDiscreteTransponderCode returns false when given restricted squawks for the USA', (t) => {
    t.false(isDiscreteTransponderCode(USA_ICAO, '7500'));
    t.false(isDiscreteTransponderCode(USA_ICAO, '7600'));
    t.false(isDiscreteTransponderCode(USA_ICAO, '7700'));
    t.false(isDiscreteTransponderCode(USA_ICAO, '7777'));
});

ava('isDiscreteTransponderCode returns false when given VFR codes', (t) => {
    t.false(isDiscreteTransponderCode(USA_ICAO, '1200'));
    t.false(isDiscreteTransponderCode(USA_ICAO, '1202'));
    t.false(isDiscreteTransponderCode(USA_ICAO, '1277'));

    t.true(isDiscreteTransponderCode(UK_ICAO, '1201')); // 1201 is allowed in the UK
    t.false(isDiscreteTransponderCode(UK_ICAO, '7000'));
});
