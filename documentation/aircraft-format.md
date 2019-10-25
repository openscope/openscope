# Aircraft Format

## Example Aircraft File

```javascript
{
    "name": "Boeing 747-400",   - Official name of the aircraft¹
    "icao": "B744",             - ICAO identifier of the aircraft¹
    "engines": {
        "number": 4,            - Number of Engines¹
        "type": "J"             - Engines type¹ - [J = Jet / T = TurboProp / P = Piston]
    },
    "weightClass": "H",         - wake turbulence category¹
    "category": {
        "srs": 3,               - Same Runway Separation Category²
        "lahso": 10,            - LAHSO (land-and-hold-short) Category²
        "recat": "B"            - Wake Turb Recategorization Category²
    },
    "ceiling": 45000,           - Service Ceiling³
    "rate": {
        "climb":      1500,     - Climb Rate³
        "descent":    3000,     - Descent Rate³
        "accelerate": 4,        - Accelerate Rate (your best estimate, btwn ~1-5)
        "decelerate": 2         - Decelerate Rate (your best estimate, btwn ~1-5)
    },
    "runway": {
        "takeoff": 3.300,       - Takeoff Distance Required³ (km)
        "landing": 2.130        - Landing Distance Required³ (km)
    },
    "speed":{
        "min":     135,         - Stall speed³ (minimum speed)
        "landing": 150,         - Landing speed³ (at threshold)
        "cruise":  492          - Typical cruise speed³, knots (a/c will fly at slower of these speeds)
        "cruiseM": 0.81,        - Typical cruise speed³, mach  (a/c will fly at slower of these speeds) if unavailable, put null
        "max":     507,         - Maximum Operating Limit Speed⁴ (Vmo, knots)
        "maxM":    0.83         - Maximum Operating Limit Mach⁴ (Mmo, knots)
    },
    "capability": {
        "ils": true,            - T/F: whether aircraft has ILS equipment
        "fix": true             - T/F: whether aircraft has VOR or GPS equipment
    }
}
```

## Notes

Recommended sources:

1. [https://www.icao.int/publications/DOC8643/Pages/Search.aspx](https://www.icao.int/publications/DOC8643/Pages/Search.aspx)
1. [https://www.faa.gov/documentLibrary/media/Order/2017-03-07_FAA_Order_JO_7360.1B_Aircraft_Type_Designators.pdf](https://www.faa.gov/documentLibrary/media/Order/2017-03-07_FAA_Order_JO_7360.1B_Aircraft_Type_Designators.pdf)
1. [https://contentzone.eurocontrol.int/aircraftperformance/default.aspx](https://contentzone.eurocontrol.int/aircraftperformance/default.aspx)
1. [https://www.easa.europa.eu/document-library/type-certificates](https://www.easa.europa.eu/document-library/type-certificates) or [http://www1.airweb.faa.gov/Regulatory_and_Guidance_Library/rgMakeModel.nsf/MainFrame?OpenFrameSet](http://www1.airweb.faa.gov/Regulatory_and_Guidance_Library/rgMakeModel.nsf/MainFrame?OpenFrameSet)
(Try to find the correct .pdf file and search for "VMO" or "MMO")
