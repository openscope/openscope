
function canvas_init_pre() {
  prop.canvas={};

  prop.canvas.contexts={};

  // resize canvas to fit window?
  prop.canvas.resize=true;
  prop.canvas.size={ // all canvases are the same size
    height:480,
    width:640
  };

  prop.canvas.last = time();

  prop.canvas.dirty = true;
}

function canvas_init() {
  canvas_add("navaids");
  canvas_add("info");
  canvas_add("aircraft");
  canvas_add("compass");
}

function canvas_complete() {
  setTimeout(function() {
    prop.canvas.dirty = true;
  }, 500);
  prop.canvas.last = time();
}

function canvas_resize() {
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
}

function canvas_add(name) {
  $("#canvases").append("<canvas id='"+name+"-canvas'></canvas>");
  prop.canvas.contexts[name]=$("#"+name+"-canvas").get(0).getContext("2d");
}

function canvas_get(name) {
  return(prop.canvas.contexts[name]);
}

function canvas_clear(cc) {
  cc.clearRect(0,0,prop.canvas.size.width,prop.canvas.size.height);
}

function canvas_should_draw() {
  var elapsed = time() - prop.canvas.last;
  if(elapsed > (1/prop.game.speedup)) {
    prop.canvas.last = time();
    return true;
  }
  return false;
}

// DRAW

function canvas_draw_runway(cc, runway) {
  var length2 = round(km(runway.length / 2));
  var angle   = runway.angle;

  var size  = 20;
  var size2 = size / 2;

  cc.translate(round(km(runway.position[0])), -round(km(runway.position[1])));

  cc.rotate(angle);

  cc.strokeStyle = "#899";
  cc.beginPath();
  cc.moveTo(0, -length2);
  cc.lineTo(0,  length2);
  cc.stroke();

  cc.strokeStyle = "#465";
  cc.lineWidth = 2;
  cc.beginPath();

  cc.moveTo(0, -length2);
  cc.lineTo(0, -length2 - km(20));

  cc.moveTo(0,  length2);
  cc.lineTo(0,  length2 + km(20));

  cc.stroke();

  var text_height = 8;
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
  cc.strokeStyle = "rgba(255, 255, 255, 0.4)";
  cc.fillStyle   = "rgba(255, 255, 255, 0.4)";
  cc.lineWidth   = 4;
  var airport=airport_get();
  for(var i=0;i<airport.runways.length;i++) {
    cc.save();
    canvas_draw_runway(cc, airport.runways[i]);
    cc.restore();
  }
}

function canvas_draw_fix(cc, name, fix) {
  cc.beginPath();
  cc.moveTo( 0, -5);
  cc.lineTo( 4,  3);
  cc.lineTo(-4,  3);
  cc.closePath();
  cc.fill();

  cc.textAlign    = "center";
  cc.textBaseline = "top";
  cc.fillText(name, 0, 6);
}

function canvas_draw_fixes(cc) {
  cc.strokeStyle = "rgba(255, 255, 255, 0.4)";
  cc.fillStyle   = "rgba(255, 255, 255, 0.4)";
  cc.lineWidth   = 2;
  cc.lineJoin    = "round";
  var airport=airport_get();
  for(var i in airport.fixes) {
    cc.save();
    cc.translate(round(km(airport.fixes[i][0])), -round(km(airport.fixes[i][1])));
    canvas_draw_fix(cc, i, airport.fixes[i]);
    cc.restore();
  }
}

