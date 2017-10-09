import _includes from 'lodash/includes';
import _filter from 'lodash/filter';
import AirportController from '../airport/AirportController';
import EventBus from '../lib/EventBus';
import GameController, { GAME_EVENTS } from '../game/GameController';
import TimeKeeper from '../engine/TimeKeeper';
import UiController from '../UiController';
import { abs } from '../math/core';
import { angle_offset } from '../math/circle';
import { vlen, vsub, vturn } from '../math/vector';
import { degreesToRadians } from '../utilities/unitConverters';
import { SEPARATION } from '../constants/aircraftConstants';
import { EVENT } from '../constants/eventNames';

/**
 * Details about aircraft in close proximity in relation to 'the rules'
 *
 * @class AircraftConflict
 */
export default class AircraftConflict {
    constructor(first, second) {
        this._eventBus = EventBus;

        this.aircraft = [first, second];
        this.distance = vlen(vsub(first.relativePosition, second.relativePosition));
        this.distance_delta = 0;
        this.altitude = abs(first.altitude - second.altitude);
        this.collided = false;
        this.conflicts = {};
        this.violations = {};

        if (this.isAlreadyKnown()) {
            console.warn(`Duplicate conflict between ${this.aircraft[0].callsign} `
                + `and ${this.aircraft[1].callsign}! Scoring may be inaccurate!`);
            return;
        }

        this.update();
    }

