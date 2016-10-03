/* eslint-disable camelcase, no-underscore-dangle, no-mixed-operators, func-names, object-shorthand, no-param-reassign, no-undef */
import { abs } from '../math/core';
import { angle_offset } from '../math/circle';
import { vlen, vsub, vturn } from '../math/vector';
import { km_ft, degreesToRadians } from '../utilities/unitConverters';

// TODO: move these to a constants file
// 14.816km = 8nm (max possible sep minmum)
const MAXIMUM_SEPARATION_KM = 14.816;
// Standard Basic Lateral Separation Minimum
const STANDARD_LATERAL_SEPARATION_MINIMUM_KM = 5.556; // 3nm
// Minimum vertical separation in feet
const MIN_VERTICAL_SEPARATION_FT = 1000;

/**
 * Details about aircraft in close proximity in relation to 'the rules'
 *
 * @class AircraftConflict
 */
export default class AircraftConflict {
    constructor(first, second) {
        this.aircraft = [first, second];
        this.distance = vlen(vsub(first.position, second.position));
        this.distance_delta = 0;
        this.altitude = abs(first.altitude - second.altitude);

        this.collided = false;

        this.conflicts = {};
        this.violations = {};

        this.aircraft[0].addConflict(this, second);
        this.aircraft[1].addConflict(this, first);

        this.update();
    }

    /**
     * Is there anything which should be brought to the controllers attention
     *
     * @returns {Array of Boolean} First element true if any conflicts/warnings,
     *                             Second element true if any violations.
     */
    hasAlerts() {
        return [this.hasConflict(), this.hasViolation()];
    }

    /**
     *  Whether any conflicts are currently active
     */
    hasConflict() {
        for (const i in this.conflicts) {
            if (this.conflicts[i]) {
                return true;
            }
        }

        return false;
    }

    /**
     *  Whether any violations are currently active
     */
    hasViolation() {
        for (const i in this.violations) {
            if (this.violations[i]) {
                return true;
            }
        }

        return false;
    }

    /**
     * Update conflict and violation checks, potentially removing this conflict.
     */
    update() {
        // Avoid triggering any more conflicts if the two aircraft have collided
        if (this.collided) {
            return;
        }

        const d = this.distance;
        this.distance = vlen(vsub(this.aircraft[0].position, this.aircraft[1].position));
        this.distance_delta = this.distance - d;
        this.altitude = abs(this.aircraft[0].altitude - this.aircraft[1].altitude);

        // Check if the separation is now beyond the bounding box check
        if (this.distance > MAXIMUM_SEPARATION_KM) {
            this.remove();
            return;
        }

        this.checkCollision();
        this.checkRunwayCollision();

        // Ignore aircraft below about 1000 feet
        const airportElevation = window.airportController.airport_get().elevation;
        if (((this.aircraft[0].altitude - airportElevation) < 990) ||
            ((this.aircraft[1].altitude - airportElevation) < 990)) {
            return;
        }


        // Ignore aircraft in the first minute of their flight
        if ((window.gameController.game_time() - this.aircraft[0].takeoffTime < 60) ||
            (window.gameController.game_time() - this.aircraft[0].takeoffTime < 60)) {
            return;
        }

        this.checkProximity();
    }

    /**
     * Remove conflict for both aircraft
     */
    remove() {
        this.aircraft[0].removeConflict(this.aircraft[1]);
        this.aircraft[1].removeConflict(this.aircraft[0]);
    }

    /**
     * Check for collision
     */
    checkCollision() {
        if (this.aircraft[0].isLanded() || this.aircraft[1].isLanded()) {
            return;  // TEMPORARY FIX FOR CRASHES BTWN ARRIVALS AND TAXIIED A/C
        }

        // TODO: enumerate the magic numbers.
        // Collide within 160 feet
        if (((this.distance < 0.05) && (this.altitude < 160)) &&
            (this.aircraft[0].isVisible() && this.aircraft[1].isVisible())
        ) {
            this.collided = true;
            const isWarning = true;
            window.uiController.ui_log(`${this.aircraft[0].getCallsign()} collided with ${this.aircraft[1].getCallsign()}`, isWarning);

            prop.game.score.hit += 1;
            this.aircraft[0].hit = true;
            this.aircraft[1].hit = true;

            // If either are in runway queue, remove them from it
            for (const i in window.airportController.airport_get().runways) {
                const runway = window.airportController.airport_get().runways[i];

                // Primary End of Runway
                runway[0].removeQueue(this.aircraft[0], true);
                runway[0].removeQueue(this.aircraft[1], true);

                // Secondary End of Runway
                runway[1].removeQueue(this.aircraft[0], true);
                runway[1].removeQueue(this.aircraft[1], true);
            }
        }
    }

    /**
     * Check for a potential head-on collision on a runway
     */
    checkRunwayCollision() {
        // Check if the aircraft are on a potential collision course
        // on the runway
        const airport = window.airportController.airport_get();

        // TODO: this logic block needs its own method.
        // Check for the same runway, different ends and under about 6 miles
        if ((!this.aircraft[0].isTaxiing() && !this.aircraft[1].isTaxiing()) &&
            (this.aircraft[0].rwy_dep !== null) &&
            (this.aircraft[0].rwy_dep !== this.aircraft[1].rwy_dep) &&
            (airport.getRunway(this.aircraft[1].rwy_dep) === airport.getRunway(this.aircraft[0].rwy_dep)) &&
            (this.distance < 10)
        ) {
            if (!this.conflicts.runwayCollision) {
                this.conflicts.runwayCollision = true;
                window.uiController.ui_log(
                    `${this.aircraft[0].getCallsign()} appears on a collision course with` +
                    ` ${this.aircraft[1].getCallsign()} on the same runway"`,
                    isWarning
                );

                prop.game.score.warning += 1;
            }
        } else {
            this.conflicts.runwayCollision = false;
        }
    }

