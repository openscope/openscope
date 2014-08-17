
function input_init_pre() {
  prop.input={};

  prop.input.command  = "";
  prop.input.callsign = "";
  prop.input.data     = "";

  prop.input.history      = [];
  prop.input.history_item = null;

  prop.input.click    = [0, 0];
}

function input_init() {

  $("#canvases").mousemove(function(e) {
    var position = [e.pageX, -e.pageY];
    position[0] -= prop.canvas.size.width / 2;
    position[1] += prop.canvas.size.height / 2;
    prop.input.click = [pixels_to_km(position[0]), pixels_to_km(position[1])];
  });

  $("#canvases").mousedown(function(e) {
    var position = [e.pageX, -e.pageY];
    position[0] -= prop.canvas.size.width / 2;
    position[1] += prop.canvas.size.height / 2;
    var nearest = aircraft_get_nearest([pixels_to_km(position[0]), pixels_to_km(position[1])]);
    if(nearest[0]) {
      if(nearest[1] < pixels_to_km(80)) {
        input_select(nearest[0].getCallsign().toUpperCase());
      } else {
        input_select();
      }
    }
    e.preventDefault();
    return(false);
  });

  $(window).keydown(function() {
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
      if(data) prop.input.data += c[i];
      else prop.input.callsign += c[i];
    }
  }

  for(var i=0;i<prop.aircraft.list.length;i++) {
    var aircraft=prop.aircraft.list[i];
    if(aircraft.matchCallsign(prop.input.callsign)) {
      aircraft.html.addClass("active");
    }
  }
}

function input_keydown(e) {
  if(e.which == 13) { // enter key
    input_parse();
    if(input_run()) {
      prop.input.history.unshift(prop.input.callsign);
      $("#command").val("");
      prop.input.command = "";
      input_parse();
    }
    prop.input.history_item = null;
  } else if(e.which == 38) { // up arrow
    input_history_prev();
    e.preventDefault();
  } else if(e.which == 40) { // up arrow
    input_history_next();
    e.preventDefault();
  }
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

  var command = prop.input.history[prop.input.history_item];
  $("#command").val(command);
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

  var command = prop.input.history[prop.input.history_item];
  $("#command").val(command);
  input_change();
}

function input_run() {
  var matches = 0;
  var match   = -1;

  for(var i=0;i<prop.aircraft.list.length;i++) {
    var aircraft=prop.aircraft.list[i];
    if(aircraft.matchCallsign(prop.input.callsign)) {
      matches += 1;
      match    = i;
    }
  }

  if(matches > 1) return false;
  if(match == -1) return false;

  var aircraft = prop.aircraft.list[match];
  return aircraft.runCommand(prop.input.data);
}
