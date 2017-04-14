# Airport Format

* [Template](## Template)
* [Property Descriptions](## Property Descriptions)

The airport JSON file must be in "[assets/airports](assets/airports)"; the filename
should be `icao.json` where "icao" is the lowercase four-letter ICAO
airport code, such as "ksfo" or "kmsp".  If this is a new airport, there
should also be an entry added to [airportLoadList.js](../src.assets/scripts/airport/airportLoadList.js) in alphabetical order.
See the comments for information on the correct structure to use.

## Example

_Note: This is an **abbreviated** version of [klas.json](assets/airports/klas.json)._
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
        "_NAPSE068": ["N36.11211", "W115.14661"],
        "BAKRR": ["N36.07582112978773", "W114.95309917207562"],
        "BCE":   ["N37.68918661436860", "W112.30389943797489"],
        "BESSY": ["N36.10772192196994", "W115.28956463349111"],
        "BETHL": ["N36.88434886833625", "W112.44043432584908"],
        "BIKKR": ["N36.56666216331978", "W116.75003219453492"]
    },
    "runways":[
        {
            "name": ["07L", "25R"],
            "name_offset": [[0, 0], [0, 0]],
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
    "sids": {
        "COWBY6": {
            "icao": "COWBY6",
            "name": "Cowboy Six",
            "suffix": {"1L":"", "1R":"", "28L":"", "28R":""},
            "rwy": {
                "01L": ["_NAPSE068", "NAPSE", ["RIOOS", "A130+"], "COMPS"],
                "01R": ["_NAPSE068", "NAPSE", ["RIOOS", "A130+"], "COMPS"],
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
                ["_NAPSE068", "NAPSE", "RIOOS", "COMPS"],
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

- **radio** ― The radio callsigns for each controller. (`"app"` for "approach", `"dep"` for "departure", and `"twr"` for "tower")
- **ICAO** ― ICAO identifiers are unique codes used to differentiate airports, fixes, aircraft, etc. (ex: "KSFO" for the San Francisco Airport) (*see [ICAO identifiers](### ICAO and IATA identifiers) for more information*)
- **IATA** ― IATA identifiers are unique codes used as a shorthand for ICAO identifiers for mostly airports. (ex: "SFO" for the San Francisco Airport) (*see [IATA identifiers](### ICAO and IATA identifiers) for more information*)
- **magnetic_north** ― The magnetic declination (variation), which is the angular difference between true north and magnetic north. (in degrees **EAST**!) (*see [this NOAA calculator](https://www.ngdc.noaa.gov/geomag-web/#declination) if you can't find this value*)
- **ctr_radius** ― The radius around the airport that aircraft are simulated within. Outside of this radius, aircraft are removed, so ensure it is large enough for your airspace. (in kilometers)
- **ctr_ceiling** ― The ceiling of the airspace. When an "airspace" property is present, its value will take priority over this one. (in feet)
- **initial_alt** ― The altitude to which all departing aircraft are expected to stop their climb after takeoff, unless otherwise instructed. (in feet)
- **position** ― The geographical position of the airport. (in latitude, longitude, and elevation: *see [lat, lon, elev](### Latitude, Longitude, Elevation) for formatting*)
- **rr_radius_nm** ― The distance between each range ring within the airspace. (in nautical miles)
- **rr_center** ― The position at which the range rings are centered. (in latitude, longitude: *see [lat, lon, elev](### Latitude, Longitude, Elevation) for formatting*)
- **has_terrain** ― Whether or not the airport has a corresponding `.geoJSON` file in "[assets/airports/terrain](assets/airports/terrain)".
- **wind** ― The true heading and speed that the wind is coming from. (in degrees and knots, respectively)


#### airspace
The airspace of the airport. (Multiple airspace areas may be defined, and will all be included in the "airspace". This allows for advanced airspace stratification.)
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
* **floor** ― The altitude at which the airspace begins.
* **ceiling** ― The altitude at which the airspace ends.
* **airspace_class** ― The FAA class of the airspace. *(see [this FAA document](https://www.faasafety.gov/gslac/ALC/course_content.aspx?cID=42&sID=505&preview=true) for more details)*
* **poly** ― The coordinates of the airspace. (in latitude, longitude: *see [lat, lon, elev](### Latitude, Longitude, Elevation) for formatting*)


#### fixes
```javascript
"fixes": {
    "_NAPSE068": ["N36.11211", "W115.14661"],
    "BAKRR": ["N36.07582112978773", "W114.95309917207562"],
    "BCE":   ["N37.68918661436860", "W112.30389943797489"],
    "BESSY": ["N36.10772192196994", "W115.28956463349111"],
    "BETHL": ["N36.88434886833625", "W112.44043432584908"],
    "BIKKR": ["N36.56666216331978", "W116.75003219453492"]
},
```

All fixes, navaids, waypoints, intersections, and airport locations. (in latitude, longitude: *see [lat, lon, elev](#### Latitude, Longitude, Elevation) for formatting*)

#### runways
```javascript
"runways":[
    {
        "name": ["07L", "25R"],
        "name_offset": [[0, 0], [0, 0]],
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
```
The runways usable by aircraft.


#### sids
```javascript
"sids": {
    "COWBY6": {
        "icao": "COWBY6",
        "name": "Cowboy Six",
        "suffix": {"1L":"", "1R":"", "28L":"", "28R":""},
        "rwy": {
            "01L": ["_NAPSE068", "NAPSE", ["RIOOS", "A130+"], "COMPS"],
            "01R": ["_NAPSE068", "NAPSE", ["RIOOS", "A130+"], "COMPS"],
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
            ["_NAPSE068", "NAPSE", "RIOOS", "COMPS"],
            ["COWBY", "NAVHO", "DRK*"]
        ]
    }
},
```
"Standard Instrument Departure" procedures.


#### stars
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
"Standard Terminal Arrival Route" procedures.


#### spawnPatterns
```javascript
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
```
Contains the parameters used to determine how and where aircraft are spawned into the simulation. (*see [spawnPatternReadme.md](documentation/spawnPatternReadme.md) for formatting*)


#### maps
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


### Latitude, Longitude, Elevation

For `lat, lon, elev` values, these formats are acceptable:
* [40.94684722, -76.61727778, "866ft"]
* ["N40.94684722", "W76.61727778", "866ft"]
* ["N40d56.811", "W076d37.037", "866ft"]
* ["N40d56m48.65", "W076d37m02.20", "866ft"]

*Note: For `lat, lon` values, just omit the elevation.*

### ICAO and IATA identifiers

ICAO (the International Civil Aviation Organization) is an international aviation authority that sets safety and consistency standards that make worldwide travel more standardized. ICAO maintains many lists of things they assign their own identifiers (such as aircraft type designators, airport identifiers, etc). Wherever we have those identifiers stored, they will have the label "icao".

IATA is another international aviation organization (like ICAO) which maintains their own set of identifiers. We include the IATA identifiers for airports in all airport `.json` files, though they are not currently used for anything.
