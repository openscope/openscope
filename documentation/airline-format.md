---
title: Airline Format
---
[back to index](index.html)

## Airline format

Airlines specify a name, radio call sign, flight number generation
parameters and one or more fleets of aircraft.

###  Example

This specifies the airline Air Canada with a default fleet and a
long haul fleet.

```
{
  "icao": "ACA",
  "name": "Air Canada",
  "callsign": {
    "name": "Air Canada",
    "length": 3,
    "alpha": false
  },
  "fleets": {
    "default": [
      ["A319", 5],
      ["A320", 1]
    ],
    "long": [
      ["B763", 5],
      ["B772", 1]
    ]
  }
}
```

### Fleets

Fleets are used to select from a subset of aircraft which could fly
under a given operator's name.  They were introduced to handle airports
which a given operator only flies long haul flights to.  To choose a
particular fleet in an airport add a slash and the fleet name to the
airline code: `ACA/long`.

A default fleet must be defined, this should generally contain all the
aircraft which the operator would fly.

For more fine grained selection the fleet names 'long', 'medium', and 'short'
are suggested.  They refer to long haul, medium haul, and short haul
flights respectively.  Fleet names can be any arbitrary string.

The list of aircraft in a fleet are weighted relative to each other.
An easy weighting to use is the simple count of aircraft in the
operator's fleet.

Example:
```
...
"fleets": {
  "default": [
    ["A319", 20],
    ["A320", 40],
    ["A388", 5]
  ],
  "long": [
    ["A388", 5]
  ]
}
```

The above specifies a default fleet where an A320 is twice as likely
to appear as a A319 and eight times as likely as an A388.  A long
haul fleet is specified which will always spawn an A388.

### Other options

#### Name

The common name for the airline

Example: `"name": "American Airlines"`

#### Callsign

Specifies the radio identifier and length of the flight number.  If
alpha is specified and true the last two characters in the flight
number will be letters.

Example:
```
"callsign": {
  "name": "Speedbird",
  "length": 3
}
```

Generates flight numbers like 123 or 838.  Will refer to the aircraft
as "Speedbird 123" over the radio.

#### ICAO (optional)

The 3 letter ICAO designator for the airline.

Example: `"icao": "ACA"`
