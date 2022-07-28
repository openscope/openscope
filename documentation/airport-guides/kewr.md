### About this facility
New York TRACON (N90), Westbury, New York, USA
1,957,764 annual operations in 2019 (<a href="https://aspm.faa.gov/opsnet/sys/Tracon.asp" target="_blank">FAA ATADS</a>)

### Airspace
Widely considered to be the most complex airspace in the world, the New York TRACON (N90) includes three major airports: KJFK, KEWR, and KLGA. Combined, they accumulated 1.29 million aircraft movements in 2019, and an additional 667,000 movements from various New York area satellite airports. With only 9 miles and 14 miles separating KLGA from KJFK and KEWR (respectively), these powerhouse airports are extremely close together, making simultaneous operations with changing runway configurations and countless crossing flows highly difficult.

### Sectors Available in openScope
N90 includes 5 different areas: Kennedy, LaGuardia, Newark, Islip, and Liberty. In this case, we are only simulating the Newark area, operating as the ARD sector, with all other Kennedy sectors combined at ARD.

```
P - ARD (default, "Yardley")
A - North Arrival (unavailable)
Q - final (unavailable)
U - MUGZY satellite (unavailable)
S - ZEEBO satellite (unavailable)
H - METRO satellite (unavailable)
N - departure (unavailable)
```

To the east, we border the LaGuardia area, this creates a very tight area east of the airport.

### Vectoring Departures

All departures will need to be vectored to join their route. When departing to the northeast, The EWR4 (Newark 4) SID leaves aircraft on a 290 heading so that they turn away from LaGuardia. When departing to the southwest, the SID leaves aircraft on a 220 heading. In both cases, aircraft will start by making slight turns to the east to create some room for their climb. 

### Vectoring Arrivals

KEWR is served by 3 RNAV Arrivals, one from the north (FLOSI#), one from the west (FQM#), and one from the southwest (PHLBO#). There is no set merge point for these 3 flows so vectors are required to properly merge them into a single flow for final.

### Additional Resources
<a href="https://wiki.nyartcc.org/index.php?title=EWR_SOP" target="_blank">VATSIM vZNY's EWR SOP</a>
