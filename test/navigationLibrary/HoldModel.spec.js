import ava from 'ava';
import HoldModel from '../../src/assets/scripts/client/navigationLibrary/HoldModel';

import {
    FIX_NAME_MOCK_EMPTY,
    FIX_NAME_MOCK_VALID,
    HOLD_STRING_MOCK_INVALID_COURSE,
    HOLD_STRING_MOCK_INVALID_LENGTH,
    HOLD_STRING_MOCK_INVALID_SPEED,
    HOLD_STRING_MOCK_INVALID_SPEED_RESTRICTION,
    HOLD_STRING_MOCK_INVALID_TURN,
    HOLD_STRING_MOCK_MISSING_LENGTH,
    HOLD_STRING_MOCK_MISSING_RADIAL,
    HOLD_STRING_MOCK_MISSING_TURN,
    HOLD_STRING_MOCK_VALID,
    EXPECTED_HOLD_PARAMETERS
} from './_mocks/holdModelMocks';

ava('throws if called with invalid parameters', (t) => {
    t.throws(() => new HoldModel(FIX_NAME_MOCK_EMPTY, null));
    t.throws(() => new HoldModel(FIX_NAME_MOCK_EMPTY, HOLD_STRING_MOCK_VALID));
    t.throws(() => new HoldModel(FIX_NAME_MOCK_VALID, null));

    t.throws(() => new HoldModel(FIX_NAME_MOCK_VALID, HOLD_STRING_MOCK_INVALID_COURSE));
    t.throws(() => new HoldModel(FIX_NAME_MOCK_VALID, HOLD_STRING_MOCK_INVALID_LENGTH));
    t.throws(() => new HoldModel(FIX_NAME_MOCK_VALID, HOLD_STRING_MOCK_INVALID_SPEED));
    t.throws(() => new HoldModel(FIX_NAME_MOCK_VALID, HOLD_STRING_MOCK_INVALID_SPEED_RESTRICTION));
    t.throws(() => new HoldModel(FIX_NAME_MOCK_VALID, HOLD_STRING_MOCK_INVALID_TURN));

    t.throws(() => new HoldModel(FIX_NAME_MOCK_VALID, HOLD_STRING_MOCK_MISSING_LENGTH));
    t.throws(() => new HoldModel(FIX_NAME_MOCK_VALID, HOLD_STRING_MOCK_MISSING_RADIAL));
    t.throws(() => new HoldModel(FIX_NAME_MOCK_VALID, HOLD_STRING_MOCK_MISSING_TURN));
});

ava('accepts a hold string that is used to set the instance properties', (t) => {
    const model = new HoldModel(FIX_NAME_MOCK_VALID, HOLD_STRING_MOCK_VALID);

    t.is(model.fixName, FIX_NAME_MOCK_VALID);
    t.deepEqual(model.holdParameters, EXPECTED_HOLD_PARAMETERS);
});

ava('.reset() clears the instance properties', (t) => {
    const model = new HoldModel(FIX_NAME_MOCK_VALID, HOLD_STRING_MOCK_VALID);
    model.reset();

    t.is(model.fixName, '');
    t.is(model.holdParameters, null);
});
