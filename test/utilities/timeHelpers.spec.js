import ava from 'ava';

import { calculateDeltaTime } from '../../src/assets/scripts/client/utilities/timeHelpers';

ava('.calculateDeltaTime() should calculate the next DeltaTime', t => {
    const currentTime = 1474388830.375;
    const result = calculateDeltaTime(currentTime);

    t.true(result === 0.05);
});
