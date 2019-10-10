# Terrain Generation

## Table of Contents

- [Introduction](#Introduction)
- [Initial setup with QGIS 2.18](#initial-setup-qgis-218)
- [Initial setup with QGIS 3.4+](#initial-setup-qgis-34)

## Introduction

This guide will show you how to generate a terrain file for any airport in openScope. This is mainly done using QGIS, a free and open source Geographic Information System. The process can be quite tedious and often frustrating, so if you get stuck somewhere, you can talk to us on [Slack](http://slack.openscope.co/), where we will be happy to help you!

## Initial setup (QGIS 2.18)

### Install QGIS version 2.18 from the [QGIS website](http://www.qgis.org/en/site/forusers/download.html)

*Note: QGIS version 3 is not compatible with the Zonal Statistics plugin.*

### Install Zonal Statistics plugin

* Open QGIS and navigate to `Plugins->Manage and install plugins...`
* Search for `Zonal statistics plugin` and enable plugin

### Create a folder to dump all your files into

* The folder should be named after the airport's ICAO code, e.g. `~/KSEA/`
*Note: Throughout this guide it will be referred to as `~/terrain/`*

### Obtain elevation data

* Go to [this site](http://viewfinderpanoramas.org/Coverage%20map%20viewfinderpanoramas_org3.htm) and download all the tiles which cover your airport and its surrounding area
* Extract the zip files into a new folder `~/terrain/DEM/`

### Obtain airspace coordinates

* Copy all the coordinates within the airspace key of your airport file
* Convert the coordinates to the right format using [this web app](https://jakcharvat.github.io/polygonConverter/) *(Thanks @jakcharvat for this wonderful tool!)*
* Copy the output and paste it on a new file.
* Save the file as `~/terrain/airspace.csv/`

## QGIS

### Build Raster

* Go to `Raster->Miscellaneous->Build Virtual Raster(Catalog)...`
* Check `Choose input directory instead of files`
* For input directory select `~/terrain/DEM/`
* Check `Recurse subdirectories`
* For Output file select `~/terrain/dem.vrt`
* Check `Load into canvas when finished`
* Click `OK`

*Note: After it completes, click `OK` on the popups and `Close` on the Build Virtual Raster window*.

### Import Airspace

* In QGIS, go to `Layer->Add Layer->Add Delimited Text Layer...`
* For `File Name` browse `~/terrain/airspace.csv/`
* For `File Format` check `Custom Delimiters`
* For `Geometry Definition` check `Well Known Text (WKT)`
* Click `OK`

* Go to `Vector->Geometry Tools->Polygons to Lines...`
* Input layer: `airspace`
* Click `Run`
* On the Layers Panel, Rename `Lines from polygons` to `perimeter`

### Trim Raster

* Go to `Vector->Geoprocessing Tools->Fixed distance buffer`
* Input layer: `airspace`
* Distance: `0.005`
* Click `Run`

* Go to `Processing->Toolbox`
* Search for `Clip raster by mask layer`
* Input layer: `dem`
* Mask Layer: `Buffer`
* Click `Run`

*Note: QGIS may seem frozen while the algorithm is run, but it is still running. Try not clicking anywhere on the program to ensure it does not crash.*

* Go to `Vector->Geometry Tools->Polygons to Lines`
* Input layer: `Buffer`
* Click `Run`

* On the Layers Panel, Rename `Lines from Polygons` layer to `clipping`
* Remove `Buffer` layer

### Build Contours

* Go to `Raster->Extraction->Contour...`
* Input: `Clipped (mask)`
* Output: `~/terrain/contours.shp/`
* Interval between contour lines: `304.8` *(1000ft in meters)*
* Click `OK`

*Note: After it completes, click `OK` on the popups and `Close` on the Contour window*.

* Go to `Vector->Geometry Tools->Simplify geometries`
* Input layer: `contours`
* Tolerance: `0.002`
* Click `Run`

* On the Layers Panel, remove `contours` layer
* Rename `Simplified` layer to `contours`

### Process Contours

* Go to `Vector->Data Management Tools->Merge Vector Layers`
* Layers to Merge: `perimeter` & `contours`
* Click `Run`

* In the Processing Toolbox, seach for `Polygonize` tool
* Input: `Merged`
* Click `Run`

* Go to `Vector->Geoprocessing Tools->Clip`
* Input: `Polygons from Lines`
* Clip: `airspace`
* Click `Run`

* In the Layers Panel, Remove `Polygons from Lines` layer
* Go to `Vector->Geoprocessing tools->Eliminate Sliver Polygons`
* Input layer: `Clipped`
* Selection attribute: `area`  *(Note: May require changing input layer to `airspace` and back to `Clipped`)*
* Comparison: `<=`
* Value: `0.00005`
* Merge selection: `Largest common boundary`
* Click `Run`

*Note: This step can sometimes take a while to complete.

### Prepare for Export

* Go to `Raster->Zonal statistics->Zonal statistics`
* Raster Layer: `Clipped (mask)`
* Polygon layer: `Cleaned`
* Statistics to calculate: `mean`
* Click `OK`

* In the Layers Panel, select `Cleaned` layer
* Go to `Layer->Toggle Editing`
* Go to `View->Select->Select by Expression...`
* Expression: `"mean" < 304.8`
* Click `Select`
* Click `Close`
* Go to `Edit->Delete selected`

* Open `Field Calculator` *(Button with an Abacus at the top of the screen)*
* Check `Create virtual field`
* Output field name: `elevation`
* Output field type: `Decimal number (real)`
* Expresion: `floor("mean" / 304.8) * 304.8`
* Click `OK`

* Go to `Layer->Save Layer Edits`
* Go to `Layer->Toggle Editing`

### Export Terrain

* Go to `Layer->Save As...`
* Format: `GeoJSON`
* File Name: `~/terrain/icao.geojson/` where `icao` is the ICAO code of your airport, e.g. `KSEA.geojson`
* CRS: `EPSG:4326, WGS 84`
* Fields to export: `elevation`
* Coordinate precision: `10`
* Click `OK`

* Go to `Project->Save As...`
* Save as `~/terrain/icao.qgs/` where `icao` is the ICAO code of your airport, e.g. `KSEA.qgs`
* Exit QGIS
* Delete `DEM` folder from `~/terrain/`

## Final Steps

* Go to the [Airport Modelling Repo](https://github.com/openscope/airport-modeling/tree/master/airports)
* Click `Upload Files`
* Drag `~/terrain/` folder into the page.
* Add a simple commit title
* Check `Commit directly to the master branch`
* Click `Commit changes`

* Copy the `~/terrain/icao.geojson` file into `~/openscope/assets/airports/terrain/`
* In the airport file, ensure `has_terrain` is set to `true`

## Congratulations

If you've made it this far, you have successfully generated a terrain file for openScope. Give yourself a break now, you deserve it!

If you're having any problems while following this guide, you can talk to us on [Slack](http://slack.openscope.co/), where we will be happy to help you!

## Initial setup (QGIS 3.4+)

### Install QGIS version 3.4 from the [QGIS website](https://qgis.org/en/site/forusers/download.html)

It's advisable to use the Long term release (LTR) of QGIS (v.3.4) as likely to be the most stable version. A [video on YouTube](https://youtu.be/V0A83VNzLCU) demonstrates how to get started.

### Download and unzip the NOAA GSHHG database

The NOAA provide shorelines, lakes and waterway data in the form of the Global Self-consistent, Hierarchical, High-resolution Geography
Database (GSHHG). These are required by the QgsOpenScope plugin in order to generate water polygons.

1. Download the [GSHHG Shapefiles](https://www.ngdc.noaa.gov/mgg/shorelines/data/gshhg/latest/gshhg-shp-2.3.7.zip)
2. Unzip the `GSHHS_shp/f` to a location of your choice
3. The plugin only uses files in the `GSHHS_shp/f` directory. All other files aren't needed (altough they're interesting to look at)

### Install the QgsOpenScope plugin

The plugin must be installed manually as it has not been published in the QGIS plugin repository. It replicates the processes above,
including the downloading of elevation data (hgt files), as well as generating water polygons.

1. Download the QgsOpenScope plugin from the [GitGub website](https://github.com/openscope/qgsopenscope/releases)
2. Open QGIS and navigate to `Plugins->Manage and install plugins...`
3. Select `Install from ZIP file`, and select the ZIP file you just downloaded

### Configure the QgsOpenScope

Before being used, the plugin needs to know the location of the GSHHG files

1. Navigate to `Plugins->QgsOpenScope->QgsOpenScope Settings`
2. Specify the path to the openScope airport JSON files, this isn't strictly necessary but makes things quicker to load airports
3. Optionally update the path that is used for storing temp files, this should default to the OS default
4. Specify the path the the GSHHG shapefiles. **Note: this is the path that contains the GSHHS_shp directory**

### Loading openScope airport files

Navigate to `Plugins->QgsOpenScope->Load Airport`, select the airport you want to load. The plugin will clear any existing layers
(it will prompt you to confirm), and will generate the following items:

* Fixes
* Restricted
* Maps
   - One layer for every MapModel in the `maps` property
* Terrain
   - Existing Terrain (if found)
* Airspace
* Airspace (Hidden) (taken from the `_airspace` property)

### Generating terrain

Terrain generation is as simple, albeit slower as the plugin will need to download the height files, and more processing time is required.

1. Select a polygon that will represents the bounds of the terrain. This will usually be the largest (or only polygon) in the Airspace layer
2. Navigate to `Plugins->QgsOpenScope->Generate Terrain`, and select the airport file (this should be the file you last opened)
3. Wait... this can take some time as it's a CPU intensive process
4. Two more layers should be added to the Terrain group:
    - Water
    - Contours - Final

### Modifying water polygons

In some cases (KSFO, KSEA for example), the video map will already have coastline data. Rather than modifying the video maps, the water polygons
are required to be modified to coincided with the video map. This uses two QGIS functions:

* The [Reshape Feature](https://docs.qgis.org/3.4/en/docs/user_manual/working_with_vector/editing_geometry_attributes.html#reshape-features)
* Clipping, including the the [Automatic Tracing tool](https://docs.qgis.org/3.4/en/docs/user_manual/working_with_vector/editing_geometry_attributes.html?highlight=trace#automatic-tracing)

The tools aren't the most intuitive to use, so it's worth reading the QGIS documentation in the links above. A [video on YouTube](https://youtu.be/5-rSBTLS3kA)
demonstrates how this can be done:

1. Select the layer you want to edit (this will most likely be the `Water` layer)
2. Enable editing of the layer (either from the Toolbar, or from the Layer context menu)
3. Select the `Reshape Features` tool from the `Advanced Digitizing Toolbar`
4. `Enable Snapping` (Keyboard `S`) from the `Snapping Toolbar`
5. Optionally `Enable Snapping on Intersection` from the `Snapping Toolbar`
6. Optionally `Enable Tracing` (Keyboard `T`) from the `Snapping Toolbar`

**Note: It's advisable to reshape the polygon in shorter segments, this avoids some frustration if the tool fails to work as expected**

The key part of using the shaping tools is that _"For it to work, the reshape tool’s line must cross the polygon’s boundary at least twice."_
eg. The start and end points should be on the opposite side of the polygon edge that the line you want to reshape to is on.

![Reshaping Features](./images/QGIS%20-%20Reshape%20Polygon%20to%20Line.gif)

It gets very tedious having to click on every vertex. This is where the `Tracing` tool is helpful. Instead of having to click on every point, you simply have to enable it (Keyboard `T`) and then click on a vertex along the line. Some notes on using the tool:

* Avoid tracing long segments
* When tracing, hide the all layers other than the one you are tracing. The reduces the change of the tool getting _"lost"_

### Other plugin features

As well as automatic loading of features and terrain generation, the plugin also has the following features. A [video on YouTube](https://youtu.be/V0A83VNzLCU?t=136) demonstrates how to use these tools.

* Circle generation
* Extended runway centreline generation
* Exporting of Fixes, Restricted Airspace, Airspace, Maps, Terrain
