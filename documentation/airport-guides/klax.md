## KLAX - Los Angeles International Airport

### About this facility
Southern California TRACON (SCT), San Diego, California, USA
2,278,058 annual operations in 2019 (<a href="https://aspm.faa.gov/opsnet/sys/Tracon.asp" target="_blank">FAA ATADS</a>)

### Airspace
The Southern California TRACON, or SoCal TRACON, as it is nicknamed, provides radar air traffic approach control services to all arriving and departing aircraft for most airports in southern California. SCT's airspace covers a massive area from 20 miles north of Burbank to the US/Mexican border and from San Bernardino to Santa Catalina Island. Airports receiving SCT services include Burbank Airport, John Wayne Airport, Los Angeles International Airport, Long Beach Airport, March AFB, MCAS Miramar, NAS North Island, Ontario Airport, San Diego International Airport, Van Nuys Airport and many more smaller airports that service general aviation, making it one of the busiest air traffic control facilities in the world.

#### Sectors Available in openScope
SCT is divided into 6 main areas, each of which has multiple individual sectors that are worked by controllers.

| Area            | Sector         | Callsign  | Available in openScope |
|-----------------|----------------|-----------|------------------------|
| 1 - Burbank     | M - Moorpark   | BUR_M_APP | No                     |
| 1 - Burbank     | V - Valley     | BUR_V_APP | No                     |
| 1 - Burbank     | W - Woodland   | BUR_W_APP | No                     |
| 2 - Los Angeles | D - Downey     | LAX_D_APP | Yes                    |
| 2 - Los Angeles | F - Feeder     | LAX_F_APP | Yes                    |
| 2 - Los Angeles | U - Stadium    | LAX_U_APP | Yes                    |
| 2 - Los Angeles | Z - Zuma       | LAX_Z_APP | Yes                    |
| 3 - Empire      | N - Norton     | ONT_N_APP | No                     |
| 3 - Empire      | P - Pomona     | ONT_P_APP | No                     |
| 3 - Empire      | S - Springs    | PSP_S_APP | No                     |
| 4 - Coast       | Y - Pacific    | SNA_Y_APP | No                     |
| 4 - Coast       | T - Tustin     | SNA_T_APP | No                     |
| 5 - San Diego   | D - Del Mar    | SAN_D_APP | No                     |
| 5 - San Diego   | E - East       | SAN_E_APP | No                     |
| 5 - San Diego   | N - North      | SAN_N_APP | No                     |
| 5 - San Diego   | W - West/Wizky | SAN_W_APP | No                     |
| 6 - Del Rey     | N - Malibu     | LAX_N_DEP | Yes                    |
| 6 - Del Rey     | S - Manhattan  | LAX_S_DEP | Yes                    |
| 6 - Del Rey     | X - Newport    | LAX_X_DEP | Yes                    |

The area available for control in openScope is a combination of the Los Angeles area (responsible for arrivals into LAX) and the Del Rey area (responsible for departures out of LAX) in a West configuration (landing and departing 24L/R & 25L/R).

NOTE: Since the complex stratification of the airspace is not simulated, the entire airspace extends from the the surface up to FL190. Special attention must be paid to aircraft on the GOATZ1 and DIRBY1 arrivals, which enter the airspace to the South. The procedures takes aircraft out of our airspace to then re-enter to the Southeast. This is not a problem in real life since aircraft would be too high to enter Del Rey's airspace at that point. To prevent aircraft from exiting our airspace, a shortcut can be given to waypoints ZAPPP/BUFIE/SLI/TRNDO, as aircraft first enter the airspace near Catalina Island.

### Procedures
LAX is obviously a very complex airport with numerous departing and arriving procedures (47 to be precise!). These procedures are designed carefully to minimize conflict between aircraft flying within the SCT and reduce noise around the Los Angeles area.

#### SIDs
Most departure procedures have a 'mirror' procedure to be used at night, designed for noise reduction. Aircraft in openScope will file for either the day or night procedures, although these can be changed with the `SID` or `route` commands, if you'd like. Some procedures also require ATC to vector aircraft to different waypoints before continuing on the departure. The table bellow summarizes this information.

