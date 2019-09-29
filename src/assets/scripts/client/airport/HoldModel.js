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
    constructor(fixName, holdJson) {
        super();

        /**
         * Name of the Fix
         *
         * @property fixName
         * @type {string}
         * @default fixName
         */
        this.fixName = fixName;

        /**
         * The parameters of the hold
         *
         * @property holdParameters
         * @type {object}
         * @default DEFAULT_HOLD_PARAMETERS
         */
        this.holdParameters = Object.assign({}, DEFAULT_HOLD_PARAMETERS);

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
        this.holdParameters = Object.assign({}, DEFAULT_HOLD_PARAMETERS, {
            inboundHeading: degreesToRadians(holdJson.inboundHeading),
            legLength: holdJson.legLength,
            speed: holdJson.speed || undefined,
            turnDirection: holdJson.turnDirection
        });

        return this;
    }

    /**
     * @for MapModel
     * @method reset
     */
    reset() {
        this.fixName = '';
        this.holdParameters = Object.assign({}, DEFAULT_HOLD_PARAMETERS);
    }
}