    // TODO: this method is ripe for refactor. lots of logic that can be pulled out to
    // helper functions or other class methods.
    /**
     * Check for physical proximity and trigger crashes if necessary
     */
    checkProximity() {
        // No conflict or warning if vertical separation is present
        if (this.altitude >= MIN_VERTICAL_SEPARATION_FT) {
            this.conflicts.proximityConflict = false;
            this.conflicts.proximityViolation = false;

            return;
        }

        let conflict = false;
        let violation = false;
        let disableNotices = false;
        const a1 = this.aircraft[0];
        const a2 = this.aircraft[1];
        let applicableLatSepMin = STANDARD_LATERAL_SEPARATION_MINIMUM_KM;


        // Established on precision guided approaches && both are following different instrument approaches
        if ((a1.isPrecisionGuided() && a2.isPrecisionGuided()) && (a1.rwy_arr !== a2.rwy_arr)) {
            const runwayRelationship = window.airportController.airport_get().metadata.rwy[a1.rwy_arr][a2.rwy_arr];

            // Determine applicable lateral separation minima for conducting
            // parallel simultaneous dependent approaches on these runways:
            if (runwayRelationship.parallel) {
                // hide notices for aircraft on adjacent final approach courses
                disableNotices = true;

                // TODO: this should be a helper function: findSeparationMinimum = (feetBetween) => {};
                const feetBetween = km_ft(runwayRelationship.lateral_dist);
                if (feetBetween < 2500) {
                    // Runways separated by <2500'
                    applicableLatSepMin = STANDARD_LATERAL_SEPARATION_MINIMUM_KM;  // 3.0nm
                } else if (feetBetween >= 2500 && feetBetween <= 3600) {
                    // 2500'-3600'
                    applicableLatSepMin = 1.852;  // 1.0nm
                } else if (feetBetween > 3600 && feetBetween <= 4300) {
                    // 3600'-4300'
                    applicableLatSepMin = 2.778;  // 1.5nm
                } else if (feetBetween > 4300 && feetBetween <= 9000) {
                    // 4300'-9000'
                    applicableLatSepMin = 3.704;  // 2.0nm
                } else if (feetBetween > 9000) {
                    // Runways separated by >9000'
                    applicableLatSepMin = STANDARD_LATERAL_SEPARATION_MINIMUM_KM;  // 3.0nm
                }
                // Note: The above does not take into account the (more complicated)
                // rules for dual/triple simultaneous parallel dependent approaches as
                // outlined by FAA JO 7110.65, para 5-9-7. Users playing at any of our
                // airports that have triple parallels may be able to "get away with"
                // the less restrictive rules, whilst their traffic may not be 100%
                // legal. It's just complicated and not currently worthwhile to add
                // rules for running trips at this point... maybe later. -@erikquinn
                // Reference: FAA JO 7110.65, section 5-9-6
            }
        }

        // TODO: this should be another class method: hasSeparationViolation(applicableLatSepMin)
        // Considering all of the above cases,...
        violation = (this.distance < applicableLatSepMin);
        // TODO: enumerate the magic number.
        // TODO: this should be another class method
        conflict = (this.distance < applicableLatSepMin + 1.852 && !disableNotices) || violation;  // +1.0nm

        // "Passing & Diverging" Rules (the "exception" to all of the above rules)
        // test the below only if separation is currently considered insufficient
        if (conflict) {
            const hdg_difference = abs(angle_offset(a1.groundTrack, a2.groundTrack));

            // FIXME: couldnt these two ifs be combined to something like:
            // if (hdg_difference >= degreesToRadians(15) && hdg_difference > degreesToRadians(165)) {}
            if (hdg_difference >= degreesToRadians(15)) {
                if (hdg_difference > degreesToRadians(165)) {
                    // 'opposite' courses
                    if (this.distance_delta > 0) {
                        // OKAY IF the distance is increasing
                        conflict = false;
                        violation = false;
                    }
                } else {
                    // TODO: this should definitely be a helper function that lives in one of the math/ files
                    // 'same' or 'crossing' courses
                    // Ray intersection from http://stackoverflow.com/a/2932601
                    const ad = vturn(a1.groundTrack);
                    const bd = vturn(a2.groundTrack);
                    const dx = a2.position[0] - a1.position[0];
                    const dy = a2.position[1] - a1.position[1];
                    const det = bd[0] * ad[1] - bd[1] * ad[0];
                    const u = (dy * bd[0] - dx * bd[1]) / det;  // a1's distance from point of convergence
                    const v = (dy * ad[0] - dx * ad[1]) / det;  // a2's distance from point of convergence

                    // TODO: this should be a helper function that live in one of the math/ files
                    if ((u < 0) || (v < 0)) { // check if either a/c has passed the point of convergence
                        conflict = false;  // targets are diverging
                        violation = false;  // targets are diverging
                    }
                    // Reference: FAA JO 7110.65, section 5-5-7-a-1:
                    // (a) Aircraft are on opposite/reciprocal courses and you have observed
                    // that they have passed each other; or aircraft are on same or crossing
                    // courses/assigned radar vectors and one aircraft has crossed the
                    // projected course of the other, and the angular difference between
                    // their courses/assigned radar vectors is at least 15 degrees.
                }
            }
        }

        // Update Conflicts
        if (conflict) {
            this.conflicts.proximityConflict = true;
        } else {
            this.conflicts.proximityConflict = false;
        }

        if (violation) {
            this.violations.proximityViolation = true;
        } else {
            this.violations.proximityViolation = false;
        }
    }
}
