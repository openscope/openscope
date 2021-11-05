### About this facility
New York TRACON (N90), Westbury, New York, USA
1,957,764 annual operations in 2019 (<a href="https://aspm.faa.gov/opsnet/sys/Tracon.asp" target="_blank">FAA ATADS</a>)

### Airspace
Widely considered to be the most complex airspace in the world, the New York TRACON (N90) includes three major airports: KJFK, KEWR, and KLGA. Combined, they accumulated 1.29 million aircraft movements in 2019, and an additional 667,000 movements from various New York area satellite airports. With only 9 miles and 14 miles separating KLGA from KJFK and KEWR (respectively), these powerhouse airports are extremely close together, making simultaneous operations with changing runway configurations and countless crossing flows highly difficult.

### Sectors Available in openScope
N90 includes 5 different areas: Kennedy, LaGuardia, Newark, Islip, and Liberty. In this case, we are only simulating the Kennedy area, operating as the CAMRN sector, with all other Kennedy sectors combined at CAMRN.

```
G - CAMRN (default)
K - ROBER (unavailable)
A - final (unavailable)
S - satellite (unavailable)
J - departure (unavailable)
```

To the east, we overhang the Islip area (to acommodate descending the ROBER arrivals), and to the northwest, we overhang the LaGuardia and Newark areas (to accomodate descending the LENDY arrivals).

### Vectoring Departures

With the exception of the SKORR4 departure, RNGRR transition, all departures will need to be vectored to join their route. When departing the 31s, due to airspace constraints (LGA/EWR traffic), all traffic will need a left turn to the west or south.

Aircraft routed over RBV (usually routed `SKORR4.RNGRR..RBV`) are not impacted, but all other aircraft will be issued a southbound heading, climbed above any relevant arrival traffic, and turned toward their departure fix. Departures to north fixes will be climbed above landing traffic, and turned northeasbound across the LENDY arrival flow before being cleared on course.

### Airports of Interest

#### KJFK (Primary Airport)
John F Kennedy Int'l
463,198 annual operations

The primary airport of the Kennedy area of the New York TRACON, New York's John F Kennedy Int'l Airport is the second busiest airport in N90, behind Newark Liberty Int'l (KEWR). It is the 19th busiest in the world, and 10th busiest in the United States.

#### KFRG
Republic Field / Farmingdale
219,672 annual operations
17.5nm east of KJFK

The only other airport within the Kennedy area of New York TRACON, Farmingdale is a popular GA airport attracting charters and high-end business jet traffic destined for Long Island and the city of New York. These arrivals used to also follow the CAMRN4 arrival, though now they are routed through the N90's Islip area, and come to the Kennedy area routed over DPK.

### Additional Resources
<a href="https://youtu.be/LUI4T3sMp_Q" target="_blank">VASAviation: JFK Departure Sector (departing 13s)</a>
<a href="https://youtu.be/Mf89B-UY1m4" target="_blank">VASAviation: CAMRN Sector (landing 4s)</a>
<a href="https://youtu.be/mw4AUdXCWmc" target="_blank">VASAviation: CAMRN Sector (landing 13s)</a>
<a href="https://youtu.be/lORVlatmHso" target="_blank">VASAviation: JFK Final Sector (landing 4s)</a>
<a href="https://nyartcc.org/znywiki/index.php/JFK_SOP" target="_blank">VATSIM vZNY's JFK SOP</a>
