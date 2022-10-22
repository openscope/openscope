import $ from 'jquery';
import EventBus from '../lib/EventBus';
import { SELECTORS, CLASSNAMES } from '../constants/selectors';
import { EVENT } from '../constants/eventNames';
import AirportController from '../airport/AirportController';

/**
 * @property UI_SETTINGS_MODAL_TEMPLATE
 * @type {string}
 * @final
 */
const UI_MAP_MODAL_TEMPLATE = `
    <div class="map-dialog dialog notSelectable">
        <p class="dialog-title">Video Maps</p>
        <div class="dialog-body nice-scrollbar"></div>
    </div>`;

/**
 * @class VideoMapController
 */
export default class VideoMapController {
    constructor($element) {
        /**
         * @property EventBus
         * @type {EventBus}
         * @default EventBus
         * @private
         */
        this._eventBus = EventBus;

        /**
         * Root DOM element
         *
         * @property $element
         * @type {jquery|HTML Element}
         * @default $element
         */
        this.$element = $element;

        /**
         * Dialog DOM element
         *
         * @property $dialog
         * @type {jquery|HTML Element}
         * @default null
         */
        this.$dialog = null;

        /**
         * Currently selected maps, default to the one in the Airport file
         *
         * @property _selectedMaps
         * @type {object}
         * @default null
         */
        this._selectedMaps = null;


        this._setupHandlers()
            .init()
            .enable();
    }

    /**
     *
     * @for VideoMapController
     * @method init
     * @chainable
     */
    init() {
        this.$dialog = $(UI_MAP_MODAL_TEMPLATE);
        this.$dialogBody = this.$dialog.find(`.${CLASSNAMES.DIALOG_BODY}`);

        this._buildDialogBody();
        this.$element.append(this.$dialog);

        return this;
    }

    /**
     * Create event handlers
     *
     * Should be run once only on instantiation
     *
     * @for VideoMapController
     * @method _setupHandlers
     * @chainable
     */
    _setupHandlers() {
        this._onAirportChangeHandler = this.onAirportChange.bind(this);
        this._onChangeSelectedMapsHandler = this.onChangeSelectedMaps.bind(this);

        return this;
    }

    /**
     * Enable event handlers
     *
     * should be run only once on instantiation
     *
     * @for VideoMapController
     * @method enable
     * @chainable
     */
    enable() {
        this._eventBus.on(EVENT.AIRPORT_CHANGE, this._onAirportChangeHandler);

        return this;
    }

    /**
     * Disable event handlers
     *
     * @for VideoMapController
     * @method disable
     * @chainable
     */
    disable() {
        this._eventBus.off(EVENT.AIRPORT_CHANGE, this._onAirportChangeHandler);

        return this;
    }

    /**
     * Returns whether the airport selection dialog is open
     *
     * @for VideoMapController
     * @method isDialogOpen
     * @return {boolean}
     */
    isDialogOpen() {
        return this.$dialog.hasClass(SELECTORS.CLASSNAMES.OPEN);
    }

    /**
    * @for VideoMapController
    * @method toggleDialog
    */
    toggleDialog() {
        this.$dialog.toggleClass(SELECTORS.CLASSNAMES.OPEN);
    }

    /**
     * Rebuilds the dialog body when the airport is changed.
     *
     * @for VideoMapController
     * @method onAirportChange
     */
    onAirportChange() {
        this._buildDialogBody();
    }

    /**
     * Builds the dialog body
     *
     * @for VideoMapController
     * @method _buildDialogBody
     */
    _buildDialogBody() {
        this.$dialogBody.empty();

        const airportModel = AirportController.airport_get();
        const mapNames = airportModel.mapCollection.getMapNames();
        this._selectedMaps = airportModel.mapCollection.getVisibleMapNames();

        for (const mapName of mapNames) {
            const isChecked = this._selectedMaps.includes(mapName);
            const $formElement = this._buildRow(mapName, mapName, isChecked);

            this.$dialogBody.append($formElement);
        }
    }

    /**
     * Build form element
     *
     * @for VideoMapController
     * @method _buildRow
     * @param key {string}
     * @param label {string}
     * @param checked {boolean} initial value
     * @param onChangeMethod {function}
     * @return {jquery|HTML Element}
     */
    _buildRow(key, label, checked) {
        const template = `
            <div class="form-element">
                <input class="form-checkbox" type="checkbox" name="${key}"/>
                <label class="form-label"> ${label}</label>
            </div>`;
        const $element = $(template);

        $element.find('.form-checkbox').prop('checked', checked);
        $element.on('change', { name: label }, this._onChangeSelectedMapsHandler);

        return $element;
    }

    /**
     * Called when the video map selection is changed
     *
     * @for VideoMapController
     * @method onChangeSelectedMaps
     * @param event
     */
    onChangeSelectedMaps(event) {
        const $target = $(event.target);
        const isChecked = $target.prop('checked');
        const map = event.data.name;

        if (!isChecked) {
            this._removeMap(map);
            return;
        }

        this._addMap(map);
    }

    /**
     * Helper method to add a map to the list of selected maps
     *
     * @param map
     * @private
     */
    _addMap(map) {
        this._selectedMaps.push(map);
        this._eventBus.trigger(EVENT.TOGGLE_VIDEO_MAP, this._selectedMaps);
    }

    /**
     *  Helper method to remove a map from the list of selected maps
     *
     * @param map
     * @private
     */
    _removeMap(map) {
        const index = this._selectedMaps.indexOf(map);

        if (index > -1) {
            this._selectedMaps.splice(index, 1);
        }

        this._eventBus.trigger(EVENT.TOGGLE_VIDEO_MAP, this._selectedMaps);
    }
}
