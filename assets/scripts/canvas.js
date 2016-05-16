// jshint latedef:nofunc, undef:true, eqnull:true, eqeqeq:true, browser:true, jquery:true, devel:true
/*global prop:true, km:false, crange:false, clamp:false, lpad:false, airport_get:false, game_time:false, game_paused:false, time:false, round:false, distance2d:false, radians:false  */

function canvas_init_pre() {
  "use strict";
  prop.canvas={};

  prop.canvas.contexts={};

  prop.canvas.panY=0;
  prop.canvas.panX=0;

  // resize canvas to fit window?
  prop.canvas.resize=true;
  prop.canvas.size={ // all canvases are the same size
    height:480,
    width:640
  };

  prop.canvas.last = time();
  prop.canvas.dirty = true;
  prop.canvas.draw_labels = true;
  prop.canvas.draw_restricted = true;
  prop.canvas.draw_sids = true;
  prop.canvas.draw_terrain = true;
}

function canvas_init() {
  "use strict";
  canvas_add("navaids");
}

function canvas_adjust_hidpi() {
  "use strict";
  var dpr = window.devicePixelRatio || 1;
  log("devicePixelRatio:"+dpr);
  if(dpr > 1) {
    var hidefCanvas = $("#navaids-canvas").get(0);
    var w = prop.canvas.size.width;
    var h = prop.canvas.size.height;
    $(hidefCanvas).attr('width', w * dpr);
    $(hidefCanvas).attr('height', h * dpr);
    $(hidefCanvas).css('width', w );
    $(hidefCanvas).css('height', h );
    var ctx = hidefCanvas.getContext("2d");
    ctx.scale(dpr, dpr);
    prop.canvas.contexts.navaids = ctx;
  }
}

function canvas_complete() {
  "use strict";
  setTimeout(function() {
    prop.canvas.dirty = true;
  }, 500);
  prop.canvas.last = time();
}

function canvas_resize() {
  "use strict";
  if(prop.canvas.resize) {
    prop.canvas.size.width  = $(window).width();
    prop.canvas.size.height = $(window).height();
  }
  prop.canvas.size.width  -= 250;
  prop.canvas.size.height -= 36;
  for(var i in prop.canvas.contexts) {
    prop.canvas.contexts[i].canvas.height=prop.canvas.size.height;
    prop.canvas.contexts[i].canvas.width=prop.canvas.size.width;
  }
  prop.canvas.dirty = true;
  canvas_adjust_hidpi();
}

function canvas_add(name) {
  "use strict";
  $("#canvases").append("<canvas id='"+name+"-canvas'></canvas>");
  prop.canvas.contexts[name]=$("#"+name+"-canvas").get(0).getContext("2d");
}

function canvas_get(name) {
  "use strict";
  return(prop.canvas.contexts[name]);
}

function canvas_clear(cc) {
  "use strict";
  cc.clearRect(0,0,prop.canvas.size.width,prop.canvas.size.height);
}

function canvas_should_draw() {
  "use strict";
  var elapsed = time() - prop.canvas.last;
  if(elapsed > (1/prop.game.speedup)) {
    prop.canvas.last = time();
    return true;
  }
  return false;
}

// DRAW

function canvas_draw_runway(cc, runway, mode) {
  "use strict";
  var length2 = round(km_to_px(runway.length / 2));
  var angle   = runway.angle;

  cc.translate(round(km_to_px(runway.position[0])) + prop.canvas.panX, 
              -round(km_to_px(runway.position[1])) + prop.canvas.panY);
  cc.rotate(angle);

  if(!mode) { // runway body
    cc.strokeStyle = "#899";
    cc.lineWidth = 2.8;
    cc.beginPath();
    cc.moveTo(0, 0);
    cc.lineTo(0, -2*length2);
    cc.stroke();
  } 
  else {  // extended centerlines
    if(!runway.ils.enabled) return;
    cc.strokeStyle = "#465";
    cc.lineWidth = 1;
    cc.beginPath();
    cc.moveTo(0, 0);
    cc.lineTo(0, km_to_px(runway.ils.loc_maxDist));
    cc.stroke();
  }
}

function canvas_draw_runway_label(cc, runway) {
  "use strict";
  var length2 = round(km_to_px(runway.length / 2)) + 0.5;
  var angle   = runway.angle;

  cc.translate(round(km_to_px(runway.position[0])) + prop.canvas.panX, -round(km_to_px(runway.position[1])) + prop.canvas.panY);

  cc.rotate(angle);

  var text_height = 14;
  cc.textAlign    = "center";
  cc.textBaseline = "middle";

  cc.save();
  cc.translate(0,  length2 + text_height);
  cc.rotate(-angle);
  cc.translate(round(km_to_px(runway.labelPos[0])), -round(km_to_px(runway.labelPos[1])));
  cc.fillText(runway.name, 0, 0);
  cc.restore();
}

function canvas_draw_runways(cc) {
  "use strict";
  if(!prop.canvas.draw_labels) return;
  cc.strokeStyle = "rgba(255, 255, 255, 0.4)";
  cc.fillStyle   = "rgba(255, 255, 255, 0.4)";
  cc.lineWidth   = 4;
  var airport=airport_get();
  var i;
  //Extended Centerlines
  for( i=0;i<airport.runways.length;i++) {
    cc.save();
    canvas_draw_runway(cc, airport.runways[i][0], true);
    cc.restore();
    cc.save();
    canvas_draw_runway(cc, airport.runways[i][1], true);
    cc.restore();
  }
  // Runways
  for( i=0;i<airport.runways.length;i++) {
    cc.save();
    canvas_draw_runway(cc, airport.runways[i][0], false);
    cc.restore();
  }
}

