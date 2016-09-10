import $ from 'jquery';
import Fiber from 'fiber';

import Runway from './Runway';
import { km, nm, degreesToRadians } from '../utilities/unitConverters';
import { distance2d } from '../math/distance';
import { vlen, vradial, vsub } from '../math/vector';

const AirportInstance = Fiber.extend(function() {
  return {
    init: function(options = {}) {
      this.loaded   = false;
      this.loading  = false;
      this.name     = null;
      this.icao     = null;
      this.radio    = null;
      this.level    = null;
      this.elevation = 0;
      this.runways  = [];
      this.runway   = null;
      this.fixes    = {};
      this.real_fixes = {};
      this.sids     = {};
      this.stars    = {};
      this.maps     = {};
      this.airways  = {};
      this.restricted_areas = [];
      this.metadata = {
        rwy: {}
      };
      this.airspace = null; // array of areas under this sector's control. If null, draws circle with diameter of 'ctr_radius'
      this.perimeter= null; // area outlining the outermost lateral airspace boundary. Comes from this.airspace[0]

      this.timeout  = {
        runway: null,
        departure: null
      };

      this.departures = null;
      this.arrivals   = [];

      this.wind     = {
        speed: 10,
        angle: 0
      };

      this.ctr_radius  = 80;
      this.ctr_ceiling = 10000;
      this.initial_alt = 5000;

      this.parse(options);
    },
    getWind: function() {
      var wind = clone(this.wind);
      var s = 1;
      var angle_factor = Math.sin((s + game_time()) * 0.5) + Math.sin((s + game_time()) * 2);
      var s = 100;
      var speed_factor = Math.sin((s + game_time()) * 0.5) + Math.sin((s + game_time()) * 2);
      wind.angle += crange(-1, angle_factor, 1, degreesToRadians(-4), degreesToRadians(4));
      wind.speed *= crange(-1, speed_factor, 1, 0.9, 1.05);
      return wind;
    },
    parse: function(data) {
      if(data.position) this.position = new Position(data.position);
      if (this.position && (this.position.elevation != null))
        this.elevation = this.position.elevation;
      if(data.magnetic_north) this.magnetic_north = degreesToRadians(data.magnetic_north);
        else this.magnetic_north = 0;
      if(data.name) this.name   = data.name;
      if(data.icao) this.icao   = data.icao;
      if(data.radio) this.radio = data.radio;
      if(data.ctr_radius) this.ctr_radius = data.ctr_radius;
      if(data.ctr_ceiling) this.ctr_ceiling = data.ctr_ceiling;
      if(data.initial_alt) this.initial_alt = data.initial_alt;
      if(data.rr_radius_nm) this.rr_radius_nm = data.rr_radius_nm;
      if(data.rr_center) this.rr_center = data.rr_center;
      if(data.level) this.level = data.level;
      this.has_terrain = false || data.has_terrain;

      if (this.has_terrain) {
        this.loadTerrain();
      }

      if(data.airspace) { // create 3d polygonal airspace
        var areas = [];
        for(var i=0; i<data.airspace.length; i++) { // for each area
          var positions = [];
          for(var j=0; j<data.airspace[i].poly.length; j++) {  // for each point
            positions.push(new Position(data.airspace[i].poly[j],
                                        this.position, this.magnetic_north));
          }
          areas.push(new Area(positions, data.airspace[i].floor*100,
            data.airspace[i].ceiling*100, data.airspace[i].airspace_class));
        }
        this.airspace = areas;

        // airspace perimeter (assumed to be first entry in data.airspace)
        this.perimeter = areas[0];

        // change ctr_radius to point along perimeter that's farthest from rr_center
        var pos = new Position(this.perimeter.poly[0].position, this.position, this.magnetic_north);
        var len = nm(vlen(vsub(pos.position, this.position.position)));
        var apt = this;
        this.ctr_radius = Math.max.apply(Math, $.map(this.perimeter.poly, function(v) {return vlen(vsub(v.position,new Position(apt.rr_center, apt.position, apt.magnetic_north).position));}));
      }

      if(data.runways) {
        for(var i in data.runways) {
          data.runways[i].reference_position = this.position;
          data.runways[i].magnetic_north = this.magnetic_north;
          this.runways.push( [new Runway(data.runways[i], 0, this),
                              new Runway(data.runways[i], 1, this)]);
        }
      }

      if(data.fixes) {
        for(var i in data.fixes) {
          var name = i.toUpperCase();
          this.fixes[name] = new Position(data.fixes[i], this.position, this.magnetic_north);
          if(i.indexOf('_') != 0) this.real_fixes[name] = this.fixes[name];
        }
      }

      if(data.sids) {
        this.sids = data.sids;  // import the sids
        for(var s in this.sids) { // Check each SID fix and log if not found in the airport fix list
          if(this.sids.hasOwnProperty(s)) {
            var fixList = this.sids[s];
            for(var i=0; i<fixList.length; i++) {
              var fixname = fixList[i];
              if(!this.airport.fixes[fixname])
                log("SID " + s + " fix not found: " + fixname, LOG_WARNING);
            }
          }
        }
      }

      if(data.stars) this.stars = data.stars;
      if(data.airways) this.airways = data.airways;

      if(data.maps) {
        for(var m in data.maps) {
          this.maps[m] = [];
          var lines = data.maps[m];
          for(var i in lines) { // convert GPS coordinates to km-based position rel to airport
            var start = new Position([lines[i][0],lines[i][1]], this.position, this.magnetic_north).position;
            var end   = new Position([lines[i][2],lines[i][3]], this.position, this.magnetic_north).position;
            this.maps[m].push([start[0], start[1], end[0], end[1]]);
          }
        }
      }

      if(data.restricted) {
        var r = data.restricted,
          self = this;
        for(var i in r) {
          var obj = {};
          if (r[i].name) obj.name = r[i].name;
          obj.height = parseElevation(r[i].height);
          obj.coordinates = $.map(r[i].coordinates, function(v) {
            return [(new Position(v, self.position, self.magnetic_north)).position];
          });

          var coords = obj.coordinates,
              coords_max = coords[0],
              coords_min = coords[0];

          for (var i in coords) {
            var v = coords[i];
            coords_max = [Math.max(v[0], coords_max[0]), Math.max(v[1], coords_max[1])];
            coords_min = [Math.min(v[0], coords_min[0]), Math.min(v[1], coords_min[1])];
          };

          obj.center = vscale(vadd(coords_max, coords_min), 0.5);
          self.restricted_areas.push(obj);
        }
      }

      if(data.wind) {
        this.wind = data.wind;
        this.wind.angle = degreesToRadians(this.wind.angle);
      }

      if(data.departures) {
        this.departures = zlsa.atc.DepartureFactory(this, data.departures);
      }

      if(data.arrivals) {
        for(var i=0;i<data.arrivals.length;i++) {
          if(!data.arrivals[i].hasOwnProperty("type"))
            log(this.icao + " arrival stream #" + i + " not given type!", LOG_WARNING);
          else this.arrivals.push(zlsa.atc.ArrivalFactory(this, data.arrivals[i]));
        }
      }

      this.checkFixes();  // verify we know where all the fixes are


      // ***** Generate Airport Metadata *****

      // Runway Metadata
      for(var rwy1 in this.runways) {
        for(var rwy1end in this.runways[rwy1]) {
          // setup primary runway object
          this.metadata.rwy[this.runways[rwy1][rwy1end].name] = {};

          for(var rwy2 in this.runways) {
            if(rwy1 == rwy2) continue;
            for(var rwy2end in this.runways[rwy2]) {
              //setup secondary runway subobject
              var r1  = this.runways[rwy1][rwy1end];
              var r2  = this.runways[rwy2][rwy2end];
              var offset = getOffset(r1, r2.position, r1.angle);
              this.metadata.rwy[r1.name][r2.name] = {};

              // generate this runway pair's relationship data
              this.metadata.rwy[r1.name][r2.name].lateral_dist = abs(offset[0]);
              this.metadata.rwy[r1.name][r2.name].straight_dist = abs(offset[2]);
              this.metadata.rwy[r1.name][r2.name].converging =
                raysIntersect(r1.position, r1.angle, r2.position, r2.angle);
              this.metadata.rwy[r1.name][r2.name].parallel =
                ( abs(angle_offset(r1.angle,r2.angle)) < degreesToRadians(10) );
            }
          }
        }
      }
    },
    set: function() {
      if (!this.loaded) {
        this.load();
        return;
      }

      localStorage['atc-last-airport'] = this.icao;

      prop.airport.current = this;

      $('#airport')
        .text(this.icao.toUpperCase())
        .attr("title", this.name);

      prop.canvas.draw_labels = true;
      $('.toggle-labels').toggle(
        !$.isEmptyObject(this.maps));

      $('.toggle-restricted-areas').toggle(
        (this.restricted_areas || []).length > 0);

      $('.toggle-sids').toggle(
        !$.isEmptyObject(this.sids));

      prop.canvas.dirty = true;

      $('.toggle-terrain').toggle(
        !$.isEmptyObject(this.terrain));

      game_reset_score();
      this.start = game_time();
      this.updateRunway();
      this.addAircraft();
      updateRun(true);
    },
    unset: function() {
      for(var i=0;i<this.arrivals.length;i++) {
        this.arrivals[i].stop();
      }
      this.departures.stop();
      if(this.timeout.runway) game_clear_timeout(this.timeout.runway);
    },
    addAircraft: function() {
      if(this.departures) {
        this.departures.start();
      }

      if(this.arrivals) {
        for(var i=0;i<this.arrivals.length;i++) {
          this.arrivals[i].start();
        }
      }
    },
    updateRunway: function(length) {
      if(!length) length = 0;
      var wind = this.getWind();
      var headwind = {};
      function ra(n) {
        var deviation = degreesToRadians(10);
        return n + crange(0, Math.random(), 1, -deviation, deviation);
      }
      for(var i=0;i<this.runways.length;i++) {
        var runway = this.runways[i];
        headwind[runway[0].name] = Math.cos(runway[0].angle - ra(wind.angle)) * wind.speed;
        headwind[runway[1].name] = Math.cos(runway[1].angle - ra(wind.angle)) * wind.speed;
      }
      var best_runway = "";
      var best_runway_headwind = -Infinity;
      for(var i in headwind) {
        if(headwind[i] > best_runway_headwind && this.getRunway(i).length > length) {
          best_runway = i;
          best_runway_headwind = headwind[i];
        }
      }
      this.runway = best_runway;
      this.timeout.runway = game_timeout(this.updateRunway, Math.random() * 30, this);
    },
    selectRunway: function(length) {
      return this.runway;
    },
    parseTerrain: function(data) {
      // terrain must be in geojson format
      var apt = this;
      apt.terrain = {};
      for (var i in data.features) {
        var f = data.features[i],
            ele = round(f.properties.elevation / .3048, 1000); // m => ft, rounded to 1K (but not divided)

        if (!apt.terrain[ele]) {
          apt.terrain[ele] = [];
        }

        var multipoly = f.geometry.coordinates;
        if (f.geometry.type == 'LineString') {
          multipoly = [[multipoly]];
        }
        if (f.geometry.type == 'Polygon') {
          multipoly = [multipoly];
        }

        $.each(multipoly, function(i, poly) {
          // multipoly contains several polys
          // each poly has 1st outer ring and other rings are holes
          apt.terrain[ele].push($.map(poly, function(line_string) {
            return [
              $.map(line_string,
                function(pt) {
                  var pos = new Position(pt, apt.position, apt.magnetic_north);
                  pos.parse4326();
                  return [pos.position];
                }
              )
            ];
          }));
        });
      }
    },
    loadTerrain: function() {
      zlsa.atc.loadAsset({url: 'assets/airports/terrain/' + this.icao.toLowerCase() + '.geojson',
                         immediate: true})
        .done(function (data) {
          try {
            log('Parsing terrain');
            this.parseTerrain(data);
          }
          catch (e) {
            log(e.message);
          }
          this.loading = false;
          this.loaded = true;
          this.set();
        }.bind(this))
        .fail(function (jqXHR, textStatus, errorThrown) {
          this.loading = false;
          console.error("Unable to load airport/terrain/" + this.icao
                        + ": " + textStatus);
          prop.airport.current.set();
        }.bind(this));
    },
    load: function() {
      if (this.loaded)
        return;

      updateRun(false);
      this.loading = true;
      zlsa.atc.loadAsset({url: "assets/airports/"+this.icao.toLowerCase()+".json",
                          immediate: true})
        .done(function (data) {
          this.parse(data);
          if (this.has_terrain)
            return;
          this.loading = false;
          this.loaded = true;
          this.set();
        }.bind(this))
        .fail(function (jqXHR, textStatus, errorThrown) {
          this.loading = false;
          console.error("Unable to load airport/" + this.icao
                        + ": " + textStatus);
          prop.airport.current.set();
        }.bind(this));
    },
    getRestrictedAreas: function() {
      return this.restricted_areas || null;
    },
    getFix: function(name) {
      if(!name) return null;
      if(Object.keys(airport_get().fixes).indexOf(name.toUpperCase()) == -1) return;
      else return airport_get().fixes[name.toUpperCase()].position;
    },
    getSID: function(id, exit, rwy) {
      if(!(id && exit && rwy)) return null;
      if(Object.keys(this.sids).indexOf(id) == -1) return;
      var fixes = [];
      var sid = this.sids[id];

      // runway portion
      if(sid.rwy.hasOwnProperty(rwy))
        for(var i=0; i<sid.rwy[rwy].length; i++) {
          if(typeof sid.rwy[rwy][i] == "string")
            fixes.push([sid.rwy[rwy][i], null]);
          else fixes.push(sid.rwy[rwy][i]);
        }

      // body portion
      if(sid.hasOwnProperty("body"))
        for(var i=0; i<sid.body.length; i++) {
          if(typeof sid.body[i] == "string")
            fixes.push([sid.body[i], null]);
          else fixes.push(sid.body[i]);
        }

      // exit portion
      if(sid.hasOwnProperty("exitPoints"))
        for(var i=0; i<sid.exitPoints[exit].length; i++) {
          if(typeof sid.exitPoints[exit][i] == "string")
            fixes.push([sid.exitPoints[exit][i], null]);
          else fixes.push(sid.exitPoints[exit][i]);
        }

      return fixes;
    },
    getSIDExitPoint: function(id) {
      // if ends at fix for which the SID is named, return end fix
      if(!this.sids[id].hasOwnProperty("exitPoints"))
        return this.sids[id].icao;

      // if has exitPoints, return a randomly selected one
      var exits = Object.keys(this.sids[id].exitPoints);
      return exits[Math.floor(Math.random() * exits.length)];
    },
    getSIDName: function(id, rwy) {
      if(this.sids[id].hasOwnProperty("suffix"))
        return this.sids[id].name + " " + this.sids[id].suffix[rwy];
      else return this.sids[id].name;
    },
    getSIDid: function(id, rwy) {
      if(this.sids[id].hasOwnProperty("suffix"))
        return this.sids[id].icao + this.sids[id].suffix[rwy];
      else return this.sids[id].icao;
    },
    /** Return an array of [Waypoint, fixRestrictions] for a given STAR
     ** @param {string} id - the identifier for the STAR (eg 'LENDY6')
     ** @param {string} entry - the entryPoint from which to join the STAR
     ** @param {string} rwy - (optional) the planned arrival runway
     ** Note: Passing a value for 'rwy' will help the fms distinguish between
     **       different branches of a STAR, when it splits into different paths
     **       for landing on different runways (eg 'HAWKZ4, landing south' vs
     **       'HAWKZ4, landing north'). Not strictly required, but not passing
     **       it will cause an incomplete route in many cases (depends on the
     **       design of the actual STAR in the airport's json file).
     */
    getSTAR: function(id, entry, /*optional*/ rwy) {
      if(!(id && entry) || Object.keys(this.stars).indexOf(id) == -1) return null;
      var fixes = [];
      var star = this.stars[id];

      // entry portion
      if(star.hasOwnProperty("entryPoints"))
        for(var i=0; i<star.entryPoints[entry].length; i++) {
          if(typeof star.entryPoints[entry][i] == "string")
            fixes.push([star.entryPoints[entry][i], null]);
          else fixes.push(star.entryPoints[entry][i]);
        }

      // body portion
      if(star.hasOwnProperty("body"))
        for(var i=0; i<star.body.length; i++) {
          if(typeof star.body[i] == "string")
            fixes.push([star.body[i], null]);
          else fixes.push(star.body[i]);
        }

      // runway portion
      if(star.rwy && star.rwy.hasOwnProperty(rwy))
        for(var i=0; i<star.rwy[rwy].length; i++) {
          if(typeof star.rwy[rwy][i] == "string")
            fixes.push([star.rwy[rwy][i], null]);
          else fixes.push(star.rwy[rwy][i]);
        }

      return fixes;
    },
    getRunway: function(name) {
      if(!name) return null;
      name = name.toLowerCase();
      for(var i=0;i<this.runways.length;i++) {
        if(this.runways[i][0].name.toLowerCase() == name) return this.runways[i][0];
        if(this.runways[i][1].name.toLowerCase() == name) return this.runways[i][1];
      }
      return null;
    },
    /** Verifies all fixes used in the airport also have defined positions
     */
    checkFixes: function() {
      var fixes = [];

      // Gather fixes used by SIDs
      if(this.hasOwnProperty("sids")) {
        for(var s in this.sids) {
          if(this.sids[s].hasOwnProperty("rwy")) {  // runway portion
            for(var r in this.sids[s].rwy)
              for(var i in this.sids[s].rwy[r]) {
                if(typeof this.sids[s].rwy[r][i] == "string")
                  fixes.push(this.sids[s].rwy[r][i]);
                else fixes.push(this.sids[s].rwy[r][i][0]);
              }
          }
          if(this.sids[s].hasOwnProperty("body")) { // body portion
            for(var i in this.sids[s].body) {
              if(typeof this.sids[s].body[i] == "string")
                fixes.push(this.sids[s].body[i]);
              else fixes.push(this.sids[s].body[i][0]);
            }
          }
          if(this.sids[s].hasOwnProperty("exitPoints")) { // exitPoints portion
            for(var t in this.sids[s].exitPoints)
              for(var i in this.sids[s].exitPoints[t]) {
                if(typeof this.sids[s].exitPoints[t][i] == "string")
                  fixes.push(this.sids[s].exitPoints[t][i]);
                else fixes.push(this.sids[s].exitPoints[t][i][0]);
              }
          }
          if(this.sids[s].hasOwnProperty("draw")) { // draw portion
            for(var i in this.sids[s].draw)
              for(var j=0; j<this.sids[s].draw[i].length; j++)
                fixes.push(this.sids[s].draw[i][j].replace('*',''));
          }
        }
      }

      // Gather fixes used by STARs
      if(this.hasOwnProperty("stars")) {
        for(var s in this.stars) {
          if(this.stars[s].hasOwnProperty("entryPoints")) { // entryPoints portion
            for(var t in this.stars[s].entryPoints)
              for(var i in this.stars[s].entryPoints[t]) {
                if(typeof this.stars[s].entryPoints[t][i] == "string")
                  fixes.push(this.stars[s].entryPoints[t][i]);
                else fixes.push(this.stars[s].entryPoints[t][i][0]);
              }
          }
          if(this.stars[s].hasOwnProperty("body")) { // body portion
            for(var i in this.stars[s].body) {
              if(typeof this.stars[s].body[i] == "string")
                fixes.push(this.stars[s].body[i]);
              else fixes.push(this.stars[s].body[i][0]);
            }
          }
          if(this.stars[s].hasOwnProperty("rwy")) {  // runway portion
            for(var r in this.stars[s].rwy)
              for(var i in this.stars[s].rwy[r]) {
                if(typeof this.stars[s].rwy[r][i] == "string")
                  fixes.push(this.stars[s].rwy[r][i]);
                else fixes.push(this.stars[s].rwy[r][i][0]);
              }
          }
          if(this.stars[s].hasOwnProperty("draw")) { // draw portion
            for(var i in this.stars[s].draw)
              for(var j in this.stars[s].draw[i])
                fixes.push(this.stars[s].draw[i][j].replace('*',''));
          }
        }
      }

      // Gather fixes used by airways
      if(this.hasOwnProperty("airways")) {
        for(var a in this.airways)
          for(var i in this.airways[a])
            fixes.push(this.airways[a][i]);
      }

      // Get (unique) list of fixes used that are not in 'this.fixes'
      var apt = this;
      var missing = fixes.filter(function(f){return !apt.fixes.hasOwnProperty(f);}).sort();
      for(var i=0; i<missing.length-1; i++)
        if(missing[i] == missing[i+1]) missing.splice(i,1); // remove duplicates
      if(missing.length > 0) {  // there are some... yell at the airport designer!!! :)
        log(this.icao + " uses the following fixes which are not listed in " +
          "airport.fixes: " +missing.join(' '), LOG_WARNING);
      }
    }
  };
});

export default AirportInstance;
