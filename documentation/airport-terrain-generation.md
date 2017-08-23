Initial setup
=============

Install QGIS from http://www.qgis.org/en/site/forusers/download.html.

Create a directory for working in, for this documentation it will be
referred to as ~/projects/openscope-terrain/ but it can be any
directory on your computer.

Menu items are written like this:
Project->Save

The above means click the Project Menu, then click the Save item in
it.

One plugin needs to be enabled, the following instructions
demonstrate the interactions for a dialog box which are specified
indented under the menu item, like this:

Plugins->Manage and install plugins...
  Search for 'Zonal statistics plugin'
  Ensure the plugin is checked in the middle pane
  Click Close


Getting elevation data
======================

Go to this site and download the tile(s) which cover your airport
http://viewfinderpanoramas.org/Coverage%20map%20viewfinderpanoramas_org3.htm

Extract the zip file into ~/projects/openscope-terrain/DEM/

Open QGIS

Raster->Miscellaneous->Build Virtual Raster(Catalog)
  Check 'Choose Input Directory instead of files'
  For input directory select ~/projects/openscope-terrain/DEM/
  Check 'Recurse subdirectories'
  For Output file select ~/projects/openscope-terrain/dem.vrt
  Make sure 'Load into canvas when finished' is checked
  Click OK

After it completes (there may be some warnings) click Ok on the popups
and close on Build Virtual Raster

### More information on this data source

http://www.viewfinderpanoramas.org/dem3.html

### Alternate sources

https://earthexplorer.usgs.gov/
https://gdex.cr.usgs.gov/gdex/

QGIS
====

Getting the control area perimeter
----------------------------------

TODO: Give instructions for creating a new perimeter

or

Import an existing perimeter
Copy the airspace:poly: key from the existing airport and 
paste it into a new file called ~/projects/openscope-terrain/airport.csv
Edit airport.csv so it reads something like
POLYGON((-121.69999940 47.83333330,-121.97603665
47.95335007,-121.96666670 48.30000000))
copy the first entry to the end as the last entry to close the polygon
Note the latitude and longitude are reversed in order compared to the
definition in the airport file and S/W entries are replaced with a
minus (-), coordinates also need to be in decimal degrees.

Layer->Add Layer->Delimited text layer...
  Browse to ~/projects/openscope-terrain/airport.csv
  Check custom delimiters
  Uncheck first record has field names
  Select Well Known Text (WKT)
  Click OK

Vector->Geometry Tools->Polygons to Lines
  Input layer 'airport'
  Click Run

Rename layer 'Lines from Polygons' to 'perimeter'

Trimming the DEM/Raster
-----------------------

Vector->Geoprocessing tools->Fixed distance buffer
  Input layer: airport
  Distance: 0.005
  Click Run

Open the Processing Toolbox (Processing->Toolbox) if it is not yet
Search for 'Clip raster by mask layer'
Processing Toolbox: GDAL/OGR->[GDAL] Extraction->Clip raster by mask layer:
  Input layer: 'dem'
  Mask Layer: 'Buffer'
  Click Run

Vector->Geometry Tools->Polygons to Lines
  Input layer 'Buffer'
  Run

Rename 'Polygons to Lines' to 'clipping'
Remove Buffer layer

Building the contours
----------------------------

Raster->Extraction->Contour:
  Input: Clipped (mask)
  Output: project/contours.shp
  Interval between contour lines: 304.8
  Click OK, wait for processing, OK, OK, Close

Vector->Geometry tools->Simplify geometries
  Input layer: contours
  Tolerance: 0.002
  Click Run

Remove contours layer
Rename Simplified layer to contours

Vector->Data Management Tools->Merge Vector Layers
  Layers to Merge: perimeter, contours
  Click Run

Processing Toolbox: QGIS geoalgorithms->Vector geometry tools->Polygonize
  Input: Merged
  Click Run

Vector->Geoprocessing tools->Clip
  Input: Polygons from Lines
  Clip: airport
  Click Run

Remove layer 'Polygons from Lines'

Vector->Geoprocessing tools->Eliminate Sliver Polygons
  Input layer: Clipped
  Selection attribute: area (May require changing input layer to
  airport and back)
  Comparison: <=
  Value: 0.00005
  Merge selection with: Largest common boundary
  Click Run

Raster->Zonal statistics->Zonal statistics
  Raster Layer: Clipped (mask)
  Polygon layer: Cleaned
  Statistics to calculate: mean
  Click OK

Select layer Cleaned in Layers Panel on the bottom left

Layer->Toggle Editing

View->Select->Select by expression:
  Expression: "mean" < 304.8
  Click Select
  Click Close

Edit->Delete selected

Layer->Properties->Fields
Click Field Calculator
  Check 'Create virtual field'
  field name: elevation
  Type: Decimal
  Expresion: floor("mean" / 304.8) * 304.8
  Click OK, OK

Layer->Save layer edits
Layer->Toggle Editing

Layer->Save As...
  Format: GeoJSON
  File Name: ~/projects/openscope-terrain/icao.geojson
  CRS: EPSG: 4326
  Fields to export: deselect all, check elevation
  Coordinate precision: 10
  Click OK

You are done, copy the ~/projects/openscope-terrain/icao.geojson file
into openscope/assets/airports/terrain/ and enjoy.
