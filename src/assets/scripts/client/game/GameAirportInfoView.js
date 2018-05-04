import AirportController from '../airport/AirportController';
import EventBus from '../lib/EventBus';
import { FLIGHT_CATEGORY } from '../constants/aircraftConstants';
import { EVENT } from '../constants/eventNames';
import { SELECTORS } from '../constants/selectors';

/**
 * Displays information about the current airport
 * @class GameAirportInfoView
 */
export default class GameAirportInfoView {
    /**
     * @for GameAirportInfoView
     * @constructor
     */
    constructor($element) {
        this.$element = $element;
        this._eventBus = EventBus;

        return this._init($element);
    }

    /**
     * Method to update information when airport is changed
     *
     * @for GameAirportInfoView
     * @method update
     */
    update = (airport) => {
        this.airport = airport;

        return this._render();
    }

    /**
     * @for GameAirportInfoView
     * @method destroy
     * @chainable
     */
    destroy() {
        this.$element = null;
        this.airport = null;

        this._eventBus.off(EVENT.AIRPORT_CHANGE, this.update);

        return this;
    }

    /**
     * @for GameAirportInfoView
     * @method _init
     * @private
     */
    _init($element, icao) {
        this.$element = $element.find(SELECTORS.DOM_SELECTORS.AIRPORT_INFO);
        this.airport = AirportController.airport_get(icao);
        this._eventBus.on(EVENT.AIRPORT_CHANGE, this.update);

        return this;
    }

    /**
     * @for AirportGameInfoView
     * @method _render
     * @private
     */
    _render() {
        const $element = this.$element;
        const airport = this.airport;
        console.log('airport in _render ' + airport);
        let information = '';

        information = `WIND  | ${this._windFormat(airport.wind)}<br />`;
        information += `ALTIM | ${airport.icao} ${this._altimeter(airport.wind.speed)}<br />`;
        information += `ELEV  | ${airport.icao} ${this._elevation(airport)}`;

        $element.html(information);

        return this;
    }

    /**
     * Formats the wind into a string
     *
     * @for AirportGameInfoView
     * @method _windFormat
     * @private
     */
    _windFormat(wind) {
        const speed = wind.speed;
        const angle = wind.angle;
        let newAngle = '';
        let newSpeed = '';
        let gustSpeed = 0;

        if (angle === 0) {
            newAngle = '360';
        } else if (angle >= 100) {
            newAngle = String(angle);
        } else if (angle >= 10) {
            newAngle = `0${String(angle)}`;
        } else {
            newAngle = `00${String(angle)}`;
        }

        // Creates a fake "gusting" speed
        gustSpeed = Math.round(speed + (speed * Math.random()));

        if (speed < 10) {
            newSpeed = `0${String(speed)}`;
        }
        if (gustSpeed < 10) {
            gustSpeed = `0${String(gustSpeed)}`;
        }

        return `${newAngle}${newSpeed}G${gustSpeed}`;
    }

    /**
     * Creates an 'altimeter' reading for the info view
     *
     * @for GameAirportInfoView
     * @method _altimeter
     * @private
     */
    _altimeter(windSpeed) {
        return 2992 + Math.round((windSpeed * Math.random()) / 200);
    }

    /**
     * Finds the airport's field elevation
     *
     * @for GameAirportInfoView
     * @method _elevation
     * @private
     */
    _elevation(airport) {
        console.log('airport in _elevation is ' + airport);
        const activeRunway = airport.runways[0];

        return Math.round(activeRunway.end[0][2].);
    }
}
