export const EMPTY_HOLD_PARAMETERS_MOCK = {};

export const CUSTOM_HOLD_PARAMETERS_MOCK = {
    legLength: '5nm',
    turnDirection: 'right',
    inboundHeading: Math.PI
};

export const CUSTOM_HOLD_PARAMETERS_EXECPTED = {
    inboundHeading: Math.PI,
    legLength: '5nm',
    turnDirection: 'right',
    speedMaximum: 220,
    timer: -1
};

export const GRNPA8_HOLD_PARAMETERS_EXPECTED = {
    inboundHeading: Math.PI / 2, // on the 270 radial
    legLength: '1min',
    turnDirection: 'left',
    speedMaximum: 220,
    timer: -1
};
