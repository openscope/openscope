# Airport Format

[NOTICE](#NOTICE)
[Template](#Template)
[Comments](#Comments)

## DEVNOTES

feature/184 - version 0.2 documentation
Working on formatting this document like the [spawnPatterns readme.](openscope/src/assets/scripts/client/trafficGenerator/spawnPatternReadme.md).
Plans:
    - Remove all "// <explanation>" lines from the template so it can be copy/pasted.
    - Explain needed properties below the template.

## NOTICE

The airport JSON file must be in `assets/airports`; the filename
should be `icao.json` where `icao` is the lowercase four-letter ICAO
airport code, such as `ksfo` or `kmsp`.  If this is a new airport, there
should also be an entry added to the end of [`airportLoadList.js`](../src.assets/scripts/airport/airportLoadList.js).
See the comments for information on the correct structure to use.

## Template
```
{
  "radio": {
    "twr": "tower callsign",                // The callsign of the airport control tower.
    "app": "approach control callsign",     // The callsign of the airport approach tower.
    "dep": "departure control callsign"     // The callsign of the airport departure tower.
  },
  "icao": "KSFO",                           // Uppercase ICAO airport code.
  "iata": "SFO",                            // Uppercase IATA airport code.
  "magnetic_north": 13.7,                   // Magnetic deviation from Magnetic North, in degrees East. (can be a negative number)
  "ctr_radius": 80,                         // Radius of the airspace from the center of the airport. (in nautical miles)
  "ctr_ceiling": 10000,                     // Height of the airspace. (in feet)
  "initial_alt": 5000,                      // Set altitude for departures to climb if given "clearance as filed", but without a "climb via SID" clearance or altitude assignment.  
  "position": ["lat", "lon", "elevation"],  // The center of the airport. (in latitude, longitude, and elevation) // See comments below.
  "rr_radius_nm": 5,                        // Radius of the ring sections. (in nautical miles)
  "rr_center": ["lat", "lon"],              // The center position of the rings. (in nautical miles)
  "has_terrain": true,                      // Whether or not the airport has an associated GeoJSON terrain file in "assets/airports/terrain". (true or false)
  "wind": {                                 // Wind is used for score. // It can affect an aircraft's ground tracks if enabled in settings.
    "angle": 0,                             // Wind direction. (in degrees)
    "speed": 3                              // Wind speed. (in knots)
  },
  "fixes": {                                // Locations on the map that aircraft use to travel in and out of the map.
    "FIXNAME", ["lat", "lon"],              // The name and position of the fix. (in latitude and longitude)
    "FIXNAME2", ["lat", "lon"]              // You can add as many as you like.
  },
  "runways": [
    {
      "name": ["36", "18"],                 // Name of the runways.
      "name_offset": [[0, 0], [0, 0]],      // The offset of the runway label. (in km)
      "end": [                              // The ends of the runways. (in latitude, longitude, and elevation)
            ["lat", "lon", "elevation"],
            ["lat", "lon", "elevation"]
      ],
      "delay": [2, 2],                      // Time it takes to taxi to the end of the runway. (in seconds)
      "ils": [true, true]                   // Whether or not each end of the runway has ILS.
    }
  ],
  "sids": {                                 // Paths that aircraft follow from the runways to their transitions.
    "OFFSH9": {                             // Must match ICAO identifier.
      "icao": "OFFSH9",                     // ICAO identifier for SID. (NOT the full name - always 2-6 characters)
      "name": "Offshore Nine",              // Full name of SID as it would be said aloud. (this is used by speech synthesis)
      "suffix": {"1L":"", "1R":"", "28L":"", "28R":""}, // (optional) Suffixes for SID names based on a runway. (ex: '2C' for 'EKERN 2C')
                                                        // Suffixes are common for European-style SIDs. If not needed (like in USA), leave this part out.
      "rwy": {                              // All runways usable with this SID. Aircraft departing from runways not listed will need to be re-assigned to a different SID.
          "1L" : [["SEPDY", "A19+"], "ZUPAX"],          // The value assigned to each runway is an array of fixes. As shown, you can enter altitude or speed
          "1R" : [["SEPDY", "A19+"], "ZUPAX"],          // restrictions. ("A19+" means Altitude of 1,900ft or more. The nested brackets are needed if you are
          "28L": [["SENZY", "A25+"], "ZUPAX"],          // using restrictions.) If you use both restrictions (alt. & spd.), they must be separated by a pipe
          "28R": [["SENZY", "A25+"], "ZUPAX"]           // symbol ('|'). (ex: ["FIXNAME", "A50-|S220+"]) ("A50-" = 5,000ft or less, "S220+" = 220kts or more)
      },
      "body": ["EUGEN", "SHOEY"],           // (optional) Used only if long series of fixes are used. Only used while all segments follow the same path.
      "exitPoints": {                       // (optional) Defines exitPoints for a given SID. Common for FAA-style (USA) SIDs.
          "SNS": ["SNS"],                   // Defines the "OFFSH9.SNS" transition as being a single fix, "SNS". It is often a list instead.
          "BSR": ["BSR"]                    // Note: This connects previous sections. (RWY fixes, then BODY fixes, then EXITPOINTS fixes) (ex: SEPDY->ZUPAX->EUGEN->SHOEY->BSR)
      },
      "draw": [["SEPDY","ZUPAX"], ["SENZY","ZUPAX","EUGEN","SHOEY*"], ["SHOEY","SNS*"], ["SHOEY","BSR*"]]
            // This section is what defines how the SID is drawn on the map. The array contains multiple arrays that
            // are a series of fixes to draw lines between. In this case, SEPDY->ZUPAX, SENZY->ZUPAX->EUGEN->SHOEY,
            // SHOEY->SNS, SHOEY->BSR are the lines drawn. Additionally, you'll notice three asterisks ('*'). This
            // is an optional flag that, if invoked for "FIXXX", will tell canvas.js to write "OFFSH9.FIXXX" next to
            // "FIXXX" on the map. If no such flags are present, then the ICAO identifier for the SID will be drawn
            // at the last point of the "draw" array. For European-style SIDs, where they always end at the fix for
            // which the SID is named, don't use the flags. But if your SID has transitions, like in the N/S Americas,
            // United Kingdom, etc., be sure to flag all the transition fixes.
    }
  },
  "stars": {                                // STARs are STandard ARrival paths for aircraft to follow.
    "PYE1" : {
      "icao": "PYE1",                       // ICAO identifier of the STAR. (NOT the full name, always 2-6 characters)
      "name": "Point Reyes One",            // Name of STAR as it would be said aloud. (used by speech synthesis)
      "suffix": {"1L":"", "1R":"", "28L":"", "28R":""},   // (optional) Suffixes for STAR names based on a runway. (ex: '7W' for 'MIKOV 7W')
                                                          // Suffixes are common for European-style STARs. If not needed (like in USA), leave this part out.
      "entryPoints": {                      // (optional) Defines entryPoints for a given SID. Common for FAA-style (USA) SIDs.
          "ENI": ["ENI"],                   // Defines the "PYE1.ENI" transition as being a single fix, "ENI". It is often a list instead.
          "MXW": ["MXW"]                    // Note: This connects previous sections. (ENTRYPOINTS fixes, then BODY fixes, then RWY fixes) (ex: ENI->PYE->STINS->HADLY->SEPDY->ZUPAX)
      },
      "body": ["PYE", ["STINS", "A230|S250"], "HADLY"], // (optional) Used only if long series of fixes are used. Only used while all segments follow the same path.
      "rwy": {                              // All runways usable with this STAR. Aircraft arriving to runways not listed will need to be re-assigned to a different STAR or runway.
          "1L" : [["SEPDY", "A19+"], "ZUPAX"],          // The value assigned to each runway is an array of fixes. As shown, you can enter altitude or speed
          "1R" : [["SEPDY", "A19+"], "ZUPAX"],          // restrictions. ("A19+" means Altitude of 1,900ft or more. The nested brackets are needed if you are
          "28L": [["SENZY", "A25+"], "ZUPAX"],          // using restrictions.) If you use both restrictions (alt. & spd.), they must be separated by a pipe
          "28R": [["SENZY", "A25+"], "ZUPAX"]           // symbol ('|'). (ex: ["FIXNAME", "A50-|S220+"]) ("A50-" = 5,000ft or less, "S220+" = 220kts or more)
      },
      "draw": [["ENI*","PYE"], ["MXW*","PYE"], ["PYE","STINS","HADLY","OSI"]]
      // This section is what defines how the STAR is drawn on the map. The array contains multiple arrays that
      // are a series of fixes to draw lines between. In this case, ENI->PYE, MXW->PYE, PYE->STINS->HADLY->OSI
      // are the lines drawn. Additionally, you'll notice two asterisks ('*'). This is an optional flag that,
      // if invoked for "FIXXX", will tell canvas.js to write "PYE1.FIXXX" next to "FIXXX" on the map. If no
      // such flags are present, then the ICAO identifier for the SID will be drawn at the last point of the
      // "draw" array. For European-style SIDs, where they always end at the fix for which the SID is named,
      // don't use the flags. But if your SID has transitions, like in the N/S Americas, United Kingdom, etc.,
      // be sure to flag all the transition fixes.
    }
  },
  "spawnPatterns": [
  {
      "origin": "KSFO",                     // Four-letter ICAO identifier of the origin point/fix. (can be left empty if "destination" is filled)
      "destination": "vhhh",                // Four-letter ICAO identifier of the destination point/fix. (can be left empty if "origin" is filled)
      "category": "arrival",                // Category of the flight. (arrival or departure, usually)
      "route": "ABBEY..MUSEL..TAMAR..TD",   // Route of the flight. (can use fixes OR SIDs / STARs in this format: *origin*.*SID/STAR ICAO*.*destination*)
      "altitude": 10000,                    // Altitude of the flight. (in feet)
      "speed": 250,          
      "method": "surge",
      "entrail": [10, 22],
      "rate": 15,
      "airlines":  [
          ["cpa", 30],
          ["ces", 10],
          ["csn", 10],
          ["hda", 10],
          ["aca/long", 5],
          ["cca", 10],
          ["ual/long", 3],
          ["kal/long", 3]
      ]
  },
  ]
}
```

## Comments

### Main Notes

#### Latitude, Longitude, Elevation

For `lat, lon, elev` values, these formats are acceptable:
    [40.94684722, -76.61727778, "866ft"],
    ["N40.94684722", "W76.61727778", "866ft"],
    ["N40d56.811", "W076d37.037", "866ft"],
    ["N40d56m48.65", "W076d37m02.20", "866ft"]

#### ICAO and IATA codes

ICAO codes _must_ be 2-6 characters long, in uppercase letters only.
IATA codes _must_ be 2-3 characters long, in uppercase letters only.

### Property Descriptions

`callsign`: A name used to identify a tower or aircraft. (ex: "Delta 5634", "San Francisco Tower")
`has_terrain`: A true/false property __ if the airport has a GeoJSON file associated with it.



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
