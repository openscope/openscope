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
  prop.canvas.draw_restricted = true;
  prop.canvas.draw_sids = true;
  prop.canvas.draw_terrain = true;
}

function canvas_init() {
  "use strict";
  canvas_add("compass");
  canvas_add("navaids");
  canvas_add("info");
  canvas_add("aircraft");
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
  var length2 = round(km(runway.length / 2));
  var angle   = runway.angle;

  cc.translate(round(km(runway.position[0])) + prop.canvas.panX, -round(km(runway.position[1])) + prop.canvas.panY);
  cc.rotate(angle);

  if(!mode) {
    cc.strokeStyle = "#899";
    cc.lineWidth = 2.8;
    cc.beginPath();
    cc.moveTo(0, -length2);
    cc.lineTo(0,  length2);
    cc.stroke();
  } else {
    cc.strokeStyle = "#465";

    var ils = null;

    if(runway.ils[1] && runway.ils_distance[1]) {
      ils = runway.ils_distance[1];
      cc.lineWidth = 3;
    } else {
      ils = 40;
      cc.lineWidth = 0.8;
    }

    cc.beginPath();
    cc.moveTo(0, -length2);
    cc.lineTo(0, -length2 - km(ils));
    cc.stroke();

    if(runway.ils[0] && runway.ils_distance[0]) {
      ils = runway.ils_distance[0];
      cc.lineWidth = 3;
    } else {
      ils = 40;
      cc.lineWidth = 0.8;
    }

    cc.beginPath();
    cc.moveTo(0,  length2);
    cc.lineTo(0,  length2 + km(ils));
    cc.stroke();

  }
}

function canvas_draw_runway_label(cc, runway) {
  "use strict";
  var length2 = round(km(runway.length / 2)) + 0.5;
  var angle   = runway.angle;

  cc.translate(round(km(runway.position[0])) + prop.canvas.panX, -round(km(runway.position[1])) + prop.canvas.panY);

  cc.rotate(angle);

  var text_height = 14;
  cc.textAlign    = "center";
  cc.textBaseline = "middle";

  cc.save();
  cc.translate(0,  length2 + text_height);
  cc.rotate(-angle);
  cc.translate(round(km(runway.name_offset[0][0])), -round(km(runway.name_offset[0][1])));
  cc.fillText(runway.name[0], 0, 0);
  cc.restore();

  cc.save();
  cc.translate(0, -length2 - text_height);
  cc.rotate(-angle);
  cc.translate(round(km(runway.name_offset[1][0])), -round(km(runway.name_offset[1][1])));
  cc.fillText(runway.name[1], 0, 0);
  cc.restore();
}

function canvas_draw_runways(cc) {
  "use strict";
  cc.strokeStyle = "rgba(255, 255, 255, 0.4)";
  cc.fillStyle   = "rgba(255, 255, 255, 0.4)";
  cc.lineWidth   = 4;
  var airport=airport_get();
  var i;
  for( i=0;i<airport.runways.length;i++) {
    cc.save();
    canvas_draw_runway(cc, airport.runways[i], true);
    cc.restore();
  }
  for( i=0;i<airport.runways.length;i++) {
    cc.save();
    canvas_draw_runway(cc, airport.runways[i], false);
    cc.restore();
  }
}

