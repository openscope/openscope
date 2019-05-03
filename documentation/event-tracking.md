# Openscope Event Tracking

* Openscope uses [Google Analytics](https://analytics.google.com/analytics/web/) for basic site analytics
* Openscope tracks app usage using custom events

We do this so we can gain a better understanding of how the app is _actually_ being used.  We are a team of volunteers and, as such, our time is limited.  We want to be sure the things we work on are things that are used by our users.

## Events

_For reference, the `EventTracker` class is responsible for interfacing with Google Analytics_

GA expects custom events in the following format:

```text
Category: "Videos"
Action: "Play"
Label: "Baby's First Birthday"
Value: (optional)
```

_see: [GA Events Developer Guide](https://developers.google.com/analytics/devguides/collection/analyticsjs/events)_

## Event Tracking

The following is a list of Events we are tracking written in a pseudo-code shorthand that works out to:

```text
category -> action -> label? -> value?
```

### Airports

This whole app is built on airports.  We want to know which airports are popular and which ones are not.

```text
airports -> initial-load
airports -> airport-switcher -> open
airports -> airport-switcher -> `${airport}`
airports -> airport-switcher -> close
```

### Options

These map to the options toggles at the foot of the scope.  The `v` here indicates a boolean value for the current state of the option (on/off).

```text
options -> fix-runway-labels -> toggle -> v
options -> sids -> toggle -> v
options -> starts -> toggle -> v
options -> terrain -> toggle -> v
options -> restricted -> toggle -> v
options -> tutorial -> toggle -> v
options -> video-map -> toggle -> v
options -> timewarp -> v
options -> timewarp-manual-entry -> v
options -> pause -> v
options -> speech -> v
options -> traffic -> v
options -> tutorial -> v
```

### Traffic

We support changing spawn pattern rates by category (arrival, departure, overflight) or by individual pattern.

```text
change-spawn-pattern -> flight-category -> ${AIRPORT_ICAO}:{CATEGORY}:{NEXT_VALUE}
change-spawn-pattern -> spawn-pattern -> ${AIRPORT_ICAO}:{ROUTE_STRING}:{PREVIOUS_VALUE}:{NEXT_VALUE}
```

### Tutorial

This is how new users start out, we want to make sure this is getting used and it's valuable.  The `v` here indicates the tutorial step (index) a user has moved to with each event action explaining the direction.

```text
tutorial -> next -> v
tutorial -> prev -> v
```

### Settings

We have some legacy settings options here.  Do any of them every get used?

```text
settings -> toggle
settings -> `${option}` -> v
```

### Ui-Log

Sometimes a user sends the wrong command(s) to aircraft.  Sometimes many users send the same wrong command.

```text
ui-log -> error -> ${error}
```
