# Airline format

Airlines specify a name, radio call sign, flight number generation
parameters and one or more fleets of aircraft.

## Example

This specifies the airline Air Canada with a default fleet, a
long haul and a short haul fleet.

```json
{
    "icao": "aca",
    "name": "Air Canada",
    "callsign": {
        "name": "Air Canada",
        "callsignFormats": [
            "####",
            "###",
            "##"
        ]
    },
    "fleets": {
        "default": [
            ["A319", 18],
            ["A320", 42],
            ["A321", 15],
            ["A333", 8],
            ["B38M", 15],
            ["B763", 8],
            ["B77L", 6],
            ["B77W", 19],
            ["B788", 8],
            ["B789", 27],
            ["E190", 25]
        ],
        "long": [
            ["A333", 8],
            ["B763", 8],
            ["B77L", 6],
            ["B77W", 19],
            ["B788", 8],
            ["B789", 27]
        ],
        "short": [
            ["A319", 18],
            ["A320", 42],
            ["A321", 15],
            ["B38M", 15],
            ["E190", 25]
        ]
    }
}
```

## Fleets

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

```json
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

## Other options

### Name

The common name for the airline

Example: `"name": "American Airlines"`

### Callsign

Specifies the radio identifier and the composition of the alphanumerical callsign.

Example:

```json
"icao": "baw",
...
"callsign": {
    "name": "Speedbird",
    "callsignFormats": [
        "####",
        "###@",
        "#@@",
        ...
    ]
...
}
```

With each `#` indicating a random number and each `@` indicating a random letter.

- `####` will give give you a callsign with 4 random numbers: `BAW3845` `BAW6544` `BAW1028`
- `###@` will give give you a callsign with 3 random numbers and one random letter at the end: `BAW384H` `BAW654X` `BAW102M`
- `#@@` will give give you a callsign with 1 random number and two random letters at the end: `BAW3AH` `BAW6YX` `BAW1WM`

### ICAO (optional)

The 3 letter ICAO designator for the airline.

Example: `"icao": "ACA"`
