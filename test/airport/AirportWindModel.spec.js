import ava from 'ava';
import AirportWindModel from '../../src/assets/scripts/client/airport/AirportWindModel';

const windModel = new AirportWindModel();

ava('._calculateNextWind is able to handle angles greater than 360', (t) => {
    const windMock = {
        speed: 10,
        angle: 1000
    };

    t.true(AirportWindModel._calculateNextWind(windMock) <= 360);
});

ava('._calculateNextWind does not give negative values for speed or angle', (t) => {
    const windMock = {
        speed: -1000,
        angle: -1000
    };

    const result = windModel._calculateNextWind(windMock);

    t.true(result.speed >= 0);
    t.true(result.angle >= 0);
});
