# Table of Contents
- [Table of Contents](#table-of-contents)
- [Terrain Generation](#terrain-generation)
  * [Introduction](#introduction)
  * [Initial setup (QGIS 2.18)](#initial-setup-qgis-218)
    + [Install QGIS version 2.18](#install-qgis-version-218)
    + [Install Zonal Statistics plugin](#install-zonal-statistics-plugin)
    + [Create a folder to dump all your files into](#create-a-folder-to-dump-all-your-files-into)
    + [Obtain elevation data](#obtain-elevation-data)
    + [Obtain airspace coordinates](#obtain-airspace-coordinates)
  * [QGIS](#qgis)
    + [Build Raster](#build-raster)
    + [Import Airspace](#import-airspace)
    + [Trim Raster](#trim-raster)
    + [Build Contours](#build-contours)
    + [Process Contours](#process-contours)
    + [Prepare for Export](#prepare-for-export)
    + [Export Terrain](#export-terrain)
  * [Final Steps](#final-steps)
  * [Congratulations](#congratulations)
- [Terrain Generation (QGIS 3.4+)](#terrain-generation-qgis-34)
  * [Initial setup (QGIS 3.4+)](#initial-setup-qgis-34)
- [Manual generation of river water polygons](#manual-generation-of-river-water-polygons)
  * [Preamble](#preamble)
  * [Load the existing aiport terrain](#load-the-existing-aiport-terrain)
  * [Load the WDBII rivers](#load-the-wdbii-rivers)
  * [Convert the rivers to polygons](#convert-the-rivers-to-polygons)
  * [Merge all the rivers into the water layer](#merge-all-the-rivers-into-the-water-layer)
  * [Tidy up the generated polygons](#tidy-up-the-generated-polygons)

<small><i><a href='http://ecotrust-canada.github.io/markdown-toc/'>Table of contents generated with markdown-toc</a></i></small>

# Terrain Generation

## Introduction

This guide will show you how to generate a terrain file for any airport in openScope. This is mainly done using QGIS, a free and open source Geographic Information System. The process can be quite tedious and often frustrating, so if you get stuck somewhere, you can talk to us on [Slack](http://slack.openscope.io/), where we will be happy to help you!

## Initial setup (QGIS 2.18)

### Install QGIS version 2.18

Download and install QGIS from the [QGIS website](http://www.qgis.org/en/site/forusers/download.html)

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

If you're having any problems while following this guide, you can talk to us on [Slack](http://slack.openscope.io/), where we will be happy to help you!

# Terrain Generation (QGIS 3.4+)

## Initial setup (QGIS 3.4+)

Using QGIS 3.4 and above, there is now a plugin - [qgsopenscope](https://github.com/openscope/qgsopenscope) that:

* Loads the airport.json files
* Automates the terrain generation process described above
* Generates water polygons from the NOAA's [Global Self-consistent, Hierarchical, High-resolution Geography Database (GSHHG)](https://www.ngdc.noaa.gov/mgg/shorelines/) database.

Intructions on how to install and use the plugin are located in the repository, as well as some videos (no audio, but subtitled) on YouTube that demonstrate the usage:

* [The qgsopenscope repository](https://github.com/openscope/qgsopenscope)
* Video - [Installing and using the QgsOpenScope plugin for QGIS](https://youtu.be/V0A83VNzLCU)
* Video - [Reshaping water polygons to match the video map](https://youtu.be/5-rSBTLS3kA)
* Video - [Adding River Polygons to openScope terrain](https://youtu.be/WHJtp36RYck)

# Manual generation of river water polygons

## Preamble

The GSHHG database only contains coastlines and lakes. In order to generate river polygons, the lines can be imported from the [CIA World DataBank II (Rivers and Political Boundaries)](https://www.evl.uic.edu/pape/data/WDB/). If you've already downloaded the shapefiles required by the qgsopenscope plugin, then you will have these files. Otherwise, [downloaded the shapefile archive](https://www.ngdc.noaa.gov/mgg/shorelines/data/gshhg/latest/), and unpack it.

## Load the existing aiport terrain

There are a few ways of loading the existing terrain:

1. Generate the terrain using the qgsopenscope plugin
This will generate the airspace an terrain for the current airport data.
2. Open the QGIS project file from the [airport-modeling](https://github.com/openscope/airport-modeling) repository
If you do this, make sure that the project airspace matches the current airport data.
3. Add the existing aiport.geoson file into a new QGIS project. You will also need to load the airspace to determine the bounds.

**Note**: Ensure the project CRS is `WGS84` (`EPSG: 4326`)

## Load the WDBII rivers

This is a relatively arbitrary process and you will have to decide which rivers to include. The CIA World DataBank II (WDBII) databases contains 11 levels of waterways. Levels 1, 2 and 3 should be sufficient. The levels we're mainly interested in are:

The _"fine"_ data should be of a sufficient quality, so add the following layers into QGIS:

* WDBII_shp/f/WDBII_river_f_L01.shp - Double-lined rivers (river-lakes)
* WDBII_shp/f/WDBII_river_f_L02.shp - Permanent major rivers
* WDBII_shp/f/WDBII_river_f_L03.shp - Additional major rivers

1. Also add the OpenStreetMap layer to the project, and use this to determine which rivers should be used. A rough rule is to include rivers at least 200m wide.
2. Select the features that you want to use
3. Paste the features as a new Temporary Scratch Layer (`Ctrl+Alt+V`) and call it "Rivers"
4. Hide all the "WDBII*" layers (we don't want to accidentally modify them)
5. Toggle editing on the "Rivers" layer and select all the features.
6. Select all the segments for each river, and use the `Merge Selected Features` tool.
6. Use the `Simplify Features` tool, set the tolerance to `0.0005` and select `Map Units`.
7. Toggle editing and save any changes.

## Convert the rivers to polygons

Open the `Processing Toolbox` (`Ctrl+Alt+T`), and then for each river:

1. Select the feaures
2. Open the `Measure Line` tool (`Ctrl+Shift+M`) to measure the width agains the OpenStreeMap layer, using the _units as degrees_.
3. Open the `Vector Geometry -> Multi-ring Buffer` tool
4. Use "Rivers" as the `Input Layer`
5. Check the `Selected Features Only` box
6. `Number of Rings` should be 1.
7. Enter the measurement from Step # 1 into the `Distance between Rings` box.
8. And run.

## Merge all the rivers into the water layer

1. Copy all the new river polygons into the terrain or water layer.
2. Toggle editing on the "Water" layer
3. Select all the rivers, and use the `Modify Attributes` tool to ensure each polygon's `elevation` attributes is `0`
4. Save changes to the layer

## Tidy up the generated polygons

* Use the `Merge Selected Features` tool to merge any water polygons that intersect.
* Remove any extraneous nodes.
* Use the `Reshape Features` tool to remove any segments that are outside the airspace.
