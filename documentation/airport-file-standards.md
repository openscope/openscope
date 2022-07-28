# Airport File Standards

## Overview

This document serves as a checklist for airport contributors to review to ensure their airport file is "up to snuff". There are two levels of airports: `Standard` and `Premium`, the latter designator being used only for our most pristine, complete, realistic, and well-documented airports. In order for a new airport to be merged, it must at least meet all the `Standard` specifications listed in the section below. If it does not meet these requirements, it will require extra work before being merged. It will often require a team of people to complete work on an airport, because of the wide variety of tasks to complete.

If you ever need help working on an airport, the best place to go is the [openScope Slack](https://openscopeatc.slack.com) ([click here if you need an invite](http://slack.openscope.io)). There is always somebody available, and many who will be glad to walk you through anything you may need help with.

If you have not contributed before, please note that we will need to add you to the organization so you can keep your branch _directly_ on the openScope repository. We do all branching and pull requests internally like this, instead of using forks. Join slack and request to be invited to the openScope team by `@erikquinn`.

---

## Standard Requirements

### Terrain GeoJSON File

Even if it is empty, a terrain file must be included as part of the pull request. We ask that the qGIS files used in the generation of the terrain GeoJSON file also be uploaded to the [openscope/airport-modeling](https://github.com/openscope/airport-modeling) repository. This way, if an airspace boundary is changed, we can regenerate the terrain file in far less time. This takes a long time to generate, and is quite a pain, but there are people on slack who would be happy to do it for you. See the Reference Materials for a step-by-step guide on how to generate terrain using qGIS.

### Polygonal Airspace Boundary

An airspace boundary must be defined with GPS coordinates. Previously, we allowed just a "airspace center" and "airspace radius", but now there must be a defined edge to the airspace.

### All SIDs & STARs

All procedures for a given airport must be included in the pull request. Not all have to be _used_ for anything, but (to the extent possible) all SIDs and STARs must be present in the file.

### Accurate traffic level (and info to back it up)

The traffic level must be commensurate with real-world levels, with the arrival and departure rates. Airports can be very quiet during some hours, and very busy during others-- therefore, the traffic included in the airport file shall be:

- not less than `yearly operations / 8760` (hourly rate averaged over one year)
- not more than `3x yearly operations / 8760` (hourly rate averaged over one year)

A reference link shall be provided, validating the yearly traffic count, so the reviewer may confirm that the traffic level is appropriate.

### Base video map

A "video map" must be provided with all airports. For most US airports, these are easily found by checking with the appropriate ARTCC within VATUSA on VATSIM. In many other countries, however, these are not available to the public. If the originals cannot be obtained, an appropriate and well-thought-out video map must be created. Using qGIS (see reference materials) is the best way to do this. If you need any help with the creation of a video map, feel free to reach out to us on Slack, where someone will be happy to help you out.

### Spacing

To maintain uniformity in all airport files, only single spaces should be used.

The _single_ exception to this rule is in the `fixes` section, where all five-and-fewer-character fixes should have their colons aligned, as in the accepted example below:

```json
"CUSBU": ["N47d29.91m0", "W122d19.05m0"],
"CVO"  : ["N44d29.97m0", "W123d17.62m0"],
"GRIFY": ["N47d46.15m0", "W122d24.12m0"],
"HAROB": ["N47d14.60m0", "W123d02.45m0"],
"HAWKZ": ["N46d47.08m0", "W122d44.34m0"],
"HETHR": ["N47d33.54m0", "W122d08.70m0"],
"HISKU": ["N44d30.00m0", "W122d56.65m0"],
"HQM"  : ["N46d56.82m0", "W124d08.96m0"],
"LACEE": ["N47d02.82m0", "W122d48.35m0"],
"LIINE": ["N46d50.65m0", "W122d40.11m0"],
"LKV"  : ["N42d29.57m0", "W120d30.42m0"],
"MARNR": ["N48d02.33m0", "W122d50.99m0"]
```

For custom RNAV fixes, such as `_RWY22L05DME`, these shall use single spaces.

### Bracket Newlines

To maintain uniformity in all airport files, please follow the same newline conventions as the example file shown in the Airport Format Document (see Reference Materials.

### Key order

To maintain uniformity in all airport files, all keys used in the file must be included in the same order as they appear in the Airport Format Document (see Reference Materials).

- All fixes must be sorted alphabetically.
- The first object within the `airspace` array must represent the airspace's _outer perimeter_, which encompasses all other airspace sections.
- All runways should be sorted numerically (then L-C-R) by the primary end
- All SIDs/STARs must be sorted alphabetically by ID
- Spawn patterns should be in the exact form described in the Spawn Pattern Format Document (see Reference Materials).
  - Please note that spawnPatterns must include all keys, even those that are not used.

### Airport Guide

An airport guide must also be included as a way of providing some knowledge to users about the position they are controlling. The guide should contain the following pieces of information:

- General details of the position (location and annual operations)
- Extent and structure of the airspace (lateral and vertical limits)
- Details on the instrument procedures of the primary airport
- List of positions/sectors of the airspace
- Some information on the different airports controlled by the position (location, annual operations, type of traffic)
- Additional resources (relevant documents, videos, files, etc.)

See reference materials for an example of an airport guide.

---

## Requirements for "Premium Airport" Designation

### Airways

Relevant airways, whether they are used by procedures or spawn patterns or not, must be included as a part of the airport submission. This includes:

- All airways within the lateral airspace boundary
  - Must extend a minimum of 50 miles from the airspace boundary
- All airways _connected to_ any airway that transits the airspace
  - Must extend a minimum of 50 miles from the airspace boundary

### Full documentation on facility's airspace

Depending on the country of origin, this can be difficult to obtain or generate. But to the extent possible, documentation must be generated about the general flows of traffic, relevant local procedures and conventions, standard/acceptable/unacceptable routings, agreements with neighboring sectors or facilities, and any other unusual information specific to this facility that a user would need to know in order to run the airspace realistically.

### Airspace and traffic flow diagrams

To go with the written documentation, diagrams should be provided as a visual aid to show the airspace structure, alignment of SID/STARs, arrival and departure corridors (if applicable), airspace sectorization (including what "sector(s)" _we_ are simulating).

### Accurate Airspace Stratification

The airspace in the submitted airport must have the same stratification (aka 'shelving') as the real-world facility. This means that if one section is owned from the SFC-8000, and another section from 4000-8000, they must have separate entries within the `airspace` tag of the airport file. Users will be able to examine the airspace stratification _in-game_ with a button that will toggle on and off the airspace section outlines with altitude ranges indicated within them in text.

### Exceptionally high realism (subjective to local knowledge)

In general, in order to achieve "Premier Airport" status, the airport must be accurate to its real-world counterpart to the maximum degree achievable with the current limitations of the simulator. This requirement is subjective, and may often require that we find individuals who are familiar with the airspace and can verify its authenticity. So while choosing an airport to bring into the level of the "Premium" designation, be sure to choose one where you know we can get feedback from people who control (or fly) in that airspace on a regular basis.

---

### Further Reference Materials

- [Terrain Generation Document](airport-terrain-generation.md)
- [qGIS (for GPS-referenced modeling)](http://www.qgis.org/en/site/)
- [Airport Format Document](airport-format.md)
- [Spawn Pattern Format Document](spawnPatternReadme.md)
- [Example Airport Guide for KSEA](airport-guides/ksea.md)
