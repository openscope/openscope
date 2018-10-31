/* eslint-disable max-len */
/**
 * HTML element used for each `StripViewModel`
 *
 * @property STRIP_VIEW_TEMPLATE
 * @type {string|HTMLElement}
 * @final
 */
export const STRIP_VIEW_TEMPLATE = '' +
'<li class="stripViewItem">' +
'   <table class="stripViewItem-table">' +
'       <tbody>' +
'           <tr class="stripView-table-tr">' +
'               <td class="stripView-table-td js-stripView-callsign" title="Callsign"></td>' +
'               <td class="stripView-table-td js-stripView-transponder" title="Transponder"></td>' +
'               <td class="stripView-table-td js-stripView-departureAirportId" title="Departure Airport Identifier"></td>' +
'               <td class="stripView-table-td js-stripView-flightPlan" title="Flight Plan Route" rowspan="2" colspan="2"></td>' +
'           </tr>' +
'           <tr class="stripView-table-tr">' +
'               <td class="stripView-table-td js-stripView-aircraftModel" title="Aircraft Model"></td>' +
'               <td class="stripView-table-td mix-stripView-table_borderTop js-stripView-assignedAltitude" title="Assigned Altitude"></td>' +
'               <td class="stripView-table-td js-stripView-arrivalAirportId" title="Arrival Airport Identifier"></td>' +
'           </tr>' +
'           <tr class="stripView-table-tr">' +
'               <td class="stripView-table-td">' +
'                   <div class="u-float-right js-stripView-flightRules" title="IFR (I) or VFR (V)">I</div>' +
'                   <div class="u-float-left js-stripView-cid" title="Computer Identification number"></div>' +
'               </td>' +
'               <td class="stripView-table-td mix-stripView-table_borderTop js-stripView-flightPlanAltitude" title="Flight Plan Altitude"></td>' +
'               <td class="stripView-table-td js-stripView-alternateAirportId" title="Alternate Airport Identifier"></td>' +
'               <td class="stripView-table-td js-stripView-remarks" title="Remarks"></td>' +
'               <td class="stripView-table-td js-stripView-runway stripView-preplanning" title="Runway"></td>' +
'           </tr>' +
'       </tbody' +
'   </table>' +
'</li>';
