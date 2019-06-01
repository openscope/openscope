# Spawn Patterns

As of version 3.3.0, we define how aircraft come into the system using **Spawn Patterns**.  Spawn Patterns define how, how many, and what sorts of aircraft will spawn (appear) along a specifc route.  Spawn Patterns are used for _both_ arrivals and departures.  The shape of the data is exactly the same for both, all keys are expected to be passed all the time.

Lets look at some examples before we continue:

```json
// Departures
{
     "origin": "KLAS",
     "destination": "",
     "category": "departure",
     "route": "KLAS.BOACH6.HEC",
     "altitude": "",
     "speed": "",
     "method": "random",
     "rate": 5,
     "airlines": [
         ["aal", 10],
         ["ual", 10],
         ["ual/long", 3]
     ]
 }

// Arrivals
{
    "origin": "",
    "destination": "KLAS",
    "category": "arrival",
    "route": "BETHL.GRNPA1.KLAS",
    "altitude": [30000, 40000],
    "speed": 320,
    "method": "cyclic",
    "rate": 17.5,
    "period": 75,
    "offset": 25,
    "airlines": [
        ["aal", 10],
        ["ual", 10],
        ["ual/long", 3]
    ]
}

// Overflights
{
    "origin": "",
    "destination": "",
    "category": "overflight",
    "route": "DAG.V21.MLF",
    "altitude": 9000,
    "speed": 320,
    "method": "random",
    "rate": 8,
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

### airlines*

List of airlines, and their spawn weight. A higher weight will increase the frequency that a particular airline is chosen. Airline selections are random based on weight. Typically, you should use the approximate number of flights that airline would have on that route in a given day.

* Should always be a two-dimensional array
* Should always have a shape of either:
  * `[AIRLINE_ID, FREQUENCY_WEIGHT]`
  * `[AIRLINE_ID/AIRLINE_FLEET, FREQUENCY_WEIGHT]`

### origin (* _for departures only_)

* ICAO identifier of the origin airport

### destination (* _for arrivals only_)

* ICAO identifier of the destination airport

### category*

* Must be `arrival`, `departure`, or `overflight`.

### route*

* Should be in the shape of a routeString.
  * For direct routes: `FIXXA..FIXXB..FIXXC..FIXXD`
  * For complex routes: `FIXXA..FIXXB..ENTRY.PROCEDURE_ID.EXIT`
  * Prepend a fix name with `@` to _hold_ at that fix `FIXXA..@FIXXB..FIXXC`
  * Prepend a three digit heading with `#` to _fly that heading until given further instructions_

### altitude (* _for arrivals and overflights_)

Altitude an aircraft spawns at. If a min/max is provided an aircraft will spawn at a random altitude within the range, rounded to the nearest 1,000ft. This should be a _number_ (eg. `18000`), _not a string_ (eg `"18000"`).

* Should be a number in MSL altitude.
* Should always have a shape of either:
  * a single number
  * an array of `[MIN_ALTITUDE, MAX_ALTITUDE]`

### speed (* _for arrivals_)

Speed an aircraft spawns at, expressed in knots of indicated airspeed. This should be a _number_ (eg. `320`), _not a string_ (eg `"320"`).

### method*

Defines the method used to calculate delay between aircraft spawns.

* Should always be one of: `cyclic, random, surge, wave`

*See [spawnPatternMethodReadme.md](spawnPatternMethodReadme.md) for more information*

### rate*

Rate at which aircraft spawn expressed in ACPH (aircraft per hour). This should be a _number_ (eg. `15`), _not a string_ (eg `"15"`).
