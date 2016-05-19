---
title: Index
---

# Welcome to the ATC Documentation.

## Pages

* [Airport format](airport-format.html)
* [Airline format](airline-format.html)
* [Aircraft separation](aircraft-separation.html)
* [Scoring](scoring.html)
* [Documentation format](README.html)

## Background

ATC stands for Air Traffic Controller, which is the role you take in this simulator.

> Air traffic control (ATC) is a service provided by ground-based
controllers who direct aircraft on the ground and through controlled
airspace, and can provide advisory services to aircraft in non-controlled
airspace. The primary purpose of ATC worldwide is to prevent collisions,
organize and expedite the flow of traffic, and provide information and
other support for pilots. - [Wikipedia](https://en.wikipedia.org/wiki/Air_traffic_control)

---

## Command Reference

Although the tutorial gives a large amount of information, if you find
remembering the commands too complicated, here's a reference. Remember
that you can type out multiple commands in one go; for example:
`BAW231 fh090 d 30 sp 180` will work as well as all three commands run
separately. Additionally, some have "shortKeys", where you can skip the
space that is normally included, like in `BAW231 fh090` (heading).

### Taxi
_Aliases -_ `taxi` / `wait` / `w`

_Information -_ This command tells the specified plane to taxi to a
runway; if a runway is not included they will continue to the runway
with the largest headwind.

_Syntax -_ `AAL123 taxi [Runway]`

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

### "Cleared As Filed"
_Aliases -_ `caf`

_Information -_ This command tells the airplane that they are cleared to follow
the flight plan that they requested when spawning. Therefore, when a departure
spawns on the ground, and his strip shows that he filed for a particular SID,
there is no need to use the `sid` command. Just clear him "as filed" with the
`caf` command, and the airplane will take care of the rest.

_Syntax -_ `AAL123 caf`

### "Climb Via SID"
_Aliases -_ `cvs`

_Information -_ Authorizes the aircraft to climb in accordance with the
SID that is currently in their flightplan. They will climb to their filed
cruise altitude, whilst complying with all altitude and speed restrictions
posted in the procedure.

_Syntax -_ `AAL123 cvs`

### "Descend via STAR"
_Aliases -_ `dvs`

_Information -_ Authorizes the aircraft to descend in accordance with the
SID that is currently in their flightplan. They will descend to the lowest
altitude required by the STAR, and after no further altitude and/or speed
restrictions are listed, will maintain their altitude and speed until
receiving further instructions from ATC.

_Syntax -_ `AAL123 dvs`

### Altitude
_Aliases -_ `climb` / `c` / `descend` / `d` / `altitude` / `a`

_Hotkey -_ `up arrow` / `down arrow` (if "Control Method" setting = "Arrow Keys")

_Information -_ This command tells the specified plane the altitude, in
hundreds of feet (flight levels), it should travel to. This means that when
writing altitudes you would drop the last two zeros. For example, 3,000ft =
"30", 8,300ft = "83", 10,000ft = "100", and FL180 (18,000ft) = "180".
Airplanes will not descend below 1000 feet (unless locked on ILS).

_Syntax -_ `AAL123 c [alt]`

### Takeoff
_Aliases -_ `takeoff`, `to`, `cto`

_Hotkey -_ `numpad /`

_Information -_ This command clears the specified plane for takeoff. They
will climb to the altitude specified, or in accordance with a SID if told
previously to "climb via the SID". If neither has happened, they will ask
for an altitude assignment before they agree to take off.

_Syntax -_ `AAL123 cto`

### Heading
_Aliases -_ `heading` / `h` / `turn` / `t`

_Shortkeys -_ `fh` / `left arrow` / `right arrow` (if "Control Method" setting = "Arrow Keys")

_Information -_ This command sets the target heading; up (north) is 360,
right (east) is 090, down (south) is 180, and left (west) is 270. Of course
you can use any angle in between these as well. If the heading is set
before takeoff, the aircraft will turn to that heading after takeoff. You
can force the aircraft to reach the heading by turning left or right by
inserting `l` or `r` before the new heading, as demonstrated below.

_Syntax -_ `AAL123 fh[hdg]` or `AAL123 (rightarrow)[hdg]` or `AAL123 t r [hdg]`

### Speed
_Aliases -_ `speed` / `slow` / `sp`

_ShortKey -_ `numpad +` / `numpad -`

_Information -_ This command sets the target speed; aircraft will stay within
their safe speeds if you tell them to fly faster or slower than they are able
to. It takes some time to increase and reduce speed. Remember that speed is
always expressed in knots.

_Syntax -_ `AAL123 -[spd]` or `AAL123 +[spd]`

### Land
_Aliases -_ `ils` / `i` / `land` / `l`

_Shortkey -_ `numpad *`

_Information -_ This command clears the aircraft to land on a runway. The
aircraft's strip on the right will show either "intercept" if it's still
trying to intercept the localizer. Once established, it will show "on ILS"
and the aircraft will automatically fly down the runway centerline, descend,
and land.

_Syntax -_ `AAL123 i [rwy]`

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

### Say Route
_Aliases -_ `sr`

_Information -_ With the capability to edit the route, you obviously will
need a way to know what their current route is. Typically, this is displayed
in the flight progress strip. However, to preserve screen space, you will
instead have to check the route by running this command, and the route will
print out above the command bar.

_Syntax -_ `AAL123 sr`

### Fix
_Aliases -_ `f` / `fix` / `track`

_Information -_ This command instructs the aircraft to fly direct to a fix
or list of fixes before proceeding to the next point on their currently
assigned route. This method is neither realistic nor preferred, thus, you
should probably use the more powerful `route` or `rr` commands.

_Syntax -_ `AAL123 f [fixname]`

### "Proceed Direct"
_Aliases -_ `direct` / `pd` / `dct`

_Information -_ This command instructs the aircraft to go direct to a
navigational fix, taking a shortcut. For example, if an aircraft is flying
to fixes [A, B, C], issuing the command "pd B" will cause the aircraft
to go to B, then C. After flying past the last fix, the aircraft will
continue flying straight.

_Syntax -_ `AAL123 pd [fixname]`

### Abort
_Aliases -_ `abort`

_Information -_ Instructs the aircraft to abort the current operation.
Currently, only landings, taxiing, and fix navigation can be aborted.

_Syntax -_ `AAL123 abort`

### Hold
_Aliases -_ `hold`

_Information -_ This command instructs the aircraft to enter a holding
pattern until further notice. The direction (left/right) may be specified,
as well as the leg length (in minutes), as well as the fix to hold over.
But you may also omit those specifications, in which case, the aircraft
will enter a standard holding pattern over their present position (right
turns, 1 minute legs). To escape a hold, just set a new heading.

_Parameters -_ Specify the direction of turns during the hold with `right`
or `left`, the leg length, with `[time]min`, and the fix to hold over
with simply `[fixname]`. Any combination of these arguments provided in
any order is acceptable, as long as the command `hold` comes first.

_Syntax -_ `AAL123 hold [fixname] [left|right] [leg_time]min` or `AAL123 hold`

### Move Data Block
_Aliases -_ `` ` (backtick) ``

_Information -_ If aircraft data blocks are overlapping, it can be tough to
tell which aircraft is which. And on real ATC systems, moving the data block
is sometimes used by controllers to indicate the status of the aircraft, in
reference to whether or not they have been told to do something yet (for
instance, approach might move all the blocks down for a/c that have been
switched to tower frequency). In this sim, you can shift it in any of the 8
subcardinal directions, in reference to their relative position on the numpad: 
`(8:N, 9:NE, 6:E, 3:SE, 2:S, 1:SW, 4:W, 7:NW)`. Additionally, position `5` can
be used to "shortstem" the aircraft, which puts the data block right on top of
the aircraft's position symbol.

_Syntax -_ ``AAL123 `2``