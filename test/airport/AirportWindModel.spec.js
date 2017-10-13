import ava from 'ava';
import sinon from 'sinon';
import AirportWindModel from '../../src/assets/scripts/client/airport/AirportWindModel';
import { AIRPORT_JSON_KLAS_MOCK } from './_mocks/airportJsonMock';

const windMock = AIRPORT_JSON_KLAS_MOCK.wind;

ava('throws when instantiated with invalid data', (t) => {
    t.throws(() => new AirportWindModel());

    t.notThrows(() => new AirportWindModel(windMock));
});

ava('.enable() calls ._createWindUpdateTimer()', (t) => {
    const model = new AirportWindModel(windMock);
    const _createWindUpdateTimerSpy = sinon.spy(model, '_createWindUpdateTimer');

    model.enable();

    t.true(_createWindUpdateTimerSpy.calledOnce);
});

ava('._calculateNextWind() adjusts #angle when it exceeds 360 degrees', (t) => {
    const model = new AirportWindModel(windMock);
    model.angle = 1000;
    const { angle: previousAngle } = model;

    model._calculateNextWind();

    t.false(previousAngle === model.angle);
    t.true(model.angle <= 360);
});
