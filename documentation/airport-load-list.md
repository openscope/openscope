# Airport Load List

[airportLoadList.json](https://github.com/openscope/openscope/blob/develop/assets/airports/airportLoadList.json) contains the list of airports to be loaded by the app, in alphabetical order of their ICAO airport identifier.

If you are adding a new airport to the game, be sure to include:

- the [airport JSON file](https://github.com/openscope/openscope/blob/develop/documentation/airport-format.md) in `assets/airports/AIRPORT_NAME.json` where `AIRPORT_NAME` is the lowercase ICAO airport identifier. (ex: KSFO would be `assets/airports/ksfo.json`)
- the terrain geojson file (if one exists) in `assets/airports/terrain/AIRPORT_NAME.geojson` where `AIRPORT_NAME` is the lowercase ICAO airport identifier. (ex: KSFO would be `assets/airports/terrain/ksfo.geojson`)

Then, add a new data block (in alphabetical order) to  [airportLoadList.json](https://github.com/openscope/openscope/blob/develop/assets/airports/airportLoadList.json) in the shape of:

```
{
  "icao": "{AIRPORT_ICAO}",
  "level": "{AIRPORT_DIFFICULTY}",
  "name": "{AIRPORT_NAME}",
  "premium": {MEETS_PREMIUM_STANDARDS}
}
```

- `AIRPORT_ICAO` is the ICAO airport identifier in lowercase (ex: ksfo)
- `AIRPORT_DIFFICULTY` is the difficulty level based on the traffic volume (in Aircraft per Hour):
   |   Level  |     Traffic Volume     |
   |:--------:|:----------------------:|
   | beginner |    Less than 20 AcpH   |
   |   easy   | Between 20 and 40 AcpH |
   |  medium  | Between 40 and 60 AcpH |
   |   hard   |    More than 60 AcpH   |

- `AIRPORT_NAME` is the official English name of the airport, according to Jeppesen charts  
  - for example, KSFO = "San Francisco International Airport"
- `MEETS_PREMIUM_STANDARDS` is either `true` or `false`, see the airport standards document
