
function ui_init_pre() {
  prop.ui = {};
  prop.ui.scale = 6; // pixels per km
}

function ui_init() {
  $(".fast-forwards").click(function() {
    if(prop.game.speedup != 1) {
      prop.game.speedup = 1;
      $(".fast-forwards").removeClass("active");
    } else {
      prop.game.speedup = 3;
      $(".fast-forwards").addClass("active");
    }
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
  }, 4, window, html);
  console.log(message);
}

