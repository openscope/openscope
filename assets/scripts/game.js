
function game_init_pre() {
  prop.game={};

  prop.game.paused=true;
  prop.game.focused=true;

  prop.game.speedup=1;

  prop.game.frequency = 0.5;

  prop.game.time=0;
  prop.game.delta=0;

  prop.game.timeouts=[];

  $(window).blur(function() {
    prop.game.focused=false;
  });

  $(window).focus(function() {
    prop.game.focused=true;
  });

  prop.game.score = {
    arrival: 0,
    departure: 0,

    windy_landing: 0,
    windy_takeoff: 0,

    failed_arrival: 0,

    warning: 0,
    hit: 0,

    abort: {
      landing: 0,
      taxi: 0
    }
  };

}

function game_get_score() {
  var score = 0;
  score += prop.game.score.arrival * 10;
  score += prop.game.score.departure * 10;

  score -= prop.game.score.windy_landing * 0.5;
  score -= prop.game.score.windy_takeoff * 0.5;

  score -= prop.game.score.failed_arrival * 20;

  score -= prop.game.score.warning * 5;
  score -= prop.game.score.hit * 50;

  score -= prop.game.score.abort.landing * 5;

  score -= prop.game.score.abort.taxi * 2;

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
    $(".fast-forwards").removeClass("active");
    $(".fast-forwards").prop("title", "Set time warp to 2");
  } else if(prop.game.speedup == 1){
    prop.game.speedup = 2;
    $(".fast-forwards").addClass("active");
    $(".fast-forwards").prop("title", "Set time warp to 5");
  }else {
    prop.game.speedup = 5;
    $(".fast-forwards").addClass("active");
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
  $("#score").text(round(score));

  if(score < -0.51)
    $("#score").addClass("negative");
  else
    $("#score").removeClass("negative");

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
