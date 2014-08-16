
var Runway=Position.extend(function(base) {
  return {
    init: function(options) {
      if(!options) options={};
      base.init.call(this, options);

      this.name        = [null, null];
      this.name_offset = [[0, 0], [0, 0]];
      this.length      = 1;
      this.glideslope  = [3, 3];
      this.angle       = 0;
      this.ils         = [false, false];
      this.delay       = [2, 2];

      this.waiting     = [[], []];

      this.parse(options);

    },
    addQueue: function(aircraft, end) {
      end = this.getEnd(end);
      this.waiting[end].unshift(aircraft);
    },
    removeQueue: function(aircraft, end) {
      end = this.getEnd(end);
      if(this.waiting[end][0] == aircraft) {
        this.waiting[end].shift(aircraft);
        return true;
      }
      return false;
    },
    isWaiting: function(aircraft, end) {
      end = this.getEnd(end);
      return this.waiting[end].indexOf(aircraft);
    },
    taxiDelay: function(aircraft, end) {
      end = this.getEnd(end);
      return this.delay[end] + Math.random() * 3;
    },
    getOffset: function(position, end, length) {
      end = this.getEnd(end);
      position = [position[0], position[1]];

      position[0] -= this.position[0];
      position[1] -= this.position[1];

      var offset = [0, 0];
      offset[0]  = (-cos(this.angle) * position[0]) + (sin(this.angle) * position[1]);
      offset[1]  = ( sin(this.angle) * position[0]) + (cos(this.angle) * position[1]);
      offset[1] *= -1;

      if(end == 1) {
        offset[0] *= -1;
        offset[1] *= -1;
      }

      if(length) offset[1] -= this.length / 2;
      return offset;

    },
    getGlideslopeAltitude: function(distance, end, glideslope) {
      end = this.getEnd(end);
      if(!glideslope) glideslope = this.glideslope[end];
      distance = Math.max(0, distance);
      var rise = tan(glideslope) * 0.5;
      return rise * distance * 3280;
    },
    getEnd: function(name) {
      if(typeof name == typeof 0) return name;
      if(this.name[0].toLowerCase() == name) return 0;
      if(this.name[1].toLowerCase() == name) return 1;
      return 0;
    },
    getPosition: function(end) {
      end = this.getEnd(end);
      var offset = [this.position[0], this.position[1]];
      if(end == 0) {
        offset[0] -= sin(this.angle) * (this.length / 2);
        offset[1] -= cos(this.angle) * (this.length / 2);
      } else {
        offset[0] += sin(this.angle) * (this.length / 2);
        offset[1] += cos(this.angle) * (this.length / 2);
      }
      return offset;
    },
    parse: function(data) {
      base.parse.call(this, data);

      if(data.name) this.name = data.name;
      if(data.name_offset) this.name_offset = data.name_offset;

      if(data.length) this.length = data.length;
      if(data.angle) this.angle   = radians(data.angle);

      if(data.glideslope) this.glideslope = [radians(data.glideslope[0]), radians(data.glideslope[1])];

      if(data.ils) this.ils = data.ils;

      if(data.delay) this.delay = data.delay;
    },
  };
});

var Airport=Fiber.extend(function() {
  return {
    init: function(options) {
      if(!options) options={};

      this.name    = null;
      this.icao    = null;
      this.runways = [];
      
      this.parse(options);
      if(options.url) {
        this.load(options.url);
      }

    },
    parse: function(data) {
      if(data.name) this.name = data.name;
      if(data.icao) this.icao = data.icao;
      if(data.runways) {
        for(var i=0;i<data.runways.length;i++) {
          this.runways.push(new Runway(data.runways[i]));
        }
      }
    },
    selectRunway: function(length) {
      if(!length) length = 0;
      for(var i=0;i<this.runways.length;i++) {
        var runway = this.runways[i];
        if(runway.length > length) return choose(runway.name);
      }
    },
    load: function(url) {
      this.content = new Content({
        type: "json",
        url: url,
        that: this,
        callback: function(status, data) {
          if(status == "ok") {
            this.parse(data);
          }
        }
      });
    },
    getRunway: function(name) {
      if(!name) return null;
      name = name.toLowerCase();
      for(var i=0;i<this.runways.length;i++) {
        if(this.runways[i].name[0].toLowerCase() == name) return this.runways[i];
        if(this.runways[i].name[1].toLowerCase() == name) return this.runways[i];
      }
      return null;
    }
  };
});

function airport_init_pre() {
  prop.airport = {};
  prop.airport.airports = {};
  prop.airport.current  = null;
}

function airport_init() {
  airport_load("ksra");
  airport_set("ksra");
}

function airport_load(icao) {
  icao = icao.toLowerCase();
  var airport=new Airport({icao: icao, url: "assets/airports/"+icao+".json"});
  airport_add(airport);
  return airport;
}

function airport_add(airport) {
  prop.airport.airports[airport.icao.toLowerCase()] = airport;
}

function airport_set(icao) {
  prop.airport.current = prop.airport.airports[icao.toLowerCase()];
}

function airport_get(icao) {
  if(!icao) return prop.airport.current;
  return prop.airport.airports[icao.toLowerCase()];
}
