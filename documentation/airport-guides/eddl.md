### About the Langen Flight Information Region
The Langen FIR is one of Germany's area control centres, operated by the Deutsche Flugsicherung (German Air Traffic Control). There are four ACCs, Bremen, München, Langen and Karlsruhe. Langen controls the West side of Germany, which includes major airports such as Frankfurt, Düsseldorf and Stuttgart.

### Flughafen Dusseldorf
Flughafen Dusseldorf (_English: Dusseldorf Airport_) is the main international airport which serves the city of Dusseldorf and the German state North Rhine-Westphalia. The airport is located 7km North of downtown Dusseldorf. Dusseldorf Airport is the third busiest airport within Germany, after Frankfurt and Munich, handling 24.5m passengers in 2017. It is a hub for Eurowings and a focus city for several airlines, including Ryanair, Laudamotion, Condor, TUI, Flybe and others.

### Statistics for EDDL, 2016-2017
24,624,895 passengers
221,635 aircraft movements

<a href="http://adv.aero/wp-content/uploads/2018/02/12.2017-ADV-Monatsstatistik.pdf" target="_blank">Source: ADV</a>

### Standard Operating Procedures
##### Preferential Runways
As the Northern runway may only be used 56 hours per week, it is common that Dusseldorf operates a single runway configuration, with the Southern runway (23L/05R) in use most of the time.

##### High Intensity Runway Operations
When there is a high amount of traffic, a dual-runway configuration may be used. Takeoffs are conducted on the southern runway (23L/05R), and landings on the Northern runway (23R/05L). In OpenScope, a dual-runway configuration is operated, as there is a high quantity of inbound and outbound traffic.

##### Speed restrictions
All aircraft should be 250kt IAS under 10,000ft in German airspace classes D, E, F and G.

### Instrument Procedures
##### Departures
Dusseldorf has few departures, but there are enough to cover departures in every compass direction. Here's an outline as to how the departures are generally used:

| Compass Direction |      Departure    |
|:-----------------:|:-----------------:|
|        NE         |  MEVEL            |
|        E          |  **MEVEL**/NUDGO  |
|        SE         |  **DODEN**/KUMIK  |
|        S          |  **DODEN**/COL    |
|        SW         |  MOGRU            |
|        W          |  **MOGRU**/SONEB  |
|        NW         |  SONEB            |

In the case where there are two possible departures that can be used, the one in **bold** appears to be used more often.

##### Arrivals
Aircraft arriving into Dusseldorf mainly come from one of four waypoints, TEBRO, XAMOD, BIKMU and DOMUX. While there are transitions from these waypoints onto the ILS, these transitions aren't used often, as vectors are given most of the time. It is possible to clear aircraft for these transitions, at your own discretion through the `reroute` and `route` commands. They are named XXXX23/05, depending on the runway configuration. For example, to clear EWG23LA onto the transition from DOMUX to runway 23R, the command would be `EWG23LA route DOMUX.DOMUX23.EDDL23R`.

### Airspace
The airspace is listed within the German Aeronautical Information Publication under the name of "Dusseldorf/Köln Bonn", meaning that the airspace covers Dusseldorf as well as Cologne Bonn. This is likely due to the close proximity of the two aerodromes, hence why the airspace covers a large area. The airspace has a ceiling of 10,000ft.

##### Sectors Available in OpenScope
```
Langen Radar (Dusseldorf)
Langen Radar (Köln/Bonn)
Dusseldorf Director
Köln/Bonn Director
```

##### Flughafen Köln/Bonn
Cologne Bonn Airport is the international airport serving Germany's fourth largest city, Cologne. It also serves Bonn, which is roughly 15km south of the field. Cologne/Bonn is one of the few airports within Germany that is open 24 hours a day, unlike Dusseldorf which is closed to inbound and outbound traffic overnight. As such, the airport is popular with freight and cargo airlines such as FedEx and UPS. Low cost carriers Eurowings and Germanwings also operate out of here.


### Videomap
The videomap displays the positions of both Dusseldorf Airport and Köln Bonn Airport, and the extended centrelines of ILS-equipped runways.

It also includes:
- Restricted airspace ED R-111
- VORs Noervenich, Cola, Barmen and Germinghausen
- Shelved airspace boundaries surrounding Dusseldorf and Cologne Bonn

### Additional Resources
<a href="http://www.vacc-sag.org/airport/EDDL" target="_blank">VATSIM Germany</a>
