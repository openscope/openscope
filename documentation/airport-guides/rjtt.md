# RJTT - Tokyo International Airport

## About this facility

Tokyo International Airport (alternatively referred to as Haneda Airport) is an international airport in Tokyo, Japan. 

Opened in 1931 as the Haneda Airfield with a less than 1000ft long runway, the airport has grown into world's fifth busiest airport by passenger traffic. Although since the construction of nearby Narita International Airport (ICAO: RJAA, IATA: NRT) in 1978 the airport has been primarily used for domestic flights, the third terminal for international flights was comlpeted in 2010, reopening the airport to the world.

## Positions

|Callsign             | Frequency  | Remarks
|---------------------|:----------:|:---------------------------------------------:|
|"TOKYO DELIVERY"     | 121.825MHz | Primary                                       |
|                     | 121.875MHz | When assigned                                 |
|"TOKYO GROUND"       | 118.225MHz | East side of the airport (Terminal 2 Apron)   |
|                     | 121.625MHz | West side of RWY16R/34L (Terminal 3 Apron)    |
|                     | 121.700MHz | East side of RWY16R/34L (Terminal 1 Apron)    |
|                     | 121.975MHz | R Area Apron, RWY05/23 bridge and island      |
|                     | 122.075MHz | N and Q Area (North of airport)               |
|"TOKYO TOWER"        | 118.100MHz | RWY16R/34L                                    |
|                     | 118.575MHz | RWY04/22                                      |
|                     | 124.350MHz | RWY16L/34R                                    |
|                     | 118.725MHz | RWY05/23                                      |
|                     | 118.800MHz |                                               |
|                     | 126.200MHz |                                               |
|"TOKYO DEPARTURE"    | 126.000MHz | Primary (South Side)                          |
|                     | 120.800MHz | North Side                                    |
|                     | 127.600MHz |                                               |
|                     | 127.500MHz |                                               |
|                     | 124.200MHz |                                               |
|                     | 119.600MHz |                                               |
|                     | 120.600MHz |                                               |
|                     | 125.525MHz |                                               |
|"TOKYO APPROACH"     | 119.100MHz | Primary, South Side (Positive Control Area)   |
|                     | 119.400MHz | North Side                                    |
|                     | 119.650MHz | South Side                                    |
|                     | 119.700MHz | Positive Control Area                         |
|                     | 125.400MHz |                                               |
|                     | 121.275MHz |                                               |
|                     | 124.400MHz |                                               |
|                     | 125.200MHz |                                               |
|                     | 125.800MHz |                                               |
|                     | 127.700MHz |                                               |
|"TOKYO RADAR"        | 124.000MHz |                                               |
|                     | 126.500MHz |                                               |
|                     | 120.200MHz |                                               |
|                     | 119.025MHz |                                               |
|                     | 120.900MHz |                                               |
|                     | 123.600MHz |                                               |
|                     | 125.100MHz |                                               |
|"TOKYO TCA"          | 121.025MHz | Terminal Control Area Advisory (RJTT Area)    |
|                     | 119.450MHz | RJAA Area                                     |
|"TOKYO ATIS"         | 128.800MHz |                                               |

## Airspace

There are four radar positions in the Tokyo Approach Control Area (ACA) — Depature, Approach, Radar, and TCA, with each being divided into smaller sectors. The Tokyo ACA covers both Tokyo Int'l (RJTT) and Narita Int'l (RJAA); however, due to the nature of openScope, aircraft will only be arriving and departing from Tokyo Int'l.

As the name suggests, the Departure and Approach positions are for departing and arriving aircraft in the Tokyo ACA.

The Radar position is used as a combined position of Depature and Approach, and to assist both positions.

Finally, the TCA position provides advisory service to VFR traffic in the Tokyo Terminal Control Area. 

## Instrument Procedures

###Departures

Departing aircraft will be assigned their SID based on their destination, as the following table shows.

