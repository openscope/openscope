import _uniqueId from 'lodash/uniqueId';
import {
    km_ft,
    km,
    degreesToRadians
} from '../../utilities/unitConverters';
import { abs } from '../../math/core';
import { angle_offset } from '../../math/circle';
import { getOffset } from '../../math/flightMath';
import { raysIntersect } from '../../math/vector';
import { SEPARATION } from '../../constants/aircraftConstants';

/**
 * Describes a relationship between two `RunwayModel`s
 *
 * @class RunwayRelationshipModel
 */
export default class RunwayRelationshipModel {
    /**
     *
     * @constructor
     * @param primaryRunway {RuwnayModel}
     * @param comparatorRunway {RunwayModel}
     */
    constructor(primaryRunway, comparatorRunway) {
        if (!primaryRunway || !comparatorRunway) {
            throw new TypeError('Invalid parameters. RunwayRelationshipModel requires two RunwayModel instances');
        }

        /**
         * @property _id
         * @type {string}
         * @private
         */
        this._id = _uniqueId('runwayRelationshipModel-');

        /**
         * @property lateral_dist
         * @type {number}
         * @default -999
         */
        this.lateral_dist = -999;

        /**
         * @property straight_dist
         * @type {number}
         * @default -999
         */
        this.straight_dist = -999;

        /**
         * @property converging
         * @type {boolean}
         * @default false
         */
        this.converging = false;

        /**
         * @property parallel
         * @type {boolean}
         * @default false
         */
        this.parallel = false;

        /**
         * @property separationMinimum
         * @type {number}
         * @default -999
         */
        this.separationMinimum = -999;

        this.calculateRelationshipValues(primaryRunway, comparatorRunway);
    }

    /**
     * Calculate relationship values for each runway pair
     *
     * @for RunwayRelationshipModel
     * @method calculateRelationshipValues
     * @param primaryRunway {RuwnayModel}
     * @param comparatorRunway {RunwayModel}
     */
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
        this.separationMinimum = this.calculateSeparationMinimums();
    }

    /**
     * Determine applicable lateral separation minima for conducting
     * parallel simultaneous dependent approaches on these runways:
     *
     * Note: This does not take into account the (more complicated)
     * rules for dual/triple simultaneous parallel dependent approaches as
     * outlined by FAA JO 7110.65, para 5-9-7. Users playing at any of our
     * airports that have triple parallels may be able to "get away with"
     * the less restrictive rules, whilst their traffic may not be 100%
     * legal. It's just complicated and not currently worthwhile to add
     * rules for running trips at this point... maybe later. -@erikquinn
     * Reference: FAA JO 7110.65, section 5-9-6
     *
     * @for RunwayRelationshipModel
     * @method calculateSeparationMinimums
     * @return applicableLatSepMin {number}
     */
    calculateSeparationMinimums() {
        let applicableLatSepMin = SEPARATION.STANDARD_LATERAL_KM; // 3.0nm
        const runwaySeparationDistanceFeet = km_ft(this.lateral_dist);

        if (runwaySeparationDistanceFeet >= 2500 && runwaySeparationDistanceFeet <= 3600) {
            // 2500'-3600'
            applicableLatSepMin = km(1); // 1.852km
        } else if (runwaySeparationDistanceFeet > 3600 && runwaySeparationDistanceFeet <= 4300) {
            // 3600'-4300'
            applicableLatSepMin = km(1.5); // 2.778km
        } else if (runwaySeparationDistanceFeet > 4300 && runwaySeparationDistanceFeet <= 9000) {
            // 4300'-9000'
            applicableLatSepMin = km(2); // 3.704km
        }

        return applicableLatSepMin;
    }

    /**
     * @for RunwayRelationshipModel
     * @method destroy
     */
    destroy() {
        this.lateral_dist = -999;
        this.straight_dist = -999;
        this.converging = false;
        this.parallel = false;
        this.separationMinimum = -999;
    }
}
