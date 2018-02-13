import ava from 'ava';
import { buildFlightNumber } from '../../src/assets/scripts/client/airline/buildFlightNumber';

ava('.buildFlightNumber() creates a callsign made up of random numbers only if callsign format is [\'###\'] ', (t) => {
    const callsignFormat = ['###'];
    const result = buildFlightNumber(callsignFormat);

    t.true(!isNaN(result));
});

ava('.buildFlightNumber() creates a callsign made up of random lowercase letters only if callsign format is [\'@@@\'] ', (t) => {
    const lowerAlphabeticalRegex = /^[a-z]+$/;
    const callsignFormat = ['@@@'];
    const result = buildFlightNumber(callsignFormat);

    t.true(lowerAlphabeticalRegex.test(result));
});

ava('.buildFlightNumber() creates a callsign made up of one random number and one random lowercase letter if callsign format is [\'#@\'] ', (t) => {
    const regex = /[1-9]/;
    const callsignFormat = ['#@'];
    const result = buildFlightNumber(callsignFormat);

    t.true(regex.test(result));
});

ava('.buildFlightNumber() returns callsignFormat as is if the format does not contain @ or #', (t) => {
    const callsignFormat = ['4EVR', '8AE'];
    const result = buildFlightNumber(callsignFormat);

    t.true(callsignFormat.includes(result));
});

ava('.buildFlightNumber() does not allow 0 to be at the start of a callsign, returns a three digit callsign', (t) => {
    const callsignFormat = ['0##', '00@@'];
    const result = buildFlightNumber(callsignFormat);

    t.true(!isNaN(result));
});
