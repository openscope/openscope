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
        this.name = waypointProps.name.toLowerCase();
        this.position = waypointProps.position;
        this.speedRestriction = parseInt(waypointProps.speedRestriction, 10);
        this.altitudeRestriction = parseInt(waypointProps.altitudeRestriction, 10);
    }

    destroy() {
        this.fixName = '';
        this.position = null;
        this.speedRestriction = -1;
        this.altitudeRestriction = -1;
    }
}
