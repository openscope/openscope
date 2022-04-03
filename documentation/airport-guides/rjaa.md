# RJAA - Narita International Airport, Tokyo

## About this facility

Narita International Airport is a Japanese airport in the city of Narita, Chiba Prefecture. It is commonly called Tokyo Narita International Airport for its proximity to Tokyo, intended to handle international traffic contrary to Tokyo (Haneda) International Airport initially meant to handle domestic flights.

Opened in 1978, after years of bloody local resistance that delayed the airport's opening, it is now Japan's largest hub connecting with global destinations. Yet, the airport's initial construction plan is still incomplete, due to the continued resistance of indigenous residents who refuse to give up their land.

## Positions

|Callsign              | Frequency  | Remarks
|----------------------|:----------:|:----------------------------------------------:|
|"NARITA DELIVERY"     | 121.950MHz | Primary Frequency                              |
|                      | 121.650MHz |                                                |
|"NARITA RAMP CONTROL" | 121.600MHz | Cargo, Maintainance Area, Spots 11-26, 201-232 |
|                      | 121.750MHz | Passenger Areas 27-192, 401-426                |
|"NARITA GROUND"       | 121.950MHz | Primary Frequency                              |
|                      | 121.850MHz |                                                |
|"NARITA TOWER"        | 118.200MHz | Primary Frequency                              |
|                      | 118.350MHz |                                                |
|                      | 122.700MHz |                                                |
|                      | 126.200MHz |                                                |
|"TOKYO DEPARTURE"     | 126.000MHz | Primary (South Side)                           |
|                      | 120.800MHz | North Side                                     |
|                      | 127.600MHz |                                                |
|                      | 127.500MHz |                                                |
|                      | 124.200MHz |                                                |
|                      | 119.600MHz |                                                |
|                      | 120.600MHz |                                                |
|                      | 125.525MHz |                                                |  
|"TOKYO APPROACH"      | 119.100MHz | Primary, South Side (Positive Control Area)    |
|                      | 119.400MHz | North Side                                     |
|                      | 119.650MHz | South Side                                     |
|                      | 119.700MHz | Positive Control Area                          |
|                      | 125.400MHz |                                                |
|                      | 121.275MHz |                                                |
|                      | 124.400MHz |                                                |
|                      | 125.200MHz |                                                |
|                      | 125.800MHz |                                                |
|                      | 127.700MHz |                                                |
|"TOKYO RADAR"         | 124.000MHz |                                                |
|                      | 126.500MHz |                                                |
|                      | 120.200MHz |                                                |
|                      | 119.025MHz |                                                |
|                      | 120.900MHz |                                                |
|                      | 123.600MHz |                                                |
|                      | 125.100MHz |                                                |
|"TOKYO TCA"           | 121.025MHz | Terminal Control Area Advisory (RJTT Area)     |
|                      | 119.450MHz | RJAA Area                                      |
|"NARITA ATIS"         | 128.250MHz |                                                |

## Airspace

There are four radar positions in the Tokyo Approach Control Area (ACA) — Depature, Approach, Radar, and TCA, with each being divided into smaller sectors. The Tokyo ACA covers both Tokyo Int'l (RJTT) and Narita Int'l (RJAA); however, due to the nature of openScope, aircraft will only be arriving and departing from Narita Int'l.

As the name suggests, the Departure and Approach positions are for departing and arriving aircraft in the Tokyo ACA.

The Radar position is used as a combined position of Depature and Approach, and to assist both positions.

Finally, the TCA position provides advisory service to VFR traffic in the Tokyo Terminal Control Area. 

## Instrument Procedures

###Departures

Departing aircraft will generally be assigned runway 16R/34L for it being the longer runway. However, when the Simulataneous Parallel Independent Departures (SPID) procedure is also in use, both runways can be used for departure at the same time. For the SPID, both aircraft from each runway must be departing using the RNAV1 SIDs, including BORLO2, GULBO2, OLVAN2, PEDLA1, PIGOK2, REDEK2, and TETRA8.

The openScope scenario is set for the south wind operation, where departure is from 16L/R, but for most SIDs departing from 34L/R, there is an altitude restriction of 7000ft. This is to prevent conflicts between aircraft arriving at Tokyo Int'l. There will be no such traffic in openScope, so it is safe to immediately allow the aircraft to climb.

###Arrivals

Tokyo Control will assign STARs to aircraft and give initial descent instructions. Aircraft will cross the boundary fixes GURIP, LESPO, and VAGLA at FL150; MAMAS at FL240.

After handed off from Tokyo Control, Tokyo Approach is responsible for: 
* issuing further descent clearance;
* vectoring the aircraft to the final approach course;
* issuing approach clearance
* ensuring sufficient spacing between aircraft;

All the aircrafts arriving in openScope will head to NORMA (IAF for ILS Y/Z RWY 16L/R) following their assigned STAR. It is your responsibility to vector the aircraft to the final approach course.

## Sectors Available in openScope
```
Tokyo Depature
Tokyo Approach
```

## Additional Resources
<a href="https://aisjapan.mlit.go.jp" target="_blank">Japan Civil Aviation Bureau (JCAB) provided charts</a> (Sign up necessary)