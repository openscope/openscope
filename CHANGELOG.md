## 4.1.0 (January 20, 2017)
---
### Major









### Minor









### Bugfixes
- Updates `entryPoint` and `exitPoint` to be pluralized as is the airport json standard [#177](https://github.com/openscope/openscope/issues/177)
- Adds `entryPoints` to `gcrr` star route definitions [#175](https://github.com/openscope/openscope/issues/175)
- Fixes arrival pattern that was using an array of fix names instead of a routeString. [#174](https://github.com/openscope/openscope/issues/174)
- Updates `wmkk` StandardRoute definition to include at least one fixname [#173](https://github.com/openscope/openscope/issues/173)










## 4.0.0 (January 26, 2017)
---
### Major
- Restructures `src` files into `client` and `server` folders. [#220](https://github.com/n8rzz/atc/issues/220)
- Updates Node to version 7.0.0 [#184](https://github.com/n8rzz/atc/issues/184)
- Moves aircraft command logic from `AircraftInstanceModel` to new `AircraftCommander` class [#181](https://github.com/n8rzz/atc/issues/181)
- Adds `spawnPatterns` to airport json and vastly simplifies aircraft creation. Work on this issue ended up resolving many other smaller issues listed below. [#243](https://github.com/n8rzz/atc/issues/243)
  - Restructure `Airport.departures` to utilize routes [#229](https://github.com/n8rzz/atc/issues/229)
  - Abstract inline fix object out of ArrivalBase [#56](https://github.com/n8rzz/atc/issues/56)
  - Simplify creation of arrival aircraft [#27](https://github.com/n8rzz/atc/issues/27)
  - Include airline id in airline json [#242](https://github.com/n8rzz/atc/issues/242)
  - Create SpawnCollection, SpawnModel and SpawnScheduler classes [#235](https://github.com/n8rzz/atc/issues/235)
  - Circular reference in airportModel.departures.airport [#28](https://github.com/n8rzz/atc/issues/28)
  - Circular reference in airportModel.departures.airport [#28](https://github.com/n8rzz/atc/issues/28)

### Minor
- Changes `AircraftStripView` text outputs to be all uppercase [#193](https://github.com/n8rzz/atc/issues/193)
- Ensures proper removal of all `AircraftConflict` instances involving an aircraft that has been removed from the simulation [#133](https://github.com/n8rzz/atc/issues/133)
    - Originally reported under [zlsa#734](https://github.com/zlsa/atc/issues/734)
- Changes the names from having the flags in their name by adding WIP variable to the `AIRPORT_LOAD_LIST` in `airportLoadList` [#205](https://github.com/n8rzz/atc/issues/205)
- Fixes white space in that is displayed from the `AircraftInstanceModel` [#192](https://github.com/n8rzz/atc/issues/192)
- Adds cache to travis build [#233](https://github.com/n8rzz/atc/issues/233)

### Bugfixes
- Resets current indicies when issuing a new star to an arriving aircraft [#104](https://github.com/n8rzz/atc/issues/104) & [#237](https://github.com/n8rzz/atc/issues/237)
    - Originally reported under [zlsa#730](https://github.com/zlsa/atc/issues/730) & [zlsa#768](https://github.com/zlsa/atc/issues/768)


## 3.2.1 (January 2, 2017)
---
### Bugfixes
- Restores behavior of aircraft flying present heading after completing all legs in their flightplan [#206](https://github.com/n8rzz/atc/issues/206)
    - Originally reported in [zlsa#767](https://github.com/zlsa/atc/issues/767)
- Fix wrongful removal of departures from runway queues when arrivals land [#241](https://github.com/n8rzz/atc/issues/241)
    - Originally reported in [zlsa#770](https://github.com/zlsa/atc/issues/770)
- Fix erroneous voice readbacks for altitude command [#240](https://github.com/n8rzz/atc/issues/240)
    - Originally reported in [zlsa#769](https://github.com/zlsa/atc/issues/769)
- Fixes behavior of AircraftConflict in various ways, particularly with removal after deletion of aircraft [#133](https://github.com/n8rzz/atc/issues/133)
    - Originally reported in [zlsa#734](https://github.com/zlsa/atc/issues/734)


## 3.2.0 (December 20, 2016)
---
### Major
* Integrates `sidCollection` and `starCollection` with `RouteModel` within `AircraftInstanceModel` [#53](https://github.com/n8rzz/atc/issues/53)
    - Creates getters for `currentLeg` and `currentWaypoint`
    - Abstracts restrictions logic to live within `Waypoint`
    - Consolidates `runSID()` and `climbViaSid()` logic
- Deprecates `sid` and `star` properties of the `AirportModel` in favor of `sidCollection` and `starCollection` [#54](https://github.com/n8rzz/atc/issues/54)
- Adds [Express](expressjs.com) server to serve static assets and add [travis](travis-ci.org) config file for travis continuous integration [#169](https://github.com/n8rzz/atc/issues/169)
- Rewrites the CommandParser from the ground up [#114](https://github.com/n8rzz/atc/issues/114)
- Removes `Pegjs` and references completing switch to new CommandParser [#216](https://github.com/n8rzz/atc/issues/216)

### Minor
- Implements `modelSourceFactory` and `modelSourcePool` [#77](https://github.com/n8rzz/atc/issues/77)
- Refactors `canvasController.canvas_draw_sids` method to use `airport.sidCollection` instead of `airport.sid` [#144](https://github.com/n8rzz/atc/issues/144)
- Moves properties shared by all `Arrival` types up to `ArrivalBase` [#55](https://github.com/n8rzz/atc/issues/55)
- Removes `$.each()` from `AirportModel` in favor of `_forEach()` and uses `_get()` inside `AircraftModel.parse()` instead of if statements [#52](https://github.com/n8rzz/atc/issues/52)
- Moves creation of Legs and Waypoints to constants instead of as method arguments [#135](https://github.com/n8rzz/atc/issues/135)
- Moves `.parseCoordinate()` out of `PositionModel` and into `unitConverters` [#17](https://github.com/n8rzz/atc/issues/17)
- Moves flight management system files to `FlightManagementSystem` folder [#128](https://github.com/n8rzz/atc/issues/128)
- Adds `RouteModel` to `AircraftInstanceModel.runSTAR` for easier handling of a route string [#163](https://github.com/n8rzz/atc/issues/163)
- Adds static `calculatePosition` method to `PositionModel` and abstracts common functions [#159](https://github.com/n8rzz/atc/issues/159)
- Replaces active airport icao in view with a zulu time clock [#135](https://github.com/n8rzz/atc/issues/135)
- Consolidates test fixtures in fixtures directory [#167](https://github.com/n8rzz/atc/issues/167)
* Addresses issue with video maps being drawn incorrectly. [#176](https://github.com/n8rzz/atc/issues/176)
    - Updates `PositionModel` to run all calculations through the static `.calculatePosition()` method and vastly simplifies internal logic.
- Refactors the the function names in `FixCollection` to better fit their function. `init()` to `addItems()` and `destroy()` to `removeItems()` [#186] (https://github.com/n8rzz/atc/issues/186)
- Adds gulp-cli and adds [tools readme](tools/README.md) link to gulp issues with Windows [#194](https://github.com/n8rzz/atc/issues/194)
- Changes `routeString` to `routeCode` in `RouteModel` and moves `.toUpperCase()` from the getter to `.init()` [#188] (https://github.com/n8rzz/atc/issues/188)
- Updates `StandardRouteModel` to throw when entry/exit point doesn't exist within a collection and updates `.setDepartureRunway()` to send the `routeCode` to `Leg` on instantiation [#175](https://github.com/n8rzz/atc/issues/175)
- Prevents collision detection for aircraft that are outside of our airspace [#134](https://github.com/n8rzz/atc/issues/134)
    - Originally reported under [#736](https://github.com/zlsa/atc/issues/736)
- Escape clears commands but not callsign if commands are present [#211] (https://github.com/n8rzz/atc/issues/211)
    - Originally reported under [#763](https://github.com/zlsa/atc/issues/763)

### Bugfixes
- Moves `_comment` blocks in airport json file to be within object the are describing [#145](https://github.com/n8rzz/atc/issues/145)
- Streamlines flight number generation and adds new method to add new callsigns to the existing list [#151](https://github.com/n8rzz/atc/issues/151)
- Adds `_isNumber` check instead of `!magneticNorth` inside `PositionModel.calculatePosition()` and the `AirspaceModel` constructor. [#182](https://github.com/n8rzz/atc/issues/182)
    - Originally reported under [#754](https://github.com/zlsa/atc/issues/754)
- Adds additional handling to `StandardRouteModel._buildEntryAndExitCollections` to handle case where `entryPoints` and `exitPoints` don't exist in the `airport.sids` definition [#196](https://github.com/n8rzz/atc/issues/196)
    - Originally reported under [#760](https://github.com/zlsa/atc/issues/760)
- Ensures proper removal of aircraft from the runway queue(s) when that aircraft has been deleted. [#132](https://github.com/n8rzz/atc/issues/132)
    - Originally reported under [#706](https://github.com/zlsa/atc/issues/706)


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
- Fixes `parseElevation()` so that it does not return NaN when it is given the string `'Infinity'` [#191] (https://github.com/n8rzz/atc/issues/191)
    - Originally reported under [#756](https://github.com/zlsa/atc/issues/756)
