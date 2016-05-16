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
  airline_load("AAL");
  airline_load("ACA");
  airline_load("AEA");
  airline_load("AFL");
  airline_load("AFR");
  airline_load("AIRTAXI");
  airline_load("AMX");
  airline_load("ARG");
  airline_load("ASA");
  airline_load("ASQ");
  airline_load("AUA");
  airline_load("AVA");
  airline_load("AWE");
  airline_load("AWI");
  airline_load("AWQ");
  airline_load("AZA");
  airline_load("AZU");
  airline_load("BAW");
  airline_load("BCY");
  airline_load("BER");
  airline_load("BTK");
  airline_load("BWA");
  airline_load("CCA");
  airline_load("CES");
  airline_load("CESSNA");
  airline_load("CFG");
  airline_load("CFS");
  airline_load("CPA");
  airline_load("CPZ");
  airline_load("CSN");
  airline_load("CTV");
  airline_load("CWC");
  airline_load("DAL");
  airline_load("DLH");
  airline_load("EIN");
  airline_load("EMBRAER");
  airline_load("ENY");
  airline_load("ETD");
  airline_load("EVA");
  airline_load("EZY");
  airline_load("FAB");
  airline_load("FASTGA");
  airline_load("FDX");
  airline_load("FFT");
  airline_load("FLG");
  airline_load("GIA");
  airline_load("GJS");
  airline_load("GLO");
  airline_load("GWI");
  airline_load("HAL");
  airline_load("HDA");
  airline_load("IBE");
  airline_load("JAL");
  airline_load("JBU");
  airline_load("JIA");
  airline_load("KAL");
  airline_load("KAP");
  airline_load("KLC");
  airline_load("KLM");
  airline_load("LAN");
  airline_load("LIGHTGA");
  airline_load("LNI");
  airline_load("MOV");
  airline_load("NAX");
  airline_load("NKS");
  airline_load("ONE");
  airline_load("PAA");
  airline_load("PDT");
  airline_load("QXE");
  airline_load("RFF");
  airline_load("RLU");
  airline_load("RPA");
  airline_load("RYR");
  airline_load("SAS");
  airline_load("SBI");
  airline_load("SCX");
  airline_load("SJY");
  airline_load("SKW");
  airline_load("SLK");
  airline_load("SVR");
  airline_load("SWA");
  airline_load("SWR");
  airline_load("SXD");
  airline_load("TAM");
  airline_load("TCF");
  airline_load("TCX");
  airline_load("THY");
  airline_load("TOM");
  airline_load("TSO");
  airline_load("TUI");
  airline_load("TWA");
  airline_load("TYA");
  airline_load("UAE");
  airline_load("UAL");
  airline_load("UPS");
  airline_load("USAF");
  airline_load("VIR");
  airline_load("VRD");
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
