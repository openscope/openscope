# Terrain Generation

## Introduction
###### This guide will show you how to generate a terrain file for any airport in openScope. This is mainly done using QGIS, a free and open source Geographic Information System. The process can be quite tedious and often frustrating, so if you get stuck somewhere, you can talk to us on [Slack](http://slack.openscope.co/), where we will be happy to help you!

## Initial setup

#### 1. Install QGIS version 2.18 from the [QGIS website](http://www.qgis.org/en/site/forusers/download.html)
*Note: QGIS version 3 is not compatible with the Zonal Statistics plugin.*

#### 2. Install Zonal Statistics plugin
* Open QGIS and navigate to `Plugins->Manage and install plugins...`
* Search for `Zonal statistics plugin` and enable plugin

#### 3. Create a folder to dump all your files into.
* The folder should be named after the airport's ICAO code, e.g. `~/KSEA/`
*Note: Throughout this guide it will be referred to as `~/terrain/`*

#### 4. Obtain elevation data
* Go to [this site](http://viewfinderpanoramas.org/Coverage%20map%20viewfinderpanoramas_org3.htm) and download all the tiles which cover your airport and its surrounding area
* Extract the zip files into a new folder `~/terrain/DEM/`

#### 5. Obtain airspace coordinates
* Copy all the coordinates within the airspace key of your airport file
* Convert the coordinates to the right format using [this web app](https://jakcharvat.github.io/polygonConverter/) *(Thanks @jakcharvat for this wonderful tool!)*
* Copy the output and paste it on a new file.
* Save the file as `~/terrain/airspace.csv/`

## QGIS

#### 1. Build Raster
* Go to `Raster->Miscellaneous->Build Virtual Raster(Catalog)...`
* Check `Choose input directory instead of files`
* For input directory select `~/terrain/DEM/`
* Check `Recurse subdirectories`
* For Output file select `~/terrain/dem.vrt`
* Check `Load into canvas when finished`
* Click `OK`

*Note: After it completes, click `OK` on the popups and `Close` on the Build Virtual Raster window*.

#### 2. Import Airspace
* In QGIS, go to `Layer->Add Layer->Add Delimited Text Layer...`
* For `File Name` browse `~/terrain/airspace.csv/`
* For `File Format` check `Custom Delimiters`
* For `Geometry Definition` check `Well Known Text (WKT)`
* Click `OK`


* Go to `Vector->Geometry Tools->Polygons to Lines...`
* Input layer: `airspace`
* Click `Run`
* On the Layers Panel, Rename `Lines from polygons` to `perimeter`

#### 3. Trim Raster
* Go to `Vector->Geoprocessing Tools->Fixed distance buffer`
* Input layer: `airspace`
* Distance: `0.005`
* Click `Run`


* Go to `Processing->Toolbox`
* Search for `Clip raster by mask layer`
* Input layer: `dem`
* Mask Layer: `Buffer`
* Click `Run`

*Note: QGIS may seem frozen while the algirthm is run, but it is still running. Try not clicking anywhere on the prograam to ensure it does not crash.*

* Go to `Vector->Geometry Tools->Polygons to Lines`
* Input layer: `Buffer`
* Click `Run`


* On the Layers Panel, Rename `Polygons to Lines` layer to `clipping`
* Remove `Buffer` layer

#### 4. Build Contours

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

#### 5. Process Contours

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

#### 6. Prepare for Export

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

#### 7. Export Terrain

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
* Check `Commit directly to the `master` branch`
* Click `Commit changes`
 

* Copy the `~/terrain/icao.geojson` file into `~/openscope/assets/airports/terrain/`
* In the airport file, ensure `has_terrain` is set to `true`

# Congratulations!
###### If you've made it this far, you have successfully generated a terrain file for openScope. Give yourself a break now, you deserve it!
###### If you're having any problems while following this guide, you can talk to us on [Slack](http://slack.openscope.co/), where we will be happy to help you!

