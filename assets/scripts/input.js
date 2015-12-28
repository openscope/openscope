function input_init_pre() {
  prop.input={};

  prop.input.command  = "";
  prop.input.callsign = "";
  prop.input.data     = "";

  prop.input.history      = [];
  prop.input.history_item = null;

  prop.input.click    = [0, 0];

  prop.input.positions = "";

  prop.input.tab_compl = {};

  prop.input.mouseDelta = [0, 0];
  prop.input.mouseDown = [0, 0];
  prop.input.isMouseDown = false;
}

function input_init() {
  // For firefox see: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode
  var is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
  $(window).keydown(function(e) {
    if(e.which == 27) {
      if(prop.tutorial.open) tutorial_close();
      else if($("#airport-switch").hasClass("open")) ui_airport_close();
    }
    // Minus key to zoom out, plus to zoom in
    if(e.which == 189 || (is_firefox && e.which == 173)) {
      ui_zoom_out();
      return false;
    } else if(e.which == 187 || (is_firefox && e.which == 61)) {
      if(e.shiftKey) {
        ui_zoom_in();
      } else {
        ui_zoom_reset();
      }
      return false;
    }
    if(!prop.tutorial.open) return;
    if(e.which == 33) {
      tutorial_prev()
      e.preventDefault();
    } else if(e.which == 34) {
      tutorial_next()
      e.preventDefault();
    }
  });

  $("#canvases").bind("DOMMouseScroll mousewheel", function(e) {
    if (e.originalEvent.wheelDelta > 0 || e.originalEvent.detail < 0) {
      ui_zoom_in();
    } else {
      ui_zoom_out();
    }
  });

  $("#canvases").mousemove(function(e) {
    if(prop.input.isMouseDown){
      prop.input.mouseDelta = [e.pageX - prop.input.mouseDown[0], e.pageY - prop.input.mouseDown[1]];
      prop.canvas.panX = prop.input.mouseDelta[0];
      prop.canvas.panY = prop.input.mouseDelta[1];
      prop.canvas.dirty = true;
    }
  });

  $("#canvases").mouseup(function(e) {
    prop.input.isMouseDown = false;
  });

  $("#canvases").mousedown(function(e) {
    if(e.which  == 2) {
      e.preventDefault();
      ui_zoom_reset();
    } else if(e.which ==1){
      // Record mouse down position for panning
      prop.input.mouseDown = [e.pageX - prop.canvas.panX, e.pageY - prop.canvas.panY];
      prop.input.isMouseDown = true;

      // Aircraft label selection
      var position = [e.pageX, -e.pageY];
      position[0] -= prop.canvas.size.width / 2;
      position[1] += prop.canvas.size.height / 2;
      var nearest = aircraft_get_nearest([pixels_to_km(position[0] - prop.canvas.panX), pixels_to_km(position[1] + prop.canvas.panY)]);
      if(nearest[0]) {
        if(nearest[1] < pixels_to_km(80)) {
          input_select(nearest[0].getCallsign().toUpperCase());
        } else {
          input_select();
        }
      }
      position = [pixels_to_km(position[0]), pixels_to_km(position[1])];
      position[0] = parseFloat(position[0].toFixed(2));
      position[1] = parseFloat(position[1].toFixed(2));
      prop.input.positions += "["+position.join(",")+"]";
      e.preventDefault();
      return(false);
    }
  });

  $(window).keydown(function() {
    if(!game_paused())
      $("#command").focus();
  });

  $("#command").keydown(input_keydown);
  $("#command").on("input", input_change);
}

function input_select(callsign) {
  if(callsign) $("#command").val(callsign + " ");
  else $("#command").val("");
  $("#command").focus();
  input_change();
}

function input_change() {
  tab_completion_reset();
  var value = $("#command").val();
  prop.input.command = value;
  input_parse();
}

