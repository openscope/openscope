#!/bin/sh

for i in `find $myfolder -depth -name '*.svg'`; do inkscape $i --export-png=`echo $i | sed -e 's/svg$/png/'`; done