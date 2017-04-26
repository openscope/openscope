import _find from 'lodash/find';
import _forEach from 'lodash/forEach';
import _isArray from 'lodash/isArray';
import BaseCollection from '../../base/BaseCollection';
import RunwayModel from './RunwayModel';
import RunwayRelationshipModel from './RunwayRelationshipModel';
import { extrapolate_range_clamp } from '../../math/core';
import { degreesToRadians } from '../../utilities/unitConverters';

/**
 * Collection of `RunwayModel`s
 *
 * Provides methods to reason about the various `RunwayModel`s belonging to an airport
 *
 * @class RunwayCollection
 * @extends BaseCollection
 */
export default class RunwayCollection extends BaseCollection {
    /**
     * @constructor
     * @param runwayJson {array<object>}
     * @param airportPositionModel {StaticPositionModel}
     */
    constructor(runwayJson, airportPositionModel) {
        super();

        if (!_isArray(runwayJson)) {
            throw new TypeError(
                'Invalid parameter passed to RunwayCollection. Expected an array ' +
                `but found ${typeof runwayJson}`
            );
        }

        /**
         * @inherited
         * @memberof BaseCollection
         * @property _items
         * @type {array<RunwayModel>}
         * @default []
         */

        /**
         *
         * @property _airportPositionModel
         * @type {StaticPositionModel}
         * @default null
         * @private
         */
        this._airportPositionModel = null;

        /**
         *
         *
         * @property _runwayRelationships
         * @type object
         * @default {}
         * @private
         */
        this._runwayRelationships = {};

        this._init(runwayJson, airportPositionModel);
    }

    /**
     *
     *
     * @property runways
     * @return {array<RunwayModel>}
     */
    get runways() {
        return this._items;
    }

    /**
     *
     *
     * @for RunwayCollection
     * @method _init
     * @param runwayJson {array<object>}
     * @param airportPositionModel {StaticPositionModel}
     */
    _init(runwayJson, airportPositionModel) {
        this._airportPositionModel = airportPositionModel;

        this._buildRunwayModels(runwayJson);
        this._buildRunwayRelationships();
    }

    /**
     * Tear down the instance and destroy any class property values
     *
     * @for RunwayCollection
     * @method destroy
     */
    destroy() {
        this._airportPositionModel = null;
        this._runwayRelationships = {};
    }

    /**
     *
     *
     * @method findBestRunwayForWind
     */
    findBestRunwayForWind(getCurrentWindProps) {
        // FIXME: figure out what this does and move it to a more appropriate home
        const ra = (n) => {
            const deviation = degreesToRadians(10);

            return n + extrapolate_range_clamp(0, Math.random(), 1, -deviation, deviation);
        };

        let best_runway = '';
        let best_runway_headwind = -Infinity;
        const headwind = {};
        const wind = getCurrentWindProps();

        for (let i = 0; i < this._items.length; i++) {
            const runway = this._items[i];

            headwind[runway.name] = Math.cos(runway.angle - ra(wind.angle)) * wind.speed;
        }

        for (const runway in headwind) {
            if (headwind[runway] > best_runway_headwind) {
                best_runway = runway;
                best_runway_headwind = headwind[runway];
            }
        }

        return best_runway;
    }

    /**
     * Loop through all the `RunwayModel`s in the collection and
     * call the `.removeAircraftFromQueue()` method on each.
     *
     * This is a catchall method used for cleanup
     *
     * This method is overkill and can likely be removed in
     * the near future
     *
     * @for RunwayCollection
     * @method removeAircraftFromAllRunwayQueues
     */
    removeAircraftFromAllRunwayQueues(aircraftId) {
        for (let i = 0; i < this.length; i++) {
            const runwayModel = this._items[i];

            runwayModel.removeAircraftFromQueue(aircraftId);
        }
    }

    /**
     *
     *
     * @for RunwayCollection
     * @method findRunwayModelByName
     * @param
     * @return {RunwayModel|null}
     */
    findRunwayModelByName(runwayName = '') {
        return _find(this._items, { name: runwayName.toUpperCase() }) || null;
    }

    /**
     *
     *
     * @for RunwayCollection
     * @method getRunwayRelationshipForRunwayNames
     * @param  primaryRunwayName {string}
     * @param  comparatorRunwayName {string}
     * @return {boolean}
     */
    getRunwayRelationshipForRunwayNames(primaryRunwayName, comparatorRunwayName) {
        return this._runwayRelationships[primaryRunwayName.toUpperCase()][comparatorRunwayName.toUpperCase()];
    }

    /**
     *
     *
     * @for RunwayCollection
     * @method areRunwaysParallel
     * @param  primaryRunwayName {string}
     * @param  comparatorRunwayName {string}
     * @return {boolean}
     */
    areRunwaysParallel(primaryRunwayName, comparatorRunwayName) {
        const runwayRelationship = this.getRunwayRelationshipForRunwayNames(
            primaryRunwayName,
            comparatorRunwayName
        );

        return runwayRelationship.parallel;
    }

    /**
     *
     *
     * @for RunwayCollection
     * @method _buildRunwayModels
     * @param runwayJson {array<object>}
     */
    _buildRunwayModels(runwayJson) {
        _forEach(runwayJson, (runway) => {
            this._addRunwayToCollection(new RunwayModel(runway, 0, this._airportPositionModel));
            this._addRunwayToCollection(new RunwayModel(runway, 1, this._airportPositionModel));
        });
    }

    /**
     *
     *
     * @for RunwayCollection
     * @method _addRunwayToCollection
     * @param runwayModel {RunwayModel}
     */
    _addRunwayToCollection(runwayModel) {
        this._items.push(runwayModel);
    }

    /**
     *
     *
     * This method mutates `#_runwayRelationships`
     *
     * @for RunwayCollection
     * @method _buildRunwayRelationships
     */
    _buildRunwayRelationships() {
        for (let i = 0; i < this.length; i++) {
            const primaryRunway = this._items[i];
            // create subobject with primaryRunway name as the key
            this._runwayRelationships[primaryRunway.name] = {};

            this._buildRunwayRelationshipsForRunway(primaryRunway);
        }
    }

    /**
     *
     *
     * This method mutates `#_runwayRelationships`
     *
     * @method _buildRunwayRelationshipsForRunway
     * @param runwayModel {runwayModel}
     */
    _buildRunwayRelationshipsForRunway(runwayModel) {
        for (let i = 0; i < this.length; i++) {
            const comparatorRunway = this._items[i];

            if (runwayModel.name === comparatorRunway.name) {
                // eslint-disable-next-line no-continue
                continue;
            }

            this._runwayRelationships[runwayModel.name][comparatorRunway.name] = new RunwayRelationshipModel(
                runwayModel,
                comparatorRunway
            );
        }
    }
}
