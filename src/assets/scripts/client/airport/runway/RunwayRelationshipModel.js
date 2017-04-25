import _uniqueId from 'lodash/uniqueId';
import { degreesToRadians } from '../../utilities/unitConverters';
import { abs } from '../../math/core';
import { angle_offset } from '../../math/circle';
import { getOffset } from '../../math/flightMath';
import { raysIntersect } from '../../math/vector';

export default class RunwayRelationshipModel {
    constructor(primaryRunway, comparatorRunway) {
        this._id = _uniqueId('runwayRelationshipModel-');
        this.lateral_dist = -999;
        this.straight_dist = -999;
        this.converging = -999;
        this.parallel = -999;

        this.calculateRelationshipValues(primaryRunway, comparatorRunway);
    }

    calculateRelationshipValues(primaryRunway, comparatorRunway) {
        const offset = getOffset(primaryRunway, comparatorRunway.relativePosition, primaryRunway.angle);

        this.lateral_dist = abs(offset[0]);
        this.straight_dist = abs(offset[2]);
        this.converging = raysIntersect(
            primaryRunway.relativePosition,
            primaryRunway.angle,
            comparatorRunway.relativePosition,
            comparatorRunway.angle
        );
        this.parallel = abs(angle_offset(primaryRunway.angle, comparatorRunway.angle)) < degreesToRadians(10);
    }

    destroy() {
        this.lateral_dist = -999;
        this.straight_dist = -999;
        this.converging = -999;
        this.parallel = -999;
    }
}