function canvas_draw_aircraft(cc, aircraft) {

  if(!aircraft.isVisible()) return;

  var size = 3;
  var almost_match = false;
  var match        = false;

  if(prop.input.callsign.length > 1 && aircraft.matchCallsign(prop.input.callsign.substr(0, prop.input.callsign.length - 1)))
    almost_match = true;
  if(prop.input.callsign.length > 0 && aircraft.matchCallsign(prop.input.callsign))
    match = true;

  cc.fillStyle   = "rgba(224, 224, 224, 1.0)";
  if(almost_match)
    cc.fillStyle = "rgba(224, 210, 180, 1.0)";
  if(match)
    cc.fillStyle = "rgba(255, 255, 255, 1.0)";

  if(aircraft.warning)
    cc.fillStyle = "rgba(224, 128, 128, 1.0)";
  if(aircraft.hit)
    cc.fillStyle = "rgba(255, 64, 64, 1.0)";

  cc.strokeStyle = cc.fillStyle;

  if(match) {

    cc.save();

    cc.fillStyle = "rgba(255, 255, 255, 1.0)";

    var t = crange(0, distance2d(
      [clamp(-w, km(aircraft.position[0]), w), clamp(-h, -km(aircraft.position[1]), h)],
      [          km(aircraft.position[0]),               -km(aircraft.position[1])    ]), 30,
                  0, 50);
    var w = prop.canvas.size.width/2 -  t;
    var h = prop.canvas.size.height/2 - t;

    cc.translate(clamp(-w, km(aircraft.position[0]), w), clamp(-h, -km(aircraft.position[1]), h));

    cc.beginPath();
    cc.arc(0, 0, round(size * 1.5), 0, Math.PI * 2);
    cc.fill();

    cc.restore();

  }

  cc.translate(km(aircraft.position[0]), -km(aircraft.position[1]));

  if(!aircraft.hit) {
    cc.save();

    var tail_length = 10;
    if(match) tail_length = 15;
    var angle       = aircraft.heading;
    var end         = [-sin(angle) * tail_length, cos(angle) * tail_length];

    cc.beginPath();
    cc.moveTo(0, 0);
    cc.lineTo(end[0], end[1]);
    cc.stroke();
    cc.restore();
  }

  if(aircraft.notice) {
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

function canvas_draw_all_aircraft(cc) {
  cc.fillStyle   = "rgba(224, 224, 224, 1.0)";
  cc.strokeStyle = "rgba(224, 224, 224, 1.0)";
  cc.lineWidth   = 2;
  for(var i=0;i<prop.aircraft.list.length;i++) {
    cc.save();
    canvas_draw_aircraft(cc, prop.aircraft.list[i]);
    cc.restore();
  }
}

function canvas_draw_info(cc, aircraft) {

  if(!aircraft.isVisible()) return;

  if(!aircraft.hit) {
    cc.save();

    cc.textBaseline = "middle";

    var width  = 60;
    var width2 = width / 2;

    var height  = 35;
    var height2 = height / 2;

    var bar_width = 4;

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
      var a = [km(aircraft.position[0]), -km(aircraft.position[1])];
      var h = aircraft.html.outerHeight();
      var b = [prop.canvas.size.width / 2 - 10, -(prop.canvas.size.height / 2) + aircraft.html.offset().top + h / 2];
      var angle = Math.atan2(a[0] - b[0], a[1] - b[1]);
      var distance = 10;
      cc.beginPath();
      cc.moveTo(sin(angle) * -distance + a[0], cos(angle) * -distance + a[1]);
      cc.lineTo(b[0], b[1]);
      cc.stroke();

      cc.beginPath();
      cc.moveTo(b[0], b[1] - h / 2);
      cc.lineTo(b[0], b[1] + h / 2);
      cc.lineWidth = 4;
      cc.stroke();
      cc.restore();
    }

    cc.translate(round(km(aircraft.position[0])), -round(km(aircraft.position[1])));

    if(-km(aircraft.position[1]) + prop.canvas.size.height/2 < height * 1.5)
      cc.translate(0,  height2 + 12);
    else
      cc.translate(0, -height2 - 12);

    cc.translate(bar_width / 2, 0);

    cc.fillStyle = "rgba(71, 105, 88, 0.9)";
    if(almost_match)
      cc.fillStyle = "rgba(95, 95, 88, 0.9)";
    if(match) {
      cc.fillStyle = "rgba(120, 150, 140, 0.9)";
    }

    cc.fillRect(-width2, -height2, width, height);

    var alpha = 0.6;
    if(match) alpha = 0.9;

    if(aircraft.category == "departure")
      cc.fillStyle = "rgba(128, 255, 255, " + alpha + ")";
    else
      cc.fillStyle = "rgba(224, 128, 128, " + alpha + ")";

    cc.fillRect(-width2-bar_width, -height2, bar_width, height);

    cc.fillStyle   = "rgba(255, 255, 255, 0.8)";
    if(match)
      cc.fillStyle   = "rgba(255, 255, 255, 0.9)";

    cc.strokeStyle = cc.fillStyle;

    cc.translate(0, 1);

    var separation  = 8;
    var line_height = 8;

    cc.lineWidth = 2;

    if(aircraft.trend != 0) {
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

      if(aircraft.requested.expedite && aircraft.mode != "landing") {
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
    cc.fillText(lpad(round(aircraft.speed * 0.1), 2), separation, line_height);

    cc.textAlign = "center";
    cc.fillText(aircraft.getCallsign(), 0, -line_height);

    cc.restore();
  }

}

function canvas_draw_all_info(cc) {
  for(var i=0;i<prop.aircraft.list.length;i++) {
    cc.save();
    canvas_draw_info(cc, prop.aircraft.list[i]);
    cc.restore();
  }
}

function canvas_draw_compass(cc) {
  cc.translate(round(prop.canvas.size.width/2), round(prop.canvas.size.height/2));
  var size    = 80;
  var size2   = size / 2;
  var padding = 16;

  var dot     = 8;

  cc.translate(-size2-padding, -size2-padding);
  cc.lineWidth = 4;

  cc.fillStyle = "rgba(0, 0, 0, 0.7)";
  cc.beginPath();
  cc.arc(0, 0, size2, 0, Math.PI*2);
  cc.fill();

  cc.fillStyle = "rgba(255, 255, 255, 1.0)";
  cc.beginPath();
  cc.arc(0, 0, dot/2, 0, Math.PI*2);
  cc.fill()

  cc.save();
  cc.beginPath();
  cc.moveTo(0, 0);
  cc.rotate(airport_get().wind.angle - Math.PI);
  cc.lineTo(0, crange(0, airport_get().wind.speed, 15, 0, size2-dot));
  cc.strokeStyle = "rgba(255, 255, 255, 0.7)";
  cc.lineWidth = 2;
  cc.stroke();
  cc.restore();

  cc.fillStyle = "rgba(255, 255, 255, 0.7)";

  cc.textAlign = "center";
  cc.textBaseline = "top";
  for(var i=0;i<4;i++) {
    var angle = (i / 4) * 360;
    cc.save();
    cc.rotate((i / 4) * (Math.PI * 2));
    cc.fillText(angle, 0, -size2+6);
    cc.restore();
  }

}

function canvas_update_post() {
  var elapsed = game_time() - airport_get().start;
  var alpha   = crange(0.1, elapsed, 0.4, 0, 1);

  if(prop.canvas.dirty || (!game_paused() && prop.time.frames % 30 == 0) || elapsed < 1) {
    var cc=canvas_get("navaids");
    var fading  = (elapsed < 1);

    cc.font = "11px monoOne, monospace";

    if(prop.canvas.dirty || fading) {
      cc.save();

      canvas_clear(cc);
      cc.translate(round(prop.canvas.size.width/2), round(prop.canvas.size.height/2));

      cc.save();
      cc.globalAlpha = alpha;
      canvas_draw_runways(cc);
      cc.restore();

      cc.save();
      cc.globalAlpha = alpha;
      canvas_draw_fixes(cc);
      cc.restore();

      cc.restore();
    }

    // compass

    cc=canvas_get("compass");

    cc.font = "bold 10px monoOne, monospace";

    if(prop.canvas.dirty || fading) {
      cc.save();

      canvas_clear(cc);
      cc.translate(round(prop.canvas.size.width/2), round(prop.canvas.size.height/2));
      canvas_draw_compass(cc);

      cc.restore();
    }

    //

    cc=canvas_get("info");

    cc.font = "10px monoOne, monospace";

    cc.save();

    cc.globalAlpha = alpha;
    canvas_clear(cc);
    cc.translate(round(prop.canvas.size.width/2), round(prop.canvas.size.height/2));
    canvas_draw_all_info(cc);

    cc.restore();

    //

    cc=canvas_get("aircraft");

    if(prop.canvas.dirty || canvas_should_draw() || true) {
      cc.save();
      cc.globalAlpha = alpha;
      canvas_clear(cc);
      cc.translate(round(prop.canvas.size.width/2), round(prop.canvas.size.height/2));
      canvas_draw_all_aircraft(cc);
      cc.restore();
    }

    //

    prop.canvas.dirty = false;
  }
}
