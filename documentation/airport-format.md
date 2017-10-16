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

_Note: The code block shown below is an abbreviated version of [klas.json](assets/airports/klas.json)._
```javascript
{
    "radio": {
        "twr": "Las Vegas Tower",
        "app": "Las Vegas Approach",
        "dep": "Las Vegas Departure"
    },
    "icao": "KLAS",
    "iata": "LAS",
    "magnetic_north": 11.9,
    "ctr_radius": 80,
    "ctr_ceiling": 19000,
    "initial_alt": 19000,
    "position": ["N36.080056", "W115.15225", "2181ft"],
    "rr_radius_nm": 5.0,
    "rr_center": ["N36.080056", "W115.15225"],
    "has_terrain": true,
    "wind": {
        "angle": 220,
        "speed": 6
    },
    "arrivalRunway": "19R",
    "departureRunway": "19R",
    "airspace": [
        {
            "floor": 0,
            "ceiling": 190,
            "airspace_class": "B",
            "poly": [
                ["N35d57m50.000", "W115d51m15.000"],
                ["N35d34m30.000", "W115d29m00.000"]
            ]
        }
    ],
    "fixes": {
        "_RWY19L02DME": [36.12883621109, -115.13620132796],
        "_RWY19R02DME": [36.12992510899, -115.13907057136],
        "BAKRR": ["N36.07582112978773", "W114.95309917207562"],
        "BCE"  : ["N37.68918661436860", "W112.30389943797489"],
        "BESSY": ["N36.10772192196994", "W115.28956463349111"],
        "BETHL": ["N36.88434886833625", "W112.44043432584908"],
        "BIKKR": ["N36.56666216331978", "W116.75003219453492"]
    },
    "restricted": [
        {
            "name": "EIP10",
            "height": "5000ft",
            "coordinates": [
                ["N53d09m16", "W6d52m47"],
                ["N53d09m43", "W6d49m27"],
                ["N53d09m00", "W6d48m16"],
                ["N53d07m49", "W6d47m59"],
                ["N53d08m51", "W6d52m45"],
                ["N53d09m16", "W6d52m47"]
            ]
        }
    ]
    "runways": [
        {
            "name": ["07L", "25R"],
            "end": [
                ["N36d4m34.82", "W115d10m16.98", "2179ft"],
                ["N36d4m35.05", "W115d7m15.93", "2033ft"]
            ],
            "ils": [false, true]
        },
        {
            "name": ["07R", "25L"],
            "end": [
                ["N36d4m25.04", "W115d9m41.15", "2157ft"],
                ["N36d4m25.17", "W115d7m32.96", "2049ft"]
            ],
            "ils": [false, true]
        }
    ],
    "airways": {
        "J100": ["HEC", "CLARR", "LAS", "NORRA", "BCE"],
        "J146": ["LAS", "NOOTN"],
        "J9": ["HEC", "CLARR", "LAS", "NORRA", "AVERS", "URIAH", "BERYL",  "MLF"],
        "J92:" ["BTY", "BLD", "KADDY", "PRFUM", "CADDU", "DRK"],
        "Q15": ["CHILY", "DOVEE", "BIKKR"],
        "V8": ["PHYLI", "MMM", "MEADS", "ACLAM", "WINDS", "LYNSY", "SHUSS", "GFS", "HEC"]
    },
    "sids": {
        "COWBY6": {
            "icao": "COWBY6",
            "name": "Cowboy Six",
            "suffix": {"1L":"", "1R":"", "28L":"", "28R":""},
            "rwy": {
                "01L": ["_RWY19R02DME", "NAPSE", ["RIOOS", "A130+"], "COMPS"],
                "01R": ["_RWY19L02DME", "NAPSE", ["RIOOS", "A130+"], "COMPS"],
                "07L": ["WASTE", ["BAKRR", "A70"], "COMPS"],
                "07R": ["JESJI", ["BAKRR", "A70"], "COMPS"],
                "19L": ["FIXIX", ["ROPPR", "A70"], ["CEASR", "A80+"], ["HITME", "A110+"]],
                "19R": ["JAKER", ["ROPPR", "A70"], ["CEASR", "A80+"], ["HITME", "A110+"]],
                "25L": ["PIRMD", ["ROPPR", "A70"], ["CEASR", "A80+"], ["HITME", "A110+"]],
                "25R": ["RBELL", ["ROPPR", "A70"], ["CEASR", "A80+"], ["HITME", "A110+"]]
            },
            "body": ["COWBY"],
            "exitPoints": {
                "DRK": ["NAVHO", "DRK"],
                "GUP": [["MOSBI", "A150+"], "GUP"],
                "INW": [["CUTRO", "A150+"], "INW"]
            },
            "draw": [
                ["ROPPR", "CEASR", "HITME", "COWBY", "MOSBI", "GUP*"],
                ["BAKRR", "COMPS", "COWBY", "CUTRO", "INW*"],
                ["_RWY19L02DME", "NAPSE"],
                ["_RWY19R02DME", "NAPSE", "RIOOS", "COMPS"],
                ["COWBY", "NAVHO", "DRK*"]
            ]
        }
    },
    "stars": {
        "GRNPA1": {
            "icao": "GRNPA1",
            "name": "Grandpa One",
            "suffix": {"1L":"", "1R":"", "28L":"", "28R":""},
            "entryPoints": {
                "BETHL": ["BETHL", ["HOLDM", "A270"]],
                "BCE": ["BCE"],
                "DVC": ["DVC", "BETHL", ["HOLDM", "A270"]],
                "MLF": ["MLF"]
            },
            "body": [
                ["KSINO", "A170"],
                ["LUXOR", "A120|S250"],
                ["GRNPA", "A110"],
                ["DUBLX", "A90"],
                ["FRAWG", "A80|S210"],
                "TRROP",
                "LEMNZ"
            ],
            "rwy": {
                "01L": [],
                "01R": [],
                "07L": [],
                "07R": [],
                "19L": [],
                "19R": [],
                "25L": [],
                "25R": []
            },
            "draw": [["ENI*","PYE"], ["MXW*","PYE"], ["PYE","STINS","HADLY","OSI"]]
        }
    },
    "spawnPatterns": [
        {
            "origin": "KLAS",
            "destination": "",
            "category": "departure",
            "route": "KLAS.COWBY6.GUP",
            "altitude": 0,
            "method": "random",
            "entrail": [10, 22],
            "rate": 5,
            "airlines": [
                ["amx", 2],
                ["aca/long", 4],
                ["asa", 3],
                ["aay", 15]
            ],
        },
        {
            "origin": "",
            "destination": "KLAS",
            "category": "arrival",
            "route": "BETHL.GRNPA1.KLAS",
            "altitude": [30000, 40000],
            "speed": 320
            "method": "random",
            "entrail": [10, 22],
            "rate": 10,
            "airlines": [
                ["aca/long", 4],
                ["aay", 15],
                ["aal", 10]
            ],
        }
    ],
    "maps": {
        "base": [
            ["N36d38m01.199", "W114d36m17.219", "N36d36m32.337", "W114d34m19.673"],
            ["N36d36m27.904", "W114d36m12.534", "N36d38m06.271", "W114d34m20.227"],
            ["N35d56m01.371", "W114d51m25.735", "N35d57m09.977", "W114d51m43.334"],
            ["N35d56m42.691", "W114d52m17.075", "N35d56m28.981", "W114d50m51.994"]
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
    "twr": "Las Vegas Tower",
    "app": "Las Vegas Approach",
    "dep": "Las Vegas Departure"
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
    "angle": 220,
    "speed": 6
}
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
         "ceiling": 190,
         "airspace_class": "B",
         "poly": [
             ["N35d57m50.000", "W115d51m15.000"],
             ["N35d34m30.000", "W115d29m00.000"]
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
    "_RWY19L02DME": [36.12883621109, -115.13620132796],
    "_RWY19R02DME": [36.12992510899, -115.13907057136],
    "BAKRR": ["N36.07582112978773", "W114.95309917207562"],
    "BCE":   ["N37.68918661436860", "W112.30389943797489"],
    "BESSY": ["N36.10772192196994", "W115.28956463349111"],
    "BETHL": ["N36.88434886833625", "W112.44043432584908"],
    "BIKKR": ["N36.56666216331978", "W116.75003219453492"]
},
```
Each navaid located within or around the airport airspace in latitude, longitude: _see [lat, lon, elev](#latitude-longitude-elevation) for formatting_.  Real life fixes are defined thusly:
```javascript
"BAKRR": ["N36.07582112978773", "W114.95309917207562"]
```
You will notice in the list above there is a fix definition preprended with an `_`.  This is called an _invisible_ fix.  A few examples of uses for these fixes include:

1. To simulate fly-over waypoints (examples in EIDW)
1. To simulate DME arcs (can be seen in SAME)
1. To simulate initial climbs (e.g. Climb runway heading until LON 2DME)

They're used when we need aircraft to fly over a location that doesn't have an actual fix or waypoint. A fix should be created and should be named using the following conventions:

* The fixes should be located at the thresholds of the runways for which they are named.
```javascript
"_RWY33L": [42.354662, -70.991598]
```
* Any fixes desired a given distance away from another fix will be described in fix-radial-distance form. This would be the fix name, three digit bearing, and three digit distance in nautical miles. All of these should be marked as RNAV fixes (via the underscore prefix).
```javascript
"_AUTUM220015": [42.324333, -71.736833]
```
* Any fixes desired a given distance out on final of a given runway will be described via the distance from the threshold. This would be the runway name, two digit distance in nautical miles, then `DME`. All of these should be marked as RNAV fixes (via the underscore prefix).
```javascript
"_RWY33L01DME": [42.342838, -70.975751]
```

### Restricted Airspace
Areas of restricted airspace may be added to the `restricted` property of the airport file. This is an array containing restricted areas such as the example below:
```javascript
{
    "name": "EIP10",
    "height": "5000ft",
    "coordinates": [
        ["N53d09m16", "W6d52m47"],
        ["N53d09m43", "W6d49m27"],
        ["N53d09m00", "W6d48m16"],
        ["N53d07m49", "W6d47m59"],
        ["N53d08m51", "W6d52m45"],
        ["N53d09m16", "W6d52m47"]
    ]
},
```

Note that `height` represents the _top_ of the restricted area. Currently all restricted areas are assumed to begin at sea level.


### Runways
```javascript
"runways": [
    {
        "name": ["07L", "25R"],
        "end": [
            ["N36d4m34.82", "W115d10m16.98", "2179ft"],
            ["N36d4m35.05", "W115d7m15.93", "2033ft"]
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
// Runway 07L
{
    "name": "07L",
    "end": [
        ["N36d4m34.82", "W115d10m16.98", "2179ft"]
    ],
    "ils": false
}

// Runway 25R
{
    "name": "25R",
    "end": [
        ["N36d4m35.05", "W115d7m15.93", "2033ft"]
    ],
    "ils": true
}
```

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

## Standard Procedures

Standard Procedures consist of SIDs and STARs and, at a very high level, all contain three segments:
1. Entry - the start of the procedure. can be on one of (possibly) several transition routes that feed into a central segment (the Body)
2. Body - shared segment that all aircraft on the route will follow
3. Exit - end of the procedure. can be one of (possibly) several exit segments

This structure is used to work with both SIDs and STARs within the app.  Though it's not important to know for an airport file, it is a good thing to keep in mind.

Fixes within the segments can be defined in several different ways:
```javascript
// fix name only
"07L": ["WASTE", "COMPS"]

// fix name with altitude restriction
"07L": ["WASTE", ["BAKRR", "A70"], "COMPS"]

// fix name with speed restriction
"07L": ["WASTE", ["BAKRR", "S200"], "COMPS"]

// fix name with at/below and at/above altitude and speed restrictions
"07L": ["WASTE", ["BAKRR", "A70+|S250-"], "COMPS"]

// fix name with ranged altitude and speed restrictions
"07L": ["WASTE", ["BAKRR", "A70+|A100-|S210+|S250-"], "COMPS"]
```
These definitions can be used within any `Entry`, `Body` or `Exit` segment of a standardRoute.


### SIDs
_All properties in this section are required for each route definition_

```javascript
"sids": {
    "COWBY6": {
        "icao": "COWBY6",
        "name": "Cowboy Six",
        "suffix": {"1L":"", "1R":"", "28L":"", "28R":""},
        "rwy": {
            "01L": ["_RWY19R02DME", "NAPSE", ["RIOOS", "A130+"], "COMPS"],
            "01R": ["_RWY19L02DME", "NAPSE", ["RIOOS", "A130+"], "COMPS"],
            "07L": ["WASTE", ["BAKRR", "A70"], "COMPS"],
            "07R": ["JESJI", ["BAKRR", "A70"], "COMPS"],
            "19L": ["FIXIX", ["ROPPR", "A70"], ["CEASR", "A80+"], ["HITME", "A110+"]],
            "19R": ["JAKER", ["ROPPR", "A70"], ["CEASR", "A80+"], ["HITME", "A110+"]],
            "25L": ["PIRMD", ["ROPPR", "A70"], ["CEASR", "A80+"], ["HITME", "A110+"]],
            "25R": ["RBELL", ["ROPPR", "A70"], ["CEASR", "A80+"], ["HITME", "A110+"]]
        },
        "body": ["COWBY"],
        "exitPoints": {
            "DRK": ["NAVHO", "DRK"],
            "GUP": [["MOSBI", "A150+"], "GUP"],
            "INW": [["CUTRO", "A150+"], "INW"]
        },
        "draw": [
            ["ROPPR", "CEASR", "HITME", "COWBY", "MOSBI", "GUP*"],
            ["BAKRR", "COMPS", "COWBY", "CUTRO", "INW*"],
            ["_RWY19R02DME", "NAPSE"],
            ["_RWY19L02DME", "NAPSE", "RIOOS", "COMPS"],
            ["COWBY", "NAVHO", "DRK*"]
        ]
    }
},
```
SID is an acronym for _Standard Instrument Departure_.

- **icao** - icao identifier of the route, should match the object key in spelling and casing
```javascript
"COWBY6": {
    "icao": "COWBY6"
}
```
- **name** - spoken name of the route used for read backs.
- **suffix** - (object) For applicable airports, a number and letter "suffix" are used to indicate the version of the procedure that applies to a specific departing runway. A "key" must be present for all runways, and their values set to the appropriate suffix or an empty string: `""`.
- **rwy** - (2d array of strings) considered the `Entry`. Each key corresponds to a runway that can be used to enter the route.
- **body** - (2d array of strings) fix names for the `Body` segment.
- **exitPoints** - (2d array of strings) considered the `Exit`. Each key corresponds to and exit transition for a route.
- **draw** - (2d array of strings) array of lines (arrays) to draw in blue between the listed fixes. _Please note that the 'draw' array must contain at least one array, even if it is empty: `"draw": [[]]`_

- _The `body` section must contain at least one fix_
- _The `exitPoints` section must contain at least one fix_


### STARs
_All properties in this section are required for each route definition_

```javascript
"stars": {
    "GRNPA1": {
        "icao": "GRNPA1",
        "name": "Grandpa One",
        "suffix": {"1L":"", "1R":"", "28L":"", "28R":""},
        "entryPoints": {
            "BETHL": ["BETHL", ["HOLDM", "A270"]],
            "BCE": ["BCE"],
            "DVC": ["DVC", "BETHL", ["HOLDM", "A270"]],
            "MLF": ["MLF"]
        },
        "body": [
            ["KSINO", "A170"],
            ["LUXOR", "A120|S250"],
            ["GRNPA", "A110"],
            ["DUBLX", "A90"],
            ["FRAWG", "A80|S210"],
            "TRROP",
            "LEMNZ"
        ],
        "rwy": {
            "01L": [],
            "01R": [],
            "07L": [],
            "07R": [],
            "19L": [],
            "19R": [],
            "25L": [],
            "25R": []
        },
        "draw": [["ENI*","PYE"], ["MXW*","PYE"], ["PYE","STINS","HADLY","OSI"]]
    }
},
```
STAR is an acronym for _Standard Terminal Arrival Route_.

- **icao** - icao identifier of the route, should match the object key in spelling and casing
```javascript
"GRNPA1": {
    "icao": "GRNPA1"
}
```
- **name** - spoken name of the route used for read backs.
- **suffix** - (object) For applicable airports, a number and letter "suffix" are used to indicate the version of the procedure that applies to a specific landing runway. A "key" must be present for all runways, and their values set to the appropriate suffix or an empty string: `""`.
- **entryPoints** - (2d array of strings) considered the `Entry`. Each key corresponds to a route transition that can be used to enter the route.
- **body** - (2d array of strings) fix names for the `Body` segment.
- **rwy** - (2d array of strings) considered the `Exit`. Each key corresponds to a runway that is usable from this route
- **draw** - (2d array of strings) array of lines (arrays) to draw in red between the listed fixes.


### Spawn Patterns
_At least one `spawnPattern` is required to get aircraft populating into the app_

```javascript
"spawnPatterns": [
    {
        "origin": "KLAS",
        "destination": "",
        "category": "departure",
        "route": "KLAS.COWBY6.GUP",
        "altitude": "",
        "speed": "",
        "method": "random",
        "rate": 5,
        "airlines": [
            ["amx", 2],
            ["aca/long", 4],
            ["asa", 3],
            ["aay", 15]
        ],
    },
    {
        "origin": "",
        "destination": "KLAS",
        "category": "arrival",
        "route": "BETHL.GRNPA1.KLAS",
        "altitude": [30000, 40000],
        "speed": 320
        "method": "random",
        "rate": 10,
        "airlines": [
            ["aca/long", 4],
            ["aay", 15],
            ["aal", 10]
        ],
    }
],
```
Contains the parameters used to determine how and where aircraft are spawned into the simulation.  At least one `spawnPattern` is required so that aircraft can be added to the simulation.

_see [spawnPatternReadme.md](documentation/spawnPatternReadme.md) for more detailed descriptions on data shape and format of a spawnPattern_


### Maps
```javascript
"maps": {
    "base": [
        ["N36d38m01.199", "W114d36m17.219", "N36d36m32.337", "W114d34m19.673"],
        ["N36d36m27.904", "W114d36m12.534", "N36d38m06.271", "W114d34m20.227"],
        ["N35d56m01.371", "W114d51m25.735", "N35d57m09.977", "W114d51m43.334"],
        ["N35d56m42.691", "W114d52m17.075", "N35d56m28.981", "W114d50m51.994"]
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
