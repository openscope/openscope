import _find from 'lodash/find';
import _forEach from 'lodash/forEach';
import _has from 'lodash/has';
import _keys from 'lodash/keys';
import _random from 'lodash/random';
import SidModel from './SidModel';

/**
 * @class SidCollection
 */
export default class SidCollection {
    /**
     * @constructor
     * @param sidList
     */
    constructor(sidList) {
        if (typeof sidList === 'undefined') {
            return;
        }

        this._sids = [];
        this.length = 0;

        return this._init(sidList);
    }

    /**
     * @for SidCollection
     * @method _init
     * @param sidList {object}
     * @private
     */
    _init(sidList) {
        this._addSidListToCollection(sidList);

        return this;
    }

    /**
     * @for SidCollection
     * @method _addSidListToCollection
     * @param sidList {object}
     * @private
     */
    _addSidListToCollection(sidList) {
        _forEach(sidList, (sid) => {
            this._addSidToCollection(sid);
        });

        return this;
    }

    /**
     * @for SidCollection
     * @method _addSidToCollection
     * @param sid {object}
     * @private
     */
    _addSidToCollection(sid) {
        const sidModel = new SidModel(sid);

        this._sids.push(sidModel);
        this.length = this._sids.length;

        return this;
    }


    /**
     * @for SidCollection
     * @method getSID
     * @param icao
     * @param exit
     * @param runway
     */
    findFixesForSidByRunwayAndExit(icao, exit, runway) {
        if (!icao && !exit && !runway) {
            return;
        }

        const sid = this.findSidByIcao(icao);

        console.log(sid.getFixesAndRestrictionsForRunway(runway));

        return sid;
        // return [
        //     ...sid.initialClimbFixes,
        //     ...sid.baseFixes,
        //     ...sid.exitFixes
        // ];
    }

    /**
     * @for SidCollection
     * @method getRandomExitPointForSIDIcao
     * @param id {string}
     */
    getRandomExitPointForSIDIcao(icao) {
        const sid = this.findSidByIcao(icao);

        // TODO: move to SidModel
        // if sid ends at fix for which the SID is named, return end fixName
        if (!_has(sid, 'exitPoints')) {
            return sid.icao;
        }

        // if has exitPoints, return a randomly selected one
        const exitPointIcaos = _keys(sid.exitPoints);
        const randomIndex = _random(0, exitPointIcaos.length);

        return exitPointIcaos[randomIndex];
    }

    /**
     * @for SidCollection
     * @method findSidByIcao
     * @param icao {string}
     * @return {object|undefined}
     */
    findSidByIcao(icao) {
        return _find(this._sids, { icao: icao });
    }
}
