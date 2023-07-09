import AirportController from "../airport/AirportController";

/**
 * Responsible for managing Airport transition altitudes
 *
 * @class transitionAltitudes
 */
class transitionAltitudes {
    /**
     * @constructor
     */
    constructor() {
        this.airportTransitionAltitudePairs = [
            { icao: "egcc", transalt: 5000 },
            { icao: "egnm", transalt: 5000 },
            { icao: "eddf", transalt: 5000 },
            { icao: "eddh", transalt: 5000 },
            { icao: "eddl", transalt: 5000 },
            { icao: "eddm", transalt: 5000 },
            { icao: "eick", transalt: 5000 },
            { icao: "eidw", transalt: 5000 },
            { icao: "einn", transalt: 5000 },
            { icao: "engm", transalt: 7000 },
            { icao: "lipz", transalt: 6000 },
            { icao: "lkpr", transalt: 5000 },
            { icao: "loww", transalt: 10000 },
            { icao: "lrop", transalt: 4000 },
            { icao: "lszh", transalt: 7000 },
            { icao: "ltba", transalt: 12000 },
            { icao: "omaa", transalt: 13000 },
            { icao: "omdb", transalt: 13000 },
            { icao: "othh", transalt: 13000 },
            { icao: "rjaa", transalt: 14000 },
            { icao: "rjoa", transalt: 14000 },
            { icao: "rjss", transalt: 14000 },
            { icao: "rjtt", transalt: 14000 },
            { icao: "saez", transalt: 3000 },
            { icao: "same", transalt: 6000 },
            { icao: "sawh", transalt: 8000 },
            { icao: "sumu", transalt: 3000 },
            { icao: "tncm", transalt: 5000 },
        ];
    }
    getTransAlt() {
        const airport = AirportController.airport_get();
        const currenticao = airport.icao;
        const matchingPair = this.airportTransitionAltitudePairs.find(
            (pair) => pair.icao === currenticao
        );

        if (matchingPair) {
            const transAltValue = matchingPair.transalt;
            return transAltValue;
        } else {
            return 18000; // or any other value indicating no matching pair found
        }
    }
}

export default new transitionAltitudes();