| SID    | RNAV | Runways       | Time of Day |  Vectors to  | Top Altitude    |
|--------|------|---------------|-------------|--------------|-----------------|
| SXC8   | No   | 6L/R & 7L/R   | Any         | SXC          | Assigned by ATC |
| CHATY5 | No   | 6L/R & 7L/R   | Any         | V23 to CHATY | Assigned by ATC |
| DARRK3 | Yes  | 24L/R & 25L/R | Night Only  | n/a          | FL230           |
| DOTSS2 | Yes  | 24L/R & 25L/R | Any         | n/a          | 17000ft         |
| GARDY3 | Yes  | 6L/R & 7L/R   | Any         | TRAAP (7L/R) | Assigned by ATC |
| GMN7   | No   | All           | Day Only    | V23 to GMN   | Assigned by ATC |
| LADYJ4 | Yes  | 24L/R & 25L/R | Day Only    | n/a          | 8000ft          |
| LAXX1  | No   | All           | Any         | SLI          | Assigned by ATC |
| MOOOS2 | Yes  | 24L/R & 25L/R | Any         | DTAIL        | 9000ft          |
| MUELR4 | Yes  | 24L/R & 25L/R | Any         | n/a          | 10000ft         |
| ORCKA4 | Yes  | 24L/R & 25L/R | Day Only    | KLIPR        | FL230           |
| OSHNN8 | Yes  | 24L/R & 25L/R | Night Only  | n/a          | 17000ft         |
| PRCH3  | No   | All           | Any         | DINTY/FICKY  | Assigned by ATC |
| PNDAH2 | Yes  | 24L/R & 25L/R | Any         | n/a          | FL200           |
| SLI8   | No   | All           | Any         | SLI          | Assigned by ATC |
| SEBBY3 | No   | 24L/R & 25L/R | Any         | SLI          | Assigned by ATC |
| SKWRL2 | Yes  | 24L/R & 25L/R | Any         | RCKYY        | Assigned by ATC |
| SUMMR2 | Yes  | 24L/R & 25L/R | Any         | n/a          | FL230           |
| TRTON2 | Yes  | 6L/R & 7L/R   | Any         | TRTON        | FL230           |
| TUSTI2 | Yes  | 6L/R & 7L/R   | Any         | BUULI        | 17000ft         |
| VTU8   | No   | All           | Any         | VTU          | Assigned by ATC |
| WNNDY3 | Yes  | 6L/R & 7L/R   | Any         | JRGSN (7L/R) | FL230           |
| ZILLI4 | Yes  | 24L/R & 25L/R | Any         | n/a          | 14000ft         |

#### STARs
Arrival procedures into KLAX bring aircraft from outside the SCT to a small area surrounding the ILSs. ATC must vector aircraft from the IAFs to the ILSs. The diagram below (from the VATSIM vZLA) shows the usual vectoring procedures followed by ATC:  

![Vectoring Diagram](https://laartcc.org/uploads/lightbox/KLAX%20FINALS%20WEST.png)

NOTE: Aircraft on the HLYWD and ANJLL arrivals are too far away to intercept the ILS glidepath at KRAIN/SKOLL. We recommend descending aircraft to 7000ft-8000ft to allow aircraft to descend on the glidepath once the ILS is captured.

NOTE: As already mentioned above, special attention must be paid to aircraft on the GOATZ1 and DIRBY1 arrivals, which enter the airspace to the South. To prevent aircraft from exiting our airspace, a shortcut can be given to waypoints ZAPPP/BUFIE/SLI/TRNDO, as aircraft first enter the airspace near Catalina Island.

#### Operation

##### Preferential RWYs
- With prevailing winds from the West, departures will be off of 24L and 25R, and arrivals will be to 24R and 25L with arrivals from the South and East usually landing 25L and from the North and West landing on 24R
- KLAX usually operates an "Over Ocean" configuration at night, where aircraft will depart from runways 24L and 25R and land in the opposite direction on 6L and 7R. This configuration is not simulated in openScope.

### Airports of Interest

#### KLAX (Primary Airport)  
Los Angeles International Airport  
710,989 annual operations  

The primary airport of the Kennedy area of the New York TRACON, New York's John F Kennedy Int'l Airport is the second busiest airport in N90, behind Newark Liberty Int'l (KEWR). It is the 19th busiest in the world, and 10th busiest in the United States.

#### KHHR
Jack Northrop Field/Hawthorne Municipal Airport  
80,793 annual operations  
3.8nm East of KLAX  

This small GA airport is in very close proximity to the considerably larger Los Angeles International Airport so special consideration must be paid to avoid encroaching on the LAX airspace. The airport is the home base for approximately 150 general aviation aircraft, and multiple flight training schools. Tesla Design Studio, SpaceX and The Boring Company are all located at the airport.

#### KTOA
Torrance/Zamperini Field Airport  
135,620 annual operations  
9.0nm Southeast of KLAX  

Zamperini Field is a small airport three miles (5 km) southwest of downtown Torrance, in Los Angeles County. It's home to the Western Museum of Flight as well as the Robinson Helicopter Company. Their entire production, assembly, and testing facilities are on the southeast side of the airfield and are the largest buildings at the field.

### Additional Resources
<a href="https://www.youtube.com/watch?v=UHwg3yrOgtE" target="_blank">VASAviation: Los Angeles Stadium Sector (West Configuration)</a>  
<a href="https://laartcc.org/uploads/lightbox/KLAX%20FINALS%20WEST.png" target="_blank">VATSIM vZLA's Vectoring Diagram</a>  
<a href="https://laartcc.org/document/socal-tracon-general-sop" target="_blank">VATSIM vZLA's SCT General SOP</a>  
<a href="https://laartcc.org/document/socal-tracon-area-2-los-angeles" target="_blank">VATSIM vZLA's SCT Los Angeles Area SOP</a>  
<a href="https://laartcc.org/document/socal-tracon-area-6-del-rey" target="_blank">VATSIM vZLA's SCT Del Rey Area SOP</a>  