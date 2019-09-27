import ava from 'ava';
import {
    generateTransponderCode, isDiscreteTransponderCode, isValidTransponderCode
} from '../../src/assets/scripts/client/utilities/transponderUtilities';

const USA_ICAO = 'klax';
const UK_ICAO = 'egll';

ava('isDiscreteTransponderCode returns false for all non-discrete codes', (t) => {
    // Loops are not ideal, but it saves writing 64 identical tests!
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const squawk = `${i}${j}00`;
            t.false(isDiscreteTransponderCode(squawk));
        }
    }
});

ava('generateTransponderCode returns a valid transponder code', (t) => {
    // This is basically pointless, as we're testing random output...
    const code = generateTransponderCode();
    t.true(isValidTransponderCode(code));
});

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

ava('isValidTransponderCode returns true when given a valid transponder code', (t) => {
    t.true(isValidTransponderCode('0000'));
    t.true(isValidTransponderCode('7777'));
});

ava('isValidTransponderCode returns false when given a invalid transponder code', (t) => {
    t.false(isValidTransponderCode('777'));
    t.false(isValidTransponderCode('7778'));
});
