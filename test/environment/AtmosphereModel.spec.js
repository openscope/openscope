import ava from 'ava';

// import _inRange from 'lodash/inRange';
import AtmosphereModel from '../../src/assets/scripts/client/environment/AtmosphereModel';
// import { ENVIRONMENT } from '../../src/assets/scripts/client/constants/environmentConstants';
// import { vectorize_2d, vscale } from '../../src/assets/scripts/client/math/vector';
// import { degreesToRadians } from '../../src/assets/scripts/client/utilities/unitConverters';

// const SFC_WX = {
//     surfaceElevation: 0,
//     surfaceTemperature: 15,
//     surfaceWind: [0, 0]
// };
// const WINDS_ALOFT = {
//     5000: [120, 27],
//     20000: [220, 68],
//     30000: [200, 89]
// };
const atmosphereDataMock = {
    pressure: 29.92,
    surface: {
        elevation: 0,
        temperature: 15,
        wind: [0, 0]
    },
    windGradient: {
        5000: [120, 27],
        20000: [220, 68],
        30000: [200, 89]
    }
};

ava('throws when called with invalid surface weather data', (t) => {
    t.throws(() => new AtmosphereModel());
    t.throws(() => new AtmosphereModel({}));
    t.throws(() => new AtmosphereModel(42));
    t.throws(() => new AtmosphereModel('threeve'));
    t.throws(() => new AtmosphereModel(false));
});

ava('throws when called with invalid winds aloft data', (t) => {
    t.throws(() => new AtmosphereModel(atmosphereDataMock, undefined));
    t.throws(() => new AtmosphereModel(atmosphereDataMock, {}));
    t.throws(() => new AtmosphereModel(atmosphereDataMock, 42));
    t.throws(() => new AtmosphereModel(atmosphereDataMock, 'threeve'));
    t.throws(() => new AtmosphereModel(atmosphereDataMock, false));
});

ava.only('does not throw when called with valid data', (t) => {
    t.notThrows(() => new AtmosphereModel(atmosphereDataMock));
});
