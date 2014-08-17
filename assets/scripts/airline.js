
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
  return prop.airline.airlines[icao];
}

function airline_get_aircraft(icao) {
  var airline     = airline_get(icao);
  var aircraft    = airline.aircraft;
  var weight_sum  = 0;
  for(var i=0;i<aircraft.length;i++) {
    weight_sum += aircraft[i][1];
  }
  var random = Math.random() * weight_sum;
  weight_sum=0;
  for(var i=0;i<aircraft.length;i++) {
    weight_sum += aircraft[i][1];
    if(weight_sum > random) {
      return aircraft[i][0];
    }
  }
}
