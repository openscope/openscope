## Spawn Patterns
In version 3.3.0 we completely changed how aircraft coming into the system are defined.  We introduced **_Spawn Patterns_**.  Spawn Patterns provide a simple, consistent way to describe aircraft coming into the system.  Spawn Patterns are used for _both_ arrivals and departures.  The shape of the data is exactly the same for both, all keys are expected to be passed all the time.  

Lets look at some examples before we continue:
```javascript
// Departures
{
    "destination": "",
    "origin": "KLAS",
    "category": "departure",
    "route": "KLAS.BOACH6.HEC",
    "altitude": "",
    "method": "random",
    "rate": 5,
    "speed": ""
    "airlines": [
        ["aal", 10],
        ["ual", 10],
        ["ual/long", 3]
    ]
}

// Arrivals
{
    "destination": "KLAS",
    "origin": "",
    "category": "arrival",
    "route": "BETHL.GRNPA1.KLAS",
    "altitude": [30000, 40000],
    "method": "random",
    "rate": 10,
    "speed": 320
    "airlines": [
        ["aal", 10],
        ["ual", 10],
        ["ual/long", 3]
    ]
}
```
## Key descriptions
* _(*) denotes a required field_
* All keys are required to be present and can be left as an empty string when not used by a particular pattern. ex `"destination": ""` for an arrival pattern.

#### airlines*
List of airlines, and their spawn weight. A higher weight will increase the frequency that a particular airline is chosen. Airline selections are random based on weight.
* Should always be a two-dimensional array
* Should always have a shape of either:
  - `[AIRLINE_ID, FREQUENCY_WEIGHT]`
  - `[AIRLINE_ID/AIRLINE_FLEET, FREQUENCY_WEIGHT]`

#### destination (* _for arrivals_)
* destination airport `icao`

#### origin (* _for departures_)
* origin airport `icao`

#### category*
* Should be one of `arrival` or `departure`

#### route*
* Should be in the shape of a routeString.
  - For direct routes: `FIXXA..FIXXB..FIXXC..FIXXD`
  - For complex routes: `FIXXA..FIXXB..ENTRY.PROCEDURE_ID.EXIT`

#### altitude (* _for arrivals_)
Altitude an aircraft spawns at. If a min/max is provided an aircraft will spawn at a random altitude within the range, rounded to the nearest 1,000ft

* Should be a number in MSL altitude.
* Should always have a shape of either:
  - a single number
  - an array of `[MIN_ALTITUDE, MAX_ALTITUDE]`

#### method*
Defines the method used to calculate delay between aircraft spawns.

* Should always be one of: `cyclic, random, surge, wave`

#### rate*
Rate at which aircraft spawn expressed in ACPH (aircraft per hour).

#### speed (* _for arrivals_)
speed an aircraft spawns at expressed in knots
