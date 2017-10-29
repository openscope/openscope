import FixCollection from '../Fix/FixCollection';

export default class ProcedureWaypointModel {
    constructor(data) {
        if (typeof data === 'undefined') {
            throw new TypeError(`Expected valid data to create ProcedureWaypointModel but received ${data}`);
        }

        this.altitudeMaximum = -1;
        this.altitudeMinimum = -1;
        this.speedMaximum = -1;
        this.speedMinimum = -1;
        this._isFlyOverWaypoint = false;
        this._isHoldWaypoint = false;
        this._isVectorWaypoint = false;
        this._name = '';
        this._positionModel = null;

        this._init(data);
    }

    _init(data) {
        let fixName = data;
        let restrictions = '';

        if (typeof data !== 'string') {
            fixName = data[0];
            restrictions = data[1];
        }

        this._name = fixName.replace('@', '').replace('^', '').replace('#', '');
        this._isFlyOverWaypoint = fixName.indexOf('^') !== -1;
        this._isHoldWaypoint = fixName.indexOf('@') !== -1;
        this._isVectorWaypoint = fixName.indexOf('#') !== -1;
        this._applyRestrictions(restrictions);
        this._initializePosition();

        return;
    }

    _applyRestrictions(restrictions) {
        const restrictionCollection = restrictions.split('|');

        for (let i = 0; i < restrictionCollection.length; i++) {
            const restriction = restrictionCollection[i];

            // looking at the first letter of a restriction
            if (restriction[0] === 'A') {
                this._applyAltitudeRestriction(restriction.substr(1));
            } else if (restriction[0] === 'S') {
                this._applySpeedRestriction(restriction.substr(1));
            }
        }
    }

    _applyAltitudeRestriction(restriction) {
        const altitude = parseInt(restriction, 10) * 100;

        if (restriction.indexOf('+') !== -1) {
            this.altitudeMinimum = altitude;

            return;
        } else if (restriction.indexOf('-') !== -1) {
            this.altitudeMaximum = altitude;

            return;
        }

        this.altitudeMaximum = altitude;
        this.altitudeMinimum = altitude;
    }

    _applySpeedRestriction(restriction) {
        const speed = parseInt(restriction, 10);

        if (restriction.indexOf('+') !== -1) {
            this.speedMinimum = speed;

            return;
        } else if (restriction.indexOf('-') !== -1) {
            this.speedMaximum = speed;

            return;
        }

        this.speedMaximum = speed;
        this.speedMinimum = speed;
    }

    _initializePosition() {
        if (this._isVectorWaypoint) {
            return;
        }

        const fixPosition = FixCollection.getPositionModelForFixName(this._name);

        if (fixPosition === null) {
            throw new TypeError(`Expected fix with known position, but cannot find fix '${this._name}'`);
        }

        this._positionModel = fixPosition;
    }
}
