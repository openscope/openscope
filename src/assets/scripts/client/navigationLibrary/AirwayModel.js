import _forEach from 'lodash/forEach';
import _isEmpty from 'lodash/isEmpty';
import _map from 'lodash/map';
import _some from 'lodash/some';
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

        this._fixNameCollection = [];

        this._icao = '';

        this._navigationLibrary = null;

        this.init(icao, fixNames, navigationLibrary);
    }

    /**
     * Return the #_fixNameCollection
     *
     * @for AirwayModel
     * @property fixNameCollection
     * @type {array<string>}
     */
    get fixNameCollection() {
        return this._fixNameCollection;
    }

    // ------------------------------ LIFECYCLE ------------------------------

    init(icao, fixNames, navigationLibrary) {
        this._fixNameCollection = fixNames;
        this._icao = icao;
        this._navigationLibrary = navigationLibrary;

        this._verifyFixNamesExistInNavigationLibrary(fixNames);

        return this;
    }

    reset() {
        this._fixNameCollection = [];
        this._icao = '';
        this._navigationLibrary = null;

        return this;
    }

    _verifyFixNamesExistInNavigationLibrary(fixNames) {
        _forEach(fixNames, (fixName) => {
            if (!this._navigationLibrary.hasFixName(fixName)) {
                throw new TypeError(`Expected to find fix "${fixName}" for ` +
                    `airway "${this._icao}", but it is not a defined fix!`
                );
            }
        });
    }

    // ------------------------------ PUBLIC ------------------------------

    getWaypointModelsForEntryAndExit(entryName, exitName) {
        if (entryName === exitName) {
            console.error('Expected use of airway to include at least two fixes');

            return;
        }

        const indexOfEntryFix = this._fixNameCollection.indexOf(entryName);
        const indexOfExitFix = this._fixNameCollection.indexOf(exitName);

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

    /**
     * Returns whether the specified fix name is on the airway
     *
     * @for AirwayModel
     * @method hasFixName
     * @return {boolean}
     */
    hasFixName(fixName) {
        return this._fixNameCollection.indexOf(fixName) !== INVALID_INDEX;
    }

    // ------------------------------ PRIVATE ------------------------------

    _getFixNamesFromIndexToIndex(startIndex, endIndex) {
        if (startIndex === endIndex) {
            throw new TypeError('Expected use of airway to include at least two fixes');
        }

        const numberOfFixes = Math.abs(endIndex - startIndex) + 1;

        if (endIndex > startIndex) {
            return this._fixNameCollection.slice().splice(startIndex, numberOfFixes);
        }

        return this._fixNameCollection.slice().splice(endIndex, numberOfFixes).reverse();
    }
}
