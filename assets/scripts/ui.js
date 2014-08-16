
function ui_init_pre() {
  prop.ui = {};
  prop.ui.scale = 8; // pixels per km
}

function pixels_to_km(pixels) {
  return pixels / prop.ui.scale;
}

function km(kilometers) {
  return kilometers * prop.ui.scale;
}
