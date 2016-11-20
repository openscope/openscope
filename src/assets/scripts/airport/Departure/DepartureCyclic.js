/* eslint-disable no-underscore-dangle, no-mixed-operators, func-names, object-shorthand */
import DepartureBase from './DepartureBase';
import { sin } from '../../math/core';
import { tau } from '../../math/circle';
import { convertMinutesToSeconds } from '../../utilities/unitConverters';
import { TIME } from '../../constants/globalConstants';

/**
 * Generate departures in cyclic pattern
 *
 * @class DepartureCyclic
 * @extends DepartureBase
 */
export default class DepartureCyclic extends DepartureBase {
    /**
     * @for DepartureBase
     * @constructor
     * @param airport {AirportInstanceModel}
     * @param options {object}
     */
    constructor(airport, options) {
        super(airport, options);

        /**
         * length of a cycle
         *
         * @property period
         * @type {number}
         * @default TIME.ONE_HOUR_IN_SECONDS
         */
        this.period = TIME.ONE_HOUR_IN_SECONDS;

        /**
         * Start at the peak
         *
         * Optionally specify when the cycle peaks
         *
         * @property offset
         * @type {number}
         * @default -900
         */
        this.offset = -900;

        /**
         * @property _amplitude
         * @type {number}
         */
        this._amplitude = TIME.ONE_HOUR_IN_SECONDS / this.frequency / 2;

        /**
         * @property _average
         * @type {number}
         */
        this._average = TIME.ONE_HOUR_IN_SECONDS / this.frequency;
    }

    /**
     * @for DepartureCyclic
     * @method parse
     */
    parse(options) {
        super.parse(options);

        if (options.period) {
            this.period = convertMinutesToSeconds(options.period);
        }

        if (options.offset) {
            // TODO: enumerate the magic numbers
            this.offset = -this.period / 4 + convertMinutesToSeconds(options.offset);
        }
    }

    /**
     * @for DepartureCyclic
     * @method nextInterval
     * @return {number}
     */
    nextInterval() {
        const gameTimeWithOffset = window.gameController.game_time() + this.offset;
        const sinOffsetOverPeriod = sin(tau() * (gameTimeWithOffset / this.period));
        const amplitudeTimesSinOffsetOverPeriod = this._amplitude * sinOffsetOverPeriod;

        return (amplitudeTimesSinOffsetOverPeriod + this._average) / window.gameController.game.frequency;
    }
}
