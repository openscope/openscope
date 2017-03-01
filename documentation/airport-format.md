# Airport Format

[NOTICE](## NOTICE)
[Template](## Template)
[Comments](## Comments)
    [Property Descriptions](### Property Descriptions)
        [Latitude, Longitude, Elevation](#### Latitude, Longitude, Elevation)
        [ICAO and IATA codes](#### ICAO and IATA codes)
        [#### `spawnPatterns` Build Process](#### `spawnPatterns` Build Process)

## NOTICE

The airport JSON file must be in `assets/airports`; the filename
should be `icao.json` where `icao` is the lowercase four-letter ICAO
airport code, such as `ksfo` or `kmsp`.  If this is a new airport, there
should also be an entry added to [`airportLoadList.js`](../src.assets/scripts/airport/airportLoadList.js) in alphabetical order.
See the comments for information on the correct structure to use.

## Template
```
{
    "radio": {
        "twr": "Las Vegas Tower",
        "app": "Las Vegas Approach",
        "dep": "Las Vegas Departure"
    },
    "icao": "KLAS",                             // Uppercase ICAO airport code.
    "iata": "LAS",                              // Uppercase IATA airport code.
    "magnetic_north": 11.9,                     // Magnetic deviation from magnetic north, in degrees East. (can be a negative number)
    "ctr_radius": 80,                           // Radius of the airspace from the center of the airport. (in nautical miles)
    "ctr_ceiling": 19000,                       // Height of the airspace. (in feet)
    "initial_alt": 19000,                       // Set altitude for departures to climb if given "clearance as filed", but without a "climb via SID" clearance or altitude assignment.
    "position": ["N36.080056", "W115.15225", "2181ft"], // The center of the airport. (in latitude, longitude, and elevation) // See comments below.
    "rr_radius_nm": 5.0,                        // Radius of the ring sections. (in nautical miles)
    "rr_center": ["N36.080056", "W115.15225"],  // The center position of the rings. (in nautical miles)
    "has_terrain": true,                        // Whether or not the airport has an associated GeoJSON terrain file in "assets/airports/terrain". (true or false)
    "wind": {                                   // (optional) Wind is used for score. // It can affect an aircraft's ground tracks if enabled in settings.
        "angle": 220,                           // (optional) Wind direction. (in degrees)
        "speed": 6                              // (optional) Wind speed. (in knots)
    },
    "airspace": [                               // (optional) Restricted airspace.
        {
            "floor": 0,                         // The height that the restricted airspace begins, from the ground up. (in flight level: multiply by 100 to get feet)
            "ceiling": 190,                     // The height that the restricted airspace ends, from the ground up. (in flight level: multiply by 100 to get feet)
            "airspace_class": "B",              // The class of the restricted airspace.
            "poly": [                           // The points on the map where the restricted airspace is drawn.
                ["N35d57m50.000", "W115d51m15.000"],
                ["N35d34m30.000", "W115d29m00.000"]
            ]
        }
    ],
    "fixes": {                                  // Locations on the map that aircraft use to travel in and out of the map. These should be sorted alphabetically for readability.
        "_NAPSE068": ["N36.11211", "W115.14661"],
        "BAKRR": ["N36.07582112978773", "W114.95309917207562"],
        "BCE":   ["N37.68918661436860", "W112.30389943797489"],
        "BESSY": ["N36.10772192196994", "W115.28956463349111"],
        "BETHL": ["N36.88434886833625", "W112.44043432584908"],
        "BIKKR": ["N36.56666216331978", "W116.75003219453492"]
    },
    "runways":[
        {
            "name": ["07L", "25R"],                     // Names of the runways.
            "name_offset": [[0, 0], [0, 0]],            // (optional) The offset of the runway label. (in km) If there is no offset, this should be omitted.
            "end": [                                    // The ends of the runways. (in latitude, longitude, and elevation)
                ["N36d4m34.82", "W115d10m16.98", "2179ft"],
                ["N36d4m35.05", "W115d7m15.93", "2033ft"]
            ],
            "ils": [false, true]                        // Whether or not each end of the runway has ILS.
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
    "sids": {                               // (optional) Paths that aircraft follow from the runways to their transitions.
        "COWBY6": {                         // Must match ICAO identifier.
            "icao": "COWBY6",               // ICAO identifier for SID. (NOT the full name - always 2-6 characters)
            "name": "Cowboy Six",           // Full name of SID as it would be said aloud. (this is used by speech synthesis)
            "suffix": {"1L":"", "1R":"", "28L":"", "28R":""},                   // (optional) Suffixes for SID names based on a runway. (ex: '2C' for 'EKERN 2C')
            "rwy": {                        // All runways usable with this SID. Aircraft departing from runways not listed will need to be re-assigned to a different SID.
                "01L": ["_NAPSE068", "NAPSE", ["RIOOS", "A130+"], "COMPS"],     // The value assigned to each runway is an array of fixes. As shown, you can enter altitude or speed
                "01R": ["_NAPSE068", "NAPSE", ["RIOOS", "A130+"], "COMPS"],     // restrictions. ("A19+" means Altitude of 1,900ft or more. The nested brackets are needed if you are
                "07L": ["WASTE", ["BAKRR", "A70"], "COMPS"],                    // using restrictions.) If you use both restrictions (alt. & spd.), they must be separated by a pipe
                "07R": ["JESJI", ["BAKRR", "A70"], "COMPS"],                    // symbol ('|'). (ex: ["FIXNAME", "A50-|S220+"]) ("A50-" = 5,000ft or less, "S220+" = 220kts or more)
                "19L": ["FIXIX", ["ROPPR", "A70"], ["CEASR", "A80+"], ["HITME", "A110+"]],
                "19R": ["JAKER", ["ROPPR", "A70"], ["CEASR", "A80+"], ["HITME", "A110+"]],
                "25L": ["PIRMD", ["ROPPR", "A70"], ["CEASR", "A80+"], ["HITME", "A110+"]],
                "25R": ["RBELL", ["ROPPR", "A70"], ["CEASR", "A80+"], ["HITME", "A110+"]]
            },
            "body": ["COWBY"],                  // (optional) Only used while all segments follow the same path.
            "exitPoints": {                     // Defines exitPoints for a given SID. Common for FAA-style (USA) SIDs.
                "DRK": ["NAVHO", "DRK"],                // Defines the "OFFSH9.SNS" transition as being a single fix, "SNS". It is often a list instead.
                "GUP": [["MOSBI", "A150+"], "GUP"],     // Note: This connects previous sections. (RWY fixes, then BODY fixes, then EXITPOINTS fixes) (ex: SEPDY->ZUPAX->EUGEN->SHOEY->BSR)
                "INW": [["CUTRO", "A150+"], "INW"]
            },
            "draw": [
                ["ROPPR", "CEASR", "HITME", "COWBY", "MOSBI", "GUP*"],
                ["BAKRR", "COMPS", "COWBY", "CUTRO", "INW*"],
                ["_NAPSE068", "NAPSE", "RIOOS", "COMPS"],
                ["COWBY", "NAVHO", "DRK*"]
            ]
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
    "stars": {                              // (optional) STARs are STandard ARrival paths for aircraft to follow.
        "GRNPA1": {
            "icao": "GRNPA1",               // ICAO identifier of the STAR. (NOT the full name, always 2-6 characters)
            "name": "Grandpa One",          // Name of STAR as it would be said aloud. (used by speech synthesis)
            "suffix": {"1L":"", "1R":"", "28L":"", "28R":""},   // (optional) Suffixes for STAR names based on a runway. (ex: '7W' for 'MIKOV 7W')
                                                                // Suffixes are common for European-style STARs. If not needed (like in USA), leave this part out.
            "entryPoints": {                                    // Defines entryPoints for a given SID. Common for FAA-style (USA) SIDs.
                "BETHL": ["BETHL", ["HOLDM", "A270"]],          // Defines the "PYE1.ENI" transition as being a single fix, "ENI". It is often a list instead.
                "BCE": ["BCE"],                                 // Note: This connects previous sections. (ENTRYPOINTS fixes, then BODY fixes, then RWY fixes) (ex: ENI->PYE->STINS->HADLY->SEPDY->ZUPAX)
                "DVC": ["DVC", "BETHL", ["HOLDM", "A270"]],
                "MLF": ["MLF"]
            },
            "body": [                               // (optional) Used only if long series of fixes are used. Only used while all segments follow the same path.
                ["KSINO", "A170"],
                ["LUXOR", "A120|S250"],
                ["GRNPA", "A110"],
                ["DUBLX", "A90"],
                ["FRAWG", "A80|S210"],
                "TRROP",
                "LEMNZ"
            ],
            "rwy": {                                // All runways usable with this STAR. Aircraft arriving to runways not listed will need to be re-assigned to a different STAR or runway.
                "01L": [],                          // The value assigned to each runway is an array of fixes. As shown, you can enter altitude or speed
                "01R": [],                          // restrictions. ("A19+" means Altitude of 1,900ft or more. The nested brackets are needed if you are
                "07L": [],                          // using restrictions.) If you use both restrictions (alt. & spd.), they must be separated by a pipe
                "07R": [],                          // symbol ('|'). (ex: ["FIXNAME", "A50-|S220+"]) ("A50-" = 5,000ft or less, "S220+" = 220kts or more)
                "19L": [],
                "19R": [],
                "25L": [],
                "25R": []
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
            "origin": "KLAS",               // Four-letter ICAO identifier of the origin point/fix. (can be left empty if "destination" is filled)
            "destination": "",              // Four-letter ICAO identifier of the destination point/fix. (can be left empty if "origin" is filled)
            "category": "departure",        // Category of the flights. (arrival or departure)
            "route": "KLAS.COWBY6.GUP",     // Route of the flights. (can use fixes OR SIDs / STARs in this format: origin.SID/STAR_ICAO.destination)
                                            // (ex: "FIX1..FIX2..FIX3" or "KSFO.OFFSH9.SNS")
            "altitude": 0,                  // Altitude of the flights. (in feet)
            "speed": 0                      // Speed of the flights. (in knots)
            "method": "random",             // Method of spawn. See "spawnPatterns Build Process" section in the comments.
            "entrail": [10, 22],                  // (optional) Only used when "method" is "surge".
                                                  // Range of distances between successively spawned aircraft throughout the cycle. [minimum, maximum]
            "rate": 5,                      // Number of flight per hour at normal speed.
            "airlines": [                   // Airlines of the flights spawned.
                ["amx", 2],
                ["aca/long", 4],
                ["asa", 3],
                ["aay", 15]
            ],
        },
        {
            "origin": "",                       // Four-letter ICAO identifier of the origin point/fix. (can be left empty if "destination" is filled)
            "destination": "KLAS",              // Four-letter ICAO identifier of the destination point/fix. (can be left empty if "origin" is filled)
            "category": "arrival",              // Category of the flights. (arrival or departure)
            "route": "BETHL.GRNPA1.KLAS",       // Route of the flights. (can use fixes OR SIDs / STARs in this format: origin.SID/STAR_ICAO.destination)
                                                // (ex: "FIX1..FIX2..FIX3" or "KSFO.OFFSH9.SNS")
            "altitude": [30000, 40000],         // Altitude of the flights. (in feet)
            "speed": 320                        // Speed of the flights. (in knots)
            "method": "random",                 // Method of spawn. See "spawnPatterns Build Process" section in the comments.
            "entrail": [10, 22],                // (optional) Only used when "method" is "surge".
                                                // Range of distances between successively spawned aircraft throughout the cycle. [minimum, maximum]
            "rate": 10,                         // Number of flight per hour at normal speed.
            "airlines": [                       // Airlines of the flights spawned.
                ["aca/long", 4],
                ["aay", 15],
                ["aal", 10]
            ],
        }
    ],
    "maps": {                                   // (optional) Video maps used for extra detail in-game. **
        "base": [
            ["N36d38m01.199", "W114d36m17.219", "N36d36m32.337", "W114d34m19.673"],
            ["N36d36m27.904", "W114d36m12.534", "N36d38m06.271", "W114d34m20.227"],
            ["N35d56m01.371", "W114d51m25.735", "N35d57m09.977", "W114d51m43.334"],
            ["N35d56m42.691", "W114d52m17.075", "N35d56m28.981", "W114d50m51.994"]
        ]
    }
}
```

## Comments

### Property Descriptions

#### Latitude, Longitude, Elevation

For `lat, lon, elev` values, these formats are acceptable:
    [40.94684722, -76.61727778, "866ft"],
    ["N40.94684722", "W76.61727778", "866ft"],
    ["N40d56.811", "W076d37.037", "866ft"],
    ["N40d56m48.65", "W076d37m02.20", "866ft"]

#### ICAO and IATA codes

ICAO codes _must_ be 2-6 characters long, in uppercase letters only.
IATA codes _must_ be 2-3 characters long, in uppercase letters only.

#### `spawnPatterns` Build Process

See [spawnPatternReadme.md](src\assets\scripts\client\trafficGenerator\spawnPatternReadme.md)
