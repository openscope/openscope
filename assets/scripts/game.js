
function game_init_pre() {
  prop.game={};

  prop.game.paused=true;
  prop.game.focused=true;

  prop.game.speedup=1;

  prop.game.time=time();
  prop.game.delta=0;

  $(window).blur(function() {
//    prop.game.focused=false;
  });

  $(window).focus(function() {
//    prop.game.focused=true;
  });

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

function game_update_pre() {
  prop.game.delta=Math.min(delta()*prop.game.speedup, 1);
  if(game_paused()) {
    prop.game.delta=0;
  }
  prop.game.time+=prop.game.delta;
}

function game_complete() {
  prop.game.paused=false;
}
