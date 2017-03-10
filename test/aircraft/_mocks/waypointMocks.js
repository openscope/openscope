import { SNORA_STATIC_POSITION_MODEL } from '../../base/_mocks/positionMocks';

export const MINIMAL_WAYPOINT_MOCK = 'klas';

export const BASIC_WAYPOINT_MOCK = {
    fix: 'SNORA',
    position: SNORA_STATIC_POSITION_MODEL,
    fixRestrictions: {
        alt: '270+',
        spd: '280'
    }
};

export const ENROUTE_TO_HOLD_WAYPOINT_MOCK = {
    fix: 'SNORA',
    position: SNORA_STATIC_POSITION_MODEL,
    altitude: 7000,
    speed: 230
};

export const EXPANDED_WAYPOINT_MOCK = {
    navmode: 'hold',
    speed: 230,
    altitude: 7000,
    fix: null,
    hold: {
        fixName: 'BOLDR',
        fixPos: [37.28695678169094, -42.26087965200279],
        dirTurns: 'right',
        legLength: '1min',
        inboundHdg: 2.697288004800421,
        timer: null
    }
};