function canvas_draw_runway_labels(cc) {
  "use strict";
  if(!prop.canvas.draw_labels) return;
  cc.fillStyle   = "rgba(255, 255, 255, 0.8)";
  var airport=airport_get();
  for(var i=0;i<airport.runways.length;i++) {
    cc.save();
    canvas_draw_runway_label(cc, airport.runways[i][0]);
    cc.restore();
    cc.save();
    canvas_draw_runway_label(cc, airport.runways[i][1]);
    cc.restore();
  }
}

function canvas_draw_scale(cc) {
  "use strict";
  cc.fillStyle   = "rgba(255, 255, 255, 0.8)";
  cc.strokeStyle = "rgba(255, 255, 255, 0.8)";

  var offset = 10;
  var height = 5;

  var length = round(1 / prop.ui.scale * 50);
  var px_length = round(km_to_px(length));

  cc.translate(0.5, 0.5);

  cc.lineWidth = 1;
  cc.moveTo(prop.canvas.size.width - offset, offset);
  cc.lineTo(prop.canvas.size.width - offset, offset + height);
  cc.lineTo(prop.canvas.size.width - offset - px_length, offset + height);
  cc.lineTo(prop.canvas.size.width - offset - px_length, offset);
  cc.stroke();

  cc.translate(-0.5, -0.5);

  cc.textAlign = 'center';
  cc.fillText(length + ' km', prop.canvas.size.width - offset - px_length * 0.5, offset + height + 17);
}

function canvas_draw_fix(cc, name, fix) {
  "use strict";
  cc.beginPath();
  cc.moveTo( 0, -5);
  cc.lineTo( 4,  3);
  cc.lineTo(-4,  3);
  cc.closePath();
  cc.fill();
  cc.stroke();

  cc.textAlign    = "center";
  cc.textBaseline = "top";
  cc.strokeText(name, 0, 6);
  cc.fillText(name, 0, 6);
}

function canvas_draw_fixes(cc) {
  "use strict";
  if(!prop.canvas.draw_labels) return;
  cc.lineJoin    = "round";
  cc.font = "10px monoOne, monospace";
  var airport=airport_get();
  for(var i in airport.real_fixes) {
    cc.save();
    cc.translate(round(km_to_px(airport.fixes[i][0])) + prop.canvas.panX, -round(km_to_px(airport.fixes[i][1])) + prop.canvas.panY);

    // draw outline (draw with eraser)
    cc.strokeStyle = "rgba(0, 0, 0, 0.67)";
    cc.fillStyle   = "rgba(0, 0, 0, 0.67)";
    cc.globalCompositeOperation = 'destination-out';
    cc.lineWidth   = 4;
    
    canvas_draw_fix(cc, i, airport.fixes[i]);

    cc.strokeStyle = "rgba(255, 255, 255, 0)";
    cc.fillStyle   = "rgba(255, 255, 255, 0.5)";
    cc.globalCompositeOperation = 'source-over';
    cc.lineWidth   = 1;

    canvas_draw_fix(cc, i, airport.fixes[i]);
    cc.restore();
  }
}

function canvas_draw_sids(cc) {
  "use strict";
  if (!prop.canvas.draw_sids) return;

  var departure_colour = "rgba(128, 255, 255, 0.6)";
  cc.strokeStyle = departure_colour;
  cc.fillStyle = departure_colour;
  cc.setLineDash([1,10]);
  cc.font = "italic 14px monoOne, monospace";
  var airport = airport_get();
  for(var s in airport.sids) {
    var write_sid_name = true;
    if(airport.sids[s].hasOwnProperty("draw")) {
      for(var i in airport.sids[s].draw) {
        var fixList = airport.sids[s].draw[i];
        var fx, fy, trxn_name = null;
        for(var j=0; j<fixList.length; j++) {
          if(fixList[j].indexOf("*") != -1) { // write transition name
            trxn_name = fixList[j].replace("*","");
            write_sid_name = false;
          }
          var fix = airport.getFix(fixList[j].replace("*",""));
          if(!fix) log('Unable to draw line to "'+fixList[j]+'" because its position is not defined!', LOG_WARNING);
          fx = km_to_px(fix[0]) + prop.canvas.panX;
          fy = -km_to_px(fix[1]) + prop.canvas.panY;
          if(j === 0) {
            cc.beginPath();
            cc.moveTo(fx, fy);
          } else {
            cc.lineTo(fx, fy);
          }
        }
        cc.stroke();
        if(trxn_name) cc.fillText(s + "." + trxn_name, fx+10, fy);
      }
      if(write_sid_name) cc.fillText(s, fx+10, fy);
    }
  }
}

function canvas_draw_separation_indicator(cc, aircraft) {
  "use strict";
  // Draw a trailing indicator 2.5 NM (4.6km) behind landing aircraft to help with traffic spacing
  var rwy = airport_get().getRunway(aircraft.fms.currentWaypoint().runway);
  var angle = rwy.angle + Math.PI;
  cc.strokeStyle = "rgba(224, 128, 128, 0.8)";
  cc.lineWidth = 3;
  cc.translate(km_to_px(aircraft.position[0]) + prop.canvas.panX, -km_to_px(aircraft.position[1]) + prop.canvas.panY);
  cc.rotate(angle);
  cc.beginPath();
  cc.moveTo(-5, -km_to_px(5.556));  // 5.556km = 3.0nm
  cc.lineTo(+5, -km_to_px(5.556));  // 5.556km = 3.0nm
  cc.stroke();
}

