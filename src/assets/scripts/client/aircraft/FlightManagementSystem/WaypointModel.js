/**
 *
 * @class WaypointModel
 */
export default class WaypointModel {
    /**
     *
     * @constructor
     */
    constructor() {
        this.fix = null;
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
    }

    init() {

    }

    destroy() {
        this.fix = null;
        this.position = null;
        this.speedRestriction = -1;
        this.altitudeRestriction = -1;
    }
}
