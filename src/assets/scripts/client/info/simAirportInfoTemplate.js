/**
 * HTML template for the airport info view and clock.
 *
 * @property SIM_AIRPORT_INFO_TEMPLATE
 * @type {String|HTML Element}
 * @final
 */
export const SIM_AIRPORT_INFO_TEMPLATE = '' +
'<div id="airport-info">' +
'    <div id="definitions" class="sidebyside">' +
'        <div id="clock-def" class="vertical">TIME</div>' +
'        <div id="wind-def" class="vertical">WIND</div>' +
'        <div id="altimeter-def" class="vertical">ALTIM</div>' +
'        <div id="elevation-def" class="vertical">ELEV</div>' +
'    </div>' +
'    <div id="pipes" class="sidebyside">' +
'        <div class="vertical">|</div>' +
'        <div class="vertical">|</div>' +
'        <div class="vertical">|</div>' +
'        <div class="vertical">|</div>' +
'    </div>' +
'    <div id="values" class="sidebyside">' +
'        <div id="clock" class="vertical"></div>' +
'        <div id="wind" class="vertical"></div>' +
'        <div id="altimeter" class="vertical"></div>' +
'        <div id="elevation" class="vertical"></div>' +
'    </div>' +
'</div>';