function canvas_draw_aircraft_rings(cc,aircraft) {
  cc.save();
  if(aircraft.hasAlerts()[0]) {
    if(aircraft.hasAlerts()[1]) cc.strokeStyle = "rgba(224, 128, 128, 1.0)";  //red violation circle
    else cc.strokeStyle = "rgba(255, 255, 255, 0.2)";   //white warning circle
  }
  else cc.strokeStyle = cc.fillStyle;
  cc.beginPath();
  cc.arc(0, 0, km_to_px(km(3)), 0, Math.PI * 2);  //3nm RADIUS
  cc.stroke();
  cc.restore();
}

function canvas_draw_aircraft_departure_window(cc, aircraft) {
  "use strict";
  cc.save();
  cc.strokeStyle = "rgba(128, 255, 255, 0.9)";
  cc.beginPath();
  var angle = aircraft.destination - Math.PI/2;
  cc.arc(prop.canvas.panX,
         prop.canvas.panY,
         km_to_px(airport_get().ctr_radius),
         angle - 0.08726,
         angle + 0.08726);
  cc.stroke();
  cc.restore();
}

function canvas_draw_aircraft(cc, aircraft) {
  "use strict";
  var almost_match = false;
  var match        = false;

  if ((prop.input.callsign.length > 1) &&
      (aircraft.matchCallsign(prop.input.callsign.substr(0, prop.input.callsign.length - 1))))
  {
    almost_match = true;
  }
  if((prop.input.callsign.length > 0) &&
     (aircraft.matchCallsign(prop.input.callsign)))
  {
    match = true;
  }

  if (match && (aircraft.destination != null)) {
    canvas_draw_aircraft_departure_window(cc, aircraft);
  }

  if(!aircraft.isVisible()) return;

  var size = 3;

  // Trailling
  var trailling_length = 12;
  var dpr = window.devicePixelRatio || 1;
  if (dpr > 1)
    trailling_length *= round(dpr);

  cc.save();
  if (!aircraft.inside_ctr)
    cc.fillStyle   = "rgb(224, 224, 224)";
  else
    cc.fillStyle = "rgb(255, 255, 255)";

  var length = aircraft.position_history.length;
  for (var i = 0; i < length; i++) {
    if (!aircraft.inside_ctr)
      cc.globalAlpha = 0.3 / (length - i);
    else
      cc.globalAlpha = 1 / (length - i);
    cc.fillRect(km_to_px(aircraft.position_history[i][0]) + prop.canvas.panX - 1, - km_to_px(aircraft.position_history[i][1]) + prop.canvas.panY - 1, 2, 2);
  }
  cc.restore();

  if(aircraft.position_history.length > trailling_length) aircraft.position_history = aircraft.position_history.slice(aircraft.position_history.length - trailling_length, aircraft.position_history.length);

  if(aircraft.isPrecisionGuided()) {
    cc.save();
    canvas_draw_separation_indicator(cc, aircraft);
    cc.restore();
  }

  // Aircraft
  // Draw the future path
  if ((prop.game.option.get('drawProjectedPaths') == 'always') ||
      ((prop.game.option.get('drawProjectedPaths') == 'selected') &&
       ((aircraft.warning || match) && !aircraft.isTaxiing())))
  {
    canvas_draw_future_track(cc, aircraft);
  }

  var alerts = aircraft.hasAlerts();

  if (!aircraft.inside_ctr)
    cc.fillStyle   = "rgba(224, 224, 224, 0.3)";
  else if (almost_match)
    cc.fillStyle = "rgba(224, 210, 180, 1.0)";
  else if (match)
    cc.fillStyle = "rgba(255, 255, 255, 1.0)";
  else if (aircraft.warning || alerts[1])
    cc.fillStyle = "rgba(224, 128, 128, 1.0)";
  else if (aircraft.hit)
    cc.fillStyle = "rgba(255, 64, 64, 1.0)";
  else
    cc.fillStyle   = "rgba(224, 224, 224, 1.0)";

  cc.strokeStyle = cc.fillStyle;

  if(match) {

    cc.save();

    if (!aircraft.inside_ctr)
      cc.fillStyle = "rgba(255, 255, 255, 0.3)";
    else
      cc.fillStyle = "rgba(255, 255, 255, 1.0)";

    var w = prop.canvas.size.width/2;
    var h = prop.canvas.size.height/2;

    cc.translate(clamp(-w, km_to_px(aircraft.position[0]) + prop.canvas.panX, w), clamp(-h, -km_to_px(aircraft.position[1]) + prop.canvas.panY, h));

    cc.beginPath();
    cc.arc(0, 0, round(size * 1.5), 0, Math.PI * 2);
    cc.fill();

    cc.restore();
  }

  cc.translate(km_to_px(aircraft.position[0]) + prop.canvas.panX, -km_to_px(aircraft.position[1]) + prop.canvas.panY);

  if(!aircraft.hit) {
    cc.save();

    var tail_length = aircraft.groundSpeed / 15;
    if(match) tail_length = 15;
    var angle       = aircraft.groundTrack;
    var end         = vscale(vturn(angle), tail_length);

    cc.beginPath();
    cc.moveTo(0, 0);
    cc.lineTo(end[0], -end[1]);
    cc.stroke();
    cc.restore();
  }

  if(aircraft.notice || alerts[0]) {
    canvas_draw_aircraft_rings(cc,aircraft);
  }

  cc.beginPath();
  cc.arc(0, 0, size, 0, Math.PI * 2);
  cc.fill();
}