function canvas_draw_runway_labels(cc) {
  "use strict";
  cc.fillStyle   = "rgba(255, 255, 255, 0.8)";
  var airport=airport_get();
  for(var i=0;i<airport.runways.length;i++) {
    cc.save();
    canvas_draw_runway_label(cc, airport.runways[i]);
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
  var px_length = round(km(length));

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
  cc.lineJoin    = "round";
  cc.font = "10px monoOne, monospace";
  var airport=airport_get();
  for(var i in airport.real_fixes) {
    cc.save();
    cc.translate(round(km(airport.fixes[i][0])) + prop.canvas.panX, -round(km(airport.fixes[i][1])) + prop.canvas.panY);

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
  for(var s in airport.departures.sids) {
    var fixList = airport.departures.sids[s];
    var fx, fy;
    for(var i=0; i<fixList.length; i++) {
      var fix = airport.getFix(fixList[i]);
      fx = km(fix[0]) + prop.canvas.panX;
      fy = -km(fix[1]) + prop.canvas.panY;
      if(i === 0) {
        cc.beginPath();
        cc.moveTo(fx, fy);
      } else {
        cc.lineTo(fx, fy);
      }
    }
    cc.stroke();
    cc.fillText(s, fx+10, fy);
  }
}

function canvas_draw_separation_indicator(cc, aircraft) {
  "use strict";
  // Draw a trailing indicator 2.5 NM (4.6km) behind landing aircraft to help with traffic spacing
  var rwy = airport_get().getRunway(aircraft.fms.currentWaypoint().runway);
  var angle = rwy.getAngle(aircraft.fms.currentWaypoint().runway) + Math.PI;
  cc.strokeStyle = "rgba(224, 128, 128, 0.8)";
  cc.lineWidth = 3;
  cc.translate(km(aircraft.position[0]) + prop.canvas.panX, -km(aircraft.position[1]) + prop.canvas.panY);
  cc.rotate(angle);
  cc.beginPath();
  cc.moveTo(-5, -km(4.6));
  cc.lineTo(+5, -km(4.6));
  cc.stroke();
}

function canvas_draw_aircraft_departure_window(cc, aircraft) {
  "use strict";
  cc.save();
  cc.strokeStyle = "rgba(128, 255, 255, 0.9)";
  cc.beginPath();
  var angle = aircraft.destination - Math.PI/2;
  cc.arc(prop.canvas.panX,
         prop.canvas.panY,
         km(airport_get().ctr_radius),
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
    cc.fillRect(km(aircraft.position_history[i][0]) + prop.canvas.panX - 1, - km(aircraft.position_history[i][1]) + prop.canvas.panY - 1, 2, 2);
  }
  cc.restore();

  if(aircraft.position_history.length > trailling_length) aircraft.position_history = aircraft.position_history.slice(aircraft.position_history.length - trailling_length, aircraft.position_history.length);

  if( aircraft.isPrecisionGuided() && aircraft.altitude > 1000) {
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

    cc.translate(clamp(-w, km(aircraft.position[0]) + prop.canvas.panX, w), clamp(-h, -km(aircraft.position[1]) + prop.canvas.panY, h));

    cc.beginPath();
    cc.arc(0, 0, round(size * 1.5), 0, Math.PI * 2);
    cc.fill();

    cc.restore();
  }

  cc.translate(km(aircraft.position[0]) + prop.canvas.panX, -km(aircraft.position[1]) + prop.canvas.panY);

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
    cc.save();
    cc.strokeStyle = cc.fillStyle;
    cc.beginPath();
    cc.arc(0, 0, km(4.8), 0, Math.PI * 2);
    cc.stroke();
    cc.restore();
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
      var x = km(future_track[i][0]) + prop.canvas.panX ;
      var y = -km(future_track[i][1]) + prop.canvas.panY;
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
  var x = km(future_track[start][0]) + prop.canvas.panX;
  var y = -km(future_track[start][1]) + prop.canvas.panY;
  cc.beginPath();
  cc.moveTo(x, y);
  cc.setLineDash([3,10]);
  for(var i=0; i<aircraft.fms.waypoints.length; i++) {
    if (!aircraft.fms.waypoints[i].location)
      break;
    var fix = aircraft.fms.waypoints[i].location;
    var fx = km(fix[0]) + prop.canvas.panX;
    var fy = -km(fix[1]) + prop.canvas.panY;
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

function canvas_draw_info(cc, aircraft) {
  "use strict";

  if(!aircraft.isVisible()) return;

  if(!aircraft.hit) {
    cc.save();

    cc.textBaseline = "middle";

    var width  = 60;
    var width2 = width / 2;

    var height  = 35;
    var height2 = height / 2;

    var bar_width = width / 15;
    var bar_width2 = bar_width / 2;

    var ILS_enabled = aircraft.fms.currentWaypoint().runway && aircraft.category === "arrival";
    var lock_size = height / 3;
    var lock_offset = lock_size / 8;
    var pi = Math.PI;
    var point1 = lock_size - bar_width2;

  	//angle for the clipping mask
    var a = point1 - lock_offset;
    var b = bar_width2;
  	//var c = Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
    var clipping_mask_angle = Math.atan(b / a);

    var match        = false;
    var almost_match = false;

    if(prop.input.callsign.length > 1 && aircraft.matchCallsign(prop.input.callsign.substr(0, prop.input.callsign.length - 1)))
      almost_match = true;
    if(prop.input.callsign.length > 0 && aircraft.matchCallsign(prop.input.callsign))
      match = true;

    if(match && false) {
      cc.save();
      cc.strokeStyle = "rgba(120, 140, 130, 1.0)";
      cc.lineWidth = 2;
      a = [km(aircraft.position[0]), -km(aircraft.position[1])];
      var h = aircraft.html.outerHeight();
      b = [prop.canvas.size.width / 2 - 10, -(prop.canvas.size.height / 2) + aircraft.html.offset().top + h / 2];
      var angle = Math.atan2(a[0] - b[0], a[1] - b[1]);
      var distance = 10;
      cc.beginPath();
      cc.moveTo(Math.sin(angle) * -distance + a[0], Math.cos(angle) * -distance + a[1]);
      cc.lineTo(b[0], b[1]);
      cc.stroke();

      cc.beginPath();
      cc.moveTo(b[0], b[1] - h / 2);
      cc.lineTo(b[0], b[1] + h / 2);
      cc.lineWidth = 4;
      cc.stroke();
      cc.restore();
    }

    cc.translate(round(km(aircraft.position[0])) + prop.canvas.panX, -round(km(aircraft.position[1])) + prop.canvas.panY);

    if(-km(aircraft.position[1]) + prop.canvas.size.height/2 < height * 1.5)
      cc.translate(0,  height2 + 12);
    else
      cc.translate(0, -height2 - 12);

    cc.translate(bar_width / 2, 0);

    if (!aircraft.inside_ctr)
      cc.fillStyle = "rgba(71, 105, 88, 0.3)";
    else if (match)
      cc.fillStyle = "rgba(120, 150, 140, 0.9)";
    else if(almost_match)
      cc.fillStyle = "rgba(95, 95, 88, 0.9)";
    else
      cc.fillStyle = "rgba(71, 105, 88, 0.9)";

    //Background fill and clip for ILS Lock Indicator
    if (ILS_enabled)
    {
      cc.save();
      cc.beginPath();

      cc.moveTo(-width2, height2);
      cc.lineTo(width2, height2);
      cc.lineTo(width2, -height2);
      cc.lineTo(-width2, -height2);

      //side cutout
      cc.lineTo(-width2, -point1);
      cc.arc(-width2 - bar_width2, -lock_offset, lock_size / 2 + bar_width2, clipping_mask_angle - pi / 2, 0);
      cc.lineTo(-width2 + lock_size / 2, lock_offset);
      cc.arc(-width2 - bar_width2, lock_offset, lock_size / 2 + bar_width2, 0, pi / 2 - clipping_mask_angle);
      cc.closePath();

      cc.strokeStyle = cc.fillStyle;
      cc.stroke();
      cc.clip();
      cc.fillRect(-width2, -height2, width, height);

      cc.restore();
    }
    else
      cc.fillRect(-width2, -height2, width, height);

    var alpha = 0.6;
    if (!aircraft.inside_ctr) alpha = 0.3;
    else if (match) alpha = 0.9;

    if(aircraft.category === "departure")
      cc.fillStyle = "rgba(128, 255, 255, " + alpha + ")";
    else
      cc.fillStyle = "rgba(224, 128, 128, " + alpha + ")";

  	//sideBar ILS Lock Indicator
    if (ILS_enabled)
    {
      var pi_slice = pi / 24;

      cc.translate(-width2 - bar_width2, 0);

      cc.lineWidth = bar_width;
      cc.strokeStyle = cc.fillStyle;

      //top arc
      cc.beginPath();
      cc.arc(0, -lock_offset, lock_size / 2, -pi_slice, pi + pi_slice, true);
      cc.moveTo(0, -lock_size / 2);
      cc.lineTo(0, -height2);
      cc.stroke();

      //bottom arc
      cc.beginPath();
      cc.arc(0, lock_offset, lock_size / 2, pi_slice, pi - pi_slice);
      cc.moveTo(0, lock_size - bar_width);
      cc.lineTo(0, height2);
      cc.stroke();

      cc.translate(width2 + bar_width2, 0);

      //ILS locked
      if (aircraft.mode === "landing")
      {
        cc.fillStyle = "white";
        cc.translate(-width2 - bar_width2, 0);

        cc.beginPath();
        // arc(x,y,radius,startAngle,endAngle, clockwise);
        cc.arc(0, 0, lock_size / 5, 0, pi * 2);
        cc.fill();
        cc.translate(width2 + bar_width2, 0);
      }
    }
    else
      cc.fillRect(-width2 - bar_width, -height2, bar_width, height);

    if (!aircraft.inside_ctr)
      cc.fillStyle   = "rgba(255, 255, 255, 0.6)";
    else if(match)
      cc.fillStyle   = "rgba(255, 255, 255, 0.9)";
    else
      cc.fillStyle   = "rgba(255, 255, 255, 0.8)";

    cc.strokeStyle = cc.fillStyle;

    cc.translate(0, 1);

    var separation  = 8;
    var line_height = 8;

    cc.lineWidth = 2;

    if(aircraft.trend !== 0) {
      cc.save();
      if(aircraft.trend < 0) {
        cc.translate(1, 6.5);
      } else if(aircraft.trend > 0) {
        cc.translate(-1, 6.5);
        cc.scale(-1, -1);
      }
      cc.lineJoin  = "round";
      cc.beginPath();

      cc.moveTo(0,  -5);
      cc.lineTo(0,   5);
      cc.lineTo(-3,  2);

      if(aircraft.fms.currentWaypoint().expedite && aircraft.mode !== "landing") {
        cc.moveTo(0,   5);
        cc.lineTo(3,   2);
      }

      cc.stroke();
      cc.restore();
    } else {
      cc.beginPath();
      cc.moveTo(-4, 7.5);
      cc.lineTo( 4, 7.5);
      cc.stroke();
    }

    cc.textAlign = "right";
    cc.fillText(lpad(round(aircraft.altitude * 0.01), 2), -separation, line_height);

    cc.textAlign = "left";
    cc.fillText(lpad(round(aircraft.groundSpeed * 0.1), 2),
                separation,
                line_height);

    cc.textAlign = "center";
    cc.fillText(aircraft.getCallsign(), 0, -line_height);

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

function canvas_draw_ctr(cc) {
  "use strict";
  
  //Draw a gentle fill color with border within the bounds of the airport's ctr_radius
  cc.translate(round(prop.canvas.size.width/2), round(prop.canvas.size.height/2));
  cc.translate(prop.canvas.panX, prop.canvas.panY);
  cc.fillStyle = "rgba(200, 255, 200, 0.02)";
  cc.beginPath();
  cc.arc(0, 0, airport_get().ctr_radius*prop.ui.scale, 0, Math.PI*2);
  cc.fill();
  //Draw the outline circle
	cc.beginPath();
  cc.linewidth = 1;
	cc.arc(0, 0, airport_get().ctr_radius*prop.ui.scale, 0, Math.PI*2);
	cc.strokeStyle = "rgba(200, 255, 200, 0.25)";
	cc.stroke();

  // Check if range ring characteristics are defined for this airport
  if(airport_get().hasOwnProperty("rr_radius_nm")) {
  	var rangeRingRadius = airport_get().rr_radius_nm *  1.852;	//convert input param from nm to km
  }
  else {
  	var rangeRingRadius = airport_get().ctr_radius / 4;	//old method
  }

  //Fill up airport's ctr_radius with rings of the specified radius
  for(var i=1; i*rangeRingRadius < airport_get().ctr_radius; i++) {
	  cc.beginPath();
	  cc.linewidth = 1;
		cc.arc(0, 0, rangeRingRadius*prop.ui.scale*i, 0, Math.PI*2);
		cc.strokeStyle = "rgba(200, 255, 200, 0.1)";
		cc.stroke();
  }
}

// Draw range rings for ENGM airport to assist in point merge
function canvas_draw_engm_range_rings(cc) {
  "use strict";
  cc.strokeStyle = "rgba(200, 255, 200, 0.3)";
  cc.setLineDash([3,6]);
  canvas_draw_range_ring(cc, "BAVAD","GM428","GM432");
  canvas_draw_range_ring(cc, "TITLA","GM418","GM422");
  canvas_draw_range_ring(cc, "INSUV","GM403","GM416");
  canvas_draw_range_ring(cc, "VALPU","GM410","GM402");
}

function canvas_draw_range_ring(cc, fix_origin, fix1, fix2) {
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
  var x = round(km(origin[0])) + prop.canvas.panX;
  var y = -round(km(origin[1])) + prop.canvas.panY;
  // 5NM = 9.27km
  var radius = 9.27;
  for( var i=0; i<4; i++) {
    cc.beginPath();
    cc.arc(x, y, km(minDist - (i*radius)), start_angle, end_angle);
    cc.stroke();
  }
}

function canvas_draw_poly(cc, poly) {
  cc.beginPath();

  for (var v in poly) {
    cc.lineTo(km(poly[v][0]), -km(poly[v][1]));
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
            cc.moveTo(km(v2[v][0]), -km(v2[v][1]));
          else 
            cc.lineTo(km(v2[v][0]), -km(v2[v][1]));
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
      cc.fillText(area.name, round(km(area.center[0])), - round(km(area.center[1])));
    }
    
    cc.fillText(height, round(km(area.center[0])), height_shift - round(km(area.center[1])));
  }
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
    canvas_draw_ctr(cc);
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

    prop.canvas.dirty = false;
  }
}
