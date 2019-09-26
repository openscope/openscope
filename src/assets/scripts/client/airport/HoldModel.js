import BaseModel from '../base/BaseModel';
import { degreesToRadians } from '../utilities/unitConverters';
import { DEFAULT_HOLD_PARAMETERS } from '../constants/waypointConstants';

/**
 * Defines a navigational `HoldModel`
 *
 * A `HoldModel` is used to specify how a hold executed at
 * a specific fix
 *
 * @class HoldModel
 */
export default class HoldModel extends BaseModel {
    /**
     * @for HoldModel
     * @constructor
     * @param holdJson {object}
     */
    constructor(holdJson) {
        super();

        /**
         * Name of the Fix
         *
         * @property fixName
         * @type {string}
         * @default ''
         */
        this.fixName = '';

        /**
         * The parameters of the hold
         *
         * @property holdParameters
         * @type {object}
         * @default DEFAULT_HOLD_PARAMETERS
         */
        this.holdParameters = Object.assign({}, DEFAULT_HOLD_PARAMETERS);

        /**
         * The names of the procedures that the hold applies to
         *
         * @property procedures
         * @type {array<string>}
         * @default []
         */
        this.procedures = [];

        this._init(holdJson);
    }

    // ------------------------------ LIFECYCLE ------------------------------

    /**
     * Initialize the model
     *
     * @for HoldModel
     * @method _init
     * @param holdJson {object}
     * @private
     */
    _init(holdJson) {
        this.fixName = holdJson.fixName;

        this.holdParameters = Object.assign({}, DEFAULT_HOLD_PARAMETERS, {
            inboundHeading: degreesToRadians(holdJson.inboundHeading),
            legLength: holdJson.legLength,
            turnDirection: holdJson.turnDirection
        });

        this.procedures = holdJson.procedures || [];

        return this;
    }

    /**
     * @for MapModel
     * @method reset
     */
    reset() {
        this.fixName = '';
        this.holdParameters = Object.assign({}, DEFAULT_HOLD_PARAMETERS);
        this.procedures = [];
    }
}
