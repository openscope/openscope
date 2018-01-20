import _findIndex from 'lodash/findIndex';
import _isEmpty from 'lodash/isEmpty';
import _map from 'lodash/map';
import WaypointModel from '../aircraft/FlightManagementSystem/WaypointModel';
import { INVALID_INDEX } from '../constants/globalConstants';

export default class AirwayModel {
    constructor(icao, fixNames, navigationLibrary) {
        if (_isEmpty(icao)) {
            throw new TypeError('Expected airway to have a non-empty name, but no airway name was given');
        }

        if (_isEmpty(fixNames)) {
            throw new TypeError(`Expected a list of fix names for airway "${icao}", but received none`);
        }

        this._icao = '';

        this._fixCollection = [];

        this._navigationLibrary = null;

        this.init(icao, fixNames, navigationLibrary);
    }

    // ------------------------------ LIFECYCLE ------------------------------

    init(icao, fixNames, navigationLibrary) {
        this._icao = icao;
        this._navigationLibrary = navigationLibrary;

        this._initFixCollection(fixNames);

        return this;
    }

    reset() {
        this._icao = '';
        this._fixCollection = [];
        this._navigationLibrary = null;

        return this;
    }

    _initFixCollection(fixNames) {
        this._fixCollection = _map(fixNames, (fixName) => {
            const fixModel = this._navigationLibrary.findFixByName(fixName);

            if (fixModel === null) {
                throw new TypeError(`Expected to find fix "${fixName}" for ` +
                    `airway "${this._icao}", but it is not a defined fix!`
                );
            }

            return fixModel;
        });
    }

    // ------------------------------ PUBLIC ------------------------------

    getWaypointModelsForEntryAndExit(entryName, exitName) {
        if (entryName === exitName) {
            console.error('Expected use of airway to include at least two fixes');

            return;
        }

        const indexOfEntryFix = this._findIndexOfFixName(entryName);
        const indexOfExitFix = this._findIndexOfFixName(exitName);

        if (indexOfEntryFix === INVALID_INDEX) {
            console.error(`Expected valid entry of "${this._icao}" airway, but received "${entryName}"`);

            return;
        }

        if (indexOfExitFix === INVALID_INDEX) {
            console.error(`Expected valid exit of "${this._icao}" airway, but received "${exitName}"`);

            return;
        }

        const fixNames = this._getFixNamesFromIndexToIndex(indexOfEntryFix, indexOfExitFix);
        const waypointModels = _map(fixNames, (fixName) => new WaypointModel(fixName));

        return waypointModels;
    }

    // ------------------------------ PRIVATE ------------------------------

    _findIndexOfFixName(fixName) {
        return _findIndex(this._fixCollection, (fixModel) => fixModel.name === fixName.toUpperCase());
    }

    _getFixNamesFromIndexToIndex(startIndex, endIndex) {
        if (startIndex === endIndex) {
            throw new TypeError('Expected use of airway to include at least two fixes');
        }

        const numberOfFixes = Math.abs(endIndex - startIndex) + 1;

        if (startIndex > endIndex) {
            const fixModels = this._fixCollection.slice().splice(endIndex, numberOfFixes);
            const fixNames = _map(fixModels, (fixModel) => fixModel.name);

            return fixNames.reverse();
        }

        const fixModels = this._fixCollection.slice().splice(startIndex, numberOfFixes);
        const fixNames = _map(fixModels, (fixModel) => fixModel.name);

        return fixNames;
    }
}
