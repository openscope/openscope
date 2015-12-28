zlsa.atc.Options = Fiber.extend(function (base) {
  return {
    init: function () {
      this._options = {};
      this.addOption({
        name: 'controlMethod',
        defaultValue: 'classic',
        description: 'Control Method',
        type: 'select',
        data: [['Classic', 'classic'],
               ['Arrow Keys', 'arrows']]
      });
      this.addOption({
        name: 'drawProjectedPaths',
        defaultValue: 'selected',
        description: 'Draw aircraft projected path',
        type: 'select',
        data: [['Always', 'always'],
               ['Selected', 'selected'],
               ['Never', 'never']]
      });
      this.addOption({
        name: 'simplifySpeeds',
        defaultValue: 'yes',
        description: 'Use simplified airspeeds',
        help: 'Controls use of a simplified calculation which results in'
          + ' aircraft always moving across the ground at the speed assigned.'
          + ' In reality aircraft will move faster as they increase altitude.',
        type: 'select',
        data: [['Yes', 'yes'],
               ['No', 'no']]
      });
      this.addOption({
        name: 'softCeiling',
        defaultValue: 'no',
        description: 'Allow departures via climb',
        help: 'Normally aircraft depart the airspace by flying beyond'
          + ' the horizontal bounds.  If set to yes, aircraft may also'
          + ' depart the airspace by climbing above it.',
        type: 'select',
        data: [['Yes', 'yes'],
               ['No', 'no']],
      });
    },
    addOption: function(data) {
      this._options[data.name] = data;
      if ('zlsa.atc.option.'+data.name in localStorage)
        this[data.name] = localStorage['zlsa.atc.option.'+data.name];
      else
        this[data.name] = data.defaultValue;
    },
    getDescriptions: function() {
      return this._options;
    },
    get: function(name) {
      return this[name];
    },
    set: function(name, value) {
      localStorage['zlsa.atc.option.'+name] = value;
      this[name] = value;
      return value;
    },
  };
});

function game_init_pre() {
  prop.game={};

  prop.game.paused=true;
  prop.game.focused=true;

  prop.game.speedup=1;

  prop.game.frequency=1;

  prop.game.time=0;
  prop.game.delta=0;

  prop.game.timeouts=[];

  $(window).blur(function() {
    prop.game.focused=false;
  });

  $(window).focus(function() {
    prop.game.focused=true;
  });

  prop.game.last_score = 0;
  prop.game.score = {
    arrival: 0,
    departure: 0,

    windy_landing: 0,
    windy_takeoff: 0,

    failed_arrival: 0,
    failed_departure: 0,

    warning: 0,
    hit: 0,

    abort: {
      landing: 0,
      taxi: 0
    },

    violation: 0,
    restrictions: 0
  };

  prop.game.option = new zlsa.atc.Options();
}

function game_get_score() {
  var score = 0;
  score += prop.game.score.arrival * 10;
  score += prop.game.score.departure * 10;

  score -= prop.game.score.windy_landing * 0.5;
  score -= prop.game.score.windy_takeoff * 0.5;

  score -= prop.game.score.failed_arrival * 20;
  score -= prop.game.score.failed_departure * 2;

  score -= prop.game.score.warning * 5;
  score -= prop.game.score.hit * 50;

  score -= prop.game.score.abort.landing * 5;
  score -= prop.game.score.abort.taxi * 2;

  score -= prop.game.score.violation;
  score -= prop.game.score.restrictions * 10;

  return score;
}

function game_get_weighted_score() {
  var score = game_get_score();
  score     = score / (game_time() / 60);
  score    *= 500;
  return score;
}

function game_timewarp_toggle() {
  if(prop.game.speedup == 5) {
    prop.game.speedup = 1;
    $(".fast-forwards").removeClass("speed-5");
    $(".fast-forwards").prop("title", "Set time warp to 2");
  } else if(prop.game.speedup == 1){
    prop.game.speedup = 2;
    $(".fast-forwards").addClass("speed-2");
    $(".fast-forwards").prop("title", "Set time warp to 5");
  }else {
    prop.game.speedup = 5;
    $(".fast-forwards").removeClass("speed-2");
    $(".fast-forwards").addClass("speed-5");
    $(".fast-forwards").prop("title", "Reset time warp");
  }
}

function game_pause() {
  prop.game.paused = true;
  $(".pause-toggle").addClass("active");
  $(".pause-toggle").attr("title", "Resume simulation");
  $("html").addClass("paused");
}

function game_unpause() {
  prop.game.paused = false;
  $(".pause-toggle").removeClass("active");
  $(".pause-toggle").attr("title", "Pause simulation");
  $("html").removeClass("paused");
}

function game_pause_toggle() {
  if(prop.game.paused) {
    game_unpause();
  } else {
    game_pause();
  }
}

function game_paused() {
  return !prop.game.focused || prop.game.paused;
}

function game_time() {
  return prop.game.time;
}

function game_delta() {
  return prop.game.delta;
}

function game_speedup() {
  if(game_paused()) return 0;
  return prop.game.speedup;
}

function game_timeout(func, delay, that, data) {
  var to = [func, game_time()+delay, data, delay, false, that];
  prop.game.timeouts.push(to);
  return to;
}

function game_interval(func, delay, that, data) {
  var to = [func, game_time()+delay, data, delay, true, that];
  prop.game.timeouts.push(to);
  return to;
}

function game_clear_timeout(to) {
  prop.game.timeouts.splice(prop.game.timeouts.indexOf(to), 1);
}

function game_update_pre() {
  var score = game_get_score();
  if (score != prop.game.last_score) {
    $("#score").text(round(score));
    if(score < -0.51)
      $("#score").addClass("negative");
    else
      $("#score").removeClass("negative");
    prop.game.last_score = score;
  }

  prop.game.delta=Math.min(delta()*prop.game.speedup, 100);
  if(game_paused()) {
    prop.game.delta=0;
  } else {
    $("html").removeClass("paused");
  }
  prop.game.time+=prop.game.delta;
  for(var i=prop.game.timeouts.length-1;i>=0;i--) {
    var remove  = false;
    var timeout = prop.game.timeouts[i];
    if(game_time() > timeout[1]) {
      timeout[0].call(timeout[5], timeout[2]);
      if(timeout[4]) {
        timeout[1] += timeout[3];
      } else {
        remove=true;
      }
    }
    if(remove) {
      prop.game.timeouts.splice(i, 1);
      i-=1;
    }
  }
}

function game_complete() {
  prop.game.paused=false;
}
