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
        this._position = null;
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

    /**
     *
     * @property position
     * @return {array}
     */
    get position() {
        return this._position.position;
    }

    /**
     *
     *
     */
    init(waypointProps) {
        this.name = waypointProps.name.toLowerCase();
        this._position = waypointProps.position;
        this.speedRestriction = parseInt(waypointProps.speedRestriction, 10);
        this.altitudeRestriction = parseInt(waypointProps.altitudeRestriction, 10);
    }

    /**
     *
     *
     */
    destroy() {
        this.name = '';
        this._position = null;
        this.speedRestriction = -1;
        this.altitudeRestriction = -1;
    }
}