function input_parse() {
  $(".strip").removeClass("active");
  prop.input.callsign = "";
  prop.input.data     = "";

  var c = prop.input.command;
  var i;
  var skip=false;
  var data=false;

  for(i=0;i<c.length;i++) {
    if(c[i] == " " && prop.input.data.length == 0 && prop.input.callsign.length != 0) {
      skip=true;
    }
    if(skip && c[i] != " ") {
      skip=false;
      data=true;
    }
    if(!skip) {
      if(data) prop.input.data += c[i].toLowerCase();
      else prop.input.callsign += c[i].toLowerCase();
    }
  }

  if(prop.input.callsign.length == 0) return;

  var number = 0;
  var match  = null;

  prop.canvas.dirty = true;

  for(var i=0;i<prop.aircraft.list.length;i++) {
    var aircraft=prop.aircraft.list[i];
    if(aircraft.matchCallsign(prop.input.callsign)) {
      number += 1;
      match = aircraft;
      aircraft.html.addClass("active");
    }
  }
  if(number == 1) {
    $("#sidebar").scrollTop(round(match.html.position().top + ($(window).height() / 3)));
  }
}

function input_keydown(e) {
  switch(e.which) {
    case 13:  // enter
      input_parse();
      if(input_run()) {
        prop.input.history.unshift(prop.input.callsign);
        $("#command").val("");
        prop.input.command = "";
        tab_completion_reset();
        input_parse();
      }
      prop.input.history_item = null;
      break;

    case 33:  // Page Up
      input_history_prev(); // recall previous callsign
      e.preventDefault();
      break;

    case 34:  // Page Down
      input_history_next(); // recall subsequent callsign
      e.preventDefault();
      break;

    case 37:  // left arrow
      if(prop.game.option.get('controlMethod') == 'arrows') { //shortKeys in use
        $("#command").val($("#command").val() + " \u2BA2");
        e.preventDefault();
        input_change();
      }
      break;

    case 38:  // up arrow
      if(prop.game.option.get('controlMethod') == 'arrows') { //shortKeys in use
        $("#command").val($("#command").val() + " \u2B61");
        e.preventDefault();
        input_change();
      }
      else {
        input_history_prev(); // recall previous callsign
        e.preventDefault();
      }
      break;

    case 39:  // right arrow
      if(prop.game.option.get('controlMethod') == 'arrows') { //shortKeys in use
        $("#command").val($("#command").val() + " \u2BA3");
        e.preventDefault();
        input_change();
      }
      break;

    case 40:  //down arrow
      if(prop.game.option.get('controlMethod') == 'arrows') { //shortKeys in use
        $("#command").val($("#command").val() + " \u2B63");
        e.preventDefault();
        input_change();
      }
      else {
        input_history_prev(); // recall previous callsign
        e.preventDefault();
      }
      break;

    case 106: //numpad *
      $("#command").val($("#command").val() + " \u2B50");
      e.preventDefault();
      input_change();
      break;

    case 107: //numpad +
      $("#command").val($("#command").val() + " +");
      e.preventDefault();
      input_change();
      break;

    case 109: //numpad -
      $("#command").val($("#command").val() + " -");
      e.preventDefault();
      input_change();
      break;

    case 111: //numpad /
      $("#command").val($("#command").val() + " takeoff");
      e.preventDefault();
      input_change();
      break;

    case 9: // tab
      if(!prop.input.tab_compl.matches) {
        tab_completion_match();
      }
      tab_completion_cycle({backwards: e.shiftKey});
      e.preventDefault();
      break;

    case 27:  // esc
      $("#command").val("");
      e.preventDefault();
      break;
  }
}

function tab_completion_cycle(opt) {
  var matches = prop.input.tab_compl.matches;
  if(!matches || matches.length === 0) {
    return;
  }
  var i = prop.input.tab_compl.cycle_item;
  if(opt.backwards) {
    i = (i <= 0) ? matches.length-1 : i-1;
  } else {
    i = (i >= matches.length-1) ? 0 : i+1;
  }
  $("#command").val(matches[i] + " ");
  prop.input.command = matches[i];
  prop.input.tab_compl.cycle_item = i;
  input_parse();
}