// Run physics updates into the future, draw future track
function canvas_draw_future_track(cc, aircraft) {
  "use strict";
  var fms_twin = $.extend(true, {}, aircraft.fms);
  var twin = $.extend(true, {}, aircraft);
  twin.fms = fms_twin;
  twin.fms.aircraft = twin;
  twin.projected = true;
  var save_delta = prop.game.delta;
  prop.game.delta = 5;
  var future_track = [];
  var ils_locked;
  for(var i = 0; i < 60; i++) {
    twin.update();
    ils_locked = twin.fms.currentWaypoint().runway && twin.category === "arrival" && twin.mode === "landing";
    future_track.push([twin.position[0], twin.position[1], ils_locked]);
    if( ils_locked && twin.altitude < 500)
      break;
  }
  prop.game.delta = save_delta;
  cc.save();

  var lockedStroke;
  if(aircraft.category === "departure") {
    cc.strokeStyle = "rgba(128, 255, 255, 0.6)";
  } else {
    cc.strokeStyle = "rgba(224, 128, 128, 0.6)";
    lockedStroke   = "rgba(224, 128, 128, 1.0)";
  }
  cc.globalCompositeOperation = "screen";

  cc.lineWidth = 2;
  cc.beginPath();
  var was_locked = false;
  var length = future_track.length;
  for (i = 0; i < length; i++) {
      ils_locked = future_track[i][2];
      var x = km_to_px(future_track[i][0]) + prop.canvas.panX ;
      var y = -km_to_px(future_track[i][1]) + prop.canvas.panY;
      if(ils_locked && !was_locked) {
        cc.lineTo(x, y);
        cc.stroke(); // end the current path, start a new path with lockedStroke
        cc.strokeStyle = lockedStroke;
        cc.lineWidth = 3;
        cc.beginPath();
        cc.moveTo(x, y);
        was_locked = true;
        continue;
      }
      if( i === 0 )
        cc.moveTo(x, y);
      else
        cc.lineTo(x, y);
  }
  cc.stroke();
  canvas_draw_future_track_fixes(cc, twin, future_track);
  cc.restore();
}

// Draw dashed line from last coordinate of future track through
// any later requested fixes.
function canvas_draw_future_track_fixes( cc, aircraft, future_track) {
  "use strict";
  if (aircraft.fms.waypoints.length < 1) return;
  var start = future_track.length - 1;
  var x = km_to_px(future_track[start][0]) + prop.canvas.panX;
  var y = -km_to_px(future_track[start][1]) + prop.canvas.panY;
  cc.beginPath();
  cc.moveTo(x, y);
  cc.setLineDash([3,10]);
  for(var i=0; i<aircraft.fms.waypoints.length; i++) {
    if (!aircraft.fms.waypoints[i].location)
      break;
    var fix = aircraft.fms.waypoints[i].location;
    var fx = km_to_px(fix[0]) + prop.canvas.panX;
    var fy = -km_to_px(fix[1]) + prop.canvas.panY;
    cc.lineTo(fx, fy);
  }
  cc.stroke();
}

function canvas_draw_all_aircraft(cc) {
  "use strict";
  cc.fillStyle   = "rgba(224, 224, 224, 1.0)";
  cc.strokeStyle = "rgba(224, 224, 224, 1.0)";
  cc.lineWidth   = 2;
  // console.time('canvas_draw_all_aircraft')
  for(var i=0;i<prop.aircraft.list.length;i++) {
    cc.save();
    canvas_draw_aircraft(cc, prop.aircraft.list[i]);
    cc.restore();
  }
  // console.timeEnd('canvas_draw_all_aircraft')
}

/** Draw an aircraft's data block
 ** (box that contains callsign, altitude, speed)
 */
