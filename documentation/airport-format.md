[noaa-calculator]: https://www.ngdc.noaa.gov/geomag-web/#declination

# Airport Format

* [Property Descriptions](#property-descriptions)
    * [Base Airport Properties](#base-airport-properties)
    * [Airspace](#airspace)
    * [Fixes](#fixes)
    * [Runways](#runways)
    * [Airways](#airways)
    * [SIDs](#sids)
    * [STARs](#stars)
    * [SpawnPatterns](#spawnPatterns)
    * [Maps](#maps)
* [Reference](#reference)
    * [Latitude, Longitude, Elevation](#latitude-longitude-elevation)
    * [Identifiers](#icao-and-iata-identifiers)
    * [Flight Level](#flight-level)

The airport JSON file must be in "[assets/airports](assets/airports)"; the filename should be `icao.json` where `icao` is the lowercase four-letter ICAO airport identifier, such as `ksfo` or `kmsp`.  If this is a new airport, an entry must also be added to [airportLoadList.js](../src.assets/scripts/airport/airportLoadList.js) in alphabetical order. See the comments at the top of that file for information on the correct structure to use.

## Example

_Note: The code block shown below is an abbreviated version of [ksea.json](assets/airports/ksea.json)._
```javascript
{
    "radio": {
        "twr": "Seatle Tower",
        "app": "Seattle Approach",
        "dep": "Seattle Departure"
    },
    "icao": "KSEA",
    "iata": "SEA",
    "magnetic_north": 16,
    "ctr_radius": 110,
    "ctr_ceiling": 15000,
    "initial_alt": 15000,
    "position": ["N47d26.99m0", "W122d18.71m0"],
    "rr_radius_nm": 5.0,
    "rr_center": ["N47d26.99m0", "W122d18.71m0"],
    "has_terrain": true,
    "wind": {
        "angle": 150,
        "speed": 9
    },
    "arrivalRunway": "16R",
    "departureRunway": "16L",
    "airspace": [
        {
            "floor": 0,
            "ceiling": 150,
            "airspace_class": "B",
            "poly": [
                ["N47.83333330", "W121.69999940"],
                ["N47.95335007", "W121.97603665"],
                ["N48.30000000", "W121.96666670"],
                ["N48.30000000", "W122.30000000"],
                ["N48.20000000", "W122.45000000"]
            ]
        }
    ],
    "fixes": {
        "_NEZUG070010": ["N47d34.80m0", "W122d03.84m0"],
        "_NEZUG070PAE139": ["N47d34.77m0", "W122d05.11m0"],
        "_NICHY250SEA230": ["N47d19.92m0", "W122d42.78m0"],
        "_OLM161026" : ["N46d32.31m0", "W122d54.11m0"],
        "_SEA161002": ["N47d24.12m0", "W122d18.58m0"],
        "_SEA341004": ["N47d30.12m0", "W122d18.58m0"],
        "_SUMMA326017": ["N46d53.20m0", "W122d07.08m0"],
        "AAYRR": ["N46d38.81m0", "W123d43.34m0"],
        "BOANE": ["N47d59.10m0", "W122d43.52m0"],
        "EUG"  : ["N44d07.25m0", "W123d13.37m0"],
        "FEPOT": ["N47d04.85m0", "W123d13.13m0"],
        "GEG"  : ["N47d33.90m0", "W117d37.61m0"],
        "KRUZR": ["N48d04.65m0", "W120d34.68m0"],
        "ONSET": ["N48d57.48m0", "W118d00.00m0"],
        "PAE"  : ["N47d55.19m0", "W122d16.67m0"],
        "WESET": ["N47d24.35m0", "W122d19.10m0"],
        "YXC"  : ["N49d33.30m0", "W116d05.26m0"],
        "ZUVEN": ["N47d47.98m0", "W122d25.15m0"]
    },
    "restricted": [
        {
            "name": "P-51",
            "height": "2500ft",
            "coordinates": [
                ["N47.7737128", "W122.7710456"],
                ["N47.7189169", "W122.7706794"],
                ["N47.6924411", "W122.7388044"],
                ["N47.6932556", "W122.6940508"],
                ["N47.7723906", "W122.6948667"]
            ]
        }
    ],
    "runways":[
        {
            "name": ["16L", "34R"],
            "end": [
                [47.463767, -122.307749, "432.5ft"],
                [47.431201, -122.308035, "346.8ft"]
            ],
            "ils": [true, true],
        },
        {
            "name": ["16R", "34L"],
            "end": [
                [47.463806, -122.317884, "415.0ft"],
                [47.440562, -122.318092, "356.3ft"]
            ],
            "ils": [true, true],
        }
    ],
    "sids": {
        "SUMMA1": {
            "icao": "SUMMA1",
            "name": "Summa One",
            "suffix": {"16L":"", "16R":"", "34L":"", "34R":""},
            "rwy": {
                "16L": ["NEVJO"],
                "16R": ["NEVJO"],
                "34L": [["NEZUG", "A40+"], "^_NEZUG070PAE139", "_SUMMA326017"],
                "34R": [["NEZUG", "A40+"], "^_NEZUG070PAE139", "_SUMMA326017"]
            },
            "exitPoints": {
                "BKE": ["SUMMA", "BKE"],
                "LKV": ["SUMMA", "LKV"],
                "SUMMA": ["SUMMA"]
            },
            "draw": [
                ["NEVJO", "SUMMA"],
                ["NEZUG", "_NEZUG070PAE139", "_SUMMA326017", "SUMMA"],
                ["SUMMA", "LKV*"],
                ["SUMMA*", "BKE*"]
            ]
        }
    },
    "stars": {
        "CHINS2": {
            "icao": "CHINS2",
            "name": "Chins Two",
            "suffix": {"16L":"", "16R":"", "34L":"", "34R":""},
            "entryPoints": {
                "CHINS": [],
                "IMB": ["IMB", "SUNED", "YKM"],
                "PDT": ["PDT", "BRUKK", "SUNED", "YKM"],
                "SUNED": ["SUNED", "YKM"]
            },
            "body": ["CHINS"],
            "rwy": {
                "16L": [["RADDY", "A160+|S270"], ["HUMPP", "A150-"], ["AUBRN", "A120|S250"], "#343"],
                "16R": [["RADDY", "A160+|S270"], ["HUMPP", "A150-"], ["AUBRN", "A120|S250"], "#343"],
                "34L": [["RADDY", "A120|S250"], "HUMPP", "AUBRN", "#250"],
                "34R": [["RADDY", "A120|S250"], "HUMPP", "AUBRN", "#250"]
            },
            "draw": [
                ["IMB*", "SUNED*", "YKM"],
                ["PDT*", "BRUKK", "SUNED", "YKM"],
                ["YKM", "CHINS*", "RADDY", "HUMPP", "AUBRN"]
            ]
        }
    },
    "spawnPatterns": [
        {
            "origin": "KSEA",
            "destination": "",
            "category": "departure",
            "route": "KSEA.SUMMA1.BKE",
            "altitude": "",
            "speed": "",
            "method": "random",
            "rate": 9,
            "airlines": [
                ["aal", 4],
                ["aca", 1],
                ["asa", 3]
            ]
        },
        {
            "origin": "",
            "destination": "KSEA",
            "category": "arrival",
            "route": "PDT.CHINS2.KSEA",
            "altitude": [18000, 36000],
            "speed": 320,
            "method": "random",
            "rate": 15,
            "airlines": [
                ["aal", 4],
                ["aca", 1],
                ["asa", 3]
            ]
        }
    ],
    "maps": {
        "base": [
            ["N47.46706920", "W122.43465440", "N47.46816390", "W122.43651330"],
            ["N47.46635080", "W122.43369000", "N47.46706920", "W122.43465440"],
            ["N47.46975860", "W122.43977560", "N47.47109720", "W122.44296940"],
            ["N47.46816390", "W122.43651330", "N47.46975860", "W122.43977560"],
            ["N47.46549330", "W122.43386170", "N47.46635080", "W122.43369000"]
        ]
    }
}

```

## Property Descriptions

### Base Airport Properties
_all properties in this section are required_

- **radio** ― The radio callsigns for each controller:
```javascript
"radio": {
    "twr": "Seatle Tower",
    "app": "Seattle Approach",
    "dep": "Seattle Departure"
},
```
- **icao** ― ICAO identifier of the airport. _see [ICAO identifiers](#icao-and-iata-identifiers) for more information_
- **iata** ― IATA identifier of the airport. _see [IATA identifiers](#icao-and-iata-identifiers) for more information_
- **magnetic_north** ― The magnetic declination (variation) of the airport.  Declination is the angular difference between true north and magnetic north (in degrees **EAST**!) _see this [NOAA calculator][noaa-calculator] if you can't find this value_
- **ctr_radius** ― The radius (in kilometers) of the controlled airspace that aircraft are simulated within. Outside of this radius aircraft are removed, so ensure it is large enough for your airspace.
- **ctr_ceiling** ― The ceiling/top of the airspace (in feet). When an `airspace` property is present, that value will take priority over this one.
- **initial_alt** ― The altitude (in feet) at which all departing aircraft are expected to stop their climb after takeoff unless otherwise instructed.
- **position** ― The geographical position of the airport. (in latitude, longitude, and elevation: _see [lat, lon, elev](#latitude-longitude-elevation) for formatting_)
- **rr_radius_nm** ― The distance between each range ring (in nautical miles) within the airspace.
- **rr_center** ― The position at which the range rings are centered. (in latitude, longitude: _see [lat, lon, elev](#latitude-longitude-elevation) for formatting_)
- **has_terrain** ― Flag used to determine if the airport has a corresponding `.geoJSON` file in [assets/airports/terrain](../..assets/airports/terrain).
- **wind** ― The true heading (angle) in degrees and speed in knots of the current wind at the airport:
```javascript
"wind": {
    "angle": 150,
    "speed": 9
},
```
- **arrivalRunway** ― The default runway to use for arrivals.
- **departureRunway** ― The default runway to use for departures.


### Airspace
_All properties in this section are required for each airspace section_
_At least one airspace definition is required for an airport_

```javascript
"airspace": [
    {
        "floor": 0,
        "ceiling": 150,
        "airspace_class": "B",
        "poly": [
            ["N47.83333330", "W121.69999940"],
            ["N47.95335007", "W121.97603665"],
            ["N48.30000000", "W121.96666670"],
            ["N48.30000000", "W122.30000000"],
            ["N48.20000000", "W122.45000000"]
        ]
    }
],
```
Position definition of the airport airspace.  Multiple airspace areas may be defined and will all be included in the airspace. This allows for advanced airspace stratification.

- **floor** ― The lowest altitude (in [flight levels](#flight-level)) included in the airspace.
- **ceiling** ― The highest altitude (in [flight levels](#flight-level)) included in the airspace.
- **airspace_class** ― The FAA class of the airspace. For non-US airports, please review [this FAA airspace classification document](https://www.faasafety.gov/gslac/ALC/course_content.aspx?cID=42&sID=505&preview=true) and find the closest match based on the way the local airspace is treated.
- **poly** ― The coordinates of the airspace. in latitude, longitude: _see [lat, lon, elev](#latitude-longitude-elevation) for formatting_


### Fixes
_All fixes listed within the Standard Routes need to be defined within this section_

```javascript
"fixes": {
    "_NEZUG070010": ["N47d34.80m0", "W122d03.84m0"],
    "_NEZUG070PAE139": ["N47d34.77m0", "W122d05.11m0"],
    "_NICHY250SEA230": ["N47d19.92m0", "W122d42.78m0"],
    "_OLM161026" : ["N46d32.31m0", "W122d54.11m0"],
    "_SEA161002": ["N47d24.12m0", "W122d18.58m0"],
    "_SEA341004": ["N47d30.12m0", "W122d18.58m0"],
    "_SUMMA326017": ["N46d53.20m0", "W122d07.08m0"],
    "AAYRR": ["N46d38.81m0", "W123d43.34m0"],
    "BOANE": ["N47d59.10m0", "W122d43.52m0"],
    "EUG"  : ["N44d07.25m0", "W123d13.37m0"],
    "FEPOT": ["N47d04.85m0", "W123d13.13m0"],
    "GEG"  : ["N47d33.90m0", "W117d37.61m0"],
    "KRUZR": ["N48d04.65m0", "W120d34.68m0"],
    "ONSET": ["N48d57.48m0", "W118d00.00m0"],
    "PAE"  : ["N47d55.19m0", "W122d16.67m0"],
    "WESET": ["N47d24.35m0", "W122d19.10m0"],
    "YXC"  : ["N49d33.30m0", "W116d05.26m0"],
    "ZUVEN": ["N47d47.98m0", "W122d25.15m0"]
},
```
Each navaid located within or around the airport airspace in latitude, longitude: _see [lat, lon, elev](#latitude-longitude-elevation) for formatting_.  Real life fixes are defined thusly:
```javascript
"AAYRR": ["N46d38.81m0", "W123d43.34m0"]
```
You will notice in the list above there is a fix definition preprended with an `_`.  This is called an _invisible_ fix.  A few examples of uses for these fixes include:

1. To simulate DME arcs (can be seen in SAEZ)
2. To simulate initial climbs (e.g. Climb runway heading until LON 2DME)
3. To simulate radial intercepts (e.g. Intercept radial 180 to OLM)

They're used when we need aircraft to fly over a location that doesn't have an actual fix or waypoint. A fix should be created and should be named using the following conventions:

* Any fixes located at runway thresholds should be named after the runway at which they are located.
```javascript
"_RWY33L": [42.354662, -70.991598]
```
* Any fixes desired a given distance away from another fix will be described in fix-radial-distance form. This would be the fix name, three digit bearing, and three digit distance in nautical miles. All of these should be marked as RNAV fixes (via the underscore prefix).
```javascript
"_AUTUM220015": [42.324333, -71.736833]
```
* Any fixes desired a given distance out from a given runway will be described via the distance from the threshold. This would be the runway whose departure path is aimed toward the fix, with the distance being measured from the departure end (denoted in the fix name as a two digit distance in nautical miles, then DME). So a fix named `_RWY1805DME` would be 5.0nm south of the end of Runway 18. All of these should be marked as RNAV fixes (via the underscore prefix).
```javascript
"_RWY33L01DME": [42.342838, -70.975751]
```
* Fixes may be defined based on the intersection between outbound radials from two defined fixes. For a point northeast of `FIXXA`, and northwest of `FIXXB`, we could create `_FIXXA050FIXXB320`, where the three digit numbers after the fix names are the direction from that fix to the described location.
```javascript
"_SIPLY233STINS324": ["N37.47860", "W122.60090"]
```
* Fixes may be defined based on the intersection of a runway's outbound course and an outbound radial of any fix. For a point aligned with Runway 27's departure path and the XYZ VOR's outbound radial 180, we get `_RWY27XYZ180`. Note that if the intersection were to be on the arrival half of a given runway, the opposite runway should be used to keep with the convention of using the departure course.
```javascript
"_RWY19RPIE116": [27.848198, 82.546200]
```
* Fixes may be defined based on the intersection of a fix's outbound radial and the DME arc of the specified distance from a separate fix. This is formatted like `_FIXXA050FIXXB05DME`, where the first fix has a three digit outbound radial, and the second fix has a two-digit distance in nm, followed by DME. Similarly, this can be done with runways using the same patterns as before, yielding `_RWY22LFIXXB05DME`.
```javascript
"_RWY09RLON02DME": ["N51d32m17.76", "W0d12m45.87"]
```

### Restricted Airspace
Areas of restricted airspace may be added to the `restricted` property of the airport file. This is an array containing restricted areas such as the example below:
```javascript
"restricted": [
    {
        "name": "P-51",
        "height": "2500ft",
        "coordinates": [
            ["N47.7737128", "W122.7710456"],
            ["N47.7189169", "W122.7706794"],
            ["N47.6924411", "W122.7388044"],
            ["N47.6932556", "W122.6940508"],
            ["N47.7723906", "W122.6948667"]
        ]
    }
],
```

Note that `height` represents the _top_ of the restricted area. Currently all restricted areas are assumed to begin at sea level.


### Runways
```javascript
"runways": [
    {
        "name": ["16L", "34R"],
        "end": [
            [47.463767, -122.307749, "432.5ft"],
            [47.431201, -122.308035, "346.8ft"]
        ],
        "ils": [false, true],
        "ils_distance":[30, 25],
        "loc_maxDist": [28, 20],
        "glideslope": [3.00, 2.50]
    }
],
```
- **name** - Name of each runway in the pair.  Names should reflect a 180 degree difference. so if one end if `"Runway 9"` (or `"Runway 09"`, depending on the country) the other runway should be `"Runway 27"`.
- **end** - Latitude, Longitude, and Elevation of the runway threshold (the spot where the numbers would be painted). _see [lat, lon, elev](#latitude-longitude-elevation) for formatting_
- **ils** - Boolean property used to indicate if a runway has an ILS approach
- **ils_distance** - Distance the ILS extends away from the runway
- **glideslope** - Descent angle of the ILS glideslope
- **loc_maxDist** - Maximum distance from the runway threshold where the localizer is still usable by aircraft, in nm
- **ils_gs_maxHeight** - Maximum height where the glideslope is still usable by aircraft, in ft MSL
- **sepFromAdjacent** - A way to manually specify the separation required between this runway and an adjacent runway, in nm

Runways are defined in pairs because a runway can be used from either direction.  This makes defining runways a little tricky, so special attention should be paid to how the data is set up.  For each property, the first value will be considered part of the first runway and the second property for the second runway.  If you were to take the above example and extract each runway's properties, you would end up with the following two objects:

```javascript
// Runway 16L
{
    "name": "16L",
    "end": [
        [47.463767, -122.307749, "432.5ft"]
    ],
    "ils": false
}

// Runway 34R
{
    "name": "34R",
    "end": [
        [47.431201, -122.308035, "346.8ft"]
    ],
    "ils": true
}
```

<!---
### Airways
```javascript
"airways": {
    "J100": ["HEC", "CLARR", "LAS", "NORRA", "BCE"],
    "J146": ["LAS", "NOOTN"],
    "J9": ["HEC", "CLARR", "LAS", "NORRA", "AVERS", "URIAH", "BERYL",  "MLF"],
    "J92:" ["BTY", "BLD", "KADDY", "PRFUM", "CADDU", "DRK"],
    "Q15": ["CHILY", "DOVEE", "BIKKR"],
    "V8": ["PHYLI", "MMM", "MEADS", "ACLAM", "WINDS", "LYNSY", "SHUSS", "GFS", "HEC"]
},
```

Each fix along each airway in successive order (direction does not matter). And of course, all fixes entered here must be defined in the `fixes` section.
-->

## Standard Procedures

Standard Procedures consist of SIDs and STARs and, at a very high level, all contain three segments:
1. Entry - the start of the procedure. can be on one of (possibly) several transition routes that feed into a central segment (the Body)
2. Body - shared segment that all aircraft on the route will follow
3. Exit - end of the procedure. can be one of (possibly) several exit segments

This structure is used to work with both SIDs and STARs within the app.  Though it's not important to know for an airport file, it is a good thing to keep in mind.

Fixes within the segments can be defined in several different ways:
```javascript
// fix name only
"16L": ["IMB", "SUNED", "YKM"]

// fix name with fly-over instruction
"16L": ["IMB", "^SUNED", "YKM"]

// fix name with holding instruction
"16L": ["IMB", "@SUNED", "YKM"]

// fix name with altitude restriction
"16L": ["IMB", ["SUNED", "A70"], "YKM"]

// fix name with speed restriction
"16L": ["IMB", ["SUNED", "S200"], "YKM"]

// fix name with at/below and at/above altitude and speed restrictions
"16L": ["IMB", ["SUNED", "A70+|S250-"], "YKM"]

// fix name with ranged altitude and speed restrictions
"16L": ["IMB", ["SUNED", "A70+|A100-|S210+|S250-"], "YKM"]
```
These definitions can be used within any `Entry`, `Body` or `Exit` segment of a standardRoute.


### SIDs
_All properties in this section are required for each route definition_

```javascript
"sids": {
    "SUMMA1": {
        "icao": "SUMMA1",
        "name": "Summa One",
        "suffix": {"16L":"", "16R":"", "34L":"", "34R":""},
        "rwy": {
            "16L": ["NEVJO"],
            "16R": ["NEVJO"],
            "34L": [["NEZUG", "A40+"], "^_NEZUG070PAE139", "_SUMMA326017"],
            "34R": [["NEZUG", "A40+"], "^_NEZUG070PAE139", "_SUMMA326017"]
        },
        "exitPoints": {
            "BKE": ["SUMMA", "BKE"],
            "LKV": ["SUMMA", "LKV"],
            "SUMMA": ["SUMMA"]
        },
        "draw": [
            ["NEVJO", "SUMMA"],
            ["NEZUG", "_NEZUG070PAE139", "_SUMMA326017", "SUMMA"],
            ["SUMMA", "LKV*"],
            ["SUMMA*", "BKE*"]
        ]
    }
},
```
SID is an acronym for _Standard Instrument Departure_.

- **icao** - icao identifier of the route, should match the object key in spelling and casing
```javascript
"SUMMA1": {
    "icao": "SUMMA1"
}
```
- **name** - spoken name of the route used for read backs.
- **suffix** - (object) For applicable airports, a number and letter "suffix" are used to indicate the version of the procedure that applies to a specific departing runway. A "key" must be present for all runways, and their values set to the appropriate suffix or an empty string: `""`.
- **rwy** - (2d array of strings) considered the `Entry`. Each key corresponds to a runway that can be used to enter the route.
- **body** - (2d array of strings) fix names for the `Body` segment.
- **exitPoints** - (2d array of strings) considered the `Exit`. Each key corresponds to and exit transition for a route.
- **draw** - (2d array of strings) array of lines (arrays) to draw in blue between the listed fixes. The name of the SID will be displayed on top of the fix with a `*` after it (e.g. `["SUMMA", "LKV*"]`). _Please note that the 'draw' array must contain at least one array, even if it is empty: `"draw": [[]]`_

- _The `body` section must contain at least one fix_
- _The `exitPoints` section must contain at least one fix_


### STARs
_All properties in this section are required for each route definition_

```javascript
"stars": {
    "CHINS2": {
        "icao": "CHINS2",
        "name": "Chins Two",
        "suffix": {"16L":"", "16R":"", "34L":"", "34R":""},
        "entryPoints": {
            "CHINS": [],
            "IMB": ["IMB", "SUNED", "YKM"],
            "PDT": ["PDT", "BRUKK", "SUNED", "YKM"],
            "SUNED": ["SUNED", "YKM"]
        },
        "body": ["CHINS"],
        "rwy": {
            "16L": [["RADDY", "A160+|S270"], ["HUMPP", "A150-"], ["AUBRN", "A120|S250"], "#343"],
            "16R": [["RADDY", "A160+|S270"], ["HUMPP", "A150-"], ["AUBRN", "A120|S250"], "#343"],
            "34L": [["RADDY", "A120|S250"], "HUMPP", "AUBRN", "#250"],
            "34R": [["RADDY", "A120|S250"], "HUMPP", "AUBRN", "#250"]
        },
        "draw": [
            ["IMB*", "SUNED*", "YKM"],
            ["PDT*", "BRUKK", "SUNED", "YKM"],
            ["YKM", "CHINS*", "RADDY", "HUMPP", "AUBRN"]
        ]
    }
},
```
STAR is an acronym for _Standard Terminal Arrival Route_.

- **icao** - icao identifier of the route, should match the object key in spelling and casing
```javascript
"CHINS2": {
    "icao": "CHINS2"
}
```
- **name** - spoken name of the route used for read backs.
- **suffix** - (object) For applicable airports, a number and letter "suffix" are used to indicate the version of the procedure that applies to a specific landing runway. A "key" must be present for all runways, and their values set to the appropriate suffix or an empty string: `""`.
- **entryPoints** - (2d array of strings) considered the `Entry`. Each key corresponds to a route transition that can be used to enter the route.
- **body** - (2d array of strings) fix names for the `Body` segment.
- **rwy** - (2d array of strings) considered the `Exit`. Each key corresponds to a runway that is usable from this route
- **draw** - (2d array of strings) array of lines (arrays) to draw in red between the listed fixes. The name of the STAR will be displayed on top of the fix with a `*` after it (e.g. `["PDT*", "BRUKK"]`)


### Spawn Patterns
_At least one `spawnPattern` is required to get aircraft populating into the app_

```javascript
"spawnPatterns": [
    {
        "origin": "KSEA",
        "destination": "",
        "category": "departure",
        "route": "KSEA.SUMMA1.BKE",
        "altitude": "",
        "speed": "",
        "method": "random",
        "rate": 9,
        "airlines": [
            ["aal", 4],
            ["aca", 1],
            ["asa", 3]
        ]
    },
    {
        "origin": "",
        "destination": "KSEA",
        "category": "arrival",
        "route": "PDT.CHINS2.KSEA",
        "altitude": [18000, 36000],
        "speed": 320,
        "method": "random",
        "rate": 15,
        "airlines": [
            ["aal", 4],
            ["aca", 1],
            ["asa", 3]
        ]
    }
],
```
Contains the parameters used to determine how and where aircraft are spawned into the simulation.  At least one `spawnPattern` is required so that aircraft can be added to the simulation.

_see [spawnPatternReadme.md](documentation/spawnPatternReadme.md) for more detailed descriptions on data shape and format of a spawnPattern_


### Maps
```javascript
"maps": {
    "base": [
        ["N47.46706920", "W122.43465440", "N47.46816390", "W122.43651330"],
        ["N47.46635080", "W122.43369000", "N47.46706920", "W122.43465440"],
        ["N47.46975860", "W122.43977560", "N47.47109720", "W122.44296940"],
        ["N47.46816390", "W122.43651330", "N47.46975860", "W122.43977560"],
        ["N47.46549330", "W122.43386170", "N47.46635080", "W122.43369000"]
    ]
}
```
Markings on the scope that depict various characteristics of the airspace. When available, this will be an actual Radar Video Map used by the real-world facility.

---

## Reference

### Latitude, Longitude, Elevation

For `lat, lon, elev` values, these formats are acceptable:
* [40.94684722, -76.61727778, "866ft"]
* ["N40.94684722", "W76.61727778", "866ft"]
* ["N40d56.811", "W076d37.037", "866ft"]
* ["N40d56m48.65", "W076d37m02.20", "866ft"]

*Note: For `lat, lon` values, just omit the elevation.*


### ICAO and IATA identifiers

Identifiers are unique codes used to differentiate airports, fixes, aircraft, etc. (ex: "KSFO" for the San Francisco Airport).  ICAO (the International Civil Aviation Organization) is an international aviation authority that sets safety and consistency standards that make worldwide travel more standardized. ICAO maintains many lists of things they assign their own identifiers (such as aircraft type designators, airport identifiers, etc). Wherever we have those identifiers stored, they will have the label "icao".

IATA is another international aviation organization (like ICAO) which maintains their own set of identifiers. We include the IATA identifiers for airports in all airport `.json` files, though they are not currently used for anything.

### Flight Level

Flight levels are described by a number, which is this nominal altitude (or, pressure altitude) in hecto-feet, while being a multiple of 500 ft, therefore always ending on 0 or 5. Therefore, a pressure altitude of, for example, 32,000 feet is referred to as "flight level 320".

Flight levels are usually designated in writing as FLxxx, where xxx is a two or three-digit number indicating the pressure altitude in units of 100 feet. In radio communications, FL290 would be pronounced as "flight level two nine(r) zero." The phrase "flight level" makes it clear that this refers to the standardized pressure altitude.
