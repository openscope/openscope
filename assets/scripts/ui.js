
function ui_init_pre() {
  prop.ui = {};
  prop.ui.scale_default = 8; // pixels per km
  prop.ui.scale_max = 80; // max scale
  prop.ui.scale_min = 1; // min scale
  prop.ui.scale         = prop.ui.scale_default;
  prop.ui.terrain = {
    colors: {
      1000: '26, 150, 65',
      2000: '119, 194, 92',
      3000: '255, 255, 192',
      4000: '253, 201, 128',
      5000: '240, 124, 74',
      6000: '156, 81, 31'
    },
    border_opacity: 1,
    fill_opacity: .1
  };

  if('atc-scale' in localStorage) prop.ui.scale = localStorage['atc-scale'];
}

function ui_zoom_out() {
  var lastpos = [round(pixels_to_km(prop.canvas.panX)), round(pixels_to_km(prop.canvas.panY))];
  prop.ui.scale *= 0.9;
  if(prop.ui.scale < prop.ui.scale_min) prop.ui.scale = prop.ui.scale_min;
  ui_after_zoom();
  prop.canvas.panX = round(km(lastpos[0]));
  prop.canvas.panY = round(km(lastpos[1]));
}

function ui_zoom_in() {
  var lastpos = [round(pixels_to_km(prop.canvas.panX)), round(pixels_to_km(prop.canvas.panY))];
  prop.ui.scale /= 0.9;
  if(prop.ui.scale > prop.ui.scale_max) prop.ui.scale = prop.ui.scale_max;
  ui_after_zoom();
  prop.canvas.panX = round(km(lastpos[0]));
  prop.canvas.panY = round(km(lastpos[1]));
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

  var switches = {
    ".fast-forwards": game_timewarp_toggle,
    ".speech-toggle": speech_toggle,
    ".switch-airport": ui_airport_toggle,
    ".toggle-tutorial": tutorial_toggle,
    ".pause-toggle": game_pause_toggle,
    "#paused img": game_unpause,
    ".toggle-restricted-areas": canvas_restricted_toggle,
    ".toggle-sids": canvas_sids_toggle,
    ".toggle-terrain": canvas_terrain_toggle
  };

  $.each(switches, function(selector, fn) {
    $(selector).on('click', function(evt) { fn(evt); });
  });

  var options = $("<div id='options-dialog' class='dialog'></div>");
  var descriptions = prop.game.option.getDescriptions();
  for (var key in descriptions) {
    var opt = descriptions[key];
    if (opt.type == 'select') {
      var container = $('<div class="option"></div>');
      container.append("<span class='option-description'>" +
                     opt.description + "</span>");
      var sel_span = $("<span class='option-selector option-type-select'></span>");
      var selector = $("<select id='opt-" + opt.name +
                       "' name='" + opt.name + "'></select>");
      selector.data('name', opt.name);
      var current = prop.game.option.get(opt.name);
      for (var i=0;i<opt.data.length;i++) {
        var s = "<option value='"+opt.data[i][1];
        if (opt.data[i][1] == current)
          s += "' selected='selected";
        s += "'>"+opt.data[i][0]+"</option>";
        selector.append(s);
      }
      selector.change(function() {
        prop.game.option.set($(this).data('name'), $(this).val());
      });
      sel_span.append(selector);
      container.append(sel_span);
      options.append(container);
    }
  }

  $("body").append(options);

  $("#toggle-options").click(function() {
    ui_options_toggle();
  });
}

function ui_complete() {
  var airports = [];
  var icon = '&#9992;';

  for(var i in prop.airport.airports) airports.push(i);

  airports.sort();

  for(var i=0;i<airports.length;i++) {
    var airport = prop.airport.airports[airports[i]];
    var difficulty = '';
    switch (airport.level) {
    case 'beginner':
      difficulty = icon;
      break;
    case 'easy':
      difficulty = icon.repeat(2);
      break;
    case 'medium':
      difficulty = icon.repeat(3);
      break;
    case 'hard':
      difficulty = icon.repeat(4);
      break;
    case 'expert':
      difficulty = icon.repeat(5);
      break;
    default:
      difficulty = '?';
      break;
    }

    var html = $("<li class='airport icao-"+airport.icao.toLowerCase()+"'>" +
                 "<span style='font-size: 7pt' class='difficulty'>" + difficulty + "</span>" +
                 "<span class='icao'>" + airport.icao + "</span>" +
                 "<span class='name'>" + airport.name + "</span></li>");

    html.click(airport.icao.toLowerCase(), function(e) {
      if(e.data != airport_get().icao) {
        airport_set(e.data);
        ui_airport_close();
      }
    });

    $("#airport-list").append(html);
  }
  var symbol = $("<span class='symbol'>" + "&#9983" + "</span>");
  $("#airport-list-notes").append(symbol);
  var notes = $("<span class='words'>" + "indicates airport is a work in progress" + "</span>");
  $("#airport-list-notes").append(notes);
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

function canvas_restricted_toggle(evt) {
  $(evt.target).closest('.control').toggleClass('warning-button active');
  prop.canvas.draw_restricted = !prop.canvas.draw_restricted;
}

function canvas_sids_toggle(evt) {
  $(evt.target).closest('.control').toggleClass('active');
  prop.canvas.draw_sids = !prop.canvas.draw_sids;
}

function canvas_terrain_toggle(evt) {
  $(evt.target).closest('.control').toggleClass('active');
  prop.canvas.draw_terrain = !prop.canvas.draw_terrain;
}

function ui_options_toggle() {
  if ($("#options-dialog").hasClass("open")) {
    $("#options-dialog").removeClass("open");
    $("#options-dialog").removeClass("active");
  }
  else {
    $("#options-dialog").addClass("open");
    $("#options-dialog").addClass("active");
  }
}
