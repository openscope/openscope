/**
 * @enum AIRCRAFT_COMMAND_REFERENCE {string}
 * @type {string}
 * @final
 */
export const AIRCRAFT_COMMAND_REFERENCE = {
  CLEARED_AS_FILED: 'This command tells the airplane that they are cleared to follow the flight plan that they requested when spawning. Therefore, when a departure spawns on the ground, and his strip shows that he filed for a particular SID, there is no need to use the sid command. Just clear him "as filed" with the caf command, and the airplane will take care of the rest.',
  CLIMB_VIA_SID: 'Authorizes the aircraft to climb in accordance with the SID that is currently in their flightplan. They will climb to their filed cruise altitude, whilst complying with all altitude and speed restrictions posted in the procedure.',
  TAKEOFF: 'This command clears the specified plane for takeoff. They will climb to the altitude specified, or in accordance with a SID if told previously to "climb via the SID". If neither has happened, they will ask for an altitude assignment before they agree to take off.',
  TAXI: 'This command tells the specified plane to taxi to a runway; if a runway is not included they will continue to the runway with the largest headwind.',
  DESCEND_VIA_STAR: 'Authorizes the aircraft to descend in accordance with the SID that is currently in their flightplan. They will descend to the lowest altitude required by the STAR, and after no further altitude and/or speed restrictions are listed, will maintain their altitude and speed until receiving further instructions from ATC.',
  HELP: 'This command displays the command reference for a given command. You know this! You just ran the \'help\' command to get to this information!',
  LAND: 'This command clears the aircraft to land on a runway. The aircraft\'s strip on the right will show either "intercept" if it\'s still trying to intercept the localizer. Once established, it will show "on ILS" and the aircraft will automatically fly down the runway centerline, descend, and land.',
  FIX: 'This command has been deprecated.',
  HOLD: 'This command instructs the aircraft to enter a holding pattern until further notice. The direction (left/right) may be specified, as well as the leg length (in minutes), as well as the fix to hold over. But you may also omit those specifications, in which case, the aircraft will enter a standard holding pattern over their present position (right turns, 1 minute legs). To clear the aircraft out of the hold, either clear it direct to a fix or assign it a new heading.',
  PROCEED_DIRECT: 'This command instructs the aircraft to go direct to a navigational fix, taking a shortcut. For example, if an aircraft is flying to fixes [A, B, C, D, E, F], issuing the command "pd D" will cause the aircraft to go to D, then E. After flying past the last fix, the aircraft will switch to heading mode and fly their present heading.',
  ROUTE: 'This command instructs aircraft to follow a user-provided "route", typically one that is along an airway, approach, SID, STAR, other published procedure, or a series of fixes. This is similar to the reroute/rr command, but this command will allow you to "insert" a route that connects with the route they\'re currently flying. See the wiki for the syntax.',
  REROUTE: 'This command allows you to wipe out the aircraft\'s current route, and assign a new route of your choosing. This is similar to the route command, but this command will allow you to change the entire route, while the other is meant for specifying a route to follow to join a later point in the aircraft\'s flight plan. See the wiki for the syntax.',
  SID: 'This command tells the specified plane a standard instrument departure route (SID) it should follow. Each SID is a list of fixes to be flown in sequence. Having a standardized route often helps organize departing traffic, and maintain separation from arriving aircraft.',
  STAR: 'This command tells the plane to add or change their filed Standard Terminal Arrival Route to match the route you specify. This must be entered in dotted format, and include the point where the STAR is joined, as well as the destination airport, for example: MLP.GLASR9.KSEA. See the section on rerouting for further detail.',
  ALTITUDE: 'This command tells the specified plane the altitude, in hundreds of feet (flight levels), it should travel to. This means that when writing altitudes you would drop the last two zeros. For example, 3,000ft = "30", 8,300ft = "83", 10,000ft = "100", and FL180 (18,000ft) = "180". Airplanes will not descend below 1000 feet (unless locked on ILS).',
  HEADING: 'This command sets the target heading; up (north) is 360, right (east) is 090, down (south) is 180, and left (west) is 270. Of course you can use any angle in between these as well. If the heading is set before takeoff, the aircraft will turn to that heading after takeoff. You can force the aircraft to reach the heading by turning left or right by inserting l or r before the new heading, as demonstrated below.',
  SPEED: 'This command sets the target speed; aircraft will stay within their safe speeds if you tell them to fly faster or slower than they are able to. It takes some time to increase and reduce speed. Remember that speed is always expressed in knots.',
  SAY_ALTITUDE: 'This command reads back the aircraft\'s current altitude.',
  SAY_ASSIGNED_ALTITUDE: 'This command reads back the aircraft\'s assigned altitude.',
  SAY_HEADING: 'This command reads back the aircraft\'s current heading, in degrees.',
  SAY_ASSIGNED_HEADING: 'This command reads back the aircraft\'s assigned heading, in degrees.',
  SAY_INDICATED_AIRSPEED: 'This command reads back the aircraft\'s indicated airspeed (IAS), in knots.',
  SAY_ASSIGNED_SPEED: 'This command reads back the aircraft\'s indicated airspeed (IAS), in knots.',
  SQUAWK: 'This command tells an aircraft to set its transponder code, or "squawk" a four-digit number, from 0000 to 7777. These codes uniquely identify each plane to the air traffic controller. Certain codes have special significance, such as 0033: Paradrop in progress or 1200: VFR. Currently the squawk is purely cosmetic; including it in game mechanics is planned.',
  AIRPORT: 'Changes the current airport to the one specified.',
  PAUSE: 'Pauses the game. Click anywhere to resume.',
  TIMEWARP: 'Sets the rate at which time passes, normal is 1. While the time warp button can only set the rate to 1, 2, or 5, the command accepts any number.',
  TUTORIAL: 'Opens the tutorial.',
  VERSION: 'Displays the version of the game running.'
}

/**
 * @enum SCOPE_COMMAND_REFERENCE {string}
 * @type {string}
 * @final
 */
export const SCOPE_COMMAND_REFERENCE = {
  MOVE_DATA_BLOCK: 'If aircraft data blocks are overlapping, it can be tough to tell which aircraft is which. And on real ATC systems, moving the data block is sometimes used by controllers to indicate the status of the aircraft, in reference to whether or not they have been told to do something yet (for instance, approach might move all the blocks down for a/c that have been switched to tower frequency). In this sim, you can shift it in any of the 8 subcardinal directions, in reference to their relative position on the numpad: (8:N, 9:NE, 6:E, 3:SE, 2:S, 1:SW, 4:W, 7:NW). Additionally, position 5 can be used to "shortstem" the aircraft, which puts the data block right on top of the aircraft\'s position symbol.'
}
