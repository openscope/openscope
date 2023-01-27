# KDAB - Daytona Beach International Airport

## About DAB
Daytona Beach International Airport (IATA: DAB, ICAO: KDAB, FAA LID: DAB) is a county-owned airport located three miles (5 km) southwest of Daytona Beach, next to Daytona International Speedway, in Volusia County, Florida, United States. The airport has 3 runways, a six-gate domestic terminal, and an international terminal. Daytona Beach is the headquarters of Embry-Riddle Aeronautical University. ([Wikipedia](https://en.wikipedia.org/wiki/Daytona_Beach_International_Airport))

## Airspace
The DAB airspace covers multiple smaller airports in the region from the surface to 11,000'. It is bordered to the north by Jacksonville TRACON (JAX), north and west by Jacksonville Center, and to the south by the Central Florida TRACON (F11) and Miami Center.

## Procedures
DAB has one conventional SID and one RNAV STAR. Additionally, the airspace has a significant number of Victor airways and RNAV T-routes. This airport features a high number of overflight aircraft. These aircraft have a yellow flight strip and must be guided to their destination along their planned route of flight.

### Arrivals

vZJX Recommends a flow for aircraft on the `TTHOR3`, crossing `TTHOR` at 12,000, `BIKEZ` at 8,000. All aircraft arriving from the north get direct `OMN` at 6,000. From there, they should get heading 260, and a descent down to 4,000. Then, turn them South Bound (I like to wait until they pass `TIGAE`) which can be anything from a `150` to a `180` heading, and a descent down to 3,000. The final turn is a `090` heading and clearing them for the ILS (`i 7L`). 

For aircraft arriving from the south (crossing `SMYRA`), they should be handed off no higher than 6,000. Turn them to heading `260` around the 5 NM range ring, passing them over Spruce Creek (Pvt), and descend them to 4,000. Then give them a north bound turn to final (Once again, I like to do it once they pass `TIGAE`) which can be anything from a 360 to 020 heading, and a descent down to **2,000**. Finally, give them a right to `090` and clear them for the ils (`i 7L`)

<br>
Note:
There is no ILS for runway 7R, but in openscope you can still issue the command `i 7R` to aircraft. 

<br>

### Departures
There is no "correct" way to handle departures, so I like do to it this way. `ROYES3` departures fly runway heading until 5 DME from runway 25R, then I issue direct `BARBS` and a climb to 11,000 (`pd BARBS c 110`). All other departure routes fly on course and climbed to 5,000 (which seems like a good altitude to maintain separation between the `BIKEZ..OMN` arrivals and `SMYRA..OMN` arrivals). Northbound departures get climbed to 11,000 once clear of planes direct `OMN`, and southbound departures stay at 5,000 unless they are going to `KIZER`.



## Additional Resources
<a href="https://zjxartcc.org/media/doc/ZJX-5.D_Jacksonville_ARTCC_DAB_ATCT_TRACON_SOP.pdf" target="_blank">vZJX - Daytona Beach ATCT/TRACON SOPs</a>