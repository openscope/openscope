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
    "twr": "callsign of the facility providing tower services",                // The callsign of the airport control tower.
    "app": "callsign of the facility providing approach control services",     // The callsign of the airport approach.
    "dep": "callsign of the facility providing departure control services"     // The callsign of the airport departure.
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
  "wind": {                                 // (optional) Wind is used for score. // It can affect an aircraft's ground tracks if enabled in settings.
    "angle": 0,                             // (optional) Wind direction. (in degrees)
    "speed": 3                              // (optional) Wind speed. (in knots)
  },
  "fixes": {                                // Locations on the map that aircraft use to travel in and out of the map. These should be sorted alphabetically for readability.
    "FIXNAME", ["lat", "lon"],              // The name and position of the fix. (in latitude and longitude)
    "FIXNAME2", ["lat", "lon"]              // You can add as many as you like.
  },
  "runways": [
    {
      "name": ["36", "18"],                 // Name of the runways.
      "name_offset": [[0, 0], [0, 0]],      // (optional) The offset of the runway label. (in km) If there is no offset, this should be omitted.
      "end": [                              // The ends of the runways. (in latitude, longitude, and elevation)
            ["lat", "lon", "elevation"],
            ["lat", "lon", "elevation"]
      ],
      "ils": [true, true]                   // Whether or not each end of the runway has ILS.
    }
  ],
  "sids": {                                 // (optional) Paths that aircraft follow from the runways to their transitions.
    "OFFSH9": {                             // Must match ICAO identifier.
      "icao": "OFFSH9",                     // ICAO identifier for SID. (NOT the full name - always 2-6 characters)
      "name": "Offshore Nine",              // Full name of SID as it would be said aloud. (this is used by speech synthesis)
      "suffix": {"1L":"", "1R":"", "28L":"", "28R":""}, // (optional) Suffixes for SID names based on a runway. (ex: '2C' for 'EKERN 2C')
                                                        // Suffixes are common for European-style SIDs. If not needed (like in USA), leave this part out.
      "rwy": {                                          // All runways usable with this SID. Aircraft departing from runways not listed will need to be re-assigned to a different SID.
          "1L" : [["SEPDY", "A19+"], "ZUPAX"],          // The value assigned to each runway is an array of fixes. As shown, you can enter altitude or speed
          "1R" : [["SEPDY", "A19+"], "ZUPAX"],          // restrictions. ("A19+" means Altitude of 1,900ft or more. The nested brackets are needed if you are
          "28L": [["SENZY", "A25+"], "ZUPAX"],          // using restrictions.) If you use both restrictions (alt. & spd.), they must be separated by a pipe
          "28R": [["SENZY", "A25+"], "ZUPAX"]           // symbol ('|'). (ex: ["FIXNAME", "A50-|S220+"]) ("A50-" = 5,000ft or less, "S220+" = 220kts or more)
      },
      "body": ["EUGEN", "SHOEY"],           // (optional) Only used while all segments follow the same path.
      "exitPoints": {                       // Defines exitPoints for a given SID. Common for FAA-style (USA) SIDs.
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
  "stars": {                                // (optional) STARs are STandard ARrival paths for aircraft to follow.
    "PYE1" : {
      "icao": "PYE1",                       // ICAO identifier of the STAR. (NOT the full name, always 2-6 characters)
      "name": "Point Reyes One",            // Name of STAR as it would be said aloud. (used by speech synthesis)
      "suffix": {"1L":"", "1R":"", "28L":"", "28R":""},   // (optional) Suffixes for STAR names based on a runway. (ex: '7W' for 'MIKOV 7W')
                                                          // Suffixes are common for European-style STARs. If not needed (like in USA), leave this part out.
      "entryPoints": {                      // Defines entryPoints for a given SID. Common for FAA-style (USA) SIDs.
          "ENI": ["ENI"],                   // Defines the "PYE1.ENI" transition as being a single fix, "ENI". It is often a list instead.
          "MXW": ["MXW"]                    // Note: This connects previous sections. (ENTRYPOINTS fixes, then BODY fixes, then RWY fixes) (ex: ENI->PYE->STINS->HADLY->SEPDY->ZUPAX)
      },
      "body": ["PYE", ["STINS", "A230|S250"], "HADLY"], // (optional) Used only if long series of fixes are used. Only used while all segments follow the same path.
      "rwy": {                                          // All runways usable with this STAR. Aircraft arriving to runways not listed will need to be re-assigned to a different STAR or runway.
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
      "destination": "",                    // Four-letter ICAO identifier of the destination point/fix. (can be left empty if "origin" is filled)
      "category": "departure",              // Category of the flights. (arrival or departure)
      "route": "ABBEY..MUSEL..TAMAR..TD",   // Route of the flights. (can use fixes OR SIDs / STARs in this format: origin.SID/STAR_ICAO.destination)
                                            // (ex: "FIX1..FIX2..FIX3" or "KSFO.OFFSH9.SNS")
      "altitude": 10000,                    // Altitude of the flights. (in feet)
      "speed": 250,                         // Speed of the flights. (in knots)
      "method": "random",                   // Method of spawn. See "spawnPatterns Build Process" section in the comments.
      "entrail": [10, 22],                  // (optional) Only used when "method" is "surge".
                                            // Range of distances between successively spawned aircraft throughout the cycle. [minimum, maximum]
      "rate": 15,                           // Number of flight per hour at normal speed.
      "airlines":  [                        // Airlines of the flights spawned.
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
  {
      "origin": "",                         // Four-letter ICAO identifier of the origin point/fix. (can be left empty if "destination" is filled)
      "destination": "KSFO",                // Four-letter ICAO identifier of the destination point/fix. (can be left empty if "origin" is filled)
      "category": "arrival",                // Category of the flights. (arrival or departure)
      "route": "TD..TAMAR..MUSEL..ABBEY",   // Route of the flights. (can use fixes OR SIDs / STARs in this format: ("FIX1..FIX2..FIX3" or "SNS.OFFSH9.KSFO"))
      "altitude": 10000,                    // Altitude of the flights. (in feet)
      "speed": 250,                         // Speed of the flights. (in knots)
      "method": "random",                   // Method of spawn. See "spawnPatterns Build Process" section in the comments.
      "entrail": [10, 22],                  // (optional) Only used when "method" is "surge".
                                            // Range of distances between successively spawned aircraft throughout the cycle. [minimum, maximum]
      "rate": 15,                           // Number of flight per hour at normal speed.
      "airlines":  [                        // Airlines of the flights spawned.
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

### Property Descriptions

`callsign`: A name used to identify a tower or aircraft. (ex: "Delta 5634", "San Francisco Tower")
`has_terrain`: A true/false property set based on whether or not the airport has a GeoJSON file associated with it.


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
