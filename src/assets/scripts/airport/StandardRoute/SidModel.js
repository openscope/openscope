import _isArray from 'lodash/isArray';
import _isObject from 'lodash/isObject';
import _uniqId from 'lodash/uniqueId';
import RouteSegmentCollection from './RouteSegmentCollection';
import StandardRouteWaypointModel from './StandardRouteWaypointModel';

/**
 * @class SidModel
 */
export default class SidModel {
    /**
     * @constructor
     * @param sid {object}
     */
    constructor(sid) {
        if (!_isObject(sid) || _isArray(sid)) {
            throw new TypeError(`Expected sid to be an object, instead received ${typeof sid}`);
        }

        this._id = _uniqId();

        this.icao = '';
        this.name = '';
        this.draw = [];

        this.rwy = [];
        this._runwayCollection = [];

        this.body = [];
        this._bodyCollection = null;

        this.exitPoints = [];
        this._exitCollection = null;


        return this._init(sid);
    }

    /**
     * @for SidModel
     * @method _init
     * @param sid {object}
     * @private
     */
    _init(sid) {
        this.icao = sid.icao;
        this.name = sid.name;
        this.draw = sid.draw;

        this.rwy = sid.rwy;
        this._runwayCollection = this._buildSegmentCollection(sid.rwy);

        this.body = sid.body;
        this._bodyCollection = this._buildSegmentCollection(sid.body);

        this.exitPoints = sid.exitPoints;
        this._exitCollection = this._buildSegmentCollection(sid.exitPoints);
    }


    /**
     * @for SidModel
     * @method destroy
     */
    destroy() {
        this._id = '';
        this.icao = '';
        this.name = '';
        this.rwy = [];
        this._runwayCollection = null;

        this.body = [];
        this._bodyCollection = null;

        this.exitPoints = [];
        this._exitCollection = null;

        this.draw = [];

        return this;
    }

    _buildSegmentCollection(runwayList) {
        // TODO: this is a rough-in. Need to abstract to proper class(es) and methods.
        const segmentCollection = new RouteSegmentCollection(runwayList);

        return segmentCollection;
    }

    getFixesAndRestrictionsForRunway(runway) {
        console.log(runway);
    }
}
