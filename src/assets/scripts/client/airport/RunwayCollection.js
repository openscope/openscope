import _find from 'lodash/find';
import _forEach from 'lodash/forEach';
import _isArray from 'lodash/isArray';
import BaseCollection from '../base/BaseCollection';
import RunwayModel from './RunwayModel';
import RunwayRelationshipModel from './RunwayRelationshipModel';

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
         * @property _airportPosition
         * @type {StaticPositionModel}
         * @default null
         * @private
         */
        this._airportPosition = null;

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
     * @for RunwayCollection
     * @method _init
     * @param runwayJson {array<object>}
     * @param airportPositionModel {StaticPositionModel}
     */
    _init(runwayJson, airportPositionModel) {
        this._airportPosition = airportPositionModel;

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
        this._airportPosition = null;
        this._runwayRelationships = {};
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
            this._addRunwayToCollection(new RunwayModel(runway, 0, this._airportPosition));
            this._addRunwayToCollection(new RunwayModel(runway, 1, this._airportPosition));
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