function canvas_draw_info(cc, aircraft) {
  "use strict";
  if(!aircraft.isVisible()) return;
  if(!aircraft.hit) {
    
    // Initial Setup
    cc.save();
    var cs = aircraft.getCallsign();
    var paddingLR = 5;
    var width  = clamp(1, 5.8*cs.length) + (paddingLR*2); // width of datablock (scales to fit callsign)
    var width2 = width / 2;
    var height  = 31;               // height of datablock
    var height2 = height / 2; 
    var bar_width = width / 18;     // width of colored bar
    var bar_width2 = bar_width / 2;
    var ILS_enabled = aircraft.fms.currentWaypoint().runway && aircraft.category === "arrival";
    var lock_size = height / 3;
    var lock_offset = lock_size / 8;
    var pi = Math.PI;
    var point1 = lock_size - bar_width2;
    var alt_trend_char = "";
    var a = point1 - lock_offset;
    var b = bar_width2;
    var clipping_mask_angle = Math.atan(b / a);
    var pi_slice = pi / 24;         // describes how far around to arc the arms of the ils lock case

    // Callsign Matching
    if(prop.input.callsign.length > 1 && aircraft.matchCallsign(prop.input.callsign.substr(0, prop.input.callsign.length - 1)))
      var almost_match = true;
    if(prop.input.callsign.length > 0 && aircraft.matchCallsign(prop.input.callsign))
      var match = true;

    // set color, intensity, and style elements
    if (match) var alpha = 0.9;
    // else if(almost_match) var alpha = 0.75;
    else if (aircraft.inside_ctr) var alpha = 0.5;
    else var alpha = 0.2;
    var red   = "rgba(224, 128, 128, " + alpha + ")";
    var green = "rgba( 76, 118,  97, " + alpha + ")";
    var blue  = "rgba(128, 255, 255, " + alpha + ")";
    var white = "rgba(255, 255, 255, " + alpha + ")";
    cc.textBaseline = "middle";

    // Move to center of where the data block is to be drawn
    var ac_pos = [round(km_to_px(aircraft.position[0])) + prop.canvas.panX,
                 -round(km_to_px(aircraft.position[1])) + prop.canvas.panY];
    if(aircraft.datablockDir == -1) { // game will move FDB to the appropriate position
      if(-km_to_px(aircraft.position[1]) + prop.canvas.size.height/2 < height * 1.5)
        cc.translate(ac_pos[0], ac_pos[1] + height2 + 12);
      else cc.translate(ac_pos[0], ac_pos[1] -height2 - 12);
    }
    else {  // user wants to specify FDB position
      var displacements = {
        "ctr": [0,0],
        360  : [0, -height2 - 12],
        45   : [width2 + 8.5, -height2 - 8.5],
        90   : [width2 + bar_width2 + 12, 0],
        135  : [width2 + 8.5, height2 + 8.5],
        180  : [0, height2 + 12],
        225  : [-width2 - 8.5, height2 + 8.5],
        270  : [-width2 - bar_width2 - 12, 0],
        315  : [-width2 - 8.5, -height2 - 8.5]
      };
      cc.translate(ac_pos[0] + displacements[aircraft.datablockDir][0],
        ac_pos[1] + displacements[aircraft.datablockDir][1]);
    }

    // Draw datablock shapes
    if(!ILS_enabled) {  // Standard Box
      cc.fillStyle = green;
      cc.fillRect(-width2, -height2, width, height); // Draw box
      cc.fillStyle = (aircraft.category == "departure") ? blue : red;
      cc.fillRect(-width2 - bar_width, -height2, bar_width, height);  // Draw colored bar
    }
    else {  // Box with ILS Lock Indicator
      cc.save();

      // Draw green part of box (excludes space where ILS Clearance Indicator juts in)
      cc.fillStyle = green;
      cc.beginPath();
      cc.moveTo(-width2, height2);  // bottom-left corner
      cc.lineTo(width2, height2);   // bottom-right corner
      cc.lineTo(width2, -height2);  // top-right corner
      cc.lineTo(-width2, -height2); // top-left corner
      cc.lineTo(-width2, -point1);  // begin side cutout
      cc.arc(-width2 - bar_width2, -lock_offset, lock_size / 2 + bar_width2, clipping_mask_angle - pi / 2, 0);
      cc.lineTo(-width2 + lock_size / 2, lock_offset);
      cc.arc(-width2 - bar_width2, lock_offset, lock_size / 2 + bar_width2, 0, pi / 2 - clipping_mask_angle);
      cc.closePath();
      cc.fill();

      // Draw ILS Clearance Indicator
      cc.translate(-width2 - bar_width2, 0);
      cc.lineWidth = bar_width;
      cc.strokeStyle = red;
      cc.beginPath(); // top arc start
      cc.arc(0, -lock_offset, lock_size / 2, -pi_slice, pi + pi_slice, true);
      cc.moveTo(0, -lock_size / 2);
      cc.lineTo(0, -height2);
      cc.stroke();    // top arc end
      cc.beginPath(); //bottom arc start
      cc.arc(0, lock_offset, lock_size / 2, pi_slice, pi - pi_slice);
      cc.moveTo(0, lock_size - bar_width);
      cc.lineTo(0, height2);
      cc.stroke();  //bottom arc end
      if (aircraft.mode === "landing") {  // Localizer Capture Indicator
        cc.fillStyle = white;
        cc.beginPath();
        cc.arc(0, 0, lock_size / 5, 0, pi * 2);
        cc.fill();  // Draw Localizer Capture Dot
      }
      cc.translate(width2 + bar_width2, 0);
      // unclear how this works...
      cc.beginPath(); // if removed, white lines appear on top of bottom half of lock case
      cc.stroke();    // if removed, white lines appear on top of bottom half of lock case

      cc.restore();
    }

    // Text
    var gap = 3;          // height of TOTAL vertical space between the rows (0 for touching)
    var lineheight = 4.5; // height of text row (used for spacing basis)
    var row1text = cs;
    var row2text = lpad(round(aircraft.altitude * 0.01), 3) + " " + lpad(round(aircraft.groundSpeed * 0.1), 2);
    if (aircraft.inside_ctr) cc.fillStyle   = "rgba(255, 255, 255, 0.8)";
    else cc.fillStyle   = "rgba(255, 255, 255, 0.2)";
    if(aircraft.trend == 0)     alt_trend_char = String.fromCodePoint(0x2011);  // small dash (symbola font)
    else if(aircraft.trend > 0) alt_trend_char = String.fromCodePoint(0x1F851); // up arrow (symbola font)
    else if(aircraft.trend < 0) alt_trend_char = String.fromCodePoint(0x1F853); // down arrow (symbola font)
    // Draw full datablock text
    cc.textAlign = "left";
    cc.fillText(row1text, -width2 + paddingLR, -gap/2 - lineheight);
    cc.fillText(row2text, -width2 + paddingLR, gap/2 + lineheight);
    // Draw climb/level/descend symbol
    cc.font = "10px symbola"; // change font to the one with extended unicode characters
    cc.textAlign = "center";
    cc.fillText(alt_trend_char, -width2 + paddingLR + 20.2, gap/2 + lineheight - 0.25);
    cc.font = "10px monoOne, monospace";  // change back to normal font

    cc.restore();
  }
}

function canvas_draw_all_info(cc) {
  "use strict";
  for(var i=0;i<prop.aircraft.list.length;i++) {
    cc.save();
    canvas_draw_info(cc, prop.aircraft.list[i]);
    cc.restore();
  }
}