function tab_completion_match() {
  var val = $("#command").val();
  var matches;
  var aircrafts = prop.aircraft.list;
  if(prop.input.callsign) {
    aircrafts = aircrafts.filter(function(a) {
      return a.matchCallsign(prop.input.callsign);
    });
  }
  matches = aircrafts.map(function(a) {
    return a.getCallsign();
  });
  if(aircrafts.length === 1 && (prop.input.data || val[val.length-1] === ' ')){
    matches = aircrafts[0].COMMANDS.filter(function(c) {
      return c.toLowerCase().indexOf(prop.input.data.toLowerCase()) === 0;
    }).map(function(c) {
      return val.substring(0, prop.input.callsign.length+1) + c;
    });
  }
  tab_completion_reset();
  prop.input.tab_compl.matches = matches;
  prop.input.tab_compl.cycle_item = -1;
}

function tab_completion_reset() {
  prop.input.tab_compl = {};
}

function input_history_clamp() {
  prop.input.history_item = clamp(0, prop.input.history_item, prop.input.history.length-1);
}

function input_history_prev() {
  if(prop.input.history.length == 0) return;
  if(prop.input.history_item == null) {
    prop.input.history.unshift(prop.input.command);
    prop.input.history_item = 0;
  }

  prop.input.history_item += 1;
  input_history_clamp();

  var command = prop.input.history[prop.input.history_item] + ' ';
  $("#command").val(command.toUpperCase());
  input_change();
}

function input_history_next() {
  if(prop.input.history.length == 0) return;
  if(prop.input.history_item == null) return;

  prop.input.history_item -= 1;

  if(prop.input.history_item <= 0){
    $("#command").val(prop.input.history[0]);
    input_change();
    prop.input.history.splice(0, 1);
    prop.input.history_item = null;
    return;
  }

  input_history_clamp();

  var command = prop.input.history[prop.input.history_item] + ' ';
  $("#command").val(command.toUpperCase());
  input_change();
}

function input_run() {
  if(prop.input.callsign == "version") {
    ui_log("Air Traffic Control simulator version " + prop.version.join("."));
    return true;
  } else if(prop.input.callsign == "tutorial") {
    tutorial_toggle();
    return true;
  } else if(prop.input.callsign == "auto") {
    aircraft_toggle_auto();
    if(prop.aircraft.auto.enabled) {
      ui_log('automatic controller ENGAGED');
    } else {
      ui_log('automatic controller OFF');
    }
    return true;
  } else if(prop.input.callsign == "pause") {
    game_pause_toggle();
    return true;
  } else if(prop.input.callsign == "timewarp" ||
            prop.input.callsign == "speedup" ||
            prop.input.callsign == "timescale" ||
            prop.input.callsign == "slowmo") {
    if(prop.input.data) {
      prop.game.speedup = parseInt(prop.input.data);
    } else {
      game_timewarp_toggle();
    }
    return true;
  } else if(prop.input.callsign == "clear") {
    localStorage.clear();
    location.reload();
  } else if(prop.input.callsign == "airport") {
    if(prop.input.data) {
      if(prop.input.data.toLowerCase() in prop.airport.airports) {
        airport_set(prop.input.data);
      } else {
        ui_airport_toggle();
      }
    } else {
      ui_airport_toggle();
    }
    return true;
  } else if(prop.input.callsign == "rate") {
    if (prop.input.data) {
      var freq = parseFloat(prop.input.data);
      if (freq && freq > 0) {
        prop.game.frequency = freq;
      }
    }
    return true;
  }

  var matches = 0;
  var match   = -1;

  for(var i=0;i<prop.aircraft.list.length;i++) {
    var aircraft=prop.aircraft.list[i];
    if(aircraft.matchCallsign(prop.input.callsign)) {
      matches += 1;
      match    = i;
    }
  }

  if(matches > 1) {
    ui_log("multiple aircraft match the callsign, say again");
    return true;
  }
  if(match == -1) {
    ui_log("no such aircraft, say again");
    return true;
  }

  var aircraft = prop.aircraft.list[match];
  return aircraft.runCommand(prop.input.data);
}
