---
title: Airport format
---
[back to index](index.html)

# Airport format

The airport JSON file must be in `assets/airports`; the filename
should be `icao.json` where `icao` is the lowercase four-letter ICAO
airport code, such as `ksfo` or `kmsp`.

```
{
  "name": "Human-readable name of the airport",
  "level": "beginner, easy, medium, hard or expert",
  "radio": {
    "twr": "controller callsign for tower",
    "app": "controller callsign for approach control",
    "dep": "controller callsign for departure control"
  },
  "icao": "KSFO",             // uppercase ICAO airport code
  "iata": "SFO",              // uppercase IATA airport code
  "magnetic_north": 13.7,     // magnetic declination, in degrees EAST!
  "ctr_radius": 80,           // radius from 'position' that the airspace extends
  "ctr_ceiling": 10000,       // elevation up to which the airspace extends
  "initial_alt": 5000         // alt departures climb to if given "as-filed" clearance, but no "climb-via-sid" or altitude assignment
  "position", ["lat", "lon"]  // the latitude/longitude of the "center" of the airport; see comments below
  "rr_radius_nm": 5,          // radius of range rings, nautical miles
  "rr_center": ["lat", "lon"],// position where range rings are centered, nautical miles
  "has_terrain": true,        // true/false for if has an associated GeoJSON terrain file in assets/airports/terrain
  "wind": {     // wind is used for score, and can affect aircraft's ground tracks if enabled in settings
    "angle": 0, // the heading, in degrees, that the wind is coming from
    "speed": 3  // the speed, in knots, of the wind
  },
  "fixes": {
    "FIXNAME", ["lat", "lon"] // the position, in GPS coordinates, of the fix
  },
  "runways": [
    {
      "name":        ["36", "18"],     // the name of each end of the runway
      "name_offset": [[0, 0], [0, 0]], // the offset, in km, of the runway text when drawn on the map
      "end":         [                 // the ends of the runway
                       ["lat", "lon"],
                       ["lat", "lon"]
                     ],
      "delay":       [2, 2],           // the number of seconds it takes to taxi to the end of the runway
      "sepFromAdjacent": [2.5, 2.5],   // Distance in nautical miles that another aircraft can come while on parallel approach paths, a violation will occur at 85% of this value
      "ils":         [true, false]     // not used yet; indicates whether or not that end of the runway has ILS
    }
  ],
  "sids": {   // contains all SIDs available at this airport
    "OFFSH9": { // (req) must match ICAO identifier
      "icao": "OFFSH9",           // (req) ICAO identifier for SID (this is NOT the full name, always 2-6 characters)
      "name": "Offshore Nine" ,   // (req) Name of SID as it would be said aloud (it is used by speech synthesis to pronounce "OFFSH9")
      "suffix": {"1L":"", "1R":"", "28L":"", "28R":""},   // (optional) defines suffixes to SID name based on runway (eg '2C' for 'EKERN 2C').
                                                          // Common for European-style SIDs. If not needed (like in USA), leave this part out.
      "rwy": {  // (req) ALL runways usable on this SID must be listed below. If a runway isn't listed, aircraft departing
                // that runway will need to be re-assigned a different SID or runway (this is realistic and intended).
          "1L" : [["SEPDY", "A19+"], "ZUPAX"],  // Each runway for which this SID is valid must be listed here. The value assigned to each runway is an array 
          "1R" : [["SEPDY", "A19+"], "ZUPAX"],  // of fixes, entered as strings. As shown, you may also enter an array containing the fix name and restrictions
          "28L": [["SENZY", "A25+"], "ZUPAX"],  // at that fix, separated by a pipe symbol ('|'). For example, see the following: ["FIXNAME", "A50-|S220+"]. In 
          "28R": [["SENZY", "A25+"], "ZUPAX"]   // that example, restrictions of Altitude 5,000' or lower, and Speed 220kts or higher would be placed on that fix.
        },
      "body": ["EUGEN", "SHOEY"],   // (optional) If there is a very long series of fixes in a SID, it may be 
                                    // helpful to put some of it here, while all segments follow the same path.
      "transitions": {    // (optional) Defines transitions for a given SID. Common for FAA-style (USA) SIDs. If not needed (like in Europe), leave this part out.
          "SNS": ["SNS"], // defines the "OFFSH9.SNS" transition as being a single fix, "SNS". Is often a list instead.
          "BSR": ["BSR"]  // Note that this connects to the end of previous sections, so an example route: SEPDY->ZUPAX->EUGEN->SHOEY->BSR
      },
      "draw": [["SEPDY","ZUPAX"], ["SENZY","ZUPAX","EUGEN","SHOEY*"], ["SHOEY","SNS*"], ["SHOEY","BSR*"]]
        // (req) This "draw" section is what defines how the SID is to be drawn on the scope in blue.
        // The array contains multiple arrays that are a series of points to draw fixes between.
        // In this case, SEPDY->ZUPAX, SENZY->ZUPAX->EUGEN->SHOEY, SHOEY->SNS, SHOEY->BSR are the lines drawn.
        // Additionally, you'll notice three asterisks ('*'). This is an optional flag that, if invoked for "FIXXX"
        // will tell canvas.js to write "OFFSH9.FIXXX" next to FIXXX on the scope. If no such flags are present,
        // then the ICAO identifier for the SID will be drawn at the last point of the "draw" array. For european-
        // style SIDs, where they always end at the fix for which the SID is named, don't use the flags. But if your SID
        // has transitions, like in the N/S Americas, United Kingdom, etc, be sure to flag all the transition fixes.
    }
  },
  "stars": {  // contains all STARS available at this airport
    "PYE1" : {
      "icao": "PYE1",               // (req) ICAO identifier for SID (this is NOT the full name, always 2-6 characters)
      "name": "Point Reyes One" ,   // (req) Name of SID as it would be said aloud (it is used by speech synthesis to pronounce "OFFSH9")
      "suffix": {"1L":"", "1R":"", "28L":"", "28R":""},   // (optional) defines suffixes to STAR name based on runway (eg '7W' for 'MIKOV 7W').
                                                          // Common for European-style STARs. If not needed (like in USA), leave this part out.
      "transitions": {    // (optional) Defines transitions for a given SID. Common for FAA-style (USA) SIDs. If not needed (like in Europe), leave this part out.
          "ENI": ["ENI"], // defines the "OFFSH9.SNS" transition as being a single fix, "SNS". Is often a list instead.
          "MXW": ["MXW"]  // Note that this connects to the end of previous sections, so an example route: SEPDY->ZUPAX->EUGEN->SHOEY->BSR
      },
      "body": ["PYE", ["STINS", "A230|S250"], "HADLY"], // (optional) This is where you store the waypoints when all segments are along the same path
      "rwy": {  // (optional) For runway-transitions (eg "descending via HAWKZ4, landing north")
          "1L" : [["SEPDY", "A19+"], "ZUPAX"],  // List fixes here that are specific to a particular runway configuration.
          "1R" : [["SEPDY", "A19+"], "ZUPAX"],  // In Europe, these are called the "transitions" that come after the STAR.
          "28L": [["SENZY", "A25+"], "ZUPAX"],  // If any runways are listed, all must be listed.
          "28R": [["SENZY", "A25+"], "ZUPAX"]
      },
      "draw": [["ENI*","PYE"], ["MXW*","PYE"], ["PYE","STINS","HADLY","OSI"]]
        // (req) This "draw" section is what defines how the SID is to be drawn on the scope.
        // The array contains multiple arrays that are a series of points to draw fixes between.
        // In this case, ENI->PYE, MXW->PYE, PYE->STINS->HADLY->OSI are the lines drawn.
        // Additionally, you'll notice two asterisks ('*'). This is an optional flag that, if invoked for "FIXXX"
        // will tell canvas.js to write "FIXXX.PYE1" next to FIXXX on the scope. If no such flags are present,
        // then the ICAO identifier for the SID will be drawn at the first point of the "draw" array. For european-
        // style STARs, where they always end at the fix for which the STAR is named, don't use the flags.
    }
  },
  "departures": {
    "airlines": [
      ["three-letter ICAO airline code/fleet", 0], // see "Aircraft/Airline selectors" below
      ...
    ],
    "destinations": [
      "LISST", "OF", "SIDS", "ACRFT", "WILLL", "FLYYY", "TO"  // these must each be a defined SID above
    ],
    "type": ,
    "offset": ,
    "frequency": [3, 4] // the frequency, in minutes, of a new departing aircraft. A random number is chosen between the two.
  },
  "arrivals": [
    {   // Basic 1
      "type": "random",
      "radial": 170,        // the direction, in degrees, of arriving aircraft when they spawn; these will come from the south. ONLY use 'radial' with heading-based arrivals.
      "heading": 350,       // the direction airplanes will be pointing when they spawn; will be opposite of "radial" if omitted
      "frequency": 10,
      "altitude": 10000,
      "speed": 250,
      "airlines": [ ... ]
    },
    {   // Basic 2
      "type": "random",
      "fixes": ["MOVDD", "RISTI", "CEDES"],   // list of fixes to fly to after spawning.
      "frequency": 10,
      "altitude": 10000,
      "speed": 250,
      "airlines": [ ... ]
    },
    {   // Advanced, based on a route of flight (like a STAR, for example)
      "type": "random",               // options include 'random', 'cyclic', 'wave', and 'surge' (see below for descriptions)
      "route":   "QUINN.BDEGA2.KSFO", // route to follow (spawn at first point)
      "frequency": 10,              // spawn rate of this stream, in acph
      "altitude":  [20000, 24000],  // altitude to spawn at (either a value, or altitude range via array)
      "speed":    280,              // speed to spawn at
      "airlines": [ ... ]           // same as in "departures"
    },
    ...
  ]
}
```

