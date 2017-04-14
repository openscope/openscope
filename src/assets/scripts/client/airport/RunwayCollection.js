import _forEach from 'lodash/forEach';
import _isArray from 'lodash/isArray';
import BaseCollection from '../base/BaseCollection';
import RunwayModel from './RunwayModel';
import RunwayRelationshipModel from './RunwayRelationshipModel';

/**
 *
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

        this._airportPosition = null;
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
        this._buildRunwayMetaData();
    }

    /**
     *
     *
     * @for RunwayCollection
     * @method destroy
     */
    destroy() {

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
     * @for RunwayCollection
     * @method _buildRunwayMetaData
     */
    _buildRunwayMetaData() {
        for (let i = 0; i < this.length; i++) {
            const primaryRunway = this._items[i];
            this._runwayRelationships[primaryRunway.name] = {};

            for (let j = 0; j < this.length; j++) {
                const comparatorRunway = this._items[j];

                if (primaryRunway.name === comparatorRunway.name) {
                    // eslint-disable-next-line no-continue
                    continue;
                }

                this._runwayRelationships[primaryRunway.name][comparatorRunway.name] = new RunwayRelationshipModel(
                    primaryRunway,
                    comparatorRunway
                );
            }
        }
    }
}
