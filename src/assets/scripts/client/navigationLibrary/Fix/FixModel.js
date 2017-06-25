import _cloneDeep from 'lodash/cloneDeep';
import _get from 'lodash/get';
import BaseModel from '../../base/BaseModel';
import StaticPositionModel from '../../base/StaticPositionModel';
import WaypointModel from '../../aircraft/FlightManagementSystem/WaypointModel';
import { INVALID_NUMBER } from '../../constants/globalConstants';

/**
 * Defines a navigational `FixModel`
 *
 * A `FixModel` can be used as part of a `StandardRoute` or as a naviagtional aid.
 * Not all `FixModel`s are a part of a `StandardRoute`.
 *
 * @class FixModel
 */
export default class FixModel extends BaseModel {
    /**
     * @for FixModel
     * @constructor
     * @param fixName {string}
     * @param fixCoordinate {array}
     * @param referencePosition {StaticPositionModel}
     */
    constructor(fixName, fixCoordinate, referencePosition) {
        super();

        /**
         * Name of the Fix
         *
         * @property name
         * @type {string}
         * @default ''
         */
        this.name = '';

        /**
         * Coordinates of the fix
         *
         * @property _positionModel
         * @type {StaticPositionModel}
         * @default null
         */
        this._positionModel = null;

        this.init(fixName, fixCoordinate, referencePosition);
    }

    /**
     * Provides access to the position data of the instance
     *
     * @property positionModel
     * @return {array}
     */
    get positionModel() {
        return this._positionModel;
    }

    /**
     * Fascade to access relative position
     *
     * @for FixModel
     * @return {array<number>} [kilometersNorth, kilometersEast]
     */
    get relativePosition() {
        return this._positionModel.relativePosition;
    }

    /**
     * Lifecycle method. Should be run only once on instantiation.
     *
     * @for FixModel
     * @method init
     * @param fixName {string}
     * @param fixCoordinate {array}
     * @param referencePosition {StaticPositionModel}
     * @chainable
     */
    init(fixName, fixCoordinate, referencePosition) {
        // TODO: should this be a throwing instead of returning early?
        if (!fixName || !fixCoordinate || !referencePosition) {
            return;
        }

        this.name = fixName.toUpperCase();
        this._positionModel = new StaticPositionModel(fixCoordinate, referencePosition, referencePosition.magneticNorth);

        return this;
    }

    /**
     * reset the current instance
     *
     * @for FixModel
     * @method reset
     * @chainable
     */
    reset() {
        this.name = '';
        this._positionModel = null;

        return this;
    }

    /**
     * Returns a clone of an instance's `_positionModel` property.
     *
     * It is important to note that this is a _clone_ and not a copy. Any changes made to this instance will
     * not be reflected in the clone. This creates an entirely new instance of the `_positionModel` property,
     * and after creation is completely independant of this instance.
     *
     * This is used with `StandardRouteWaypointModel` objects to obtain the position of a fix. This method
     * provides easy access to the `StaticPositionModel` that already exists here.
     *
     * @for FixModel
     * @return {StaticPositionModel}  a clone of the current `_positionModel` property
     */
    clonePosition() {
        return _cloneDeep(this._positionModel);
    }

    /**
     * Build a new `WaypointModel` from the current instance.
     *
     * This method provides a way to create a `WaypointModel` with the current
     * properties of a `FixModel` instance.
     *
     * This is used by `LegModel` when building a flight plan from `routeString`. A `directRouteString`
     * will result in finding a `FixModel`. From that `FixModel` we need to be able to create a
     * `WaypointModel` that the Fms can consume.
     *
     * There is a method of the same name in the `StandardRouteWaypointModel` that does this same thing
     * but will be used only for `procedureRouteStrings`.
     *
     * @for FixModel
     * @method toWaypointModel
     * @param isHold {boolean}
     * @param holdProps {object}
     * @return {WaypointModel}
     */
    toWaypointModel(isHold = false, holdProps = {}) {
        const waypointProps = {
            name: this.name,
            positionModel: this.clonePosition(),
            altitudeMaximum: INVALID_NUMBER,
            altitudeMinimum: INVALID_NUMBER,
            speedMaximum: INVALID_NUMBER,
            speedMinimum: INVALID_NUMBER
        };

        // TODO: Move these default behaviors to a constants file
        if (isHold) {
            waypointProps._holdingPatternInboundHeading = _get(holdProps, 'inboundHeading', 0);
            waypointProps.isHold = true;
            waypointProps.legLength = _get(holdProps, 'legLength', '1min');
            waypointProps.timer = -999;
            waypointProps.turnDirection = _get(holdProps, 'turnDirection', 'right');
        }

        return new WaypointModel(waypointProps);
    }
}
