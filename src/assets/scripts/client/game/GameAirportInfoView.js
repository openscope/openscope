import AirportController from '../airport/AirportController';
import EventBus from '../lib/EventBus';
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
        let information = '';

        information = `WIND  | ${this._windFormat(airport.wind)}`;
        information += `ALTIM | ${airport.icao} ${this._altimeter(airport.wind.speed)}\n`;
        information += `ELEV  | ${airport.icao} ${airport.elevation}`;

        $element.text(information);

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

        return `${newAngle}${String(speed)}G${String(gustSpeed)}`;
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
}
