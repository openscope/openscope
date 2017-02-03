import _get from 'lodash/get';

/**
 *
 * @class WaypointModel
 */
export default class WaypointModel {
    /**
     *
     * @constructor
     * @param waypointProps {object}
     */
    constructor(waypointProps) {
        this.name = '';
        this.position = null;
        this.speedRestriction = -1;
        this.altitudeRestriction = -1;

        // this.hold = {
        //     dirTurns: null,
        //     fixName: null,
        //     fixPos: null,
        //     inboundHd: null,
        //     legLength: null,
        //     timer: 0
        // };

        this.init(waypointProps);
    }

    init(waypointProps) {
        this.name = waypointProps.name;
        this.position = waypointProps.position;
        this.speedRestriction = _get(waypointProps, 'speedRestriction', this.speedRestriction);
        this.altitudeRestriction = _get(waypointProps, 'altitudeRestriction', this.altitudeRestriction);
    }

    destroy() {
        this.fixName = '';
        this.position = null;
        this.speedRestriction = -1;
        this.altitudeRestriction = -1;
    }
}
