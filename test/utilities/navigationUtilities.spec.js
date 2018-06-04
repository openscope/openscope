import ava from 'ava';
import { assembleProceduralRouteString } from '../../src/assets/scripts/client/utilities/navigationUtilities';

ava('assembleProceduralRouteString() concatenates provided strings with appropriate separator character', (t) => {
    const entryFixName = 'ENTRY';
    const procedureName = 'PRCDR';
    const exitFixName = 'EXITT';
    const expectedResult = 'ENTRY.PRCDR.EXITT';
    const result = assembleProceduralRouteString(entryFixName, procedureName, exitFixName);

    t.true(result === expectedResult);
});
