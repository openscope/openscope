/**
 * Loading indicator elements for HTML interface
 */
(function ($, zlsa, Fiber, mediator, version_string) {
  "use strict";
  $("#loading").append("<div class='version'>" + version_string + "</div>");

  var minimumDisplayTime = 2; //seconds

  var state = {
    loading: false,
    callback: null,
    start: null
  };

  zlsa.atc.LoadUI = {
    complete: function() {
      $("#loading").fadeOut(1000);
      $("#loading").css("pointerEvents","none");
    },

    startLoad: function(url) {
      var msg = url;
      if (url.length > 15)
        msg = '...' + url.substr(-12);
      $("#loadingIndicator .message").text(msg);

      if (!state.loading) {
        $("#loadingIndicator").show();
        state.start = new Date().getTime() * 0.001;
      }

      if (state.callback !== null) {
        clearTimeout(state.callback);
        state.callback = null;
      }
    },

    stopLoad: function() {
      var now = new Date().getTime() * 0.001;
      if ((now - state.start) > minimumDisplayTime) {
        $("#loadingIndicator").hide();
        state.start = null;
        state.loading = false;
      }
      else {
        if (state.callback !== null)
          return;
        state.callback = setTimeout(function () {
          $("#loadingIndicator").hide();
          state.start = null;
          state.loading = false;
          state.callback = null;
        }, (minimumDisplayTime - (now - state.start)) * 1000);
      }
    },
  };
})($, zlsa, Fiber, zlsa.atc.mediator, prop.version_string);
