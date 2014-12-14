
function load_init_pre() {
  prop.load={};
  prop.load.items={
    done: 0,
    total: 0
  };
  prop.load.complete = false;
  prop.load.message = "loading";

  $("#loading").append("<div class='version'>" + prop.version_string + "</div>")

  load_tick();
}

function load_item_done() {
  prop.load.items.done+=1;
}

function load_item_add() {
  prop.load.items.total+=1;
}

function load_tick() {
  $('#loading h2').text(prop.load.message);
  if(!prop.load.complete)
    setTimeout(load_tick, 1000/30);
}

function load_complete() {
  prop.load.complete = true;
  setTimeout(function() {
    $("#loading").fadeOut(1000);
    $("#loading").css("pointerEvents","none");
  }, 500);
}
