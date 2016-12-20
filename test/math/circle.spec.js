import ava from 'ava';

import {
    tau,
    distanceToPoint
} from '../../src/assets/scripts/client/math/circle';

ava('.tau() returns PI * 2', t => {
    const result = tau();
    const expectedResult = Math.PI * 2;

    t.true(result === expectedResult);
});

ava('.distanceToPoint() returns the distance between two lat/long coordinates in kilometers', t => {
    const latitudeAMock = 36.080056;
    const longitudeAMock = -115.15225;
    const latitudeBMock = 36.080056;
    const longitudeBMock = -115.14661;
    const expectedResult = 0.5068508706893402;
    const result = distanceToPoint(latitudeAMock, longitudeAMock, latitudeBMock, longitudeBMock);

    t.true(result === expectedResult);
});
