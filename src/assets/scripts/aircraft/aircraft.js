import AircraftConflict from './AircraftConflict';
import AircraftModel from './AircraftModel';
import AircraftFlightManagementSystem from './AircraftFlightManagementSystem';
import AircraftInstanceModel from './AircraftInstanceModel';

import { km, km_ft } from '../utilities/unitConverters';

/**
 * Main entry point for the aircraft object.
 *
 */
// TODO: remove window instances
window.zlsa.atc.Conflict = AircraftConflict;
const Model = AircraftModel;
window.zlsa.atc.AircraftFlightManagementSystem = AircraftFlightManagementSystem;
const Aircraft = AircraftInstanceModel;


window.aircraft_init_pre = function aircraft_init_pre() {
    prop.aircraft = {};
    prop.aircraft.models = {};
    prop.aircraft.callsigns = [];
    prop.aircraft.list = [];
    prop.aircraft.current  = null;

    prop.aircraft.auto = {
        enabled: false,
    };
}

window.aircraft_init = function aircraft_init() {};

window.aircraft_auto_toggle = function aircraft_auto_toggle() {
  prop.aircraft.auto.enabled = !prop.aircraft.auto.enabled;
}

window.aircraft_generate_callsign = function aircraft_generate_callsign(airline_name) {
  var airline = airline_get(airline_name);
  if(!airline) {
    console.warn("Airline not found:" + airline_name);
    return 'airline-' + airline_name + '-not-found';
  }
  return airline.generateFlightNumber();
}

window.aircraft_callsign_new = function aircraft_callsign_new(airline) {
  var callsign = null;
  var hit = false;
  while(true) {
    callsign = aircraft_generate_callsign(airline);
    if (prop.aircraft.callsigns.indexOf(callsign) == -1)
      break;
  }
  prop.aircraft.callsigns.push(callsign);
  return callsign;
}

window.aircraft_new = function aircraft_new(options) {
  var airline = airline_get(options.airline);
  return airline.generateAircraft(options);
}

window.aircraft_get_nearest = function aircraft_get_nearest(position) {
  var nearest  = null;
  var distance = Infinity;
  for(var i=0;i<prop.aircraft.list.length;i++) {
    var d = distance2d(prop.aircraft.list[i].position, position);
    if(d < distance && prop.aircraft.list[i].isVisible() && !prop.aircraft.list[i].hit) {
      distance = d;
      nearest = i;
    }
  }
  return [prop.aircraft.list[nearest], distance];
}

window.aircraft_add = function aircraft_add(model) {
  prop.aircraft.models[model.icao.toLowerCase()] = model;
}

window.aircraft_visible = function aircraft_visible(aircraft, factor) {
  if(!factor) factor=1;
  return (vlen(aircraft.position) < airport_get().ctr_radius * factor);
}

window.aircraft_remove_all = function aircraft_remove_all() {
  for(var i=0;i<prop.aircraft.list.length;i++) {
    prop.aircraft.list[i].cleanup();
  }
  prop.aircraft.list = [];
}

