
function load_init_pre() {
  prop.load={};
  prop.load.items={
    done: 0,
    total: 0
  };
}

function load_item_done() {
  prop.load.items.done+=1;
}

function load_item_add() {
  prop.load.items.total+=1;
}

function load_done() {
  $("#loading").fadeOut(1000);
  $("#loading").css("pointerEvents","none");
}
