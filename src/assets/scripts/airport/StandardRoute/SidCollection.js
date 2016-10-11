import _find from 'lodash/find';
import _forEach from 'lodash/forEach';
import _has from 'lodash/has';
import _keys from 'lodash/keys';
import _random from 'lodash/random';

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
     */
    _init(sidList) {
        this._addSidListToCollection(sidList);

        return this;
    }

    /**
     * @for SidCollection
     * @method _addSidListToCollection
     * @param sidList {object}
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
     */
    _addSidToCollection(sid) {
        this._sids.push(sid);
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
    getSID(icao, exit, runway) {
        if (!icao && !exit && !runway) {
            return;
        }

        const sid = this.findSidByIcao(icao);

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

        // if sid ends at fix for which the SID is named, return end fixName
        if (!_has(sid, 'exitPoints')) {
            return sid.icao;
        }

        // if has exitPoints, return a randomly selected one
        const exitPointIcaos = _keys(sid.exitPoints);
        const randomIndex = _random(0, exitPointIcaos.length);

        return exitPointIcaos[randomIndex];
    }

    // /**
    //  * @for SidCollection
    //  * @method getSIDName
    //  * @param id {string}
    //  * @param runway
    //  */
    // getSIDName(id, runway) {
    //     if (_has(this.sids[id], 'suffix')) {
    //         return `${this.sids[id].name} ${this.sids[id].suffix[runway]}`;
    //     }
    //
    //     return this.sids[id].name;
    // }

    // /**
    //  * @for SidCollection
    //  * @method getSIDid
    //  * @param id {string}
    //  * @param runway
    //  */
    // getSIDid(id, runway) {
    //     console.log('getSIDid: ', id, runway);
    //     if (_has(this.sids[id], 'suffix')) {
    //         return this.sids[id].icao + this.sids[id].suffix[runway];
    //     }
    //
    //     return this.sids[id].icao;
    // }


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