    /**
     * Remove this conflict instance
     *
     * @for AircraftConflict
     * @method destroy
     */
    destroy() {
        this._eventBus.trigger(EVENT.REMOVE_AIRCRAFT_CONFLICT, this);
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
     * Recalculates and updates values for `this.distance`, `this.distance_delta`, and `this.altitude`
     *
     * @for AircraftConflict
     * @method _recalculateLateralAndVerticalDistances
     */
    _recalculateLateralAndVerticalDistances() {
        const distanceAtLastUpdate = this.distance;
        this.distance = vlen(vsub(this.aircraft[0].relativePosition, this.aircraft[1].relativePosition));
        this.distance_delta = this.distance - distanceAtLastUpdate;
        this.altitude = abs(this.aircraft[0].altitude - this.aircraft[1].altitude);
    }

    /**
     * Update conflict and violation checks, potentially removing this conflict.
     */
    update() {
        if (this.shouldBeRemoved()) {
            this.destroy();

            return;
        }

        // Avoid triggering any more conflicts if the two aircraft have collided
        if (this.collided) {
            return;
        }

        this._recalculateLateralAndVerticalDistances();
        this.checkCollision();
        this.checkRunwayCollision();

        // Ignore aircraft below about 1000 feet
        const airportElevation = AirportController.airport_get().elevation;
        const gameTime = TimeKeeper.accumulatedDeltaTime;
        if (((this.aircraft[0].altitude - airportElevation) < 990) ||
            ((this.aircraft[1].altitude - airportElevation) < 990)) {
            return;
        }

        // TODO: replace magic numbers with enum
        // Ignore aircraft in the first minute of their flight
        if (gameTime - this.aircraft[0].takeoffTime < 60 ||
            gameTime - this.aircraft[1].takeoffTime < 60) {
            return;
        }

        this.checkProximity();
    }

    /**
     * Check for collision
     */
    checkCollision() {
        if (this.aircraft[0].isOnGround() || this.aircraft[1].isOnGround()) {
            return;  // TEMPORARY FIX FOR CRASHES BTWN ARRIVALS AND TAXIIED A/C
        }

        // TODO: enumerate the magic numbers.
        // Collide within 160 feet
        const airport = AirportController.airport_get();

        if (
            ((this.distance < 0.05) && (this.altitude < 160)) &&
            (this.aircraft[0].isInsideAirspace(airport) && this.aircraft[1].isInsideAirspace(airport))
        ) {
            this.collided = true;
            const isWarning = true;

            UiController.ui_log(
                `${this.aircraft[0].callsign} collided with ${this.aircraft[1].callsign}`,
                isWarning
            );

            GameController.events_recordNew(GAME_EVENTS.COLLISION);
            this.aircraft[0].hit = true;
            this.aircraft[1].hit = true;

            // If either are in a runway queue, remove them from it
            AirportController.removeAircraftFromAllRunwayQueues(this.aircraft[0]);
            AirportController.removeAircraftFromAllRunwayQueues(this.aircraft[1]);
        }
    }

    /**
     * Check for a potential head-on collision on a runway
     */
    checkRunwayCollision() {
        // Check if the aircraft are on a potential collision course on the runway

        // TODO: this logic block needs its own method.
        // Check for the same runway, different ends and under about 6 miles
        if (
            (!this.aircraft[0].isTaxiing() && !this.aircraft[1].isTaxiing()) &&
            (this.aircraft[0].fms.currentRunway !== null) &&
            (this.aircraft[0].fms.currentRunway !== this.aircraft[1].fms.currentRunway) &&
            (this.aircraft[1].fms.currentRunway.name === this.aircraft[0].fms.currentRunway.name) &&
            (this.distance < 10)
        ) {
            if (!this.conflicts.runwayCollision) {
                const isWarning = true;
                this.conflicts.runwayCollision = true;

                UiController.ui_log(
                    `${this.aircraft[0].callsign} appears on a collision course with` +
                    ` ${this.aircraft[1].callsign} on the same runway"`,
                    isWarning
                );
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
        if (this.altitude >= SEPARATION.VERTICAL_FT) {
            this.conflicts.proximityConflict = false;
            this.conflicts.proximityViolation = false;

            return;
        }

        let conflict = false;
        let violation = false;
        let disableNotices = false;
        const a1 = this.aircraft[0];
        const a2 = this.aircraft[1];
        let applicableLatSepMin = SEPARATION.STANDARD_LATERAL_KM;


        // Established on precision guided approaches && both are following different instrument approaches
        if ((a1.isEstablishedOnCourse() && a2.isEstablishedOnCourse()) &&
            (a1.fms.arrivalRunwayModel.name !== a2.fms.arrivalRunwayModel.name)) {
            const runwayRelationship = AirportController.airport_get().getRunwayRelationshipForRunwayNames(
                a1.fms.arrivalRunwayModel.name,
                a2.fms.arrivalRunwayModel.name
            );

            if (runwayRelationship.parallel) {
                // hide notices for aircraft on adjacent final approach courses
                disableNotices = true;
                applicableLatSepMin = runwayRelationship.separationMinimum;
            }
        }

        // TODO: this should be another class method: hasSeparationViolation(applicableLatSepMin)
        // Considering all of the above cases,...
        violation = this.distance < applicableLatSepMin;
        // TODO: enumerate the magic number.
        // TODO: this should be another class method
        conflict = (this.distance < applicableLatSepMin + 1.852 && !disableNotices) || violation;  // +1.0nm

        // "Passing & Diverging" Rules (the "exception" to all of the above rules)
        // test the below only if separation is currently considered insufficient
        if (conflict) {
            const hdg_difference = abs(angle_offset(a1.groundTrack, a2.groundTrack));

            // TODO: couldnt these two ifs be combined to something like:
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
                    const dx = a2.relativePosition[0] - a1.relativePosition[0];
                    const dy = a2.relativePosition[1] - a1.relativePosition[1];
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

        // TODO: if conflict and violation both return booleans, remove the if/else blocks below and
        // set with those values

        // Update Conflicts
        if (conflict) {
            this.conflicts.proximityConflict = true;
        } else {
            this.conflicts.proximityConflict = false;
        }

        if (violation) {
            this.violations.proximityViolation = true;
            // TODO: Add score penalty for 'SEPARATION_LOSS', but only ONCE
        } else {
            this.violations.proximityViolation = false;
        }
    }

    /**
     * Checks if multiple `AircraftConflict` instances have been recorded for the same conflict
     * between the aircraft involved in `this`.
     *
     * @for AircraftConflict
     * @method isDuplicate
     * @return {Boolean}
     */
    isDuplicate() {
        return this._findInstancesOfThisConflictInAircraftController().length > 1;
    }

    /**
     * Checks if an `AircraftConflict` instance already exists in `AircraftController.conflicts`
     * for the aircraft involved in `this`.
     *
     * @for AircraftConflict
     * @method isAlreadyKnown
     * @return {Boolean}
     */
    isAlreadyKnown() {
        return this._findInstancesOfThisConflictInAircraftController().length > 0;
    }

    /**
     * Checks various conditions to determine whether the conflict should be removed
     *
     * @for AircraftConflict
     * @method shouldBeRemoved
     * @return {Boolean}
     */
    shouldBeRemoved() {
        return this._isOutsideBoundingBox() || this.isDuplicate();
    }

    /**
     * Checks whether the distance between the aircraft is greater than the size of the bounding
     * box within which we will examine the conflict closer
     *
     * @for AircraftConflict
     * @method _isOutsideBoundingBox
     * @private
     * @return {Boolean}
     */
    _isOutsideBoundingBox() {
        this._recalculateLateralAndVerticalDistances();

        return this.distance > SEPARATION.MAX_KM;
    }

    /**
     * Finds all instances (whether none, one, or multiple) of `AircraftConflict`s involving
     * the same aircraft included in `this.aircraft`.
     *
     * @for AircraftConflict
     * @method _findInstancesOfThisConflictInAircraftController
     * @return {Boolean}
     */
    _findInstancesOfThisConflictInAircraftController() {
        return _filter(window.aircraftController.conflicts, (conflict) => {
            return _includes(conflict.aircraft, this.aircraft[0]) && _includes(conflict.aircraft, this.aircraft[1]);
        });
    }
}
