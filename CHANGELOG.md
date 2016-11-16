## v3.1.0 (2016/11/19)
---
### Major
- Adds `FixModel` and static class `FixCollection` for reasoning about airport fixes (#18)
- Adds `StandardRoute` classes reasoning about SIDs and STARs (#19)
- Moves `airlineController` and `aircraftController` to instantiate from within `airportController` instead from `App` (#82)
- Enable airport load without bundling (#88)

### Minor
- Correct casing for Arrival and Departure factories (#41)
- Rename `AreaModel` to `AirspaceModel` (#36)
- Changes `StandardRoute` property name `icao` to `identifier` (#57)
- Introduce early exit for airport load when airport data is not complete (#44)
- Adds [git-flow](tools/documentation/git-flow-process.md) strategy document (#60)

### Bugfixes
- WMKK has misnamed star name (#45)
- Updates spelling in `.convertMinutesToSeconds()` (#58)
- Future aircraft path, when on ILS, wrong width (#75)
- `areas` is undefined in `AirportModel` (#90)
- `FixCollection.init()` does not clear current `_items` if any exist (#91)
