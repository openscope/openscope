
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

  $(".start-tutorial").click(function() {
    tutorial_toggle();
  });

  $(".pause-toggle").click(function() {
    game_pause_toggle();
  });

  $("#paused img").click(function() {
    game_unpause();
  });
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

