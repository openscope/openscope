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

> Air traffic control (ATC) is a service provided by ground-based controllers who direct aircraft on the ground and through controlled airspace, and can provide advisory services to aircraft in non-controlled airspace. The primary purpose of ATC worldwide is to prevent collisions, organize and expedite the flow of traffic, and provide information and other support for pilots. - [Wikipedia](https://en.wikipedia.org/wiki/Air_traffic_control)

## Commands

Although the tutorial gives a large amount of information, if you find remembering the commands too complicated, here's a reference. Remember that you can type out multiple commands in one go; for example, `BAW231 turn 90 climb 20 slow 180" will work as well as all three commands run separately.

### Taxi
_Aliases -_ taxi / wait

_Abbreviation -_ w

_Information -_ This command tells the specified plane to taxi to a runway; if a runway is not included they will continue to the runway with the largest headwind.

_Syntax -_ (Callsign) (taxi|wait) [Runway]

### SID
_Aliases -_ none

_Abbreviation -_ none

_Information -_ This command tells the specified plane a standard instrument departure route (SID) it should follow. Each SID is a list of fixes to be flown in sequence. Having a standardized route often helps organize departing traffic, and maintain separation from arriving aircraft.

_Syntax -_ (Callsign) (sid) [SID name]

### Climb
_Aliases -_ climb / descend / clear / altitude

_Abbreviations -_ a, c, d

_Information -_ This command tells the specified plane the altitude, in hundreds of feet (flight levels), it should travel to. This means that when writing altitudes you would drop the last two zeros. For example, 3,000ft = "30", 8,300ft = "83", 10,000ft = "100", and FL180 (18,000ft) = "180". Airplanes will not descend below 1000 feet (unless locked on ILS) or above 10000.

_Syntax -_ (Callsign) (climb|descend|clear|altitude) (new altitude, in feet)

### Takeoff
_Aliases -_ takeoff, to

_Information -_ This command tells the specified plane to takeoff and climb to the height specified when the climb command was typed.

_Syntax -_ (Callsign) (takeoff)

### Heading
_Aliases -_ turn

_Abbreviations -_ t, h

_Information -_ This command sets the target heading; up (north) is 0, right (east) is 90, down (south) is 180, and left (west) is 270. Of course you can use any angle in between these as well. If the heading is set before takeoff, the aircraft will turn to that heading after takeoff.

If you'd like, you can force the aircraft to reach the heading by turning left or right by inserting "left" or "right" before the new heading.

_Syntax -_ (Callsign) (heading|turn) (direction, optional) (new heading, in degrees)

### Speed
_Aliases -_ slow

_Abbreviation -_ sp

_Information -_ This command sets the target speed; aircraft will stay within their safe speeds if you tell them to fly faster or slower than they are able to. It takes some time to increase and reduce speed.

_Syntax -_ (Callsign) (speed|slow) (new speed, in knots)

### Land
_Aliases -_ _none_

_Abbreviation -_ l

_Information -_ This command clears the aircraft to land on a runway. The aircraft's strip on the right will show either "no ILS" if it's unable to capture the runway's ILS beacon; otherwise, it will show "ILS locked" and the aircraft will automatically fly down the runway centerline, descend, and land.

_Syntax -_ (Callsign) (land) (runway)

### Fix
_Aliases -_ track

_Abbreviations -_ f

_Information -_ This command instructs the aircraft to point itself towards a navigational fix (the triangles in the radar view). One or more fix names can be given. After flying past the last fix, the aircraft will continue flying straight.

_Syntax -_ (Callsign) (fix) (fix names)

### Direct
_Aliases -_ dct

_Abbreviations -_ none

_Information -_ This command instructs the aircraft to go direct to a navigational fix, taking a shortcut. For example, if an aircraft is flying to fixes [A, B, C], issuing the command "direct B" will cause the aircraft to go to B, then C. After flying past the last fix, the aircraft will continue flying straight.

_Syntax -_ (Callsign) (direct) (fix name)

### Proceed
_Aliases -_ pr

_Abbreviations -_ none

_Information -_ This command adds more fixes to the aircraft's flight path. This means, if you have assigned the fixes [A, B, C], issuing the command "proceed D" will cause the aircraft to fly as assigned before, but then continue to fix D. This function can be extremely useful as you don't have to retype all the preceding fixes if you want to add one.

_Syntax -_ (Callsign) (proceed) (fix name(s))

### Abort
_Aliases -_ _none_

_Information -_ This command instructs the aircraft to abort the current operation; currently, only landings and fix navigation can be aborted.

_Syntax -_ (Callsign) (abort)

### Hold
_Aliases -_ circle

_Information -_ This command instructs the aircraft to turn in a circle until further notice. The direction must be given. To escape a hold, just set a new heading.

_Syntax -_ (Callsign) (hold|circle) (left|right)

***

## GUI

On the right hand side, you can see a list of planes; the information given here from left to right is:

_First Line -_  (Plane Callsign) (HDG *) (Current Height)

_Second Line -_ (Plane Type)             (Current Speed)

where HDG can be either a heading, a fix, a hold setting, or a runway identifier.

On the bottom right, you can see a number; this is your score.
