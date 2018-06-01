import AirportController from '../airport/AirportController';
import EventBus from '../lib/EventBus';
import { radiansToDegrees } from '../utilities/unitConverters';
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
    _init($element) {
        this.$element = $element.find(SELECTORS.DOM_SELECTORS.AIRPORT_INFO);
        this.airport = AirportController.airport_get();
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

        information = `WIND &nbsp;| ${this._windFormat(airport.wind)}<br />`;
        information += `ALTIM | ${airport.icao} ${this._altimeter(airport.wind.speed)}<br />`;
        information += `ELEV &nbsp;| ${airport.icao} ${airport.runways[0].end[0][2]}`;

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
        return 2992 + Math.round(windSpeed * (Math.random() - 0.5));
    }
    /**
     * Loads the initial view.
     *
     * We need to wait until AppController#complete is called,
     * otherwise the airport will likely not be loaded, and we
     * get `undefined` everywhere.
     *
     * A seperate render function is needed because the initial airport
     * model is formatted differently than subsequently loaded models.
     *
     * nb: `this.airport` should have already been defined when
     * GameAirportInfoView#init fires in AppController#setupChildren
     *
     * @for GameAirportInfoView
     * @method initialLoad
     */
    initialLoad() {
        const $element = this.$element;
        const airport = this.airport;
        const icao = airport.icao.toUpperCase();
        const windAngle = Math.round(radiansToDegrees(airport.wind.angle));
        let information = '';

        information = `WIND &nbsp;| ${this._windFormat({ speed: airport.wind.speed, angle: windAngle })}<br />`;
        information += `ALTIM | ${icao} ${this._altimeter(airport.wind.speed)}<br />`;
        information += `ELEV &nbsp;| ${icao} ${airport.elevation}`;

        $element.html(information);

        return this;
    }
}