function canvas_draw_compass(cc) {
  "use strict";
  cc.translate(round(prop.canvas.size.width/2), round(prop.canvas.size.height/2));
  var size    = 80;
  var size2   = size / 2;
  var padding = 16;
  var dot     = 16;

  // Shift compass location
  cc.translate(-size2-padding, -size2-padding);
  cc.lineWidth = 4;

  // Outer circle
  cc.fillStyle = "rgba(0, 0, 0, 0.7)";
  cc.beginPath();
  cc.arc(0, 0, size2, 0, Math.PI*2);
  cc.fill();

  // Inner circle
  cc.lineWidth = 1;
  cc.beginPath();
  cc.arc(0, 0, dot/2, 0, Math.PI*2);
  cc.strokeStyle = "rgba(255, 255, 255, 0.7)";
  cc.stroke();

  // Wind Value
  cc.fillStyle = "rgba(255, 255, 255, 0.7)";
  cc.textAlign = "center";
  cc.textBaseline = "center";
  cc.font = "9px monoOne, monospace";
  cc.fillText(airport_get().wind.speed, 0, 3.8);
  cc.font = "bold 10px monoOne, monospace";

  // Wind line
  var windspeed_line, highwind;
  if(airport_get().wind.speed > 8) {
    windspeed_line = airport_get().wind.speed/2;
    highwind = true;
  } else {
    windspeed_line = airport_get().wind.speed;
    highwind = false;
  }
  cc.save();
  cc.translate(-dot/2 * Math.sin(airport_get().wind.angle), dot/2 * Math.cos(airport_get().wind.angle));
  cc.beginPath();
  cc.moveTo(0, 0);
  cc.rotate(airport_get().wind.angle);
  cc.lineTo(0, crange(0, windspeed_line, 15, 0, size2-dot));
  // Color wind line red for high-wind
  if(highwind) cc.strokeStyle = "rgba(255, 0, 0, 0.7)";
  else cc.strokeStyle = "rgba(255, 255, 255, 0.7)";
  cc.lineWidth = 2;
  cc.stroke();
  cc.restore();

  cc.fillStyle = "rgba(255, 255, 255, 0.7)";

  cc.textAlign = "center";
  cc.textBaseline = "top";
  for(var i=90;i<=360;i+=90) {
    cc.rotate(radians(90));
    if (i==90) var angle = "0" + i;
    else var angle = i;
    cc.save();
    cc.fillText(angle, 0, -size2+4);
    cc.restore();
  }
}

/** Draw circular airspace border
 */
function canvas_draw_ctr(cc) {
  "use strict";
  
  //Draw a gentle fill color with border within the bounds of the airport's ctr_radius
  cc.fillStyle = "rgba(200, 255, 200, 0.02)";
	cc.strokeStyle = "rgba(200, 255, 200, 0.25)";
  cc.beginPath();
  cc.arc(0, 0, airport_get().ctr_radius*prop.ui.scale, 0, Math.PI*2);
  cc.fill();
	cc.stroke();
}

/** Draw polygonal airspace border
 */
function canvas_draw_airspace_border(cc) {
  if(!airport_get().airspace) canvas_draw_ctr(cc);

  // style
  cc.strokeStyle = "rgba(200, 255, 200, 0.25)";
  cc.fillStyle   = "rgba(200, 255, 200, 0.02)";

  // draw airspace
  for(var i=0; i<airport_get().airspace.length; i++) {
    canvas_draw_poly(cc, $.map(airport_get().perimeter.poly, function(v){return [v.position];}));
    cc.clip();
  }
}

// Draw range rings for ENGM airport to assist in point merge
function canvas_draw_engm_range_rings(cc) {
  "use strict";
  cc.strokeStyle = "rgba(200, 255, 200, 0.3)";
  cc.setLineDash([3,6]);
  canvas_draw_fancy_rings(cc, "BAVAD","GM428","GM432");
  canvas_draw_fancy_rings(cc, "TITLA","GM418","GM422");
  canvas_draw_fancy_rings(cc, "INSUV","GM403","GM416");
  canvas_draw_fancy_rings(cc, "VALPU","GM410","GM402");
}

function canvas_draw_fancy_rings(cc, fix_origin, fix1, fix2) {
  "use strict";
  var arpt = airport_get();
  var origin = arpt.getFix(fix_origin);
  var f1 = arpt.getFix(fix1);
  var f2 = arpt.getFix(fix2);
  var minDist = Math.min( distance2d(origin, f1), distance2d(origin, f2));
  var halfPI = Math.PI / 2;
  var extend_ring = radians(10);
  var start_angle = Math.atan2(f1[0] - origin[0], f1[1] - origin[1]) - halfPI - extend_ring;
  var end_angle = Math.atan2(f2[0] - origin[0], f2[1] - origin[1]) - halfPI + extend_ring;
  var x = round(km_to_px(origin[0])) + prop.canvas.panX;
  var y = -round(km_to_px(origin[1])) + prop.canvas.panY;
  // 5NM = 9.27km
  var radius = 9.27;
  for( var i=0; i<4; i++) {
    cc.beginPath();
    cc.arc(x, y, km_to_px(minDist - (i*radius)), start_angle, end_angle);
    cc.stroke();
  }
}

function canvas_draw_range_rings(cc) {
  var rangeRingRadius = km(airport_get().rr_radius_nm); //convert input param from nm to km

  //Fill up airport's ctr_radius with rings of the specified radius
  for(var i=1; i*rangeRingRadius < airport_get().ctr_radius; i++) {
    cc.beginPath();
    cc.linewidth = 1;
    cc.arc(0, 0, rangeRingRadius*prop.ui.scale*i, 0, Math.PI*2);
    cc.strokeStyle = "rgba(200, 255, 200, 0.1)";
    cc.stroke();
  }
}

