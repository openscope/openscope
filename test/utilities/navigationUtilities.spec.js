import ava from 'ava';
import _forEach from 'lodash/forEach';
import { assembleProceduralRouteString, getCircularCoordinates } from '../../src/assets/scripts/client/utilities/navigationUtilities';
import { km } from '../../src/assets/scripts/client/utilities/unitConverters'
import DynamicPositionModel from '../../src/assets/scripts/client/base/DynamicPositionModel';
import { abs } from '../../src/assets/scripts/client/math/core';
import { distance2d } from '../../src/assets/scripts/client/math/distance';
import { GPS_COORDINATES_MOCK, MAGNETIC_NORTH_MOCK } from '../base/_mocks/positionMocks';
import { airportModelFixture } from '../fixtures/airportFixtures';

ava('assembleProceduralRouteString() concatenates provided strings with appropriate separator character', (t) => {
    const entryFixName = 'ENTRY';
    const procedureName = 'PRCDR';
    const exitFixName = 'EXITT';
    const expectedResult = 'ENTRY.PRCDR.EXITT';
    const result = assembleProceduralRouteString(entryFixName, procedureName, exitFixName);

    t.true(result === expectedResult);
});

ava('getCircularCoordinates() provides a set of points equidistant from center', (t) => {
    const TOLERABLE_ERROR = 0.025  // 25m

    const posAndDecl = [airportModelFixture.positionModel, MAGNETIC_NORTH_MOCK];
    const center = GPS_COORDINATES_MOCK;
    const radius = 1.0;

    const circle = getCircularCoordinates(center, radius, posAndDecl);
    t.true(circle.length === 32);

    const trueCenter = DynamicPositionModel.calculateRelativePosition(center, ...posAndDecl)

    let ok = true;
    for (let i = 0; i < circle.length; i++) {
        const distance = distance2d(trueCenter, circle[i]);
        if (abs(distance - km(1)) > TOLERABLE_ERROR) {
            ok = false;
            break;
        }
    }
    t.true(ok);
});
