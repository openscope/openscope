
function ui_init_pre() {
  prop.ui = {};
  prop.ui.scale_default = 8; // pixels per km
  prop.ui.scale         = prop.ui.scale_default;

  if('atc-scale' in localStorage) prop.ui.scale = localStorage['atc-scale'];
}

function ui_zoom_out() {
  prop.ui.scale *= 0.9;
  ui_after_zoom();
}

function ui_zoom_in() {
  prop.ui.scale /= 0.9;
  ui_after_zoom();
}

function ui_zoom_reset() {
  prop.ui.scale = prop.ui.scale_default;
  ui_after_zoom();
}

function ui_after_zoom() {
  localStorage['atc-scale'] = prop.ui.scale;
  prop.canvas.dirty = true;
}

function ui_init() {

  $(".fast-forwards").prop("title", "Set time warp to 2");

  $(".fast-forwards").click(function() {
    game_timewarp_toggle();
  });

  $(".speech-toggle").click(function() {
    speech_toggle();
  });

  $(".switch-airport").click(function() {
    ui_airport_toggle();
  });

  $(".toggle-tutorial").click(function() {
    tutorial_toggle();
  });

  $(".pause-toggle").click(function() {
    game_pause_toggle();
  });

  $("#paused img").click(function() {
    game_unpause();
  });
}

function ui_complete() {
  var airports = []

  for(var i in prop.airport.airports) airports.push(i);

  airports.sort();

  for(var i=0;i<airports.length;i++) {
    var airport = prop.airport.airports[airports[i]];

    var html = $("<li class='airport icao-"+airport.icao.toLowerCase()+"'><span class='icao'>" + airport.icao + "</span><span class='name'>" + airport.name + "</span></li>");

    html.click(airport.icao.toLowerCase(), function(e) {
      if(e.data != airport_get().icao) {
        airport_set(e.data);
        ui_airport_close();
      }
    });

    $("#airport-switch .list").append(html);

  }
}

function pixels_to_km(pixels) {
  return pixels / prop.ui.scale;
}

function km(kilometers) {
  return kilometers * prop.ui.scale;
}

function ui_log(message) {
  message = arguments[0];
  var warn = false;
  if(arguments[0] == true) {
    warn = true;
    message = arguments[1];
  } else if(arguments.length >= 2) {
    message += ", "+arguments[1];
  }

//  $("#log").append("<span class='item'><span class='from'>"+from+"</span><span class='message'>"+message+"</span></span>");
  var html = $("<span class='item'><span class='message'>"+message+"</span></span>");
  if(warn) html.addClass("warn");
  $("#log").append(html);
  $("#log").scrollTop($("#log").get(0).scrollHeight);
  game_timeout(function(html) {
    html.addClass("hidden");
    setTimeout(function() {
      html.remove();
    }, 10000);
  }, 3, window, html);

  speech_say(message);

//  console.log("MESSAGE: " + message);
}

function ui_airport_open() {
  $(".airport").removeClass("active");
  $(".airport.icao-"+airport_get().icao.toLowerCase()).addClass("active");

  $("#airport-switch").addClass("open");
  $(".switch-airport").addClass("active");
}

function ui_airport_close() {
  $("#airport-switch").removeClass("open");
  $(".switch-airport").removeClass("active");
}

function ui_airport_toggle() {
  if($("#airport-switch").hasClass("open")) ui_airport_close();
  else                                      ui_airport_open();
}
