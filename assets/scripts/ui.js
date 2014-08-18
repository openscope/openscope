
function ui_init_pre() {
  prop.ui = {};
  prop.ui.scale = 6; // pixels per km
}

function ui_init() {

  $(".fast-forwards").prop("title", "Set time warp to 5");
  
  $(".fast-forwards").click(function() {
    if(prop.game.speedup != 1) {
      prop.game.speedup = 1;
      $(".fast-forwards").removeClass("active");
      $(".fast-forwards").prop("title", "Set time warp to 5");
    } else {
      prop.game.speedup = 5;
      $(".fast-forwards").addClass("active");
      $(".fast-forwards").prop("title", "Reset time warp");
    }
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

    var html = $("<li class='airport'><span class='icao'>" + airport.icao + "</span><span class='name'>" + airport.name + "</span></li>");
    
    $("#airport-switch .list").append(html);

    html.click(airport.icao, function(e) {
      airport_set(e.data);
      ui_airport_close();
    });
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
  if(arguments.length >= 2) message += ", "+arguments[1];
//  $("#log").append("<span class='item'><span class='from'>"+from+"</span><span class='message'>"+message+"</span></span>");
  var html = $("<span class='item'><span class='message'>"+message+"</span></span>");
  $("#log").append(html);
  $("#log").scrollTop($("#log").get(0).scrollHeight);
  game_timeout(function(html) {
    html.addClass("hidden");
    setTimeout(function() {
      html.remove();
    }, 1000);
  }, 10, window, html);
  console.log("MESSAGE: " + message);
}

function ui_airport_open() {
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