function canvas_draw_poly(cc, poly) {
  cc.beginPath();

  for (var v in poly) {
    cc.lineTo(km_to_px(poly[v][0]), -km_to_px(poly[v][1]));
  }

  cc.closePath();
  cc.stroke();
  cc.fill();
}

function canvas_draw_terrain(cc) {
  "use strict";
  if (!prop.canvas.draw_terrain) return;

  cc.strokeStyle = 'rgba(255,255,255,.4)';
  cc.fillStyle = 'rgba(255,255,255,.2)';
  cc.lineWidth = clamp(.5, (prop.ui.scale / 10), 2);
  cc.lineJoin = 'round';

  var airport = airport_get(),
      max_elevation = 0;
  cc.save();
  cc.translate(prop.canvas.panX, prop.canvas.panY);

  $.each(airport.terrain || [], function(ele, terrain_level) {
    max_elevation = Math.max(max_elevation, ele);
    var color = 'rgba('
      + prop.ui.terrain.colors[ele] + ', ';

    cc.strokeStyle = color + prop.ui.terrain.border_opacity + ')';
    cc.fillStyle = color + prop.ui.terrain.fill_opacity + ')';

    $.each(terrain_level, function(k, v) {
      cc.beginPath();
      $.each(v, function(j, v2) {
        for (var v in v2) {
          if (v == 0)
            cc.moveTo(km_to_px(v2[v][0]), -km_to_px(v2[v][1]));
          else 
            cc.lineTo(km_to_px(v2[v][0]), -km_to_px(v2[v][1]));
        }
        cc.closePath();
      });
      cc.fill();
      cc.stroke();
    });
  });

  cc.restore();

  if (max_elevation == 0) return;
  var offset = 10,
      width = prop.canvas.size.width,
      height = prop.canvas.size.height,
      box_width = 30,
      box_height = 5;
      
  cc.font = "10px monoOne, monospace";
  cc.lineWidth = 1;

  for (var i = 1000; i <= max_elevation; i += 1000) {
    cc.save();
    // translate coordinates for every block to not use these X & Y twice in rect and text
    // .5 in X and Y coordinates are used to make 1px rectangle fit exactly into 1 px
    // and not be blurred
    cc.translate(width / 2 - 140.5 - (max_elevation - i) / 1000 * (box_width + 1), -height/2+offset+.5);
    cc.beginPath();
    cc.rect(0, 0, box_width - 1, box_height);
    cc.closePath();

    // in the map, terrain of higher levels has fill of all the lower levels
    // so we need to fill it below exactly as in the map
    for (var j = 0; j <= i; j += 1000) {
      cc.fillStyle = 'rgba('
          + prop.ui.terrain.colors[j] + ', '
          + prop.ui.terrain.fill_opacity + ')';
      cc.fill();
    }

    cc.strokeStyle = 'rgba('
      + prop.ui.terrain.colors[i] + ', '
      + prop.ui.terrain.border_opacity + ')';

    cc.stroke();

    // write elevation signs only for the outer elevations
    if (i == max_elevation || i == 1000) {
      cc.fillStyle = '#fff';
      cc.textAlign    = "center";
      cc.textBaseline = "top";
      cc.fillText(i + "'", box_width / 2 + .5, offset + 2);
    }

    cc.restore();
  }
}

function canvas_draw_restricted(cc) {
  "use strict";
  if (!prop.canvas.draw_restricted) return;

  cc.strokeStyle = "rgba(150, 200, 255, 0.3)";
  cc.lineWidth   = Math.max(prop.ui.scale / 3, 2);
  cc.lineJoin    = "round";
  cc.font = "10px monoOne, monospace";
  
  var airport=airport_get();
  cc.save();
  cc.translate(prop.canvas.panX, prop.canvas.panY);
  for(var i in airport.restricted_areas) {
    var area = airport.restricted_areas[i];
    cc.fillStyle   = "transparent";
    canvas_draw_poly(cc, area.coordinates);
    cc.fillStyle   = "rgba(150, 200, 255, .4)";
    
    cc.textAlign    = "center";
    cc.textBaseline = "top";
    var height = (area.height == Infinity ? 'UNL' : 'FL' + Math.ceil(area.height / 1000)*10);

    var height_shift = 0;
    if (area.name) {
      height_shift = -12;
      cc.fillText(area.name, round(km_to_px(area.center[0])), - round(km_to_px(area.center[1])));
    }
    
    cc.fillText(height, round(km_to_px(area.center[0])), height_shift - round(km_to_px(area.center[1])));
  }
  cc.restore();
}

function canvas_draw_videoMap(cc) {
  "use strict";
  if(!airport_get().hasOwnProperty("maps")) return;

  cc.strokeStyle = "#c1dacd";
  cc.lineWidth   = prop.ui.scale / 15;
  cc.lineJoin    = "round";
  cc.font = "10px monoOne, monospace";
  
  var airport=airport_get();
  var map = airport.maps.base;
  cc.save();
  cc.translate(prop.canvas.panX, prop.canvas.panY);
  for(var i in map) {
    cc.moveTo(km_to_px(map[i][0]), -km_to_px(map[i][1]));
    // cc.beginPath();
    cc.lineTo(km_to_px(map[i][2]), -km_to_px(map[i][3]));
  }
    cc.stroke();
  cc.restore();
}

/** Draws crosshairs that point to the currently translated location
 */
