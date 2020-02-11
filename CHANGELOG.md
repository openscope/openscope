# 6.16.0 (January 31, 2020)
### New Features

### Bugfixes
- <a href="https://github.com/openscope/openscope/issues/1389" target="_blank">#1389</a> - Prevent unfair penalty at KDCA on IRONS7 arrivals by deactivating R6601B/C
- <a href="https://github.com/openscope/openscope/issues/1218" target="_blank">#1218</a> - Ensure proper removal of aircraft who collide with terrain/traffic
- <a href="https://github.com/openscope/openscope/issues/1513" target="_blank">#1513</a> - Add missing fleets to AFR/LDM airlines that were crashing EDDM/EIDW
- <a href="https://github.com/openscope/openscope/issues/1398" target="_blank">#1398</a> - Fix go-arounds from aircraft with low descent rates

### Enhancements & Refactors
- <a href="https://github.com/openscope/openscope/issues/1486" target="_blank">#1486</a> - Update AFL airline
- <a href="https://github.com/openscope/openscope/issues/1507" target="_blank">#1507</a> - Fix broken link in aircraft commands documentation
- <a href="https://github.com/openscope/openscope/issues/1022" target="_blank">#1022</a> - Reintroduce Munich Airport (EDDM)
- [#1387](https://github.com/openscope/openscope/issues/1387) - Update LOWW to AIRAC 1908
- <a href="https://github.com/openscope/openscope/issues/1499" target="_blank">#1499</a> - Reintroduce Ministro Pistarini Airport (SAEZ)
- <a href="https://github.com/openscope/openscope/issues/1503" target="_blank">#1503</a> - Reintroduce Dublin Airport (EIDW)
- <a href="https://github.com/openscope/openscope/issues/1471" target="_blank">#1471</a> - Change all airport guide links to open in new tab
- <a href="https://github.com/openscope/openscope/issues/1514" target="_blank">#1514</a> - Reintroduce Malvinas Argentinas Ushuaia Airport (SAWH)
- <a href="https://github.com/openscope/openscope/issues/1381" target="_blank">#1381</a> -  Change all airport names in airport loadList to the official English name according to Jeppesen charts
- <a href="https://github.com/openscope/openscope/issues/242" target="_blank">#242</a> - Update KJFK to AIRAC 2002


# 6.15.1 (December 2, 2019)
### Hotfixes
- <a href="https://github.com/openscope/openscope/issues/1480" target="_blank">#1480</a> - Ensure settings menu appears above flight strip bay


# 6.15.0 (December 1, 2019)
### New Features
- <a href="https://github.com/openscope/openscope/issues/1105" target="_blank">#1105</a> - Add in-sim Airport Guide accessible via footer button
- <a href="https://github.com/openscope/openscope/issues/1191" target="_blank">#1191</a> - Consolidate command bar buttons
- <a href="https://github.com/openscope/openscope/issues/45" target="_blank">#45</a> - Add range/bearing measurement tool via Control button

### Bugfixes
- <a href="https://github.com/openscope/openscope/issues/1456" target="_blank">#1456</a> - Only allow headings between 001 and 360
- <a href="https://github.com/openscope/openscope/issues/1474" target="_blank">#1474</a> - Fix crash at KAUS from missing FDX fleet
- <a href="https://github.com/openscope/openscope/issues/1476" target="_blank">#1476</a> - Fix missing terrain at KSTL

### Enhancements & Refactors
- <a href="https://github.com/openscope/openscope/issues/1451" target="_blank">#1451</a> - Add ability to specify the radial with the `hold` command
- <a href="https://github.com/openscope/openscope/issues/1458" target="_blank">#1458</a> - Add support for holding patterns with distance-based legs
- <a href="https://github.com/openscope/openscope/issues/1431" target="_blank">#1431</a> - Expand capabilities for predefined holding patterns in airport files
- <a href="https://github.com/openscope/openscope/issues/1402" target="_blank">#1402</a> - Prevent assignment of reserved/nondiscrete beacon codes
- <a href="https://github.com/openscope/openscope/issues/1472" target="_blank">#1472</a> - Add water polygons to airport terrain files


# 6.14.2 (October 17, 2019)
### Hotfixes
- [#1463](https://github.com/openscope/openscope/issues/1463) - Fix travis build notifications
- [#1453](https://github.com/openscope/openscope/issues/1453) - Fix EINN video maps format which was causing sim to crash


# 6.14.0 (October 1, 2019)
### New Features
- [#1436](https://github.com/openscope/openscope/issues/1436) - Add support for multiple video maps (no toggling yet)
- [#420](https://github.com/openscope/openscope/issues/420) - Include water in terrain files

### Bugfixes
- [#1418](https://github.com/openscope/openscope/issues/1418) - Fix error from EDDF spawn pattern
- [#1395](https://github.com/openscope/openscope/issues/1395) - Fix aircraft's wind correction angle math (which was causing go-arounds)
- [#1420](https://github.com/openscope/openscope/issues/1420) - Spawn pre-spawned aircraft on correct heading instead of 360 heading
- [#1432](https://github.com/openscope/openscope/issues/1432) - Prevent aircraft from leaving their holding patterns
- [#1440](https://github.com/openscope/openscope/issues/1440) - Add missing "b738"-fleet to TUI Airways
- [#23](https://github.com/openscope/openscope/issues/23) - Ensure focus remains on the text input box in MS Edge
- [#1448](https://github.com/openscope/openscope/issues/1448) - Lower spawn altitudes of KSFO arrivals so can comply with STAR restrictions
- [#1446](https://github.com/openscope/openscope/issues/1446) - Ensure `sh`/`sah` commands return headings within 001-360

### Enhancements & Refactors
- [#1410](https://github.com/openscope/openscope/issues/1410) - Restore functionality of local server from `npm run start`
- [#1387](https://github.com/openscope/openscope/issues/1387) - Update EDDF to AIRAC 1906
- [#1327](https://github.com/openscope/openscope/issues/1327) - Airport Revival: San Francisco International Airport
- [#1390](https://github.com/openscope/openscope/issues/1390) - Update KAUS to AIRAC 1909
- [#1231](https://github.com/openscope/openscope/issues/1231) - Draw STAR labels left of fix to prevent text overlap with SID labels
- [#1434](https://github.com/openscope/openscope/issues/1434) - Update EINN to AIRAC 1909


# 6.13.0 (June 1, 2019)
### New Features
- [#1313](https://github.com/openscope/openscope/issues/1313) - Add F1/F2 shortcut to decrease/increase length of PTLs

### Bugfixes
- [#1363](https://github.com/openscope/openscope/issues/1363) - Fix aircraft not squawking assigned code
- [#1351](https://github.com/openscope/openscope/issues/1351) - Fix turn command with incremental turns of less than 10 degrees

### Enhancements & Refactors
- [#1230](https://github.com/openscope/openscope/issues/1230) - Upgrade from `cedar-14` to `heroku-14` stack and simplifies build commands
- [#1344](https://github.com/openscope/openscope/issues/1344) - Add `EventTracking` calls to `TrafficRateController` and traffic rate concerns.
- [#1072](https://github.com/openscope/openscope/issues/1072) - Overhaul of El Paso International Airport (KELP)
- [#1378](https://github.com/openscope/openscope/issues/1378) - Change KBOS wind to permit usage of Runway 27
- [#1375](https://github.com/openscope/openscope/issues/1375) - Correct overflight example in spawnPatternReadme
- [#1338](https://github.com/openscope/openscope/issues/1338) - Add `fph` command to aircraft command documentation
- [#1370](https://github.com/openscope/openscope/issues/1370) - Upgrade dependencies and address `npm audit` issues
- [#1319](https://github.com/openscope/openscope/issues/1319) - Addresses lint errors in documentation files
- [#1260](https://github.com/openscope/openscope/issues/1260) - Update all airports to AIRAC 1813


# 6.12.3 (April 22, 2019)
### Hotfixes
- [#1366](https://github.com/openscope/openscope/issues/1366) - Remove/combine conflicting spawn patterns from multiple airports


# 6.12.2 (April 15, 2019)
### Hotfixes
- [#943](https://github.com/openscope/openscope/issues/943) - Fix random spawn calculations to ensure arrivals are available quickly
- [#1355](https://github.com/openscope/openscope/issues/1355) - Ensure LSZH arrivals descend properly


# 6.12.1 (April 4, 2019)
### Hotfixes
- [#1358](https://github.com/openscope/openscope/issues/1358) - Ensure traffic resumes spawning after a spawn pattern is turned off and back on


# 6.12.0 (April 1, 2019)
### New Features
- [#804](https://github.com/openscope/openscope/issues/804) - Add ability to view changelog for the current version
- [#1330](https://github.com/openscope/openscope/issues/1330) - Allow user to choose which mouse button drags the canvas
- [#16](https://github.com/openscope/openscope/issues/16) - Add traffic volume scaling controls

### Bugfixes
- [#1335](https://github.com/openscope/openscope/issues/1335) - Fix inconsistent state of control buttons
- [#1341](https://github.com/openscope/openscope/issues/1341) - Fix CID number generation bug when generated CID is already in use
- [#1183](https://github.com/openscope/openscope/issues/1183) - Ensure a deep render occurs when changing themes

### Enhancements & Refactors
- [#10](https://github.com/openscope/openscope/issues/10) - Add command for altitude restrictions at fixes ("cr")
- [#598](https://github.com/openscope/openscope/issues/598) - Add linting (`lint-diff`) to Travis CI task list


# 6.11.0 (March 4, 2019)
### New Features
- [#898](https://github.com/openscope/openscope/issues/898) - Add command to exit holding pattern
- [#1272](https://github.com/openscope/openscope/issues/1272) - Add version number to settings menu

### Bugfixes
- [#1305](https://github.com/openscope/openscope/issues/1305) - Fix range rings center is undefined
- [#1312](https://github.com/openscope/openscope/issues/1312) - Fix KRDU arrival descent problems to some extent
- [#1329](https://github.com/openscope/openscope/issues/1329) - Free up CIDs after use
- [#1324](https://github.com/openscope/openscope/issues/1324) - Restore support for numpad enter


# 6.10.0 (February 1, 2019)
### New Features
- [#1032](https://github.com/openscope/openscope/issues/1032) - Add range ring options and toggle button
- [#1234](https://github.com/openscope/openscope/issues/1234) - Add scope command for drawing halos around aircraft data blocks

### Bugfixes
- [#1292](https://github.com/openscope/openscope/issues/1292) - Ensure taxi instructions are ignored when aircraft is taking off
- [#1309](https://github.com/openscope/openscope/issues/1309) - Fix GameController.game_interval calls continuously after it fires initially

### Enhancements & Refactors
- [#1247](https://github.com/openscope/openscope/issues/1247) - Determine initial climb altitude from the SID
- [#1290](https://github.com/openscope/openscope/issues/1290) - Add Pull Reminders badge to repository readme
- [#1286](https://github.com/openscope/openscope/issues/1286) - Update EDDF to AIRAC 1901
- [#1288](https://github.com/openscope/openscope/issues/1288) - Update event tracking arguments sent to GA
- [#1308](https://github.com/openscope/openscope/issues/1308) - Clarify that TimeKeeper and GameController.game_timeout are using seconds (not milliseconds)


# 6.9.1 (January 4, 2019)
### Hotfixes
- [#1284](https://github.com/openscope/openscope/issues/1284) - Fixes overflow issues with tests


# 6.9.0 (January 1, 2019)
### Bugfixes
- [#1250](https://github.com/openscope/openscope/issues/1250) - Fix fatal error code 128 during `npm install`
- [#1240](https://github.com/openscope/openscope/issues/1240) - Fix readback from departure cleared for takeoff when they aren't first in line
- [#1259](https://github.com/openscope/openscope/issues/1259) - Fix speech synthesis's use of "heavy/super" in callsigns
- [#1266](https://github.com/openscope/openscope/issues/1266) - Fix A380 speed definitions
- [#1158](https://github.com/openscope/openscope/issues/1158) - Fix Firefox strip bay scrollbars are not working
- [#1242](https://github.com/openscope/openscope/issues/1242) - Fix too-low glideslope intercept messages not showing
- [#1279](https://github.com/openscope/openscope/issues/1279) - Fix erroneous altitudes appearing in flight strip

### Enhancements & Refactors
- [#1264](https://github.com/openscope/openscope/issues/1264) &[#1265](https://github.com/openscope/openscope/issues/1265) - Change the "super" weight class identifier from `U` to `J`
- [#1269](https://github.com/openscope/openscope/issues/1269) - Updates [Google Analytics](https://developers.google.com/analytics/devguides/collection/gtagjs/migration) tracking function from `ga` to `gtag`
- [#727](https://github.com/openscope/openscope/issues/727) &[#1265](https://github.com/openscope/openscope/issues/1265) - Updates to the tutorial
- [#1238](https://github.com/openscope/openscope/issues/1238) - Grant IFR clearance when any type of route amendment is issued
- [#1232](https://github.com/openscope/openscope/issues/1232) - Require proper application of separation with same-runway subsequent departures
- [#1275](https://github.com/openscope/openscope/issues/1275) - Updates `buildMarkup` task to output date and time when generating the `index.html` file


# 6.8.0 (December 1, 2018)
### New Features
- [#1003](https://github.com/openscope/openscope/issues/1003) - Add assigned runway to the aircrafts' strips
- [#945](https://github.com/openscope/openscope/issues/945) - Add airport information panel to scope
- [#159](https://github.com/openscope/openscope/issues/159) - Add in-game link to GitHub repo
- [#1212](https://github.com/openscope/openscope/issues/1212) - Randomize pilot voice for each aircraft
- [#1197](https://github.com/openscope/openscope/issues/1197) - Adds custom analytics event tracking

### Bugfixes
- [#1147](https://github.com/openscope/openscope/issues/1147) - Fix Callsigns in tutorial should update when switching airports
- [#1045](https://github.com/openscope/openscope/issues/1045) - Fix descent planning logic so arrivals can meet their altitude restrictions
- [#1084](https://github.com/openscope/openscope/issues/1084) - Add messages for too-low glideslope intercepts
- [#155](https://github.com/openscope/openscope/issues/155) - Accept entrail property in spawnPatternModel
- [#1193](https://github.com/openscope/openscope/issues/1193) - Adds `SettingsController` instantiation to `UiController.init()`
- [#1202](https://github.com/openscope/openscope/issues/1202) - Prevent pilot from responding with "say again, say again"
- [#1154](https://github.com/openscope/openscope/issues/1154) - Ensure that the runway is valid for SID before takeoff
- [#955](https://github.com/openscope/openscope/issues/955) - Fix `sid` command`

### Enhancements & Refactors
- [#1075](https://github.com/openscope/openscope/issues/1075) - Typo In surgePattern documentation
- [#883](https://github.com/openscope/openscope/issues/883) - Stop penalizing light tailwind landings
- [#1001](https://github.com/openscope/openscope/issues/1001) - Remove support for work-in-progress airports
- [#1179](https://github.com/openscope/openscope/issues/1179) - Extract settings related code from UiController into its own controller
- [#1171](https://github.com/openscope/openscope/issues/1171) - Move tutorial from InputController to UiController
- [#1114](https://github.com/openscope/openscope/issues/1114), [#1115](https://github.com/openscope/openscope/issues/1115) - Update broken documentation links
- [#308](https://github.com/openscope/openscope/issues/308) - Abstract Aircraft.getWind() to the AirportModel
- [#1199](https://github.com/openscope/openscope/issues/1199) - Change taxi readback to "taxi to and hold short of Runway 1"
- [#1208](https://github.com/openscope/openscope/issues/1208) - Update Thomas Cook callsign
- [#1209](https://github.com/openscope/openscope/issues/1209) - Update TUI Airways callsign
- [#604](https://github.com/openscope/openscope/issues/604) - Adds support for dataBlock timeshare data
- [#678](https://github.com/openscope/openscope/issues/678) - Removes wind vane visualization from `CanvasController`
- [#1137](https://github.com/openscope/openscope/issues/1137) - Updates project dependencies


# 6.7.0 (November 1, 2018)
### New Features
- [#1033](https://github.com/openscope/openscope/issues/1033) - Add support for overflights
- [#793](https://github.com/openscope/openscope/issues/793) - Add AIRAC airport file key and system command
- [#1017](https://github.com/openscope/openscope/issues/1017) - Add more GA aircraft

### Bugfixes
- [#1099](https://github.com/openscope/openscope/issues/1099) - Fix wrong B747 entry in Turkish Airlines file
- [#1104](https://github.com/openscope/openscope/issues/1104) - Fix console warnings for removing StripViewModel which doesn't exist
- [#1103](https://github.com/openscope/openscope/issues/1103) - Fix pressing ESC doesn't fully clear the command bar
- [#1149](https://github.com/openscope/openscope/issues/1149) - Ensure all flight strips are removed when switching to another airport
- [#1152](https://github.com/openscope/openscope/issues/1152) - Fix GameClockView crashes sim in Firefox

### Enhancements & Refactors
- [#1108](https://github.com/openscope/openscope/issues/1108) - Overhaul of KLAS
- [#794](https://github.com/openscope/openscope/issues/794) - Bring KMIA back into compliance with the airport specs
- [1123](https://github.com/openscope/openscope/issues/1123) - Make runway mandatory in "taxi" command
- [#1112](https://github.com/openscope/openscope/issues/1112) - Cleanup of eslint errors and warnings
- [#1138](https://github.com/openscope/openscope/issues/1138) - Remove contributors block from package.json
- [#696](https://github.com/openscope/openscope/issues/696) - Default canvas theme no longer hardcoded in CanvasController
- [#1144](https://github.com/openscope/openscope/issues/1144) - Move calculateSpawnHeading to SpawnPattenModel
- [#1142](https://github.com/openscope/openscope/pull/1142) - Update documentation for taxi command
- [#966](https://github.com/openscope/openscope/pull/966) - Improve terrain generation documentation
- [#1133](https://github.com/openscope/openscope/issues/1133) - Improve InputController class


# 6.6.0 (October 1, 2018)
### New Features
- [#989](https://github.com/openscope/openscope/issues/989) - Add in Austin Bergstrom International Airport
- [#1090](https://github.com/openscope/openscope/issues/1090) - Add Tecnam P92 Aircraft

### Bugfixes
- [#1086](https://github.com/openscope/openscope/issues/1086) - Update P28A Climb rate fm 2000ft/m to 700ft/m
- [#1034](https://github.com/openscope/openscope/issues/1034) - Fix waypoint time-to-turn calculations to ensure smooth turns
- [#935](https://github.com/openscope/openscope/issues/935) - Prevent aircraft from skipping fixes that require tight turns
- [#870](https://github.com/openscope/openscope/issues/870) - Fix unusable runway bug after changing one aircraft's departure runway
- [#1101](https://github.com/openscope/openscope/issues/1101) - Fix console error caused by vector waypoints

### Enhancements & Refactors
- [1077](https://github.com/openscope/openscope/issues/1077) - Update flight strips view by separating arrival and departure strips
- [#1074](https://github.com/openscope/openscope/issues/1074) - Update link to "aircraft separation rules" in scoring.md
- [#111](https://github.com/openscope/openscope/issues/111) - Draw STARs on scope like we do with SIDs


# 6.5.0 (September 1, 2018)
### New Features
- [#206](https://github.com/openscope/openscope/issues/206) - Add Bucharest Henri Coandǎ International Airport (LROP)

### Bugfixes
- [#994](https://github.com/openscope/openscope/issues/994) - fix "Aircraft vectored off ILS maintain over-precise altitude"
- [#1048](https://github.com/openscope/openscope/issues/1048) - fix "Aircrafts do not land after ILS clearance" because runway is not part of their STAR
- [#1044](https://github.com/openscope/openscope/issues/1044) - fix aircrafts drift off ILS localizer during final approach causing "strange behaviour after landing"
- [#1047](https://github.com/openscope/openscope/issues/1047) - fix "Flight number 5000 pronounced incorrectly"
- [#993](https://github.com/openscope/openscope/issues/993) - fix Arrivals exiting and reentering airspace causes error about missing strip
- [#724](https://github.com/openscope/openscope/issues/724) - fix settings modal doesn't add active class to control icon
- [#421](https://github.com/openscope/openscope/issues/421) - Add missing keys to spawnPatternModelJsonValidator
- [#836](https://github.com/openscope/openscope/issues/836) - Fix "hold in STAR procedure isn't working"

### Enhancements & Refactors
- [#933](https://github.com/openscope/openscope/issues/933) - Revival of Istanbul Atatürk Airport (LTBA)
- [#1053](https://github.com/openscope/openscope/issues/1053) Add optional altitude argument for 'descend via STAR' command
- [#1071](https://github.com/openscope/openscope/issues/1071) Add optional altitude argument for 'climb via SID' command


# 6.4.0 (August 1, 2018)
### New Features
- [#403](https://github.com/openscope/openscope/issues/403) - Add Flughafen Düsseldorf (Düsseldorf Airport, EDDL)

### Bugfixes
- [#1018](https://github.com/openscope/openscope/issues/1018) - Fix "leaving airspace without proper clearance" bug at KSEA
- [#915](https://github.com/openscope/openscope/issues/915) - Change passing/diverging separation logic to use assigned heading, not ground track heading
- [#38](https://github.com/openscope/openscope/issues/38) - Fix issues with localizer interception
    - prevents aircraft from spinning in circles (in most cases we're seeing)
    - ensures descents below assigned altitude do not begin until established on the localizer
    - penalizes localizer interception above glideslope
    - triggers go-arounds at final approach fix if not established on both localizer and glideslope
- [#1030](https://github.com/openscope/openscope/issues/1030) - Fix background color of options menu dropdowns

### Enhancements & Refactors
- [#1005](https://github.com/openscope/openscope/issues/1005) - Minor updates to KRDU
- [#1023](https://github.com/openscope/openscope/issues/1023) - Standardize `openScope` capitalization
- [#949](https://github.com/openscope/openscope/issues/949) - Keep video map clearly visible at all zoom levels
- [#1000](https://github.com/openscope/openscope/issues/1000) - Increase max width of airport selection dialog to permit longer airport names


# 6.3.0 (July 1, 2018)
### New Features
- [#272](https://github.com/openscope/openscope/issues/272) - Add Cincinnati/Northern Kentucky International Airport (KCVG)

### Bugfixes
- [#1008](https://github.com/openscope/openscope/issues/1008) - Correct airline files using old callsign format

### Enhancements & Refactors
- [#938](https://github.com/openscope/openscope/issues/938) - Overhaul of OMDB
- [#94](https://github.com/openscope/openscope/issues/94) - Adds @openscope/validator package with supporting npm script


# 6.2.0 (June 10, 2018)
### New Features
- [#893](https://github.com/openscope/openscope/issues/893) - Add Prague Václav Havel Airport (LKPR)
- [#444](https://github.com/openscope/openscope/issues/444) - Adds option button to toggle video map display
- [#884](https://github.com/openscope/openscope/issues/884) - Add airline files for non-US registration callsigns

### Bugfixes
- [#968](https://github.com/openscope/openscope/issues/968) - Fixed N-numbered GA aircraft having callsign "default" if voice is on
- [#907](https://github.com/openscope/openscope/issues/907) - Updates `SpawnPatternModel` to handle integer or float values for `#rate`
- [#996](https://github.com/openscope/openscope/issues/996) - Add airport guide directory entry for LKPR

### Enhancements & Refactors
- [#956](https://github.com/openscope/openscope/issues/956) - Updated 'descend via STAR' documentation to change mentioning SID to STAR
- [#782](https://github.com/openscope/openscope/issues/782) - Overhaul of KATL
- [#961](https://github.com/openscope/openscope/issues/961) - Updated climb and descent rates using Eurocontrol data
- [#874](https://github.com/openscope/openscope/issues/874) - Continue and clean up following FMS / Route refactor
- [#982](https://github.com/openscope/openscope/issues/982) - Remove empty .gitkeep file
- [#916](https://github.com/openscope/openscope/issues/916) - Consolidates aircraft removal logics, renames AircraftModel#inside_ctr -> AircraftModel#isControllable, simplifies aircraft update logic in AircraftController
- [#972](https://github.com/openscope/openscope/issues/972) - Updated airline fleets to newest data


# 6.1.2 (May 2, 2018)
### Hotfix
- [#953](https://github.com/openscope/openscope/issues/953) - Fix aircraft not descending into airspace when airspace ceiling is below STAR bottom altitude


# 6.1.1 (May 1, 2018)
### Hotfix
- [#950](https://github.com/openscope/openscope/issues/950) - Fix left turn command `t l ###`


# 6.1.0 (May 1, 2018)
### New Features
- [#818](https://github.com/openscope/openscope/issues/818) - Allows selection of only aircraft within controlled airspace
- [#838](https://github.com/openscope/openscope/issues/838) - Add Zürich Airport (LSZH)
- [#24](https://github.com/openscope/openscope/issues/24) - Add command to inform arrivals of assigned landing runway

### Bugfixes
- [#918](https://github.com/openscope/openscope/issues/918) - Fix failed load by verifying "last airport" in loadList before attempting to use it
- [#939](https://github.com/openscope/openscope/issues/939) - Fix airline fleet detection logic that was erroring during spawn of properly declared patterns
- [#899](https://github.com/openscope/openscope/issues/899) - Fix improper merging of routes when divergent waypoint is not in the middle of the leg
- [#940](https://github.com/openscope/openscope/issues/940) - Fixes British Airways fleets; re-adds 'short' fleet and removes historic fleet
- [#947](https://github.com/openscope/openscope/issues/947) - Fix lack of red response for 'land' and update documentation

### Enhancements & Refactors
- [#910](https://github.com/openscope/openscope/issues/910) - Reactivate KBOS and KSTL
- [#856](https://github.com/openscope/openscope/issues/856) - Overhaul of Doha Hamad International Airport (OTHH)
- [#246](https://github.com/openscope/openscope/issues/246) - Overhaul OMAA (Abu Dhabi)
- [#908](https://github.com/openscope/openscope/issues/908) - Minor updates to KSEA
- [#928](https://github.com/openscope/openscope/issues/928) - Minor updates to KPDX
- [#923](https://github.com/openscope/openscope/issues/923) - Overhaul of KABQ
- [#931](https://github.com/openscope/openscope/issues/931) - Minor updates to KDCA
- [#241](https://github.com/openscope/openscope/issues/241) - Overhaul of London Luton Airport (England, United Kingdom)
- [#927](https://github.com/openscope/openscope/issues/927) - Fix climb rates for CRJs
- [#677](https://github.com/openscope/openscope/issues/677) - Add test which ensures all airport JSONs contain valid JSON data (helpful for airport developers)


# 6.0.0 (March 1, 2018)
### Major
- [#809](https://github.com/openscope/openscope/issues/809) - Major reconfiguration of FMS and navigation-related components of the sim

### New Features
- [#108](https://github.com/openscope/openscope/issues/108) - Add Ottawa Macdonald–Cartier International Airport (Canada)
- [#265](https://github.com/openscope/openscope/issues/265) - Add Leeds Bradford Airport (England, United Kingdom)
- [#816](https://github.com/openscope/openscope/issues/816) - Add Kansas City Int'l (KMCI)
- [#819](https://github.com/openscope/openscope/issues/819) - Add Raleigh-Durham Int'l (KRDU)
- [#785](https://github.com/openscope/openscope/issues/785) - Add Pittsburgh International Airport (KPIT)
- [#106](https://github.com/openscope/openscope/issues/106) - Add Halifax Stanfield International Airport (CYHZ)

### Bugfixes
- [#864](https://github.com/openscope/openscope/issues/864) - Resolve console.warning() is not a function (when drawing SIDs), by removing the -ing
- [#879](https://github.com/openscope/openscope/issues/879) - Restore functionality of non-procedural descents to airspace ceiling
- [#895](https://github.com/openscope/openscope/issues/895) - Ensure number-type variables defined in spawn patterns are cast to numbers if provided as strings

### Enhancements & Refactors
- [#840](https://github.com/openscope/openscope/issues/840) - Updates documentation on airport file standards
- [#655](https://github.com/openscope/openscope/issues/655) - Set new standards for airport difficulty levels
- [#529](http://github.com/openscope/openscope/issues/529) - Convert `NavigationLibrary` to a singleton
- [#881](http://github.com/openscope/openscope/issues/881) - Remove nonfunctional airports from load list broken by feature/809
- [#216](https://github.com/openscope/openscope/issues/216) - Overhaul of Ronald Reagan Washington National Airport (DC, USA)
- [#854](https://github.com/openscope/openscope/issues/854) - Overhaul of Manchester International Airport (England, United Kingdom
- [#866](https://github.com/openscope/openscope/issues/866) - Customisation of callsign formats
- [#199](https://github.com/openscope/openscope/issues/199) - Overhaul of Frankfurt Am Main International Airport (Germany)
- [#842](https://github.com/openscope/openscope/issues/842) - Updates KBOS to AIRAC 1802
- [#844](https://github.com/openscope/openscope/issues/844) - Updates KSTL to AIRAC 1802
- [#851](https://github.com/openscope/openscope/issues/851) - Updates KPDX to AIRAC 1802
- [#837](https://github.com/openscope/openscope/issues/837) - Refactors `StripView` classes to not use `$.show()` and `$.hide()`
    - updates css to use `flexbox` instead of the clever `translateY()` tricks.
    - [#885](https://github.com/openscope/openscope/issues/885) - Removes loading indicator and simplifies `LoadingView`
- [#796](https://github.com/openscope/openscope/issues/796) - Updates ENGM (Oslo Airport, Norway)
- [#723](https://github.com/openscope/openscope/issues/723) - Add contribution guidelines document


# 5.7.0 (December 1, 2017)
### Bugfixes
- [#831](https://github.com/openscope/openscope/issues/831) - Add empty video maps to WIP airports to keep them from crashing

### Enhancements & Refactors
- [#823](https://github.com/openscope/openscope/issues/823) - Add restricted and prohibited areas to KSEA
- [#825](https://github.com/openscope/openscope/issues/825) - Updates KSTL to AIRAC 1712
- [#821](https://github.com/openscope/openscope/issues/821) - Updates KDTW to AIRAC 1712
- [#829](https://github.com/openscope/openscope/issues/829) - Updates EDDH (Hamburg Airport, Germnay)
- [#833](https://github.com/openscope/openscope/issues/833) - Updates documentation on airport format
- [#485](https://github.com/openscope/openscope/issues/485) - Updates KLAS (McCarran International Airport, NV)
- [#801](https://github.com/openscope/openscope/issues/801) & [#802](https://github.com/openscope/openscope/issues/802) - Removed Monarch Airlines and Airberlin


# 5.6.1 (November 1, 2017)
### Hotfix
- [#814](https://github.com/openscope/openscope/issues/814) - Fix severe canvas bug for airports with runways that don't draw extended centerlines


# 5.6.0 (November 1, 2017)
### New Features
- [#647](https://github.com/openscope/openscope/issues/647) - Add Tampa Intl. (KTPA)
- [#107](https://github.com/openscope/openscope/issues/107) - Add Theodore Francis Green Memorial State Airport (Providence, US)
- [#559](https://github.com/openscope/openscope/issues/559) - New Airport: KDTW (Detroit Metropolitan Wayne County Airport, MI)
- [#236](https://github.com/openscope/openscope/issues/236) - Splits canvas into STATIC and DYNAMIC canvases, only drawing updates when there are updates to draw.
    - Moves CanvasController arrow functions to bound class methods

### Bugfixes
- [#667](https://github.com/openscope/openscope/issues/667) - Fix bug where aircraft cleared twice for ILS won't join glideslope
- [#567](https://github.com/openscope/openscope/issues/567) - Fix bug of aircraft descending via STAR to '0' altitude
- [#787](https://github.com/openscope/openscope/issues/787) - `sid` command no longer sets the aircraft's destination property
- [#812](https://github.com/openscope/openscope/issues/812) - Ensure aircraft future path is drawn only when directed by settings menu

### Enhancements & Refactors
- [#755](https://github.com/openscope/openscope/issues/755) - Deprecated the `rate` command
- [#80](https://github.com/openscope/openscope/issues/80) - Add git strategy flow chart to documentation
- [#662](https://github.com/openscope/openscope/issues/662) - Force arrivals with non-altitude-restricted STARs/routes descend at least to ceiling of controlled airspace
- [#725](https://github.com/openscope/openscope/issues/725) - Consolidate GameController timing elements into TimeKeeper
- [#764](https://github.com/openscope/openscope/issues/764) - Fix links in airport guide documentation
- [#768](https://github.com/openscope/openscope/issues/768) - Fix mistake in version number
- [#768](https://github.com/openscope/openscope/issues/768) - Minor renaming of holding related methods in FMS
- [#427](https://github.com/openscope/openscope/issues/427) - Updates KSFO (San Francisco International Airport, CA)
- [#773](https://github.com/openscope/openscope/issues/773) - Updates KABQ to AIRAC 1711
- [#775](https://github.com/openscope/openscope/issues/775) - Updates KSEA to AIRAC 1711
- [#777](https://github.com/openscope/openscope/issues/777) - Updates KSTL to AIRAC 1711
- [#780](https://github.com/openscope/openscope/issues/780) - Updates KBOS to AIRAC 1711
- [#726](https://github.com/openscope/openscope/issues/726) - Adds `CanvasStageModel` class and abstracts canvas dimensions, pan, zoom, and unit translation methods to this new singleton
- [#650](https://github.com/openscope/openscope/issues/650) - Updates KPDX (Portland International Airport, OR)
- [#791](https://github.com/openscope/openscope/issues/791) - Adds useful error message and tests for case when airport file has procedure with improperly defined `draw` segment


# 5.5.1 (October 1, 2017)
### Hotfix
- [#709](https://github.com/openscope/openscope/issues/709) & [#744](https://github.com/openscope/openscope/issues/744) - Checks if the airport in localStorage exists before loading it
- [#710](https://github.com/openscope/openscope/issues/710) & [#744](https://github.com/openscope/openscope/issues/744) - Updates `.eslint` rules to ignore unused `event` and `error` parameters


# 5.5.0 (October 1, 2017)
### New Features
- [#641](https://github.com/openscope/openscope/issues/641) - Add `sa`, `saa`, `sh`, `sah`, `ss`, `sas` commands
- [#14](https://github.com/openscope/openscope/issues/14) - Add toggleable scope command bar, and lays foundation for the Scope, its commands, and its collections of radar targets.
- [#564](https://github.com/openscope/openscope/issues/564) - The mouse button to drag the radar screen is now right click
- [#637](https://github.com/openscope/openscope/issues/637) - Adds Ted Stevens Anchorage Intl. (PANC)

### Bugfixes
- [#683](https://github.com/openscope/openscope/issues/683) - Fix SID Names at MDSD following the screen centre
- [#685](https://github.com/openscope/openscope/issues/685) - Fix the command bar displaying a '?' when the up or down arrow is pressed
- [#699](https://github.com/openscope/openscope/issues/699) - Extends departing spawnPatterns outside the airspace at KSDF to prevent point deduction
- [#704](https://github.com/openscope/openscope/issues/704) - Adds `footer` section to `index.html` and combines former partials `controls` and `score` with the `#command` input
    - updates styles to use flexbox with properly organized children
- [#728](https://github.com/openscope/openscope/issues/728) - Clear radar target collection when changing airports
- [#732](https://github.com/openscope/openscope/issues/732) - Ensure radar targets are removed when aircraft model is deleted
- [#711](https://github.com/openscope/openscope/issues/711) - Ensure game options initialize to correct default values
- [#741](https://github.com/openscope/openscope/issues/741) - Remove call to `AirportController.hasAirport()` in `index.js`
- [#740](https://github.com/openscope/openscope/issues/740) - Changes background-color of settings option selects to transparent
- [#743](https://github.com/openscope/openscope/issues/743) - Updates param passed to RadarTargetCollection from within AircraftController.aircraft_remove(
- [#742](https://github.com/openscope/openscope/issues/742) - Ensure failure message responses are shown in red

### Enhancements & Refactors
- [#679](https://github.com/openscope/openscope/issues/679) - Modifies `StripView` background-color to use rgba instead of hex to allow for a semi-transparent background
- [#657](https://github.com/openscope/openscope/issues/657) - Adds Eric Meyer CSS Reset and updates existing CSS to work without `*` reset
- [#695](https://github.com/openscope/openscope/issues/695) - Stops `console.warn()` spam every frame if terrain is less than zero
- [#670](https://github.com/openscope/openscope/issues/670) - Adds `localStorage.setItem()` to `GameOptions.setOptionByName()` and adds test file for `GameOptions`
- [#452](https://github.com/openscope/openscope/issues/452) - Update airport format document with new properties and requirements
- [#614](https://github.com/openscope/openscope/issues/614) - Update developer documentation regarding git strategy
- [#717](https://github.com/openscope/openscope/issues/717) - Execute scope command by clicking radar target
- [#296](https://github.com/openscope/openscope/issues/296) - Adds `TimeKeeper` singleton and moves `App.incrementFrame()` logic to this new class
- [#721](https://github.com/openscope/openscope/issues/721) - Removed the `version` command
- [#527](https://github.com/openscope/openscope/issues/527) - Updates Shannon (EINN) - Updated all procedures, added video map and terrain, updated traffic
- [#707](https://github.com/openscope/openscope/issues/707) - Makes first pass at `CanvasController` refactor
    - adds `TimeKeeper` singleton to make time tracking easier to manage
    - moves logic to update properties of the `CanvasController` to live within the `CanvasController` and happen via triggered events
    - sets the stage for next round of `CanvasController` updates by adding `CANVAS_NAME` enum to be used when creating canvas elements
- [#29](https://github.com/openscope/openscope/issues/29) - Add airport guide files and start ksea as an example
- [#354](https://github.com/openscope/openscope/issues/354) - Ensure tutorial selects departure aircraft
- [#718](https://github.com/openscope/openscope/issues/718) - Add documentation and tutorial section for scope commands
- [#630](https://github.com/openscope/openscope/issues/630) - Update UI green colors to match default blue theme
- [#326](https://github.com/openscope/openscope/issues/326) - Checks if an aircraft can reach assigned altitude/speed


# 5.4.1 (September 2, 2017)
### Hotfix
- [#327](https://github.com/openscope/openscope/issues/327) - Fix WIP airports which fail to load due to improper procedure formatting


# 5.4.0 (September 1, 2017)
### New Features
- [#327](https://github.com/openscope/openscope/issues/327) - Add Albuquerque Sunport (KABQ)
- [#541](https://github.com/openscope/openscope/issues/541) - Add Hartsfield–Jackson Atlanta Intl. (KATL)
- [#557](https://github.com/openscope/openscope/issues/557) - Add Louisville Intl. (KSDF)
- [#331](https://github.com/openscope/openscope/issues/331) - New Airport: KELP (El Paso International Airport, TX)
- [#349](https://github.com/openscope/openscope/issues/349) - New Airport: KSTL (St. Louis Lambert International Airport, MO)
- [#555](https://github.com/openscope/openscope/issues/555) - New Airport: KTUS (Tuscon International Airport, AZ)
- [#624](https://github.com/openscope/openscope/issues/624) - New Airport: KJAX (Jacksonville International Airport, FL)

### Bugfixes
- [#618](https://github.com/openscope/openscope/issues/618) - Fix VNAV descents on STARs with only "at/above" and "at/below" restrictions
- [#664](https://github.com/openscope/openscope/issues/664) - Updates order of elements in the StripViewTemplate so the FlightRules element is properly floated to the right
- [#659](https://github.com/openscope/openscope/issues/659) - Fix misalignment in airport selection dialog

### Enhancements & Refactors
- [#619](https://github.com/openscope/openscope/issues/619) - Removed index.html as it is generated from templates when run
- [#619](https://github.com/openscope/openscope/issues/619) - Implements new loading screen with new color scheme and animated radar sweep
- [#566](https://github.com/openscope/openscope/issues/566) - Extends departing spawnPatterns outside the airspace at EIDW to prevent point deduction
- [#615](https://github.com/openscope/openscope/issues/615) - Extends departing spawnPatterns outside the airspace at MDSD to prevent point deduction
- [#635](https://github.com/openscope/openscope/issues/635) - Extends departing spawnPatterns outside the airspace at KBOS to prevent point deduction
- [#15](https://github.com/openscope/openscope/issues/15) - Implement scope themes, and changed default theme to blue-based
- [#431](https://github.com/openscope/openscope/issues/431) - Deactivate unused WIP airports from the load list, and add premium flag
- [#7](https://github.com/openscope/openscope/issues/7) - Document airport terrain generation process
- [#653](https://github.com/openscope/openscope/issues/653) - Remove index.html from document root in tools/README.md
- [#640](https://github.com/openscope/openscope/issues/640) - Deprecate the `say route` command
- [#481](https://github.com/openscope/openscope/issues/481) - Adds LESS preprocessor and adds CSS folder structure
- [#639](https://github.com/openscope/openscope/issues/639) - Deprecated `abort` command
- [#365](https://github.com/openscope/openscope/issues/365) - Renamed `index.md` to `commands.md` and added system commands and a TOC
- [#480](https://github.com/openscope/openscope/issues/480) - Consolidate console warnings for missing fixes to single message
- [#516](https://github.com/openscope/openscope/issues/516) - Update Ezeiza (SAEZ) - Updated all procedures, added video map, updated traffic, added new airlines
- [#660](https://github.com/openscope/openscope/issues/660) - Lower spawn altitude for arrivals into MDSD so they can descend in time


# 5.3.0 (August 1, 2017)
### Features
- [#288](https://github.com/openscope/openscope/issues/288) - New airport: MDSD (Las Américas International Airport, Dominican Republic)
    - Includes Terrain and Video map
    - Adds Copa Airlines (CMP) and PAWA Dominicana (PWD)
- [#572](https://github.com/openscope/openscope/issues/572) - Add new openScope emblem vector graphic
- [#484](https://github.com/openscope/openscope/issues/572) - Adds additional meta tags to index.html head
- [#581](https://github.com/openscope/openscope/issues/581) - Adds a link to the full command reference at the end of the tutorial
- [#536](https://github.com/openscope/openscope/issues/536) - The distance separator behind aircraft on ILS is now toggleable
- [#411](https://github.com/openscope/openscope/issues/411) - Removes the blue line "departure window"

### Bugfixes
- [#562](https://github.com/openscope/openscope/issues/562) - Removes inactive danger areas at EIDW
- [#570](https://github.com/openscope/openscope/issues/570) - Make aircraft proceed direct new fix after full reroute
- [#383](https://github.com/openscope/openscope/issues/383) - Recalculate SID/STAR legs when changing assigned runway
- [#510](https://github.com/openscope/openscope/issues/510) - Remove +/-/= zoom hotkey, conflicts with speed
- [#577](https://github.com/openscope/openscope/issues/577) - Correct EGKK's departure fix

### Refactors
- [#586](https://github.com/openscope/openscope/issues/586) - Fix spelling error of `CanvasController` as `ConvasController`
- [#290](https://github.com/openscope/openscope/issues/290) - Remove deprecated fixRadialDist()
- [#593](https://github.com/openscope/openscope/issues/593) - Renamed `MIDDLE_PESS` as `MIDDLE_PRESS` in `InputController`
- [#602](https://github.com/openscope/openscope/issues/602) - Fix instances of misspelling of @param in code docblocks
- [#599](https://github.com/openscope/openscope/issues/599) - Deprecates `gulp server` task and adds `nodemon` package


# 5.2.1 (July 1, 2017)
### Hotfix
- [#549](https://github.com/openscope/openscope/issues/549) - Ensure previously specified directions of turn are not preserved when a new heading instruction is given


# 5.2.0 (July 1, 2017)
### Features
- [#310](https://github.com/openscope/openscope/issues/310) - Add capability for vectors in route strings
- [#138](https://github.com/openscope/openscope/issues/138) - Adds more context to the Model classes by adding an optional input paramater
- [#191](https://github.com/openscope/openscope/issues/191) - Adds object helper class for object validation
- [#402](https://github.com/openscope/openscope/issues/1402) - Renamed AircraftInstanceModel with AircraftModel
- [#19](https://github.com/openscope/openscope/issues/19) - Add capability for fly-over fixes in route strings
- [#372](https://github.com/openscope/openscope/issues/372) - Adds squawk/sq command
- [#40](https://github.com/openscope/openscope/issues/40) - Adds the ability to call an airplane by its callsign
- [#457](https://github.com/openscope/openscope/issues/457) - Adds `EventBus` and `EventModel`
- [#93](https://github.com/openscope/openscope/issues/93) - Adds `RunwayCollection` and `RunwayRelationshipModel` and moves some runway logic to live in these new classes
    - [#312](https://github.com/openscope/openscope/issues/312) - Abstracts headwind/crosswind calculations to RunwayModel
    - [#58](https://github.com/openscope/openscope/issues/58) - Removes circular reference in AirportModel.runway.airportModel
- [#469](https://github.com/openscope/openscope/issues/469) - Updates `SpawnPatternModel` to use the `AirportModel.arrivalRunway` property when gathering waypoint models needed to calculate initial aircraft heading
- [#33](https://github.com/openscope/openscope/issues/33) - Adds support for suffixes in SID and STAR procedures
- [#476](https://github.com/openscope/openscope/issues/476) - Adds game option to include/hide WIP airports in the airport list
- [#285](https://github.com/openscope/openscope/issues/285) - Adds `StripViewController`, `StripViewCollection`, and `StripViewModel` classes
    - Removes progress strip logic from the `AircraftModel`
    - Completely reworks CSS for `StripViewList`
- [#491](https://github.com/openscope/openscope/issues/491) - Adds `.isGroundedFlightPhase()` and implements this helper in `.buildWaypointModelsForProcedure()`
    - This allows for waypointModels to be build from the correct collection based on `flightPhase`
- [#477](https://github.com/openscope/openscope/issues/477) - Updates `AircraftModel.onAirspaceExit()` to look only at the `mcp.headingMode` value
- [#423](https://github.com/openscope/openscope/issues/423) - Adds user setting option to change length of PTL
- [#208](https://github.com/openscope/openscope/issues/208) - Updates Dublin (EIDW) - Improved procedures, added terrain and video map, modified airspace, realistic traffic
- [#508](https://github.com/openscope/openscope/issues/508) - Updates logic to display historical aircraft position for aircraft outside controlled airspace
- [#418](https://github.com/openscope/openscope/issues/418) - Updates development-workflow-procedures, adds Quick Start guide to README and consolidates all documentation in the `documentation` directory
- [#434](https://github.com/openscope/openscope/issues/434) - Adds tests and verifies functionality of non-procedural departures and arrivals (support for direct route strings)
- [#483](https://github.com/openscope/openscope/issues/483) - Adds unique transponder and CID generation methods
- [#137](https://github.com/openscope/openscope/issues/137) - Abstracts non game loop logic into new class `AppController`, which provides facade methods for `App` to call during game loop
- [#72](https://github.com/openscope/openscope/issues/72) - Converts `AirportController`, `GameController` and `UiController` to static classes
    - updates `window` references to these classes
    - updates `prop` references to these classes
- [#32](https://github.com/openscope/openscope/issues/32) - Add support for ranged altitude and speed restrictions in procedures
- [#32](https://github.com/openscope/openscope/issues/32) - Improve VNAV climbs and descents to better comply with restrictions
- [#228](https://github.com/openscope/openscope/issues/228) - Updates Boston Logan Intl. (KBOS) - Updated procedures, added video map and terrain, modified airspace, realistic traffic
- [#535](https://github.com/openscope/openscope/issues/535) - Removes left over references to `AircraftStripView` in `AircraftModel`

### Bugfixes
- [#385](https://github.com/openscope/openscope/issues/385) - Fixes coordinate letter issue at SBGL
- [#424](https://github.com/openscope/openscope/issues/424) - Prevent NaNs being passed on if invalid altitude is given
- [#356](https://github.com/openscope/openscope/issues/356) - Removes fix command from tutorial and replaces it with infomation on 'route', 'Say Route', and 'Proceed Direct'
- [#325](https://github.com/openscope/openscope/issues/325) - Fixes coordinate letter issues at RJBB, OSDI, OTHH
- [#448](https://github.com/openscope/openscope/issues/448) - Removes KBOS fixes from EKCH
- [#492](https://github.com/openscope/openscope/issues/492) - Runway, wind and spawnPattern changes to allow EGNM to operate
- [#467](https://github.com/openscope/openscope/issues/467) - Prevent attempts to access positions of vector waypoints
- [#451](https://github.com/openscope/openscope/issues/451) - Adjusts fix validation for hold/vector/flyover fix names
- [#521](https://github.com/openscope/openscope/issues/521) - Prevents simulator from wrongfully overriding assigned alt/hdg during approach clearances
- [#522](https://github.com/openscope/openscope/issues/522) - Updates `AirportModel.buildRestrictedAreas()` to build the coordinate array with the correct shape
- [#539](https://github.com/openscope/openscope/issues/539) - Adds local reference to `EventBus` inside `AircraftCommander`
- [#344](https://github.com/openscope/openscope/issues/344) - Cancel approach clearances whenever an altitude or heading instruction is given
- [#546](https://github.com/openscope/openscope/issues/546) - Make flight strips show appropriate altitude values


# 5.1.1 (May 12, 2017)
### Hotfix
- [#458](https://github.com/openscope/openscope/issues/458) - Fixes or removes from load list all airports that fail to load


# 5.1.0 (May 1, 2017)
### Features
- [#316](https://github.com/openscope/openscope/issues/316) - adds [deployment-checklist](tools/documentation/deployment-checklist.md) document
- [#184](https://github.com/openscope/openscope/issues/184) - Updates the airport-format.md file
- [#374](https://github.com/openscope/openscope/issues/374) - allow for specification of airport's default arrival and departure runway
- [#367](https://github.com/openscope/openscope/issues/367) - adds [airport-file-standards](tools/documentation/deployment-checklist.md) document

### Bugfixes
- [#364](https://github.com/openscope/openscope/issues/364) - Adds additional check for `undefined` in `CommandParser` when adding args to a `CommandModel`
- [#370](https://github.com/openscope/openscope/issues/370) - Deprecates and removes `AircraftController._setDestinationFromRouteOrProcedure()` as it was implemented to maintain a previous api which is no longer used
- [#188](https://github.com/openscope/openscope/issues/188) - Ensure the verbal and text instructions/readbacks state the correct directionality
- [#396](https://github.com/openscope/openscope/issues/396) - Updates Pilot.applyDepartureProcedure() to use RunwayModel correctly
- [#399](https://github.com/openscope/openscope/issues/399) - Updates `fms.getDestinationName()` to return the `fixName` when `currentLeg` is not a procedure
- [#394](https://github.com/openscope/openscope/issues/394) - Fix wrong PTL length and set to 1 minute
- [#404](https://github.com/openscope/openscope/issues/404) - Fixes broken link in [airport-format](tools/documentation/airport-format.md)
- [#395](https://github.com/openscope/openscope/issues/395) - Fix datablock speed to show GS, not IAS
- [#408](https://github.com/openscope/openscope/issues/408) - Ensure red response is given to `rr FIXXA..FIXXB`
- [#410](https://github.com/openscope/openscope/issues/410) - Fix strip update crash for arrivals on vectors


# 5.0.1 (April 24, 2017)
### Hotfix
- [#359](https://github.com/openscope/openscope/issues/359) - Updates `AircraftStripView` to display departure procedures with the correct `NAME.EXIT` shape


# 5.0.0 (April 21, 2017)
### Major
- [#139](https://github.com/openscope/openscope/issues/139) - Refactors FMS
    - This represents a ground-up, from scratch, re-build of the flight management system with new classes: `Fms`, `LegModel`, and `WaypointModel`
    - Introduces the `ModeController` that completely separates Altitude, Heading and Speed settings from the FMS and allowing the FMS to be in charge of the flight plan and any fixRestrictions defined for a given route
    - Adds `Pilot` class that acts as a coordinator layer between the `AircraftCommander`, `AircraftInstanceModel`, `ModeController`, and `Fms`
    - Completely reworks how `Aircraft.target` is calculated
    - Introduces the concept of `flightPhase`, and begins integrating that property in lieu of category (arrival/departure)
    - Adds ability to define hold waypoints with a symbol `@`
    - Splits `PositionModel` into two new classes; `StaticPositionModel` and `DynamicPositionModel`
    - Work on this issue also resolves or invalidates previously recorded issues:
        - [#57](https://github.com/openscope/openscope/issues/57) - `aircraftInstanceModel.fms` has a circular dependency with `aircraftInstanceModel.fms.my_aircraft.fms`
        - [#73](https://github.com/openscope/openscope/issues/73) - Using STAR command to change aircraft's assigned STAR throws errors
        - [#77](https://github.com/openscope/openscope/issues/77) - Abstract current waypoint altitude and speed setting
        - [#78](https://github.com/openscope/openscope/issues/78) - Add Leg to modelSourcePool
        - [#79](https://github.com/openscope/openscope/issues/79) - Refactor fms param out of Leg
        - [#81](https://github.com/openscope/openscope/issues/81) - Extend RouteModel, or add new layer, to handle compound routes
        - [#86](https://github.com/openscope/openscope/issues/86) - Rerouting aircraft causes it to climb to unassigned altitude
        - [#87](https://github.com/openscope/openscope/issues/87) - deprecate `aircraft.eid`
        - [#114](https://github.com/openscope/openscope/issues/114) - Implied holding in route strings
        - [#122](https://github.com/openscope/openscope/issues/122) - Rerouting uncleared aircraft onto SID fails
        - [#123](https://github.com/openscope/openscope/issues/123) - Using "fix" command yields legs with lower case route
        - [#129](https://github.com/openscope/openscope/issues/129) - Create getter in `AircraftInstanceModel` to get the current runway
        - [#144](https://github.com/openscope/openscope/issues/144) - create RouteBuilder class and smooth out RouteModel
        - [#153](https://github.com/openscope/openscope/issues/153) - `fix` command with multiple arguments skips to last fix
        - [#158](https://github.com/openscope/openscope/issues/158) - Add `.hasFix()` method to FixCollection
        - [#197](https://github.com/openscope/openscope/issues/197) - Route amendments will stop altitude changes
        - [#287](https://github.com/openscope/openscope/issues/287) - `StaticPositionModel` and enforcing use of Positions where appropriate

### Features
- [#269](https://github.com/openscope/openscope/issues/269) - Enumerate magic number in RunwayModel
- [#281](https://github.com/openscope/openscope/issues/281) - Replaced old `terrain.svg` file with own work

### Bugfixes
- [#256](https://github.com/openscope/openscope/issues/256) - Standardized indentation in all json files
    - followed up and corrected 2 mistakenly cleared out aircraft files
- [#263](https://github.com/openscope/openscope/issues/259) - Fixes Firefox compatibility issue by changing ajax to getJSON
- [#303](https://github.com/openscope/openscope/issues/303) - Fixes bug with departures at SAME
- [#321](https://github.com/openscope/openscope/issues/321) - Fixes coordinates for PAM at EHAM
- [#340](https://github.com/openscope/openscope/issues/340) - Ensure aircraft reach their targeted speed
- [#342](https://github.com/openscope/openscope/issues/342) - Fixes last-second go-arounds by landing aircraft
- [#346](https://github.com/openscope/openscope/issues/346) - Ensure aircraft follow glideslope
- [#338](https://github.com/openscope/openscope/issues/338) - Fix mispronunciation of grouped numbers '820' as 'eight-twenty-zero'


# 4.1.2 (February 20, 2017)
### Hotfix
- [#252](https://github.com/openscope/openscope/issues/252) - Updates `static.json` to not use ssl


# 4.1.1 (February 20, 2017)
### Hotfix
- [#249](https://github.com/openscope/openscope/issues/249) - Restores spawning of GA aircraft at EDDT


# 4.1.0 (February 20, 2017)
### Major
- [#154](https://github.com/openscope/openscope/issues/154) - Removes GitHub Pages specific files and moves hosting out of GitHub Pages.
- [#230](https://github.com/openscope/openscope/issues/230) - Updates build process to:
    - minify css and javascript and output to `public` directory
    - minify airport json/geojson files and output to `public` directory
    - combine aircraft and airline json files into `aircraft.json` and `airline.json` and output them to the `public` directory
    - copy static assets (fonts and images) to `public` directory
    - introduce [Handlebars](https://www.npmjs.com/package/handlebars-layouts) templates and create `buildMarkup` build process
    - point the local server to the `public` directory`

### Features
- [#109](https://github.com/openscope/openscope/issues/109) - Makes sure the output for sid and star commands are always uppercase.
- [#179](https://github.com/openscope/openscope/issues/179) - Marks all airports as works in progress
- [#166](https://github.com/openscope/openscope/issues/166) - Changes deployment server from Express to Nginx
- [#163](https://github.com/openscope/openscope/issues/163) - Adds javascript minification to build process
    - adds copy task to public directory
    - translates `json_assembler.rb` to `jsonAssembler.js` and adds it to the build process.
- [#222](https://github.com/openscope/openscope/issues/222) - Corrects `icao` of the Boeing 767-400 and also updates the information to Eurocontrol data
- [#224](https://github.com/openscope/openscope/issues/224) - Updates `app.json` to use correct buildpacks
- [#104](https://github.com/openscope/openscope/issues/104) - Overhauls Munich - updates Munich to AIRAC 1702, adds STARs, and adds a realistic traffic flow.
- [#103](https://github.com/openscope/openscope/pull/202) - Adds Tokyo Narita International Airport as per AIRAC 1702
- [#149](https://github.com/openscope/openscope/issues/149) - Fixes an instance of two runways called "34R" in Shanghai Pudong

### Bugfixes
- [#201](https://github.com/openscope/openscope/issues/201) - Adds the required space between 'fh' and its argument in the tutorial
- [#195](https://github.com/openscope/openscope/issues/195) - Updates airline json files to include `icao` key. Updates `AirlineCollection` and `AirlineModel` to handle variable casing of `icao`
- [#207](https://github.com/openscope/openscope/issues/207) - Adds a default position value to `SpawnPatternModel` so aircraft have, at least, a `[0, 0]` starting position
- [#210](https://github.com/openscope/openscope/issues/210) - Ensures data block colored bars are all the same width (3px), regardless of callsign length
- [#210](https://github.com/openscope/openscope/issues/210) - Adds missing `return` in `.generateFlightNumberWithAirlineModel()` that was needed to properly recurse back through the method in the case of a duplicate flight number.
- [#203](https://github.com/openscope/openscope/issues/203) - Updates boolean logic in `App.updateViewControls()` which was evaluating an asynchronous property that, typically, had not finished loading.
- [#148](https://github.com/openscope/openscope/issues/148) - Fixes internal fms error that was breaking the game when issuing holds over present position


# 4.0.1 (January 29, 2017)
### Features
- [#170](https://github.com/openscope/openscope/issues/170) - Adds Openscope favicon

### Bugfixes
- [#176](https://github.com/openscope/openscope/issues/176) - Removes `ALM` and `SVD` arrival patterns from 'EKCH' because there aren't enough fixes to support them
- [#177](https://github.com/openscope/openscope/issues/177) - Updates `entryPoint` and `exitPoint` to be pluralized as is the airport json standard
- [#175](https://github.com/openscope/openscope/issues/175) - Adds `entryPoints` to `gcrr` star route definitions
- [#174](https://github.com/openscope/openscope/issues/174) - Fixes arrival pattern that was using an array of fix names instead of a routeString.
- [#173](https://github.com/openscope/openscope/issues/173) - Updates `wmkk` StandardRoute definition to include at least one fixname


# 4.0.0 (January 26, 2017)
### Major
- [n8rzz/atc#220](https://github.com/n8rzz/atc/issues/220) - Restructures `src` files into `client` and `server` folders.
- [n8rzz/atc#184](https://github.com/n8rzz/atc/issues/184) - Updates Node to version 7.0.0
- [n8rzz/atc#181](https://github.com/n8rzz/atc/issues/181) - Moves aircraft command logic from `AircraftInstanceModel` to new `AircraftCommander` class
- [n8rzz/atc#243](https://github.com/n8rzz/atc/issues/243) - Adds `spawnPatterns` to airport json and vastly simplifies aircraft creation. Work on this issue ended up resolving many other smaller issues listed below.
  - [n8rzz/atc#229](https://github.com/n8rzz/atc/issues/229) - Restructure `Airport.departures` to utilize routes
  - [n8rzz/atc#56](https://github.com/n8rzz/atc/issues/56) - Abstract inline fix object out of ArrivalBase
  - [n8rzz/atc#27](https://github.com/n8rzz/atc/issues/27) - Simplify creation of arrival aircraft
  - [n8rzz/atc#242](https://github.com/n8rzz/atc/issues/242) - Include airline id in airline json
  - [n8rzz/atc#235](https://github.com/n8rzz/atc/issues/235) - Create SpawnCollection, SpawnModel and SpawnScheduler classes
  - [n8rzz/atc#28](https://github.com/n8rzz/atc/issues/28) - Circular reference in airportModel.departures.airport
  - [n8rzz/atc#28](https://github.com/n8rzz/atc/issues/28) - Circular reference in airportModel.departures.airport

### Minor
- [n8rzz/atc#193](https://github.com/n8rzz/atc/issues/193) - Changes `AircraftStripView` text outputs to be all uppercase
- [n8rzz/atc#133](https://github.com/n8rzz/atc/issues/133) - Ensures proper removal of all `AircraftConflict` instances involving an aircraft that has been removed from the simulation
    - Originally reported in [zlsa/atc#734](https://github.com/zlsa/atc/issues/734)
- [n8rzz/atc#205](https://github.com/n8rzz/atc/issues/205) - Changes the names from having the flags in their name by adding WIP variable to the `AIRPORT_LOAD_LIST` in `airportLoadList`
- [n8rzz/atc#192](https://github.com/n8rzz/atc/issues/192) - Fixes white space in that is displayed from the `AircraftInstanceModel`
- [n8rzz/atc#233](https://github.com/n8rzz/atc/issues/233) - Adds cache to travis build

### Bugfixes
- [n8rzz/atc#104](https://github.com/n8rzz/atc/issues/104) & [n8rzz/atc#237](https://github.com/n8rzz/atc/issues/237) - Resets current indicies when issuing a new star to an arriving aircraft
    - Originally reported in [zlsa/atc#730](https://github.com/zlsa/atc/issues/730) & [zlsa/atc#768](https://github.com/zlsa/atc/issues/768)


# 3.2.1 (January 2, 2017)
### Bugfixes
- [n8rzz/atc#206](https://github.com/n8rzz/atc/issues/206) - Restores behavior of aircraft flying present heading after completing all legs in their flightplan
    - Originally reported in [zlsa/atc#767](https://github.com/zlsa/atc/issues/767)
- [n8rzz/atc#241](https://github.com/n8rzz/atc/issues/241) - Fix wrongful removal of departures from runway queues when arrivals land
    - Originally reported in [zlsa/atc#770](https://github.com/zlsa/atc/issues/770)
- [n8rzz/atc#240](https://github.com/n8rzz/atc/issues/240) - Fix erroneous voice readbacks for altitude command
    - Originally reported in [zlsa/atc#769](https://github.com/zlsa/atc/issues/769)
- [n8rzz/atc#133](https://github.com/n8rzz/atc/issues/133) - Fixes behavior of AircraftConflict in various ways, particularly with removal after deletion of aircraft
    - Originally reported in [zlsa/atc#734](https://github.com/zlsa/atc/issues/734)


# 3.2.0 (December 20, 2016)
### Major
* [n8rzz/atc#53](https://github.com/n8rzz/atc/issues/53) - Integrates `sidCollection` and `starCollection` with `RouteModel` within `AircraftInstanceModel`
    - Creates getters for `currentLeg` and `currentWaypoint`
    - Abstracts restrictions logic to live within `Waypoint`
    - Consolidates `runSID()` and `climbViaSid()` logic
- [n8rzz/atc#54](https://github.com/n8rzz/atc/issues/54) - Deprecates `sid` and `star` properties of the `AirportModel` in favor of `sidCollection` and `starCollection`
- [n8rzz/atc#169](https://github.com/n8rzz/atc/issues/169) - Adds [Express](expressjs.com) server to serve static assets and add [travis](travis-ci.org) config file for travis continuous integration
- [n8rzz/atc#114](https://github.com/n8rzz/atc/issues/114) - Rewrites the CommandParser from the ground up
- [n8rzz/atc#216](https://github.com/n8rzz/atc/issues/216) - Removes `Pegjs` and references completing switch to new CommandParser

### Minor
- [n8rzz/atc#77](https://github.com/n8rzz/atc/issues/77) - Implements `modelSourceFactory` and `modelSourcePool`
- [n8rzz/atc#144](https://github.com/n8rzz/atc/issues/144) - Refactors `canvasController.canvas_draw_sids` method to use `airport.sidCollection` instead of `airport.sid`
- [n8rzz/atc#55](https://github.com/n8rzz/atc/issues/55) - Moves properties shared by all `Arrival` types up to `ArrivalBase`
- [n8rzz/atc#52](https://github.com/n8rzz/atc/issues/52) - Removes `$.each()` from `AirportModel` in favor of `_forEach()` and uses `_get()` inside `aircraftInstanceModel.parse()` instead of if statements
- [n8rzz/atc#135](https://github.com/n8rzz/atc/issues/135) - Moves creation of Legs and Waypoints to constants instead of as method arguments
- [n8rzz/atc#17](https://github.com/n8rzz/atc/issues/17) - Moves `.parseCoordinate()` out of `PositionModel` and into `unitConverters`
- [n8rzz/atc#128](https://github.com/n8rzz/atc/issues/128) - Moves flight management system files to `FlightManagementSystem` folder
- [n8rzz/atc#163](https://github.com/n8rzz/atc/issues/163) - Adds `RouteModel` to `AircraftInstanceModel.runSTAR` for easier handling of a route string
- [n8rzz/atc#159](https://github.com/n8rzz/atc/issues/159) - Adds static `calculatePosition` method to `PositionModel` and abstracts common functions
- [n8rzz/atc#135](https://github.com/n8rzz/atc/issues/135) - Replaces active airport icao in view with a zulu time clock
- [n8rzz/atc#167](https://github.com/n8rzz/atc/issues/167) - Consolidates test fixtures in fixtures directory
* [n8rzz/atc#176](https://github.com/n8rzz/atc/issues/176) - Addresses issue with video maps being drawn incorrectly.
    - Updates `PositionModel` to run all calculations through the static `.calculatePosition()` method and vastly simplifies internal logic.
- [n8rzz/atc#186](https://github.com/n8rzz/atc/issues/186) - Refactors the the function names in `FixCollection` to better fit their function. `init()` to `addItems()` and `destroy()` to `removeItems()`
- [n8rzz/atc#194](https://github.com/n8rzz/atc/issues/194) - Adds gulp-cli and adds [tools readme](tools/README.md) link to gulp issues with Windows
- [n8rzz/atc#188](https://github.com/n8rzz/atc/issues/188) - Changes `routeString` to `routeCode` in `RouteModel` and moves `.toUpperCase()` from the getter to `.init()`
- [n8rzz/atc#175](https://github.com/n8rzz/atc/issues/175) - Updates `StandardRouteModel` to throw when entry/exit point doesn't exist within a collection and updates `.setDepartureRunway()` to send the `routeCode` to `Leg` on instantiation
- [n8rzz/atc#134](https://github.com/n8rzz/atc/issues/134) - Prevents collision detection for aircraft that are outside of our airspace
    - Originally reported in [zlsa/atc#736](https://github.com/zlsa/atc/issues/736)
- [n8rzz/atc#211](https://github.com/n8rzz/atc/issues/211) - Escape clears commands but not callsign if commands are present
    - Originally reported in [zlsa/atc#763](https://github.com/zlsa/atc/issues/763)

### Bugfixes
- [n8rzz/atc#145](https://github.com/n8rzz/atc/issues/145) - Moves `_comment` blocks in airport json file to be within object the are describing
- [n8rzz/atc#151](https://github.com/n8rzz/atc/issues/151) - Streamlines flight number generation and adds new method to add new callsigns to the existing list
- [n8rzz/atc#182](https://github.com/n8rzz/atc/issues/182) - Adds `_isNumber` check instead of `!magneticNorth` inside `PositionModel.calculateRelativePosition()` and the `AirspaceModel` constructor.
    - Originally reported in [zlsa/atc#754](https://github.com/zlsa/atc/issues/754)
- [n8rzz/atc#196](https://github.com/n8rzz/atc/issues/196) - Adds additional handling to `StandardRouteModel._buildEntryAndExitCollections` to handle case where `entryPoints` and `exitPoints` don't exist in the `airport.sids` definition
    - Originally reported in [zlsa/atc#760](https://github.com/zlsa/atc/issues/760)
- [n8rzz/atc#132](https://github.com/n8rzz/atc/issues/132) - Ensures proper removal of aircraft from the runway queue(s) when that aircraft has been deleted.
    - Originally reported in [zlsa/atc#706](https://github.com/zlsa/atc/issues/706)


# 3.1.0 (November 20, 2016)
### Major
- [n8rzz/atc#18](https://github.com/n8rzz/atc/issues/18) - Adds `FixModel` and static class `FixCollection` for reasoning about airport fixes
- [n8rzz/atc#19](https://github.com/n8rzz/atc/issues/19) - Adds `StandardRoute` classes reasoning about SIDs and STARs
- [n8rzz/atc#82](https://github.com/n8rzz/atc/issues/82) - Moves `airlineController` and `aircraftController` to instantiate from within `airportController` instead from `App`
- [n8rzz/atc#88](https://github.com/n8rzz/atc/issues/88) - Enable airport load without bundling and moves `airportLoadList.js` out of the `src` folder
- [n8rzz/atc#96](https://github.com/n8rzz/atc/issues/96) - Updates score calculations and how they are recorded

### Minor
- [n8rzz/atc#41](https://github.com/n8rzz/atc/issues/41) - Correct casing for Arrival and Departure factories
- [n8rzz/atc#36](https://github.com/n8rzz/atc/issues/36) - Rename `AreaModel` to `AirspaceModel`
- [n8rzz/atc#57](https://github.com/n8rzz/atc/issues/57) - Changes `StandardRoute` property name `icao` to `identifier`
- [n8rzz/atc#44](https://github.com/n8rzz/atc/issues/44) - Introduce early exit for airport load when airport data is not complete
- [n8rzz/atc#60](https://github.com/n8rzz/atc/issues/60) - Adds [git-flow](tools/documentation/git-flow-process.md) strategy document
- [n8rzz/atc#100](https://github.com/n8rzz/atc/issues/100) - Adds `BaseModel`
- [n8rzz/atc#101](https://github.com/n8rzz/atc/issues/101) - Adds `BaseCollection`

### Bugfixes
- [n8rzz/atc#45](https://github.com/n8rzz/atc/issues/45) - WMKK has misnamed star name
- [n8rzz/atc#58](https://github.com/n8rzz/atc/issues/58) - Updates spelling in `.convertMinutesToSeconds[)`
- [n8rzz/atc#75](https://github.com/n8rzz/atc/issues/75) - Future aircraft path, when on ILS, wrong width
- [n8rzz/atc#90](https://github.com/n8rzz/atc/issues/90) - `areas` is undefined in `AirportModel`
- [n8rzz/atc#91](https://github.com/n8rzz/atc/issues/91) - `FixCollection.init()` does not clear current `_items` if any exist
- [n8rzz/atc#108](https://github.com/n8rzz/atc/issues/108) - Aircraft strips show arrival airport in uppercase
- [n8rzz/atc#109](https://github.com/n8rzz/atc/issues/109) - Updates `FixCollection.findFixByName()` to accept upper, mixed, or lower case fix name
- [n8rzz/atc#115](https://github.com/n8rzz/atc/issues/115) - Switching to a previously loaded airport does not clear previous airport fixes
- [n8rzz/atc#191](https://github.com/n8rzz/atc/issues/191) - Fixes `parseElevation()` so that it does not return NaN when it is given the string `'Infinity'`
    - Originally reported in [zlsa/atc#756](https://github.com/zlsa/atc/issues/756)