|SID                      | Destination or airway                                                                     
|-------------------------|-------------------------------------------------------------------------------------------|
|BEKLA                    | Hokuriku, San-in, Korea, Northern part of China                                           |
|LAXAS                    | RJBB, RJOO, RJOS, RJBD, RPLL, WIII, WSSS, A1, Y24, A590, V71, Y52                         |
|NINOX                    | Northern part of Kyushu, Southern part of China, RJBE, RJOB, RJOT, RJOM, RJOI, RJDC, A593 |
|RITLA                    | RJFF, RJFU, RJOA                                                                          |
|ROVER (BRUCE TRANSITION) | North, Europe, Turkey, North America (except NOPAC routes)                                |
|ROVER (AKAGI TRANSITION) | Europe, Turkey                                                                            |
|ROVER (INUBO TRANSITION) | NOPAC routes, Pacific                                                                     |
|RUTAS                    | RJAA                                                                                      |
|VAMOS                    | B586                                                                                      |
|OPPAR                    | All flights during night time (EOBT between 1350UTC and 2050UTC)                          |

SEKIYADO (SYE), VADAR, and ISOGO departures are not used for scheduled commercial flights.

Note: Due to technical limitations in openScope, BRUCE transition of the ROVER departures are named AGRIS transitions instead.

Departure runway assigned for flights are based on its flight direction. Below shows the assignment in different operation scenarios.

|Airway or Waypoint       | North Wind Operation   | South Wind Operation 1 (RWY22/23 approaches in progress)   | South Wind Operation 2 (RWY16L/R approaches in progress between 0600UTC and 1000UTC) 
|-------------------------|:----------------------:|:----------------------------------------------------------:|:--------------------------------------------------------------------------------------:|
|ROVER, Y884, Y885        | RWY34R                 | RWY16L                                                     | RWY16R *1                                                                              |
|Y18 *2                   | RWY05/34R              | RWY16L/16R                                                 | RWY16R/22                                                                              |
|Y20 *2                   | RWY05/34R              | RWY16L/16R                                                 | RWY16R/22                                                                              |
|Y28, Y56, XAC            | RWY05                  | RWY16R                                                     | RWY22                                                                                  |

*1 Flights bound for Europe, Turkey, and North America will be assigned RWY16L
*2 Departure runway will be assigned when Flight schedule is fixed

Pilots are given an initial climb of 9000ft for VAMOS depature, FL200 for BEKLA, LAXAS, NINOX, OPPAR, RITLA departures, and FL170 for the ROVER departure.

Due to obstructions and noise abatement, pilots should climb at a gradient of 5.0% up to 700ft from RWY04 and 34L/R, 5.0% up to 600ft from RWY22, and 5.0% up to 700ft from RWY05. 

###Arrivals

Tokyo Control will give initial descent instructions. Pilots will descent to reach: FL220 by SPENS (inbound for XAC), FL230 by SELNO (inbound for AKSEL), and FL160 by TEDIX/LALID (inbound for GODIN/POLIX, respectively).

After handed off from Tokyo Control, Tokyo Approach is responsible for: 
* issuing further descent clearance;
* assigning STARs or vectoring the aircraft to the final approach course if necessary;
* issuing approach clearance
* ensuring sufficient spacing between aircraft;

The wind settings in the simulator will allow for the "North Wind Operation", which uses RWY34L/R for arrival. When the two runways both use ILS approaches, they will be the ILS Z RWY34L/R approaches. In this case, aircraft should cross CAMEL at 4000ft for RWY34R to intercept the glideslope at CACAO; they should cross ARLON at 5000' for RWY34L to intercept the glideslope at APOLO.

## Sectors Available in openScope
```
Tokyo Depature
Tokyo Approach
(Tokyo Radar)
```

## Additional Resources
<a href="https://aisjapan.mlit.go.jp" target="_blank">Japan Civil Aviation Bureau (JCAB) provided charts</a> (Sign up necessary)