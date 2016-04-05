---
title: Aircraft Format Wiki
---
[back to index](index.html)

http://puu.sh/o6oee/00a63d977a.png

# Head(Name, Icao and Engines informations)

{
  "name": "Boeing 747-400", - Official name of the aircraft
  "icao": "B744", - ICAO of the aircraft
  "engines": { [Engines Field]
    "number": 4, - Number of Engines
    "type": "J" - Engines type - [J = Jet / T = TurboProp / P=Piston] []
  },


## Weightclass [ http://aspmhelp.faa.gov/index.php/Weight_Class ]
  "weightclass": "H", - wake turbulence category¹
  "category": {
    "srs": 3, - Same Runway Separation²
    "lahso": 10,
    "recat": "B"
  },


## Departure  [ Boeing 747 Example tabel: https://doc8643.com/aircraft/B744 ]
  "ceiling": 45000, - Heigh C
  "rate": {
    "climb":      2000, - Climb Rate
    "descent":    3000, - Descent Rate
    "accelerate": 4, - Accelerate Rate
    "decelerate": 2 - Decelerate Rate
  },


## Properties on the runway
  "runway": {
    "takeoff": 3.2, - Takeoff
    "landing": 4.0
  },


## Speed Properties
  "speed":{
    "min":     135, - Minimum speed
    "max":     250, - Maximum speed
    "landing": 150, - Landing speed
    "cruise":  200 - Cruise speed
  },


## Available instruments on board
  "capability": {
    "ils": true, - 
    "fix": true
  }
}


1-
H (Heavy) aircraft types of 136 000 kg (300 000 lb) or more;
M (Medium) aircraft types less than 136 000 kg (300 000 lb) and more than 7 000 kg (15 500 lb); and
L (Light) aircraft types of 7 000 kg (15 500 lb) or less.


2- Learn more in official FAA manual: http://www.faa.gov/documentlibrary/media/order/atc.pdf