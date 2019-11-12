export const FIX_NAME_MOCK_VALID = 'LOREL';
export const FIX_NAME_MOCK_EMPTY = null;

export const HOLD_STRING_MOCK_VALID = '085|right|3nm|S220-';
export const HOLD_STRING_MOCK_INVALID_COURSE = '000|right|3nm|S220-';
export const HOLD_STRING_MOCK_INVALID_TURN = '085||3nm|S220-';
export const HOLD_STRING_MOCK_INVALID_LENGTH = '085|right|5km|S220-';
export const HOLD_STRING_MOCK_INVALID_SPEED = '085|right|3nm|220';
export const HOLD_STRING_MOCK_INVALID_SPEED_RESTRICTION = '085|right|3nm|S220+';

export const EXPECTED_HOLD_PARAMETERS = {
    inboundHeading: 4.625122517784973,
    turnDirection: 'right',
    legLength: '3nm',
    speedMaximum: 220
};
