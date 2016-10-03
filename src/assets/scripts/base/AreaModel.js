// TODO: this class does not appear to be in use?
/**
 * An enclosed region defined by a series of Position objects and an altitude range
 *
 * @class AreaModel
 */
class AreaModel {
    /**
     * @for AreaModel
     * @constructor
     * @param {array} poly - series of Position objects that outline the shape
     *                Note: DO NOT repeat the origin to 'close' the shape. Unnecessary.
     * @param {number} floor - (optional) altitude of bottom of area, in hundreds of feet
     * @param {number} ceiling - (optional) altitude of top of area, in hundreds of feet
     * @param {string} airspace_class - (optional) FAA airspace classification (A,B,C,D,E,G)
     */
    constructor(positions, floor, ceiling, airspace_class) {
        if (!positions) {
            return;
        }

        this.poly = [];
        this.floor = null;
        this.ceiling = null;
        this.airspace_class = null;

        if (floor != null) {
            this.floor = floor;
        }

        if (ceiling != null) {
            this.ceiling = ceiling;
        }

        if (airspace_class) {
            this.airspace_class = airspace_class;
        }


        this.parse(positions);
    }

    /**
     * @for AreaModel
     * @method parse
     * @param positions {array}
     */
    parse(positions) {
        for (let i = 0; i < positions.length; i++) {
            this.poly.push(positions[i]);
        }

        if (this.poly[0] === this.poly[this.poly.length - 1]) {
            this.poly.pop();  // shape shouldn't fully close; will draw with 'cc.closepath()'
        }
    }
}

// TODO: temporarily attached to the window here until useages of AreaModel can be converted to an explicit import.
// window.Area = AreaModel;
