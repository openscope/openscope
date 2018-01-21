import ava from 'ava';
import { flightNumberBuilder } from '../../src/assets/scripts/client/airline/flightNumberBuilder';

ava('.flightNumberBuilder() creates a callsign made up of numbers only if callsign format is [\'###\'] ', (t) => {
    const callsignFormat = ['###'];
    const result = flightNumberBuilder(callsignFormat);

    t.true(!isNaN(result));
});

ava('.flightNumberBuilder() creates a callsign made up of lowercase letters only if callsign format is [\'AAA\'] ', (t) => {
    const upperAlphabeticalRegex = /^[a-z]+$/;
    const callsignFormat = ['AAA'];
    const result = flightNumberBuilder(callsignFormat);

    t.true(upperAlphabeticalRegex.test(result));
});

ava('.flightNumberBuilder() creates a callsign made up of one number and one lowercase letter if callsign format is [\'#A\'] ', (t) => {
    const regex = /^[1-9]{1}[a-z]/;
    const callsignFormat = ['#A'];
    const result = flightNumberBuilder(callsignFormat);

    t.true(regex.test(result));
});
