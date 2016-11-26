## 3.2.0 (December 20, 2016)
---
### Major
* Integrates `sidCollection` and `starCollection` with `RouteModel` within `AircraftInstanceModel` [#53](https://github.com/n8rzz/atc/issues/53)
    - Creates getters for `currentLeg` and `currentWaypoint`
    - Abstracts restrictions logic to live within `Waypoint`
    - Consolidates `runSID()` and `climbViaSid()` logic
- Deprecates `sid` and `star` properties of the `AirportModel` in favor of `sidCollection` and `starCollection` [#54](https://github.com/n8rzz/atc/issues/54)




### Minor
- Implements `modelSourceFactory` and `modelSourcePool` [#77](https://github.com/n8rzz/atc/issues/77)
- Refactors `canvasController.canvas_draw_sids` method to use `airport.sidCollection` instead of `airport.sid` [#144](https://github.com/n8rzz/atc/issues/144)
- Moves properties shared by all `Arrival` types up to `ArrivalBase` [#55](https://github.com/n8rzz/atc/issues/55)
- Removes `$.each()` from `AirportModel` in favor of `_forEach()` and uses `_get()` inside `AircraftModel.parse()` instead of if statements [#52](https://github.com/n8rzz/atc/issues/52)
- Moves creation of Legs and Waypoints to constants instead of as method arguments [#135](https://github.com/n8rzz/atc/issues/135)
- Moves `.parseCoordinate()` out of `PositionModel` and into `unitConverters` [#17](https://github.com/n8rzz/atc/issues/17)
- Moves flight management system files to `FlightManagementSystem` folder [#128](https://github.com/n8rzz/atc/issues/128)
- Adds `RouteModel` to `AircraftInstanceModel.runSTAR` for easier handling of a route string [#163](https://github.com/n8rzz/atc/issues/163)








### Bugfixes
- Moves `_comment` blocks in airport json file to be within object the are describing [#145](https://github.com/n8rzz/atc/issues/145)





## 3.1.0 (November 20, 2016)
---
### Major
- Adds `FixModel` and static class `FixCollection` for reasoning about airport fixes [#18](https://github.com/n8rzz/atc/issues/18)
- Adds `StandardRoute` classes reasoning about SIDs and STARs [#19](https://github.com/n8rzz/atc/issues/19)
- Moves `airlineController` and `aircraftController` to instantiate from within `airportController` instead from `App` [#82](https://github.com/n8rzz/atc/issues/82)
- Enable airport load without bundling and moves `airportLoadList.js` out of the `src` folder [#88](https://github.com/n8rzz/atc/issues/88)
- Updates score calculations and how they are recorded [#96](https://github.com/n8rzz/atc/issues/96)

### Minor
- Correct casing for Arrival and Departure factories [#41](https://github.com/n8rzz/atc/issues/41)
- Rename `AreaModel` to `AirspaceModel` [#36](https://github.com/n8rzz/atc/issues/36)
- Changes `StandardRoute` property name `icao` to `identifier` [#57](https://github.com/n8rzz/atc/issues/57)
- Introduce early exit for airport load when airport data is not complete [#44](https://github.com/n8rzz/atc/issues/44)
- Adds [git-flow](tools/documentation/git-flow-process.md) strategy document [#60](https://github.com/n8rzz/atc/issues/60)
- Adds `BaseModel` [#100](https://github.com/n8rzz/atc/issues/100)
- Adds `BaseCollection` [#101](https://github.com/n8rzz/atc/issues/101)

### Bugfixes
- WMKK has misnamed star name [#45](https://github.com/n8rzz/atc/issues/45)
- Updates spelling in `.convertMinutesToSeconds[)` [#58](https://github.com/n8rzz/atc/issues/58)
- Future aircraft path, when on ILS, wrong width [#75](https://github.com/n8rzz/atc/issues/75)
- `areas` is undefined in `AirportModel` [#90](https://github.com/n8rzz/atc/issues/90)
- `FixCollection.init()` does not clear current `_items` if any exist [#91](https://github.com/n8rzz/atc/issues/91)
- Aircraft strips show arrival airport in uppercase [#108](https://github.com/n8rzz/atc/issues/108)
- Updates `FixCollection.findFixByName()` to accept upper, mixed, or lower case fix name [#109](https://github.com/n8rzz/atc/issues/109)
- Switching to a previously loaded airport does not clear previous airport fixes [#115](https://github.com/n8rzz/atc/issues/115)
