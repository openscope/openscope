## 5.6.0 (November 1, 2017)
---
### New Features



### Bugfixes



### Enhancements & Refactors



## 5.5.0 (October 1, 2017)
---
### New Features
- Add `sa`, `saa`, `sh`, `sah`, `ss`, `sas` commands [#641](https://github.com/openscope/openscope/issues/641)
- Add toggleable scope command bar, and lays foundation for the Scope, its commands, and its collections of radar targets. [#14](https://github.com/openscope/openscope/issues/14)
- Checks if the airport in localStorage exists before loading it [#709](https://github.com/openscope/openscope/issues/709)
- The mouse button to drag the radar screen is now right click [#564](https://github.com/openscope/openscope/issues/564)
- Adds Ted Stevens Anchorage Intl. (PANC) [#637](https://github.com/openscope/openscope/issues/637)

### Bugfixes
- Fix SID Names at MDSD following the screen centre [#683](https://github.com/openscope/openscope/issues/683)
- Fix the command bar displaying a '?' when the up or down arrow is pressed [#685](https://github.com/openscope/openscope/issues/685)
- Extends departing spawnPatterns outside the airspace at KSDF to prevent point deduction [#699](https://github.com/openscope/openscope/issues/699)
- Adds `footer` section to `index.html` and combines former partials `controls` and `score` with the `#command` input [#704](https://github.com/openscope/openscope/issues/704)
    - updates styles to use flexbox with properly organized children
- Clear radar target collection when changing airports [#728](https://github.com/openscope/openscope/issues/728)
- Ensure radar targets are removed when aircraft model is deleted [#732](https://github.com/openscope/openscope/issues/732)
- Ensure game options initialize to correct default values [#711](https://github.com/openscope/openscope/issues/711)
- Remove call to `AirportController.hasAirport()` in `index.js` [#741](https://github.com/openscope/openscope/issues/741)
- Changes background-color of settings option selects to transparent [#740](https://github.com/openscope/openscope/issues/740)
- Updates param passed to RadarTargetCollection from within AircraftController.aircraft_remove()[#743](https://github.com/openscope/openscope/issues/743)
- Ensure failure message responses are shown in red [#742](https://github.com/openscope/openscope/issues/742)

### Enhancements & Refactors
- Modifies `StripView` background-color to use rgba instead of hex to allow for a semi-transparent background [#679](https://github.com/openscope/openscope/issues/679)
- Adds Eric Meyer CSS Reset and updates existing CSS to work without `*` reset [#657](https://github.com/openscope/openscope/issues/657)
- Stops `console.warn()` spam every frame if terrain is less than zero [#695](https://github.com/openscope/openscope/issues/695)
- Adds `localStorage.setItem()` to `GameOptions.setOptionByName()` and adds test file for `GameOptions` [#670](https://github.com/openscope/openscope/issues/670)
- Update airport format document with new properties and requirements [#452](https://github.com/openscope/openscope/issues/452)
- Update developer documentation regarding git strategy [#614](https://github.com/openscope/openscope/issues/614)
- Execute scope command by clicking radar target [#717](https://github.com/openscope/openscope/issues/717)
- Adds `TimeKeeper` singleton and moves `App.incrementFrame()` logic to this new class [#296](https://github.com/openscope/openscope/issues/296)
- Removed the `version` command [#721](https://github.com/openscope/openscope/issues/721)
- Updates Shannon (EINN) - Updated all procedures, added video map and terrain, updated traffic [#527](https://github.com/openscope/openscope/issues/527)
- Makes first pass at `CanvasController` refactor [#707](https://github.com/openscope/openscope/issues/707)
    - adds `TimeKeeper` singleton to make time tracking easier to manage
    - moves logic to update properties of the `CanvasController` to live within the `CanvasController` and happen via triggered events
    - sets the stage for next round of `CanvasController` updates by adding `CANVAS_NAME` enum to be used when creating canvas elements
- Add airport guide files and start ksea as an example [#29](https://github.com/openscope/openscope/issues/29)
- Ensure tutorial selects departure aircraft [#354](https://github.com/openscope/openscope/issues/354)
- Add documentation and tutorial section for scope commands [#718](https://github.com/openscope/openscope/issues/718)
- Update UI green colors to match default blue theme [#630](https://github.com/openscope/openscope/issues/630)
- Checks if an aircraft can reach assigned altitude/speed [#326](https://github.com/openscope/openscope/issues/326)


## 5.4.1 (September 2, 2017)
---
### Hotfix
- Fix WIP airports which fail to load due to improper procedure formatting [#327](https://github.com/openscope/openscope/issues/327)


## 5.4.0 (September 1, 2017)
---
### New Features
- New Airport: KABQ (Albuquerque International Sunport, NM) [#327](https://github.com/openscope/openscope/issues/327)
- Add Hartsfield–Jackson Atlanta Intl. (KATL) [#541](https://github.com/openscope/openscope/issues/541)
- Add Louisville Intl. (KSDF) [#557](https://github.com/openscope/openscope/issues/557)
- New Airport: KELP (El Paso International Airport, TX) [#331](https://github.com/openscope/openscope/issues/331)
- New Airport: KSTL (St. Louis Lambert International Airport, MO) [#349](https://github.com/openscope/openscope/issues/349)
- New Airport: KTUS (Tuscon International Airport, AZ) [#555](https://github.com/openscope/openscope/issues/555)
- New Airport: KJAX (Jacksonville International Airport, FL) [#624](https://github.com/openscope/openscope/issues/624)

### Bugfixes
- Fix VNAV descents on STARs with only "at/above" and "at/below" restrictions [#618](https://github.com/openscope/openscope/issues/618)
- Updates order of elements in the StripViewTemplate so the FlightRules element is properly floated to the right [#664](https://github.com/openscope/openscope/issues/664)
- Fix misalignment in airport selection dialog [#659](https://github.com/openscope/openscope/issues/659)

### Enhancements & Refactors
- Removed index.html as it is generated from templates when run [#619](https://github.com/openscope/openscope/issues/619)
- Implements new loading screen with new color scheme and animated radar sweep [#619](https://github.com/openscope/openscope/issues/619)
- Extends departing spawnPatterns outside the airspace at EIDW to prevent point deduction [#566](https://github.com/openscope/openscope/issues/566)
- Extends departing spawnPatterns outside the airspace at MDSD to prevent point deduction [#615](https://github.com/openscope/openscope/issues/615)
- Extends departing spawnPatterns outside the airspace at KBOS to prevent point deduction [#635](https://github.com/openscope/openscope/issues/635)
- Implement scope themes, and changed default theme to blue-based [#15](https://github.com/openscope/openscope/issues/15)
- Deactivate unused WIP airports from the load list, and add premium flag [#431](https://github.com/openscope/openscope/issues/431)
- Document airport terrain generation process [#7](https://github.com/openscope/openscope/issues/7)
- Remove index.html from document root in tools/README.md [#653](https://github.com/openscope/openscope/issues/653)
- Deprecate the `say route` command [#640](https://github.com/openscope/openscope/issues/640)
- Adds LESS preprocessor and adds CSS folder structure [#481](https://github.com/openscope/openscope/issues/481)
- Deprecated `abort` command [#639](https://github.com/openscope/openscope/issues/639)
- Renamed `index.md` to `commands.md` and added system commands and a TOC [#365](https://github.com/openscope/openscope/issues/365)
- Consolidate console warnings for missing fixes to single message [#480](https://github.com/openscope/openscope/issues/480)
- Update Ezeiza (SAEZ) - Updated all procedures, added video map, updated traffic, added new airlines [#516](https://github.com/openscope/openscope/issues/516)
- Lower spawn altitude for arrivals into MDSD so they can descend in time [#660](https://github.com/openscope/openscope/issues/660)


## 5.3.0 (August 1, 2017)
---
### Features
- New airport: MDSD (Las Américas International Airport, Dominican Republic) [#288](https://github.com/openscope/openscope/issues/288)
    - Includes Terrain and Video map
    - Adds Copa Airlines (CMP) and PAWA Dominicana (PWD)
- Add new openScope emblem vector graphic [#572](https://github.com/openscope/openscope/issues/572)
- Adds additional meta tags to index.html head [#484](https://github.com/openscope/openscope/issues/572)
- Adds a link to the full command reference at the end of the tutorial [#581](https://github.com/openscope/openscope/issues/581)
- The distance separator behind aircraft on ILS is now toggleable [#536](https://github.com/openscope/openscope/issues/536)
- Removes the blue line "departure window" [#411](https://github.com/openscope/openscope/issues/411)

### Bugfixes
- Removes inactive danger areas at EIDW [#562](https://github.com/openscope/openscope/issues/562)
- Make aircraft proceed direct new fix after full reroute [#570](https://github.com/openscope/openscope/issues/570)
- Recalculate SID/STAR legs when changing assigned runway [#383](https://github.com/openscope/openscope/issues/383)
- Remove +/-/= zoom hotkey, conflicts with speed [#510](https://github.com/openscope/openscope/issues/510)
- Correct EGKK's departure fix [#577](https://github.com/openscope/openscope/issues/577)

### Refactors
- Fix spelling error of `CanvasController` as `ConvasController` [#586](https://github.com/openscope/openscope/issues/586)
- Remove deprecated fixRadialDist() [#290](https://github.com/openscope/openscope/issues/290)
- Renamed `MIDDLE_PESS` as `MIDDLE_PRESS` in `InputController` [#593](https://github.com/openscope/openscope/issues/593)
- Fix instances of misspelling of @param in code docblocks [#602](https://github.com/openscope/openscope/issues/602)
- Deprecates `gulp server` task and adds `nodemon` package [#599](https://github.com/openscope/openscope/issues/599)


## 5.2.1 (July 1, 2017)
---
### Hotfix
- Ensure previously specified directions of turn are not preserved when a new heading instruction is given [#549](https://github.com/openscope/openscope/issues/549)


## 5.2.0 (July 1, 2017)
---
### Features
- Add capability for vectors in route strings [#310](https://github.com/openscope/openscope/issues/310)
- Adds more context to the Model classes by adding an optional input paramater [#138](https://github.com/openscope/openscope/issues/138)
- Adds object helper class for object validation  [#191](https://github.com/openscope/openscope/issues/191)
- Renamed AircraftInstanceModel with AircraftModel  [#402](https://github.com/openscope/openscope/issues/1402)
- Add capability for fly-over fixes in route strings [#19](https://github.com/openscope/openscope/issues/19)
- Adds squawk/sq command [#372](https://github.com/openscope/openscope/issues/372)
- Adds the ability to call an airplane by its callsign [#40](https://github.com/openscope/openscope/issues/40)
- Adds `EventBus` and `EventModel` [#457](https://github.com/openscope/openscope/issues/457)
- Adds `RunwayCollection` and `RunwayRelationshipModel` and moves some runway logic to live in these new classes [#93](https://github.com/openscope/openscope/issues/93)
    - Abstracts headwind/crosswind calculations to RunwayModel [#312](https://github.com/openscope/openscope/issues/312)
    - Removes circular reference in AirportModel.runway.airportModel [#58](https://github.com/openscope/openscope/issues/58)
- Updates `SpawnPatternModel` to use the `AirportModel.arrivalRunway` property when gathering waypoint models needed to calculate initial aircraft heading [#469](https://github.com/openscope/openscope/issues/469)
- Adds support for suffixes in SID and STAR procedures [#33](https://github.com/openscope/openscope/issues/33)
- Adds game option to include/hide WIP airports in the airport list [#476](https://github.com/openscope/openscope/issues/476)
- Adds `StripViewController`, `StripViewCollection`, and `StripViewModel` classes [#285](https://github.com/openscope/openscope/issues/285)
    - Removes progress strip logic from the `AircraftModel`
    - Completely reworks CSS for `StripViewList`
- Adds `.isGroundedFlightPhase()` and implements this helper in `.buildWaypointModelsForProcedure()` [#491](https://github.com/openscope/openscope/issues/491)
    - This allows for waypointModels to be build from the correct collection based on `flightPhase`
- Updates `AircraftModel.onAirspaceExit()` to look only at the `mcp.headingMode` value [#477](https://github.com/openscope/openscope/issues/477)
- Adds user setting option to change length of PTL [#423](https://github.com/openscope/openscope/issues/423)
- Updates Dublin (EIDW) - Improved procedures, added terrain and video map, modified airspace, realistic traffic [#208](https://github.com/openscope/openscope/issues/208)
- Updates logic to display historical aircraft position for aircraft outside controlled airspace [#508](https://github.com/openscope/openscope/issues/508)
- Updates development-workflow-procedures, adds Quick Start guide to README and consolidates all documentation in the `documentation` directory [#418](https://github.com/openscope/openscope/issues/418)
- Adds tests and verifies functionality of non-procedural departures and arrivals (support for direct route strings) [#434](https://github.com/openscope/openscope/issues/434)
- Adds unique transponder and CID generation methods [#483](https://github.com/openscope/openscope/issues/483)
- Abstracts non game loop logic into new class `AppController`, which provides facade methods for `App` to call during game loop [#137](https://github.com/openscope/openscope/issues/137)
- Converts `AirportController`, `GameController` and `UiController` to static classes [#72](https://github.com/openscope/openscope/issues/72)
    - updates `window` references to these classes
    - updates `prop` references to these classes
- Add support for ranged altitude and speed restrictions in procedures [#32](https://github.com/openscope/openscope/issues/32)
- Improve VNAV climbs and descents to better comply with restrictions [#32](https://github.com/openscope/openscope/issues/32)
- Updates Boston Logan Intl. (KBOS) - Updated procedures, added video map and terrain, modified airspace, realistic traffic [#228](https://github.com/openscope/openscope/issues/228)
- Removes left over references to `AircraftStripView` in `AircraftModel` [#535](https://github.com/openscope/openscope/issues/535)

### Bugfixes
- Fixes coordinate letter issue at SBGL [#385](https://github.com/openscope/openscope/issues/385)
- Prevent NaNs being passed on if invalid altitude is given [#424](https://github.com/openscope/openscope/issues/424)
- Removes fix command from tutorial and replaces it with infomation on 'route', 'Say Route', and 'Proceed Direct' [#356](https://github.com/openscope/openscope/issues/356)
- Fixes coordinate letter issues at RJBB, OSDI, OTHH [#325](https://github.com/openscope/openscope/issues/325)
- Removes KBOS fixes from EKCH [#448](https://github.com/openscope/openscope/issues/448)
- Runway, wind and spawnPattern changes to allow EGNM to operate [#492](https://github.com/openscope/openscope/issues/492)
- Prevent attempts to access positions of vector waypoints [#467](https://github.com/openscope/openscope/issues/467)
- Adjusts fix validation for hold/vector/flyover fix names [#451](https://github.com/openscope/openscope/issues/451)
- Prevents simulator from wrongfully overriding assigned alt/hdg during approach clearances [#521](https://github.com/openscope/openscope/issues/521)
- Updates `AirportModel.buildRestrictedAreas()` to build the coordinate array with the correct shape [#522](https://github.com/openscope/openscope/issues/522)
- Adds local reference to `EventBus` inside `AircraftCommander` [#539](https://github.com/openscope/openscope/issues/539)
- Cancel approach clearances whenever an altitude or heading instruction is given [#344](https://github.com/openscope/openscope/issues/344)
- Make flight strips show appropriate altitude values [#546](https://github.com/openscope/openscope/issues/546)


## 5.1.1 (May 12, 2017)
---
### Hotfix
- Fixes or removes from load list all airports that fail to load [#458](https://github.com/openscope/openscope/issues/458)


## 5.1.0 (May 1, 2017)
---
### Features
- adds [deployment-checklist](tools/documentation/deployment-checklist.md) document [#316](https://github.com/openscope/openscope/issues/316)
- Updates the airport-format.md file [#184](https://github.com/openscope/openscope/issues/184)
- allow for specification of airport's default arrival and departure runway [#374](https://github.com/openscope/openscope/issues/374)
- adds [airport-file-standards](tools/documentation/deployment-checklist.md) document [#367](https://github.com/openscope/openscope/issues/367)

### Bugfixes
- Adds additional check for `undefined` in `CommandParser` when adding args to a `CommandModel` [#364](https://github.com/openscope/openscope/issues/364)
- Deprecates and removes `AircraftController._setDestinationFromRouteOrProcedure()` as it was implemented to maintain a previous api which is no longer used [#370](https://github.com/openscope/openscope/issues/370)
- Ensure the verbal and text instructions/readbacks state the correct directionality [#188](https://github.com/openscope/openscope/issues/188)
- Updates Pilot.applyDepartureProcedure() to use RunwayModel correctly [#396](https://github.com/openscope/openscope/issues/396)
- Updates `fms.getDestinationName()` to return the `fixName` when `currentLeg` is not a procedure [#399](https://github.com/openscope/openscope/issues/399)
- Fix wrong PTL length and set to 1 minute [#394](https://github.com/openscope/openscope/issues/394)
- Fixes broken link in [airport-format](tools/documentation/airport-format.md) [#404](https://github.com/openscope/openscope/issues/404)
- Fix datablock speed to show GS, not IAS [#395](https://github.com/openscope/openscope/issues/395)
- Ensure red response is given to `rr FIXXA..FIXXB` [#408](https://github.com/openscope/openscope/issues/408)
- Fix strip update crash for arrivals on vectors [#410](https://github.com/openscope/openscope/issues/410)


## 5.0.1 (April 24, 2017)
---
### Hotfix
- Updates `AircraftStripView` to display departure procedures with the correct `NAME.EXIT` shape [#359](https://github.com/openscope/openscope/issues/359)


## 5.0.0 (April 21, 2017)
---
### Major
- Refactors FMS [#139](https://github.com/openscope/openscope/issues/139)
    - This represents a ground-up, from scratch, re-build of the flight management system with new classes: `Fms`, `LegModel`, and `WaypointModel`
    - Introduces the `ModeController` that completely separates Altitude, Heading and Speed settings from the FMS and allowing the FMS to be in charge of the flight plan and any fixRestrictions defined for a given route
    - Adds `Pilot` class that acts as a coordinator layer between the `AircraftCommander`, `AircraftInstanceModel`, `ModeController`, and `Fms`
    - Completely reworks how `Aircraft.target` is calculated
    - Introduces the concept of `flightPhase`, and begins integrating that property in lieu of category (arrival/departure)
    - Adds ability to define hold waypoints with a symbol `@`
    - Splits `PositionModel` into two new classes; `StaticPositionModel` and `DynamicPositionModel`
    - Work on this issue also resolves or invalidates previously recorded issues:
        - `aircraftInstanceModel.fms` has a circular dependency with `aircraftInstanceModel.fms.my_aircraft.fms` [#57](https://github.com/openscope/openscope/issues/57)
        - Using STAR command to change aircraft's assigned STAR throws errors [#73](https://github.com/openscope/openscope/issues/73)
        - Abstract current waypoint altitude and speed setting [#77](https://github.com/openscope/openscope/issues/77)
        - Add Leg to modelSourcePool [#78](https://github.com/openscope/openscope/issues/78)
        - Refactor fms param out of Leg [#79](https://github.com/openscope/openscope/issues/79)
        - Extend RouteModel, or add new layer, to handle compound routes [#81](https://github.com/openscope/openscope/issues/81)
        - Rerouting aircraft causes it to climb to unassigned altitude [#86](https://github.com/openscope/openscope/issues/86)
        - deprecate `aircraft.eid` [#87](https://github.com/openscope/openscope/issues/87)
        - Implied holding in route strings [#114](https://github.com/openscope/openscope/issues/114)
        - Rerouting uncleared aircraft onto SID fails [#122](https://github.com/openscope/openscope/issues/122)
        - Using "fix" command yields legs with lower case route [#123](https://github.com/openscope/openscope/issues/123)
        - Create getter in `AircraftInstanceModel` to get the current runway [#129](https://github.com/openscope/openscope/issues/129)
        - create RouteBuilder class and smooth out RouteModel [#144](https://github.com/openscope/openscope/issues/144)
        - `fix` command with multiple arguments skips to last fix [#153](https://github.com/openscope/openscope/issues/153)
        - Add `.hasFix()` method to FixCollection [#158](https://github.com/openscope/openscope/issues/158)
        - Route amendments will stop altitude changes [#197](https://github.com/openscope/openscope/issues/197)
        - `StaticPositionModel` and enforcing use of Positions where appropriate [#287](https://github.com/openscope/openscope/issues/287)

### Features
- Enumerate magic number in RunwayModel [#269](https://github.com/openscope/openscope/issues/269)
- Replaced old `terrain.svg` file with own work [#281](https://github.com/openscope/openscope/issues/281)











### Bugfixes
- Standardized indentation in all json files [#256](https://github.com/openscope/openscope/issues/256)
    - followed up and corrected 2 mistakenly cleared out aircraft files [#259](https://github.com/openscope/openscope/issues/259)
- Fixes Firefox compatibility issue by changing ajax to getJSON  [#263](https://github.com/openscope/openscope/issues/259)
- Fixes bug with departures at SAME [#303](https://github.com/openscope/openscope/issues/303)
- Fixes coordinates for PAM at EHAM [#321](https://github.com/openscope/openscope/issues/321)
- Ensure aircraft reach their targeted speed [#340](https://github.com/openscope/openscope/issues/340)
- Fixes last-second go-arounds by landing aircraft [#342](https://github.com/openscope/openscope/issues/342)
- Ensure aircraft follow glideslope [#346](https://github.com/openscope/openscope/issues/346)
- Fix mispronunciation of grouped numbers '820' as 'eight-twenty-zero' [#338](https://github.com/openscope/openscope/issues/338)


## 4.1.2 (February 20, 2017)
---
### Hotfix
- Updates `static.json` to not use ssl [#252](https://github.com/openscope/openscope/issues/252)


## 4.1.1 (February 20, 2017)
---
### Hotfix
- Restores spawning of GA aircraft at EDDT [#249](https://github.com/openscope/openscope/issues/249)


## 4.1.0 (February 20, 2017)
---
### Major
- Removes GitHub Pages specific files and moves hosting out of GitHub Pages. [#154](https://github.com/openscope/openscope/issues/154)
- Updates build process to: [#230](https://github.com/openscope/openscope/issues/230)
    - minify css and javascript and output to `public` directory
    - minify airport json/geojson files and output to `public` directory
    - combine aircraft and airline json files into `aircraft.json` and `airline.json` and output them to the `public` directory
    - copy static assets (fonts and images) to `public` directory
    - introduce [Handlebars](https://www.npmjs.com/package/handlebars-layouts) templates and create `buildMarkup` build process
    - point the local server to the `public` directory`

### Features
- Makes sure the output for sid and star commands are always uppercase. [#109](https://github.com/openscope/openscope/issues/109)
- Marks all airports as works in progress [#179](https://github.com/openscope/openscope/issues/179)
- Changes deployment server from Express to Nginx [#166](https://github.com/openscope/openscope/issues/166)
- Adds javascript minification to build process [#163](https://github.com/openscope/openscope/issues/163)
    - adds copy task to public directory
    - translates `json_assembler.rb` to `jsonAssembler.js` and adds it to the build process.
- Corrects `icao` of the Boeing 767-400 and also updates the information to Eurocontrol data [#222](https://github.com/openscope/openscope/issues/222)
- Updates `app.json` to use correct buildpacks [#224](https://github.com/openscope/openscope/issues/224)
- Overhauls Munich - updates Munich to AIRAC 1702, adds STARs, and adds a realistic traffic flow. [#104](https://github.com/openscope/openscope/issues/104)
- Adds Tokyo Narita International Airport as per AIRAC 1702 [#103](https://github.com/openscope/openscope/pull/202)
- Fixes an instance of two runways called "34R" in Shanghai Pudong [#149](https://github.com/openscope/openscope/issues/149)

### Bugfixes
- Adds the required space between 'fh' and its argument in the tutorial [#201](https://github.com/openscope/openscope/issues/201)
- Updates airline json files to include `icao` key. Updates `AirlineCollection` and `AirlineModel` to handle variable casing of `icao`  [#195](https://github.com/openscope/openscope/issues/195)
- Adds a default position value to `SpawnPatternModel` so aircraft have, at least, a `[0, 0]` starting position [#207](https://github.com/openscope/openscope/issues/207)
- Ensures data block colored bars are all the same width (3px), regardless of callsign length [#210](https://github.com/openscope/openscope/issues/210)
- Adds missing `return` in `.generateFlightNumberWithAirlineModel()` that was needed to properly recurse back through the method in the case of a duplicate flight number. [#210](https://github.com/openscope/openscope/issues/210)
- Updates boolean logic in `App.updateViewControls()` which was evaluating an asynchronous property that, typically, had not finished loading. [#203](https://github.com/openscope/openscope/issues/203)
- Fixes internal fms error that was breaking the game when issuing holds over present position [#148](https://github.com/openscope/openscope/issues/148)


## 4.0.1 (January 29, 2017)
---
### Features
- Adds Openscope favicon [#170](https://github.com/openscope/openscope/issues/170)

### Bugfixes
- Removes `ALM` and `SVD` arrival patterns from 'EKCH' because there aren't enough fixes to support them [176](https://github.com/openscope/openscope/issues/176)
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
- Removes `$.each()` from `AirportModel` in favor of `_forEach()` and uses `_get()` inside `aircraftInstanceModel.parse()` instead of if statements [#52](https://github.com/n8rzz/atc/issues/52)
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
- Adds `_isNumber` check instead of `!magneticNorth` inside `PositionModel.calculateRelativePosition()` and the `AirspaceModel` constructor. [#182](https://github.com/n8rzz/atc/issues/182)
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
