# Aircraft Command Reference

## Table of Contents

[Departure Commands](#departure-commands)

- [Cleared as Filed](#cleared-as-filed)
- [Climb via SID](#climb-via-sid)
- [Takeoff](#takeoff)
- [Taxi](#taxi)

[Arrival Commands](#arrival-commands)

- [Expect Runway](#expect-runway)
- [Descend via STAR](#descend-via-star)
- [ILS](#ils)

[Routing Commands](#routing-commands)

- [~~Fix~~](#fix)
- [Hold](#hold)
- [Exit Hold](#exit-hold)
- [Proceed Direct](#proceed-direct)
- [Route](#route)
- [Reroute](#reroute)
- [SID](#sid)
- [STAR](#star)

['Basic Control Instruction' Commands](#'basic-control-instruction'-commands)

- [Altitude](#altitude)
- [Fly Present Heading](#fly-present-heading)
- [Heading](#heading)
- [Speed](#speed)

[Conditional / Pilot's Discretion Commands](#conditional-/-pilot's-discretion-commands)

- [Cross](#cross)

[Aircraft Query Commands](#aircraft-query-commands)

- [Say Altitude](#say-altitude)
- [Say Assigned Altitude](#say-assigned-altitude)
- [Say Heading](#say-heading)
- [Say Assigned Heading](#say-assigned-heading)
- [Say Speed](#say-indicated-airspeed)
- [Say Assigned Speed](#say-assigned-speed)

[Miscellaneous Commands](#miscellaneous-commands)

- [~~Abort~~](#abort)
- [Squawk](#squawk)

[System Commands](#system-commands)

- [Airport](#airport)
- [Pause](#pause)
- [Timewarp](#timewarp)
- [Tutorial](#tutorial)

---

## Departure Commands

These commands are used by departure aircraft.

### Cleared As Filed

_Aliases -_ `caf`

_Information -_ This command tells the airplane that they are cleared to follow
the flight plan that they requested when spawning. Therefore, when a departure
spawns on the ground, and his strip shows that he filed for a particular SID,
there is no need to use the `sid` command. Just clear him "as filed" with the
`caf` command, and the airplane will take care of the rest.

_Syntax -_ `AAL123 caf`

### Climb Via SID

_Aliases -_ `cvs`

_Information -_ Authorizes the aircraft to climb in accordance with the
SID that is currently in their flightplan. They will climb to their filed
cruise altitude, whilst complying with all altitude and speed restrictions
posted in the procedure. Optionally, an altitude may be specified to dictate
the altitude to be climbed to.

_Syntax -_ `AAL123 cvs` or `AAL123 cvs [alt]`

### Takeoff

_Aliases -_ `takeoff`, `to`, `cto`, `/`

_Hotkey -_ `numpad /`

_Information -_ This command clears the specified plane for takeoff. They
will climb to the altitude they were previously cleared to, or in accordance
with a SID if told previously to "climb via the SID". If neither has happened,
they will ask for an altitude assignment before they agree to take off.

_Syntax -_ `AAL123 cto`

### Taxi

_Aliases -_ `taxi`, `wait`, `w`

_Information -_ This command tells the specified plane to taxi to and hold short
of the specified runway.

_Syntax -_ `AAL123 taxi [runway]`

## Arrival Commands

These commands are only used by arrival aircraft.

### Expect Runway

_Aliases -_ `e`

_Information -_ Informs the aircraft of the runway they should expect for
landing. This is useful in cases where their route is sensitive to their
runway assignment. In cases where their STAR says to follow a different series
of waypoints dependent upon their runway, we can use this command to have an
aircraft follow the desired branch of the STAR toward the desired runway.

_Syntax -_ `AAL123 e [runway]`

### Descend via STAR

_Aliases -_ `dvs`

_Information -_ Authorizes the aircraft to descend in accordance with the
STAR that is currently in their flightplan. They will descend to the lowest
altitude required by the STAR, and after no further altitude and/or speed
restrictions are listed, will maintain their altitude and speed until
receiving further instructions from ATC. Optionally, an altitude may be
specified to dictate the altitude to be descended to.

_Syntax -_ `AAL123 dvs` or `AAL123 dvs [alt]`

### ILS

_Aliases -_ `ils`, `i`, `*`

_Hotkey -_  `numpad *`

_Information -_ This command clears for an ILS approach to a runway. The
aircraft will continue on its assigned heading until intercepting the localizer,
and then automatically follow the runway centerline inbound, descending along
the glideslope and land.

Note: This replaces the old `land` / `l` command.

_Syntax -_ `AAL123 i [runway]`

## Routing Commands

These commands allow you to manipulate the route in the aircraft's FMS.

### ~~Fix~~

~~_Aliases -_ `f`, `fix`, `track`~~

~~_Syntax -_ `AAL123 f [fixname]`~~

*_This command has been deprecated_*

### Hold

_Aliases -_ `hold`

_Information -_ This command instructs the aircraft to enter a holding
pattern over a specified fix until further notice. (If no fix is provided, it
is intended that the aircraft should hold over their present position, but this
is currently not implemented.)

By default, the aircraft will fly a standard holding pattern, i.e. right turns,
1 minute legs, and using the reciprocal bearing to the fix as the outbound
radial. You may override this by specifying any of: the direction of the hold
(left/right), the leg length (either in minutes or nautical miles), and/or the
heading for the outbound radial.

_Parameters -_
Specify the the fix to hold over with simply `[fixname]`.  
Optionally, you may also specify:

- the direction of turns during the hold with `left`, `l`, `right`, or `r`
- the leg length, either as `[time]min` or `[distance]nm`, where the supplied number is either an integer from `1` to `49`, or a one-decimal number from `0.1` to `49.9`
- the radial (a 3-digit course, eg. `001` to `360`) which defines the outbound leg

Any combination of these arguments provided in any order is acceptable, as long
as the command `hold` comes first.

To clear the aircraft out of the hold, you can use the `exithold` command below,
clear it direct to a fix, or assign it a new heading.

_Syntax -_ `AAL123 hold [fixname] [left|l|right|r] [leg_time]min|[leg_dist]nm [radial]` ~~or `AAL123 hold`~~

### Exit Hold

_Aliases -_ `cancelhold` `continue` `exithold` `nohold` `xh`

_Information -_ This command instructs the aircraft to leave a holding
pattern and resume its flight plan.

_Parameters -_ Optionally, you may specify the fix at which to cancel the hold,
by specifying the fix at the end of the command: `AAL123 cancelhold [fixname]`.
This can be useful if multiple holds exist.

If no fix is specified, and the aircraft is currently in a holding pattern, it
will exit from the current hold. Otherwise, the very next hold that the
aircraft will encounter on its existing flight plan will be cancelled.

_Syntax -_ `AAL123 continue` or `AAL123 xh BOTON`

### Proceed Direct

_Aliases -_ `direct`, `pd`, `dct`

_Information -_ This command instructs the aircraft to go direct to a
navigational fix, taking a shortcut. For example, if an aircraft is flying
to fixes [A, B, C, D, E, F], issuing the command "pd D" will cause the aircraft
to go to D, then E. After flying past the last fix, the aircraft will
switch to heading mode and fly their present heading.

_Syntax -_ `AAL123 pd [fixname]`

### Route

_Aliases -_ `route`

_Information -_ This command instructs aircraft to follow a user-provided "route", typically
one that is along an airway, approach, SID, STAR, other published procedure,
or a series of fixes. This is similar to the `reroute`/`rr` command, but this
command will allow you to "insert" a route that connects with the route
they're currently flying. Note that the route uses dot format:

>Note: Input data needs to be provided with single dots connecting all
procedurally-linked points (eg KSFO.OFFSH9.SXC or SGD.V87.MOVER), and all
other points that will be simply a fix direct to another fix need to be
connected with double-dots (eg HLI..SQS..BERRA..JAN..KJAN).

An example would be if an aircraft filed to take a particular airway, and
you needed them to take a different one. Additionally, if the current route
*and* the user-provided route share a common point, the routes are considered
to have "continuity", and the FMS will remove the intermediate fixes. This
is demonstrated below:
Current Route: `BAM..CUTVA..LLC..FMG..BINNZ..HETUX..CHOIR..NEWPI..LKV.HAWKZ4.KSEA`
Command run: `AAL123 route FESKO..RUFUS..CHOIR`
Resulting route: `FESKO..RUFUS..CHOIR..NEWPI..LKV.HAWKZ4.KSEA`

Thus, since the routes have continuity at CHOIR, we are able to give shortcuts and/or
route extensions without needing to restate the whole route, as with the `rr` command.
In the case of the above example, the aircraft would immediately turn direct to `FESKO`,
join the specified route to `CHOIR`, and continue via last routing cleared.

Partial Route Example: `WHITE.J209.ORF` or `FESKO..RUFUS..CHOIR` or `KSEA.MTN7.ELN..HAMUR.J12.DNJ`

_Syntax -_ `AAL123 route [route]`

### Reroute

_Aliases -_ `reroute`, `rr`

_Information -_ This command allows you to wipe out the aircraft's current
route, and assign a new route of your choosing. This is similar to the `route`
command, but this command will allow you to *change the entire route*, while the
other is meant for specifying a route to follow to join a later point in the
aircraft's flight plan. Note that the route uses dot format:

>Note: Input data needs to be provided with single dots connecting all procedurally-
linked points (eg KSFO.OFFSH9.SXC or SGD.V87.MOVER), and all other points that will
be simply a fix direct to another fix need to be connected with double-dots
(eg HLI..SQS..BERRA..JAN..KJAN).

Full Route Example: `KSEA.HAROB5.ERAVE.Q1.ETCHY..MLBEC.BDEGA2.KSFO`

_Syntax -_ `AAL123 rr [route]`

### SID

_Aliases -_ `sid`

_Information -_ This command tells the specified plane a standard
instrument departure route (SID) it should follow. Each SID is a list of
fixes to be flown in sequence. Having a standardized route often helps
organize departing traffic, and maintain separation from arriving aircraft.

_Syntax -_ `AAL123 sid [SID name]`

### STAR

_Aliases -_ `star`

_Information -_ This command tells the plane to add or change their filed
Standard Terminal Arrival Route to match the route you specify. This must be
entered in dotted format, and include the point where the STAR is joined, as
well as the destination airport, for example: `MLP.GLASR9.KSEA`. See the section
on rerouting for further detail.

_Syntax -_ `AAL123 star [transition].[STAR name].[airport]`

## 'Basic Control Instruction' Commands

These commands control the three most basic ways we can control aircraft, collectively called the "basic control instructions" of air traffic control.

### Altitude

_Aliases -_ `climb`, `c`, `descend`, `d`, `altitude`, `a`

_Hotkeys -_ `up arrow`, `down arrow` (if "Control Method" setting = "Arrow Keys")

_Information -_ This command tells the specified plane the altitude, in
hundreds of feet (flight levels), it should travel to. This means that when
writing altitudes you would drop the last two zeros. For example, 3,000ft =
"30", 8,300ft = "83", 10,000ft = "100", and FL180 (18,000ft) = "180".
Airplanes will not descend below 1000 feet nor the minimum safe altitude
(unless locked on ILS).

Altitude also accepts an `expedite` or `ex` argument which can be used as the last item in the command.

_Syntax -_ `AAL123 c [alt]` or `AAL123 c [alt] ex`

### Fly Present Heading

_Aliases -_ `fph`

_Information -_ This command has the aircraft fly straight ahead, regardless of assigned routing. 

For departure aircraft prior to take off, this command is interpreted as "fly
runway heading". The aircraft will ignore any assigned routing and will instead
maintain runway heading upon take off, until otherwise instructed.

The command is invalid for aircraft that are at the gate, or still in the process of taxiing.

_Syntax -_ `AAL123 fph`

### Heading

_Aliases -_ `heading`, `h`, `turn`, `t`, `fh`

_Hotkeys -_ `left arrow`, `right arrow` (if "Control Method" setting = "Arrow Keys")

_Information -_ This command tells the aircraft the target heading to fly
towards: up (north) is 360, right (east) is 090, down (south) is 180, and left
(west) is 270. Of course you can use any angle in between these as well. If the
heading is set before takeoff, the aircraft will turn to that heading after takeoff.

The target heading is specified by a three digit heading. You can force the
aircraft to reach the heading by turning left or right by inserting `left`,
`l`, `right`, or `r` before the new heading, as demonstrated below.

Alternatively, you can instruct an aircraft to turn from its current heading by
a given angle by specifying the direction of turn with the heading change as
a one or two digit number of degrees.

_Syntax -_ `AAL123 fh [hdg]` or `AAL123 (rightarrow) [hdg]` or `AAL123 t r 270` (target heading) or `AAL123 t r 45` (heading change)

### Speed

_Aliases -_ `speed`, `slow`, `sp`, `+`, `-`

_Hotkeys -_ `numpad +`, `numpad -`

_Information -_ This command sets the target speed; aircraft will stay within
their safe speeds if you tell them to fly faster or slower than they are able
to. It takes some time to increase and reduce speed. Remember that speed 
assignments are given in indicated airspeed, whereas our scope can only
display groundspeed.

_Syntax -_ `AAL123 - [spd]` or `AAL123 + [spd]`

## Conditional / Pilot's Discretion Commands

These commands are used to give instructions which pilots are free to determine how to operate
the airplane, as long as they comply with the restrictions given.

## Cross

_Aliases -_ `cross`, `cr`, `x`

_Information -_ This command has the aircraft cross a specified point along their route at a specified altitude and/or speed. The altitude must be entered in hundreds of feet (eg `130` for 13,000 feet). The speed should be entered in knots (eg `210` for 210 knots).

_Syntax -_ `AAL123 x aubrn a[alt] s[spd]`

## Aircraft Query Commands

These commands are used to ask the aircraft some basic questions.

### Say Altitude

_Aliases -_ `sa`

_Information -_ This command reads back the aircraft's current altitude.

_Syntax -_ `AAL123 sa`

### Say Assigned Altitude

_Aliases -_ `saa`

_Information -_ This command reads back the aircraft's assigned altitude.

_Syntax -_ `AAL123 saa`

### Say Heading

_Aliases -_ `sh`

_Information -_ This command reads back the aircraft's current heading, in degrees.

_Syntax -_ `AAL123 sh`

### Say Assigned Heading

_Aliases -_ `sah`

_Information -_ This command reads back the aircraft's assigned heading, in degrees.

_Syntax -_ `AAL123 sah`

### Say Indicated Airspeed

_Aliases -_ `si`

_Information -_ This command reads back the aircraft's indicated airspeed (IAS), in knots.

_Syntax -_ `AAL123 si`

### Say Assigned Speed

_Aliases -_ `sas`

_Information -_ This aircraft reads back the aircraft's assigned speed, in knots (IAS).

_Syntax -_ `AAL123 sas`

## Miscellaneous Commands

All other commands are listed below.

### ~~Abort~~

~~_Aliases -_ `abort`~~

~~_Information -_ Instructs the aircraft to abort the current operation.~~
~~Currently, only landings, taxiing, and fix navigation can be aborted.~~

~~_Syntax -_ `AAL123 abort`~~

*_This command has been deprecated_*

### Squawk

_Aliases -_ `sq`

_Information -_ This command tells an aircraft to set its transponder code, or "squawk" a four-digit number, from `0000` to `7777`. These codes uniquely identify each plane to the air traffic controller. Certain codes have special significance, such as `0033: Paradrop in progress` or `1200: VFR`. Currently the squawk is purely cosmetic, though it will be important for features planned in the future.

_Parameters -_ A four digit number. Each number must be between `0` and `7`, inclusive. For example, `0736` is a valid squawk, `9416` is not.

_Syntax -_ `AAL123 squawk ###`

## System Commands

openScope has a number of commands that do not change simulation mechanics, known as _system commands_. While most are able to be executed via various menus, they can be entered in the command bar if one so desires.

### Airport

_Information -_ Changes the current airport to the one specified.

_Parameters -_ The ICAO (four-letter) code of the desired airport.

_Syntax -_ `airport [ICAO]`

### Pause

_Information -_ Pauses the simulation. Click anywhere to resume.

_Syntax -_ `pause`

### Timewarp

_Aliases -_ `tw`

_Information -_ Sets the rate at which time passes, normal is `1`. While the time warp button can only set the rate to `1`, `2`, or `5`, the timewarp command accepts any value greater than or equal to 1.

_Parameters -_ A number to multiply the rate at which time passes. Omitting the parameter, or setting it to `1`, resets to normal time.

_Syntax -_ `timewarp [rate]`

### Tutorial

_Information -_ Opens the tutorial.

_Syntax -_ `tutorial`