window.aircraft_update = function aircraft_update() {
  for(var i=0;i<prop.aircraft.list.length;i++) {
    prop.aircraft.list[i].update();
  }
  for(var i=0;i<prop.aircraft.list.length;i++) {
    prop.aircraft.list[i].updateWarning();

    InnerLoop: for (var j=i+1;j<prop.aircraft.list.length;j++) {
      var that = prop.aircraft.list[i];
      var other = prop.aircraft.list[j];

      if (that.checkConflict(other)) {
        continue InnerLoop;
      }

      // Fast 2D bounding box check, there are no conflicts over 8nm apart (14.816km)
      // no violation can occur in this case.
      // Variation of:
      // http://gamedev.stackexchange.com/questions/586/what-is-the-fastest-way-to-work-out-2d-bounding-box-intersection
      var dx = Math.abs(that.position[0] - other.position[0]);
      var dy = Math.abs(that.position[1] - other.position[1]);
      if ((dx > 14.816) || (dy > 14.816)) {
        continue InnerLoop;
      }
      else {
        new AircraftConflict(that, other);
      }
    }
  }
  for(var i=prop.aircraft.list.length-1;i>=0;i--) {
    var remove = false;
    var aircraft = prop.aircraft.list[i];
    var is_visible = aircraft_visible(aircraft);
    if(aircraft.isStopped() && aircraft.category == "arrival") {
      prop.game.score.windy_landing += aircraft.scoreWind('landed');
      ui_log(aircraft.getCallsign() + " switching to ground, good day");
      speech_say([ {type:"callsign", content:aircraft}, {type:"text", content:", switching to ground, good day"} ]);
      prop.game.score.arrival += 1;
      remove = true;
    }
    if(aircraft.hit && aircraft.isLanded()) {
      ui_log("Lost radar contact with "+aircraft.getCallsign());
      speech_say([ {type:"callsign", content:aircraft}, {type:"text", content:", radar contact lost"} ]);
      remove = true;
    }
    // Clean up the screen from aircraft that are too far
    if((!aircraft_visible(aircraft,2) && !aircraft.inside_ctr) && aircraft.fms.currentWaypoint().navmode == 'heading'){
      if(aircraft.category == "arrival") {
        remove = true;
      }
      else if(aircraft.category == "departure") {
        remove = true;
      }
    }
    if(remove) {
      aircraft_remove(aircraft);
      i -= 1;
    }
  }
}

// Calculate the turn initiation distance for an aircraft to navigate between two fixes.
// References:
// - http://www.ohio.edu/people/uijtdeha/ee6900_fms_00_overview.pdf, Fly-by waypoint
// - The Avionics Handbook, ch 15
window.aircraft_turn_initiation_distance = function aircraft_turn_initiation_distance(a, fix) {
  var index = a.fms.indexOfCurrentWaypoint().wp;
  if(index >= a.fms.waypoints().length-1) return 0; // if there are no subsequent fixes, fly over 'fix'
  var speed = a.speed * (463/900); // convert knots to m/s
  var bank_angle = radians(25); // assume nominal bank angle of 25 degrees for all aircraft
  var g = 9.81;                 // acceleration due to gravity, m/s*s
  var nextfix = a.fms.waypoint(a.fms.indexOfCurrentWaypoint().wp+1).location;
  if(!nextfix) return 0;
  var nominal_new_course = vradial(vsub(nextfix, fix));
  if( nominal_new_course < 0 ) nominal_new_course += Math.PI * 2;
  var current_heading = a.heading;
  if (current_heading < 0) current_heading += Math.PI * 2;
  var course_change = Math.abs(degrees(current_heading) - degrees(nominal_new_course));
  if (course_change > 180) course_change = 360 - course_change;
  course_change = radians(course_change);
  var turn_radius = speed*speed / (g * Math.tan(bank_angle));  // meters
  var l2 = speed; // meters, bank establishment in 1s
  var turn_initiation_distance = turn_radius * Math.tan(course_change/2) + l2;
  return turn_initiation_distance / 1000; // convert m to km
}

// Get aircraft by entity id
window.aircraft_get = function aircraft_get(eid) {
  if(eid == null) return null;
  if(prop.aircraft.list.length > eid && eid >= 0) // prevent out-of-range error
    return prop.aircraft.list[eid];
  return null;
}

// Get aircraft by callsign
window.aircraft_get_by_callsign = function aircraft_get_by_callsign(callsign) {
  callsign = String(callsign);
  for(var i=0; i<prop.aircraft.list.length; i++)
    if(prop.aircraft.list[i].callsign == callsign.toLowerCase())
      return prop.aircraft.list[i];
  return null;
}

// Get aircraft's eid by callsign
window.aircraft_get_eid_by_callsign = function aircraft_get_eid_by_callsign(callsign) {
  for(var i=0; i<prop.aircraft.list.length; i++)
    if(prop.aircraft.list[i].callsign == callsign.toLowerCase())
      return prop.aircraft.list[i].eid;
  return null;
}

window.aircraft_model_get = function aircraft_model_get(icao) {
  if (!(icao in prop.aircraft.models)) {
    var model = new Model({
      icao: icao,
      url: "assets/aircraft/"+icao+".json",
    });
    prop.aircraft.models[icao] = model;
  }
  return prop.aircraft.models[icao];
}