For `lat, lon` fields, you can either use the standard `[x, y]`
notation or the new `["LAT", "LON"]` notation. The latter uses this
format:

    ["N or S followed by a latitude", "W or E followed by a longitude", "optional altitude ending in 'ft' or 'm'"]
where latitude and longitude are numbers that follow this format:
    <degrees>[d|°][<minutes>m[<seconds>s]]

Examples of acceptable positions:
  [  40.94684722   ,  -76.61727778   ], // decimal degrees
  [ "N40.94684722" , "W76.61727778"  ], // decimal degrees
  [  "N40d56.811"  ,  "W076d37.037   ], // degrees, decimal minutes
  [ "N40d56m48.65" , "W076d37m02.20" ]  // degrees, minutes, decimal seconds

If you use a `["lat", "lon"]` combination for any `position`, you
_must_ set the `position` of the airport as well; if you use `end`,
`length` and `angle` are not needed (but can be used to override
`end`).

Aircraft scheduling
-------------------
The 'type' key in an arrival or departure block determines the algorithm
that will be used to spawn the aircraft. Each type take slightly different
parameters in order for you to shape the airport's traffic to your liking.


## Bare Minimum Elements

At the very least, an arrival stream MUST have definitions for the
following parameters. Additional may be required if the spawn method
is set to one other than 'random'. 

            BARE MINIMUM PARAMETERS:
   PARAMETER   REQ      PARAMETER DESCRIPTION
+-------------+---+-------------------------------+
| 'airlines'  | * | weighted array of airlines    |
+-------------+---+-------------------------------+
| 'altitude'  | * | altitude to spawn at          |
+-------------+---+-------------------------------+
| 'frequency' | * | spawn rate, aircraft per hour |
+-------------+---+-------------------------------+
| 'heading'   | * | heading to fly on spawn       |
|    (OR)     |   |                               |
|  'fixes'    | * | array of fixes to go to       |
|    (OR)     |   |                               |
|  'route'    | * | properly formatted route*     |
+-------------+---+-------------------------------+
| 'speed'     | * | speed to spawn at (knots)     |
+-------------+---+-------------------------------+
  *see index.md for route format (ex: 'BSR.BSR1.KSFO')


### Random (default)

If the 'type' key is omitted, this spawning method will be used. The
aircraft will be spawned at random intervals that average out to achieve
the prescribed spawn rate. Thus, you may randomly get some back-to-back,
and some massive gaps in your traffic, just as it is most likely to occur
in real life.

       PARAMETERS SPECIFIC TO 'RANDOM':
+-----------------------------------------------+
| only the "bare minimum parameters" are needed |
+-----------------------------------------------+


### Cyclic

The cyclic algorithm creates a stream of varying density. This will be more
predictable than 'random', and can be shaped to your liking. Basically, you
define the 'frequency', which is the average spawn rate, and an additional
'variance' parameter that adds some swells and lulls in the traffic. During
the cycle, the spawn rate will range throughout frequency +/- variation in
a linear fashion. Spawn rate will start at 'frequency', and steadily
increase to ('frequency' + 'variation'), then steadily decrease to
('frequency' - 'variation').

               PARAMETERS SPECIFIC TO 'CYCLIC':
   PARAMETER   REQ        PARAMETER DESCRIPTION         DEFAULT
+-------------+---+------------------------------------+-------+
| 'offset'    |   | min into the cycle to start at     | 0     |
+-------------+---+------------------------------------+-------+
| 'period'    |   | length of each cycle, in minutes   | 30    |
+-------------+---+------------------------------------+-------+
| 'variation' | * | the amount to +/- from 'frequency' | 0     |
+-------------+---+------------------------------------+-------+
|     (also include "bare minimum parameters" - see above)     |
+--------------------------------------------------------------+


# Wave

The wave algorithm works exactly like the cyclic algorithm, however,
instead of a linear shift between arrival rates, the arrival rate will
vary throughout ('frequency' +/- 'variation') in a sinusoidal pattern.
As a result, less time will be spent right at the average, and the flow
of traffic will have changes in arrival rates that come along slightly
sooner. Overall, very similar to cyclic though.

                PARAMETERS SPECIFIC TO 'WAVE':
   PARAMETER   REQ        PARAMETER DESCRIPTION         DEFAULT
+-------------+---+------------------------------------+-------+
| 'offset'    |   | min into the cycle to start at     | 0     |
+-------------+---+------------------------------------+-------+
| 'period'    |   | length of each cycle, in minutes   | 30    |
+-------------+---+------------------------------------+-------+
| 'variation' | * | the amount to +/- from 'frequency' | 0     |
+-------------+---+------------------------------------+-------+
|     (also include "bare minimum parameters" - see above)     |
+--------------------------------------------------------------+


### Surge

The wave algorithm generates a group of aircraft back to back. For departures
the spacing is 10 seconds, for arrivals, you can specify the entrail distance
while in and out of the "surge". This way, a "surge" can be gentle, or extreme,
and at any arrival rate.

Note that if you request something that's impossible to deliver, like either...
   - "frequency": 50, "entrail": [ 7, 15] <-- even if all are 7MIT, that's 35acph
   - "frequency": 7,  "entrail": [10, 25] <-- even if all are 25MIT, that's 10acph
   - Note: The above assumes spawn speed of 250kts, for example purposes
...the game will throw a warning in the console advising you that it has
clamped the arrival rate to match the entrail and speed settings, and it tells
you what range of frequencies it is mathematically capable of delivering.

              PARAMETERS SPECIFIC TO 'SURGE':
  PARAMETER  REQ        PARAMETER DESCRIPTION         DEFAULT
+-----------+---+---------------------------------------------+-------+
| 'offset'  |   | min into the cycle to start at              | 0     |
+-----------+---+---------------------------------------------+-------+
| 'period'  |   | length of each cycle, in minutes            | 30    |
+-----------+---+---------------------------------------------+-------+
|           |   | array of:                                   |       |
| 'entrail' | * | [ miles between arrivals during the surge,  | [5.5, | <-- only for arrivals
|           |   |   miles between arrivals during the lull  ] |  10]  |
+-----------+---+---------------------------------------------+-------+
|        (also include "bare minimum parameters" - see above)         |
+---------------------------------------------------------------------+



Aircraft/Airline selectors
--------------------------

Both departure and arrival blocks specify a weighted list of airlines
to use for that block.  The airline code may be optionally followed by
a particular fleet for that operator.

Example:
```
"airlines": [
  ["BAW", 10],
  ["AAL/long", 2]
]

Select an aircraft from BAW's (British Airways) default fleet five
times as often as an aircraft is selected from AAL's (American
Airlines) long haul fleet.