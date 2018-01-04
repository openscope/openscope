import { SNORA_STATIC_POSITION_MODEL } from '../../base/_mocks/positionMocks';

export const MINIMAL_WAYPOINT_MOCK = 'klas';

export const BASIC_WAYPOINT_MOCK = {
    fix: 'SNORA',
    positionModel: SNORA_STATIC_POSITION_MODEL,
    fixRestrictions: {
        alt: '270+',
        spd: '280'
    }
};

export const ENROUTE_TO_HOLD_WAYPOINT_MOCK = {
    fix: 'SNORA',
    positionModel: SNORA_STATIC_POSITION_MODEL,
    altitude: 7000,
    speed: 230
};

// FIXME: This is not what a waypoint should like like anymore; #hold does not exist,
// and its replacement #_holdParameters takes a different form
export const EXPANDED_WAYPOINT_MOCK = {
    navmode: 'hold',
    speed: 230,
    altitude: 7000,
    fix: null,
    hold: {
        fixName: 'BOLDR',
        fixPos: [37.28695678169094, -42.26087965200279],
        dirTurns: 'right',
        legLength: 1,
        inboundHeading: 2.697288004800421,
        timer: null
    }
};