function canvas_draw_crosshairs(cc) {
  cc.save();
  cc.strokeStyle = "#899";
  cc.lineWidth = 3;
  cc.beginPath();
  cc.moveTo(-10, 0);
  cc.lineTo( 10, 0);
  cc.stroke();
  cc.beginPath();
  cc.moveTo(0, -10);
  cc.lineTo(0,  10);
  cc.stroke();
  cc.restore();
}

function canvas_update_post() {
  "use strict";
  var elapsed = game_time() - airport_get().start;
  var alpha   = crange(0.1, elapsed, 0.4, 0, 1);

  var framestep = Math.round(crange(1, prop.game.speedup, 10, 30, 1));

  if(prop.canvas.dirty || (!game_paused() && prop.time.frames % framestep === 0) || elapsed < 1) {
    var cc=canvas_get("navaids");
    var fading  = (elapsed < 1);

    cc.font = "11px monoOne, monospace";

    if(prop.canvas.dirty || fading || true) {
      cc.save();

      canvas_clear(cc);
      cc.translate(round(prop.canvas.size.width/2), round(prop.canvas.size.height/2));

      cc.save();
      cc.globalAlpha = alpha;
      canvas_draw_videoMap(cc);
      canvas_draw_terrain(cc);
      canvas_draw_restricted(cc);
      canvas_draw_runways(cc);
      cc.restore();

      cc.save();
      cc.globalAlpha = alpha;
      canvas_draw_fixes(cc);
      canvas_draw_sids(cc);
      cc.restore();


      cc.restore();
    }

    // Controlled traffic region - (CTR)
    cc.save();
    cc.translate(round(prop.canvas.size.width/2 + prop.canvas.panX), round(prop.canvas.size.height/2 + prop.canvas.panY));   // translate to airport center
    airport_get().airspace ? canvas_draw_airspace_border(cc) : canvas_draw_ctr(cc); // draw airspace border
    canvas_draw_range_rings(cc);
    cc.restore();

    // Special markings for ENGM point merge
    if( airport_get().icao === "ENGM" ) {
      cc.save();
      cc.translate(round(prop.canvas.size.width/2), round(prop.canvas.size.height/2));
      canvas_draw_engm_range_rings(cc);
      cc.restore();
    }

    // Compass

    cc.font = "bold 10px monoOne, monospace";

    if(prop.canvas.dirty || fading || true) {
      cc.save();
      cc.translate(round(prop.canvas.size.width/2), round(prop.canvas.size.height/2));
      canvas_draw_compass(cc);
      cc.restore();
    }

    cc.font = "10px monoOne, monospace";

    if(prop.canvas.dirty || canvas_should_draw() || true) {
      cc.save();
      cc.globalAlpha = alpha;
      cc.translate(round(prop.canvas.size.width/2), round(prop.canvas.size.height/2));
      canvas_draw_all_aircraft(cc);
      cc.restore();
    }

    cc.save();
    cc.globalAlpha = alpha;
    cc.translate(round(prop.canvas.size.width/2), round(prop.canvas.size.height/2));
    canvas_draw_all_info(cc);
    cc.restore();

    cc.save();
    cc.globalAlpha = alpha;
    cc.translate(round(prop.canvas.size.width/2), round(prop.canvas.size.height/2));
    canvas_draw_runway_labels(cc);
    cc.restore();

    cc.save();
    cc.globalAlpha = alpha;
    canvas_draw_scale(cc);
    cc.restore();

    cc.save();
    cc.globalAlpha = alpha;
    canvas_draw_directions(cc);
    cc.restore();

    prop.canvas.dirty = false;
  }
}

function canvas_draw_directions(cc) {
  if (game_paused())
    return;

  var callsign = prop.input.callsign.toUpperCase();
  if (callsign.length === 0) {
    return;
  }

  // Get the selected aircraft.
  var aircraft = prop.aircraft.list.filter(function(p) {
    return p.isVisible() && p.getCallsign().toUpperCase() === callsign;
  })[0];
  if (!aircraft) {
    return;
  }

  var pos = to_canvas_pos(aircraft.position);
  var rectPos = [0, 0];
  var rectSize = [prop.canvas.size.width, prop.canvas.size.height];

  cc.save();
  cc.strokeStyle = "rgba(224, 224, 224, 0.7)";
  cc.fillStyle = "rgb(255, 255, 255)";
  cc.textAlign    = "center";
  cc.textBaseline = "middle";

  for (var alpha = 0; alpha < 360; alpha++) {
    var dir = [sin(radians(alpha)), -cos(radians(alpha))];
    var p = positive_intersection_with_rect(pos, dir, rectPos, rectSize);
    if (p) {
      var markLen = (alpha % 5 === 0 ?
                     (alpha % 10 === 0 ? 16 : 12) :
                     8);
      var markWeight = (alpha % 30 === 0 ?  2 : 1);

      var dx = - markLen * dir[0];
      var dy = - markLen * dir[1];

      cc.lineWidth = markWeight;
      cc.beginPath();
      cc.moveTo(p[0], p[1]);
      var markX = p[0] + dx;
      var markY = p[1] + dy;
      cc.lineTo(markX, markY);
      cc.stroke();

      if (alpha % 10 === 0) {
        cc.font = (alpha % 30 === 0 ?
                   "bold 10px monoOne, monospace" :
                   "10px monoOne, monospace");
        var text = "" + alpha;
        var textWidth = cc.measureText(text).width;
        cc.fillText(text,
                    markX - dir[0] * (textWidth / 2 + 4),
                    markY - dir[1] * 7);
      }
    }
  }
  cc.restore();
}
