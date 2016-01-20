function airline_init_pre() {
  prop.airline = {};
  prop.airline.airlines = {};
}

/**
 * An aircrcraft operating agency
 */
zlsa.atc.Airline = Fiber.extend(function() {
  return {
    /**
     * Create new airline
     */
    init: function (icao, options) {
      /** ICAO airline designation */
      this.icao = "YYY";

      /** Agency name */
      this.name = "Default airline";

      /** Radio callsign */
      this.callsign = 'Default';

      /** Parameters for flight number generation */
      this.flightNumberGeneration = {
        /** How many characters in the flight number */
        length: 3,
        /** Whether to use alphabetical characters */
        alpha: false,
      };

      /** Named weighted sets of aircraft */
      this.fleets = {
        default: [],
      };

      this.parse(icao, options);
    },

    /**
     * Initialize object from data
     */
    parse: function (icao, data) {
      if (data.icao)
        this.icao = data.icao;
      else
        this.icao = icao;

      this.name = data.name;
      this.callsign = data.callsign.name;
      this.flightNumberGeneration.length = data.callsign.length;
      this.flightNumberGeneration.alpha = (data.callsign.alpha === true);
      if (data.fleets)
        this.fleets = data.fleets;
      else
        this.fleets.default = data.aircraft;

      for (var f in this.fleets) {
        for (var j=0;j<this.fleets[f].length;j++) {
          this.fleets[f][j][0] = this.fleets[f][j][0].toLowerCase();
        }
      }
    },

    /**
     * Return a random ICAO aircraft designator from the given fleet
     *
     * If no fleet is specified the default fleet is used
     */
    chooseAircraft: function (fleet) {
      if (!fleet)
        fleet = 'default';

      try {
        return choose_weight(this.fleets[fleet.toLowerCase()]);
      }
      catch (e) {
        console.log("Unable to find fleet " + fleet
                    + " for airline " + this.icao);
        throw e;
      }
    },

    /**
     * Create a flight number/identifier
     */
    generateFlightNumber: function () {
      var flightNumberLength = this.flightNumberGeneration.length;
      var flightNumber = "";

      var list = "0123456789";

      // Start with a number other than zero
      flightNumber += choose(list.substr(1));

      if (this.flightNumberGeneration.alpha) {
        for (var i=0; i<flightNumberLength - 3; i++)
          flightNumber += choose(list);
        list = "abcdefghijklmnopqrstuvwxyz";
        for (var i=0; i<2; i++)
          flightNumber += choose(list);
      } else {
        for (var i=1; i<flightNumberLength;i++)
          flightNumber += choose(list);
      }
      return flightNumber;
    },

    /**
     * Checks all fleets for valid aircraft identifiers and log errors
     */
    validateFleets: function () {
      for (var f in this.fleets) {
        for (var j=0;j<this.fleets[f].length;j++) {
          if (!(this.fleets[f][j][0] in prop.aircraft.models)) {
            console.warn("Airline " + this.icao.toUpperCase()
                         + " uses nonexistent aircraft " + this.fleets[f][j][0]
                         + ", expect errors");
          }

          if (typeof this.fleets[f][j][1] != "number") {
            console.warn("Airline " + this.icao.toUpperCase()
                         + " uses non numeric weight for aircraft " +
                         this.fleets[f][j][0] + ", expect errors");
          }
        }
      }
    },
  };
});

function airline_init() {
  // Civil Airlines
  airline_load("UAL");
  airline_load("BAW");
  airline_load("AAL");
  airline_load("AWE");
  airline_load("CESSNA");
  airline_load("ACA");
  airline_load("BCY");
  airline_load("KLM");
  airline_load("KLC");
  airline_load("DAL");
  airline_load("AIRTAXI");
  airline_load("LIGHTGA");
  airline_load("FASTGA");
  airline_load("SAS");
  airline_load("NAX");
  airline_load("EIN");
  airline_load("RYR");
  airline_load("BER");
  airline_load("EZY");
  airline_load("GWI");
  airline_load("AUA");

  // South American
  airline_load("ONE");
  airline_load("GLO");
  airline_load("TAM");
  airline_load("AVA");
  airline_load("AZU");
  airline_load("EMBRAER");
  airline_load("ARG");

  // Asian
  airline_load("AFL");
  airline_load("MOV");
  airline_load("RLU");
  airline_load("SBI");
  airline_load("SVR");
  airline_load("TYA");
  airline_load("ASA");
  airline_load("SWA");
  
  // Asian
  airline_load("CES");
  airline_load("CPA");
  airline_load("CSN");
  airline_load("HDA");

  // Cargo Airlines
  airline_load("FDX");
  airline_load("UPS");
  airline_load("CWC");

  // Military Air Forces
  airline_load("RFF");
  airline_load("FAB");
  airline_load("USAF");

  // Internationals to South America
  airline_load("SA-AEA");
  airline_load("SA-AFR");
  airline_load("SA-AMX");
  airline_load("SA-AVA");
  airline_load("SA-AZA");
  airline_load("SA-BAW");
  airline_load("SA-CCA");
  airline_load("SA-DLH");
  airline_load("SA-IBE");
  airline_load("SA-KAL");
  airline_load("SA-KLM");
  airline_load("SA-LAN");
  airline_load("SA-UAE");
  airline_load("SA-UAL");

  airline_load("DLH");

  airline_load("THY");

}

function airline_load(icao) {
  icao = icao.toLowerCase();
  new Content({
    type: "json",
    url: "assets/airlines/"+icao+".json",
    payload: icao.toLowerCase(),
    callback: function(status, data, payload) {
      if(status == "ok") {
        prop.airline.airlines[payload] = new zlsa.atc.Airline(payload, data);
      }
    }
  });
}

function airline_get(icao) {
  icao = icao.toLowerCase();
  return prop.airline.airlines[icao];
}

function airline_ready() {
  for(var i in prop.airline.airlines) {
    prop.airline.airlines[i].validateFleets();
  }
}
