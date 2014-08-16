
function airline_init_pre() {
  prop.airline = {};
  prop.airline.airlines = {};
}

function airline_init() {
  airline_load("UAL");
  airline_load("BAW");
}

function airline_load(icao) {
  icao = icao.toLowerCase();
  new Content({
    type: "json",
    url: "assets/airlines/"+icao+".json",
    payload: icao.toLowerCase(),
    callback: function(status, data, payload) {
      if(status == "ok") {
        prop.airline.airlines[payload] = data;
      }
    }
  });
}

function airline_get(icao) {
  icao = icao.toLowerCase();
  console.log(icao);
  return prop.airline.airlines[icao];
}
