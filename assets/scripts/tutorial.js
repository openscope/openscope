
var Step = Fiber.extend(function() {
  return {
    init: function(options) {
      if(!options) options = {};

      this.title    = options.title || "?";

      this.text     = options.text || "?";

      this.parse     = options.parse || null;

      this.side     = options.side || "none";

      this.position = options.position || [0, 0];
      this.padding  = options.padding  || [0, 0];
    },
    getText: function() {
      if(this.parse)
        return this.parse(this.text);
      return this.text;
    }
  };
});

function tutorial_init_pre() {
  prop.tutorial = {};

  prop.tutorial.steps = [];
  prop.tutorial.step  = 0;

  prop.tutorial.open  = false;

  var tutorial_position = [0.1, 0.85];

  tutorial_step({
    title:    "Welcome!",
    text:     ["Welcome to Air Traffic Control simulator. It&rsquo;s not easy",
               "to control dozens of aircraft while maintaining safe distances",
               "between them; to get started with the ATC simulator tutorial, click the arrow on",
               "the right. You can also click the graduation cap icon in the lower right corner",
               "of the window at any time to close this tutorial.",
               ].join(" "),
    position: tutorial_position
  });

  tutorial_step({
    title:    "Departing aircraft",
    text:     ["Let&rsquo;s route some planes out of here. On the right side of the screen, there",
               "should be a strip with a blue bar on the left, meaning the strip represents a departing aircraft.",
               "Click the first one ({CALLSIGN}); the aircraft&rsquo;s callsign will appear in the command entry box",
               "and the strip will move to the left and change color. This means that the aircraft is selected."
               ].join(" "),
    parse:    function(t) {
      if(prop.aircraft.list.length > 0)
        return t.replace("{CALLSIGN}", prop.aircraft.list[0].getCallsign());
      else
        return t.replace('{CALLSIGN}', 'there aren\'t any right now');
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Taxiing",
    text:     ["Now type in &lsquo;taxi&rsquo; or &lsquo;wait&rsquo; into the command box after the callsign and hit Return;",
               "the messages area above it will show that the aircraft is taxiing to runway {RUNWAY} in",
               "preparation for takeoff. (If you&rsquo;d like, you can force the aircraft to taxi to a different runway by",
               "entering the runway name after &lsquo;taxi&rsquo; or &lsquo;wait&rsquo;.)"
               ].join(" "),
    parse:    function(t) {
      return t.replace("{RUNWAY}", prop.aircraft.list[0].requested.runway);
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Takeoff, part 1",
    text:     ["When it appears at the start of runway {RUNWAY} (which may take a couple of seconds), click it (or press the up arrow once)",
               "and type in &lsquo;climb 5000&rsquo;. This clears the aircraft to climb to five thousand",
               "feet after it takes off. (This step must be done before clearing the aircraft to take off, just as in real life.)"
               ].join(" "),
    parse:    function(t) {
      return t.replace("{RUNWAY}", prop.aircraft.list[0].requested.runway);
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Takeoff, part 2",
    text:     ["Now the aircraft is ready to take off. Click the aircraft again (or press up arrow once)",
               "and type &lsquo;takeoff&rsquo; to clear the aircraft to take off. It should slowly move",
               "down the runway; when it's going fast enough, it should lift off the ground and you should",
               "see its altitude increasing. Meanwhile, read the next step."
               ].join(" "),
    parse:    function(t) {
      return t.replace("{RUNWAY}", prop.aircraft.list[0].requested.runway);
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Aircraft strips, part 1",
    text:     ["On the right, there&rsquo;s a row of strips, one for each aircraft.",
               "Each strip has a bar on its left side, blue for departing aircraft and",
               "red for arrivals."
               ].join(" "),
    parse:    function(t) {
      return t.replace("{RUNWAY}", prop.aircraft.list[0].requested.runway);
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Aircraft strips, part 2",
    text:     ["The top row from the left shows the aircraft&rsquo;s callsign, its assigned heading",
               "(or its runway if it&rsquo;s in the process of taking off or landing), and its assigned altitude.",
               "The bottom row shows the model ({MODEL} here, which is a {MODELNAME}) and its assigned speed."
               ].join(" "),
    parse:    function(t) {
      return t.replace("{MODEL}", prop.aircraft.list[0].model.icao).replace("{MODELNAME}", prop.aircraft.list[0].model.name);
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Moving aircraft",
    text:     ["Now wait until the aircraft {CALLSIGN} has taken off. Click on it and type &lsquo;turn 90&rsquo; into the command box.",
               "It should start turning to the east (ninety degrees); if the turn isn&rsquo;t immediately visible, you can click",
               "the speedup button on the right side of the input box (it&rsquo;s two small arrows pointing towards the right).",
               "Don&rsquo;t forget to click it again to go back to 1x speed."
               ].join(" "),
    parse:    function(t) {
      return t.replace("{CALLSIGN}", prop.aircraft.list[0].getCallsign());
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Altitude aliases",
    text:     ["You can also assign altitudes with the &lsquo;climb&rsquo; command. This command also has aliases (other commands that have different",
               "names but act identically). Running the command &lsquo;climb&rsquo; is the same as the commands &lsquo;descend&rsquo;,",
               "&lsquo;clear&rsquo;, or &lsquo;altitude&rsquo;; use whichever feels correct in your situation."
               ].join(" "),
    parse:    function(t) {
      return t.replace("{CALLSIGN}", prop.aircraft.list[0].getCallsign());
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Altitude hints",
    text:     ["Remember how you typed &lsquo;climb 5000&rsquo; before? If the parameter for the &lsquo;climb&rsquo; command (&lsquo;5000&rsquo; here) is one or two characters long,",
               "the number is multiplied by 1000. This means that &lsquo;climb 5&rsquo; is the same as &lsquo;climb 5000&rsquo;. It&rsquo;s there",
               "to reduce the amount of typing. Likewise, &lsquo;c 5&rsquo; can be used in place of &lsquo;climb 5&rsquo;."
               ].join(" "),
    parse:    function(t) {
      return t.replace("{CALLSIGN}", prop.aircraft.list[0].getCallsign());
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Heading hints",
    text:     ["When you typed &lsquo;turn 90&rsquo;, the aircraft turned to the right to face 90 degrees (due East).",
               "In this case, the shortest turn was to the right. This is usually the desired behavior, but if you want to force the aircraft to turn",
               "in a specific direction, you can prefix the direction with &lsquo;left&rsquo; or &lsquo;right&rsquo;.",
               "Like the altitude command, the heading command also has an alias of its own: &lsquo;heading&rsquo; can be used",
               "in place of &lsquo;turn&rsquo;."
               ].join(" "),
    parse:    function(t) {
      return t.replace("{DIRECTION}", prop.aircraft.list[0].getCallsign());
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Fixes",
    text:     ["Instead of guiding each aircraft based on heading, you can also assign each aircraft to a navigational",
               "fix (shown on the map as a small triangle). Just use the command &lsquo;fix&rsquo; and the name of a fix",
               "(shown onscreen underneath the fix icon), and the aircraft will fly towards that.",
               "After it&rsquo;s reached the fix, it will cancel the fix and continue flying in the same direction."
               ].join(" "),
    parse:    function(t) {
      return t.replace("{CALLSIGN}", prop.aircraft.list[0].getCallsign());
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Bon voyage, aircraft!",
    text:     ["When the aircraft flies off the edge of the screen, it will automatically remove itself from the list on the right.",
               "Congratulations, you&rsquo;ve successfully taken off one aircraft."
               ].join(" "),
    parse:    function(t) {
      return t.replace("{CALLSIGN}", prop.aircraft.list[0].getCallsign());
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Arrivals",
    text:     ["Now, onto arrivals. Click on any arriving aircraft in the radar screen; after",
               "you&rsquo;ve selected it, use the &lsquo;climb&rsquo; and the &lsquo;turn&rsquo;",
               "commands to guide it to be in front of a runway. You&rsquo;ll want to put it",
               "quite a bit in front of the runway to give yourself a bit of breathing room.",
               "While the aircraft maneuvers to face the correct direction, go to the next step."
               ].join(" "),
    parse:    function(t) {
      return t.replace("{CALLSIGN}", prop.aircraft.list[0].getCallsign());
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Landing, part 1",
    text:     ["You can land a plane with the &lsquo;land&rsquo; command, followed by a runway",
               "name. Before you can land a plane, though, it must be facing the runway, not be offset",
               "from it horizontally more than about 20 degrees, and be at about six to seven thousand",
               "feet altitude. Since it takes a while for aircraft to turn, you can reduce the speed with",
               "the &lsquo;speed&rsquo; or &lsquo;slow&rsquo; command (example: &lsquo;{CALLSIGN} speed 200&rsquo;)",
               "to give yourself a bit more time."
               ].join(" "),
    parse:    function(t) {
      return t.replace("{CALLSIGN}", prop.aircraft.list[0].getCallsign());
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Landing, part 2",
    text:     ["When the aircraft is facing the right direction, just select it and type &lsquo;land &lt;runway&gt;&rsquo;",
               "with the runway that&rsquo;s in front of it. The assigned altitude on its strip should change to &lsquo;ILS",
               "locked&rsquo; (meaning the aircraft is capable of guiding itself down to the runway with the Instrument Landing",
               "System), and the assigned heading should now show the runway it&rsquo;s trying to land at."
               ].join(" "),
    parse:    function(t) {
      return t.replace("{CALLSIGN}", prop.aircraft.list[0].getCallsign());
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Aborting landings",
    text:     ["If the aircraft is locked on ILS, it should be able to land on the runway. However, say there&rsquo;s another",
               "aircraft that&rsquo;s planning to take off from the same runway. To abort the landing, use the command &lsquo;abort&rsquo;.",
               "(If the aircraft is navigating to a fix, the &lsquo;abort&rsquo; command will clear the fix instead.)"
               ].join(" "),
    parse:    function(t) {
      return t.replace("{CALLSIGN}", prop.aircraft.list[0].getCallsign());
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Wind sock",
    text:     ["In the lower right corner of the map is a small circle with a line; the line shows the direction",
               "the wind is going to. If it&rsquo;s pointing straight down, the wind is blowing from the North",
               "to the South. Aircraft are assigned to different takeoff runways accordingly. If it is shown in",
               "red, the wind is two times stronger.",
               ].join(" "),
    parse:    function(t) {
      return t.replace("{CALLSIGN}", prop.aircraft.list[0].getCallsign());
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Score",
    text:     ["The lower-right corner of the page has a small number in it; this is your score.",
               "Whenever you successfully route an aircraft to the ground or out of the screen, you get score;",
               "if you direct the aircraft to a runway with a strong crosswind or tailwind, you&rsquo;ll lose score.",
               "Furthermore, if two aircraft get too close or you ignore an arriving aircraft, you will also lose score.",
               "If you&rsquo;d like, you can just ignore the score; it doesn&rsquo;t have any effect with the simulation."
               ].join(" "),
    parse:    function(t) {
      return t.replace("{CALLSIGN}", prop.aircraft.list[0].getCallsign());
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Good job!",
    text:     ["If you&rsquo;ve gone through this entire tutorial, you should do pretty good with the pressure.",
               "Side note: the closest two aircraft can get is 3 miles and 1000 foot separation. Keep them further than",
               "that and you&rsquo;ll do fine."
               ].join(" "),
    parse:    function(t) {
      return t.replace("{CALLSIGN}", prop.aircraft.list[0].getCallsign());
    },
    side:     "left",
    position: tutorial_position
  });

}

function tutorial_step(options) {
  prop.tutorial.steps.push(new Step(options));
};

function tutorial_init() {
  prop.tutorial.html = $("<div id='tutorial'></div>");
  prop.tutorial.html.append("<h1></h1>");
  prop.tutorial.html.append("<main></main>");
  prop.tutorial.html.append("<div class='prev'><img src='assets/images/prev.png' title='Previous step' /></div>");
  prop.tutorial.html.append("<div class='next'><img src='assets/images/next.png' title='Next step' /></div>");
  prop.tutorial.html.find(".prev").click(tutorial_prev);
  prop.tutorial.html.find(".next").click(tutorial_next);

  $("body").append(prop.tutorial.html);
}

function tutorial_complete() {
  if(!("first-run-time" in localStorage)) tutorial_open();
  localStorage["first-run-time"] = time();
}

function tutorial_open() {
  prop.tutorial.open = true;
  $("#tutorial").addClass("open");
  $(".toggle-tutorial").addClass("active");
  $(".toggle-tutorial").prop("title", "Close tutorial");
  tutorial_update_content();
}

function tutorial_close() {
  prop.tutorial.open = false;
  $("#tutorial").removeClass("open");
  $(".toggle-tutorial").removeClass("active");
  $(".toggle-tutorial").prop("title", "Open tutorial");
  tutorial_move();
}

function tutorial_get(step) {
  if(step == null) step = prop.tutorial.step;
  return prop.tutorial.steps[step];
}

function tutorial_next() {
  if(prop.tutorial.step == prop.tutorial.steps.length - 1) {
    tutorial_close();
    return;
  }
  prop.tutorial.step = clamp(0, prop.tutorial.step + 1, prop.tutorial.steps.length - 1);
  tutorial_update_content();
}

function tutorial_prev() {
  prop.tutorial.step = clamp(0, prop.tutorial.step - 1, prop.tutorial.steps.length - 1);
  tutorial_update_content();
}

function tutorial_update_content() {
  var step = tutorial_get();

  $("#tutorial h1").html(step.title);
  $("#tutorial main").html(step.getText());

  $("#tutorial").removeClass("left right");
  if(step.side == "left") $("#tutorial").addClass("left");
  else if(step.side == "right") $("#tutorial").addClass("right");

  tutorial_move();
}

function tutorial_resize() {
  tutorial_move()
}

function tutorial_move() {
  var step = tutorial_get();

  var padding = [30, 10];

  var left = step.position[0] * ($(window).width()  - $("#tutorial").outerWidth()  - padding[0]);
  var top  = step.position[1] * ($(window).height());
  top -= ($("#tutorial").outerHeight() - padding[1]);

//  left += step.padding[0];
//  top  += step.padding[1];

  $("#tutorial").offset({top: round(top), left: round(left)});
}

function tutorial_toggle() {
  if(prop.tutorial.open) tutorial_close();
  else                   tutorial_open();
}
