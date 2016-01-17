
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
               "Click the first one ({CALLSIGN}). The aircraft&rsquo;s callsign will appear in the command entry box",
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
               "preparation for takeoff. (You could also specify to which runway to taxi the aircraft by",
               "entering the runway name after &lsquo;taxi&rsquo; or &lsquo;wait&rsquo;.)"
               ].join(" "),
    parse:    function(t) {
      return t.replace("{RUNWAY}", prop.aircraft.list[0].fms.currentWaypoint().runway);
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Takeoff, part 1",
    text:     ["When it appears at the start of runway {RUNWAY} (which may take a couple of seconds), click it (or press the up arrow once)",
               "and type in &lsquo;climb 50&rsquo;. This clears the aircraft to climb to five thousand",
               "feet after it takes off. (This step must be done before clearing the aircraft for takeoff, just as in real life.)"
               ].join(" "),
    parse:    function(t) {
      return t.replace("{RUNWAY}", prop.aircraft.list[0].fms.currentWaypoint().runway);
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Takeoff, part 2",
    text:     ["Now the aircraft is ready for take off. Click the aircraft again (or press up arrow once)",
               "and type &lsquo;takeoff&rsquo; (or &lsquo;to&rsquo;) to clear the aircraft for take off.",
               "Once it's going fast enough, it should lift off the ground and you should",
               "see its altitude increasing. Meanwhile, read the next step."
               ].join(" "),
    parse:    function(t) {
      return t.replace("{RUNWAY}", prop.aircraft.list[0].fms.currentWaypoint().runway);
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Aircraft strips, part 1",
    text:     ["On the right, there&rsquo;s a row of strips, one for each aircraft.",
               "Each strip has a bar on its left side, colored blue for departures and",
               "red for arrivals."
               ].join(" "),
    parse:    function(t) {
      return t.replace("{RUNWAY}", prop.aircraft.list[0].fms.currentWaypoint().runway);
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Aircraft strips, part 2",
    text:     ["The top row shows the aircraft&rsquo;s callsign, what it's doing (parked at apron,",
               "using a runway, flying to a fix, on a heading, etc), and its assigned altitude. The bottom row shows the model",
               "({MODEL} here, which is a {MODELNAME}) to the left, and its assigned speed to the right."
               ].join(" "),
    parse:    function(t) {
      return t.replace("{MODEL}", prop.aircraft.list[0].model.icao).replace("{MODELNAME}", prop.aircraft.list[0].model.name);
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Moving aircraft",
    text:     ["Once {CALLSIGN} has taken off, click it and type &lsquo;fh{ANGLE}&rsquo; into the command box (for",
                "&ldquo;fly heading {ANGLE}&rdquo;). It should start turning toward that heading; if the turn isn&rsquo;t",
                "immediately visible, you can click the speedup button on the right side of the input box (it&rsquo;s two",
                "small arrows pointing towards the right). Don&rsquo;t forget to click it again to go back to 1x speed."
               ].join(" "),
    parse:    function(t) {
      return t.
        replace("{CALLSIGN}", prop.aircraft.list[0].getCallsign()).
        replace("{ANGLE}", heading_to_string(prop.aircraft.list[0].destination)).
        replace("{ANGLE}", heading_to_string(prop.aircraft.list[0].destination));
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Departure destinations",
    text:     ["If you zoom out (using the mouse wheel) and click",
               "on the aircraft {CALLSIGN} you will see a blue arc in the",
               "direction it is heading.  This is its departure destination.",
               "Your goal is to direct every departure through their filed",
               "departure zone."
               ].join(" "),
    parse:    function(t) {
      return t.
        replace("{CALLSIGN}", prop.aircraft.list[0].getCallsign());
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Basic Control Instructions: Altitude",
    text:     ["You can assign altitudes with the &lsquo;climb&rsquo; command, or any of its aliases (other words that",
               "act identically). Running the command &lsquo;climb&rsquo; is the same as the commands &lsquo;descend&rsquo;, &lsquo;d&rsquo;,",
               "&lsquo;clear&rsquo;, &lsquo;c&rsquo;, &lsquo;altitude&rsquo;, or &lsquo;a&rsquo;. Just use whichever feels correct in your situation.",
               "Remember, just as in real ATC, altitudes are ALWAYS written in hundreds of feet, eg. &lsquo;descend 30&rsquo; for 3,000ft or &lsquo;climb",
               " 100&rsquo; for 10,000ft."
               ].join(" "),
    parse:    function(t) {
      return t.replace("{CALLSIGN}", prop.aircraft.list[0].getCallsign());
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Basic Control Instructions: Radar Vectors",
    text:     ["Radar vectors are an air traffic controller's way of telling aircraft to fly a specific magnetic heading. Previously, we've typed",
               "&lsquo;fh{ANGLE}&rsquo;, and the aircraft turned the shortest direction to face {ANGLE} degrees. Sometimes, you may want to specify a turn direction,",
               "entered like &lsquo;t l 270&rsquo; or &lsquo;t r 090&rsquo;, for example."
               ].join(" "),
    parse:    function(t) {
      return t.replace(/{ANGLE}/g, heading_to_string(prop.aircraft.list[0].destination));
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Basic Control Instructions: Speed",
    text:     ["Speed control is the TRACON controller's best friend. Making good use of speed control can help keep the pace manageable and allow",
               "you to carefully squeeze aircraft closer and closer to minimums while still maintaining safety. To enter speed instructions, use the",
               "&lsquo;+&rsquo; and &lsquo;-&rsquo; keys on the numpad, followed by the speed, in knots. Note that this assigned speed is indicated",
               "airspeed, and our radar scope can only display groundspeed; so, the values may be different."
               ].join(" "),
    parse:    function(t) {
      return t.replace(/{ANGLE}/g, heading_to_string(prop.aircraft.list[0].destination));
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Fixes",
    text:     ["Instead of guiding each aircraft based on heading, you can also clear each aircraft to proceed to a fix or navaid (shown on the map",
               "as a small triangle). Just use the command &lsquo;fix&rsquo; and the name of a fix, and the aircraft will fly to it. Upon passing the",
               "fix, it will continue flying along its present heading."
               ].join(" "),
    parse:    function(t) {
      return t.replace("{CALLSIGN}", prop.aircraft.list[0].getCallsign());
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Shortcuts",
    text:     ["You can give an aircraft a shortcut in a chain of fixes by issuing &lsquo;direct&rsquo;",
               "command (or &lsquo;dct&rsquo;). Also you can add more fixes in a track with",
               "&lsquo;proceed&rsquo; (&lsquo;pr&rsquo;) command. You can also have departing aircraft fly",
               "via a Standard Instrumental Departure (SID), shown in the map, via the &lsquo;sid&rsquo; command."
               ].join(" "),
    parse:    function(t) {
      return t.replace("{CALLSIGN}", prop.aircraft.list[0].getCallsign());
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Bon voyage, aircraft!",
    text:     ["When the aircraft flies through the blue arc, it will ",
               "automatically remove itself from the list on the right.",
               "Congratulations, you&rsquo;ve successfully taken off one",
               "aircraft."
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
               "you&rsquo;ve selected it, use the altitude/heading/speed controls you've learned in",
               "order to guide it to be in front of a runway. Make sure to get the aircraft down to",
               "around 4,000ft, and 10-15 nautical miles (2-3 range rings) away from the airport.",
               "While you work the airplane, read the next step."
               ].join(" "),
    parse:    function(t) {
      return t.replace("{CALLSIGN}", prop.aircraft.list[0].getCallsign());
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Approach Clearances, part 1",
    text:     ["You can clear aircraft for an ILS approach with the asterisk (*) key, followed by a runway name. Before you can do so, however,",
               "it must be on a heading that will cross the runway's extended centerline, that is no more than 30 degrees offset from the",
               "runway's heading. Once we eventually give them an approach clearance, you can expect aircraft to capture the ILS's localizer",
               "once they're within a few degrees of the extended centerline."
                 ].join(" "),
      parse:    function(t) {
        return t.replace("{CALLSIGN}", prop.aircraft.list[0].getCallsign());
      },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Approach Clearances, part 2",
    text:     ["When you have the aircraft facing the right direction, just select it and type &lsquo;*&lt;runway&gt;&rsquo;",
               "with the runway that&rsquo;s in front of it. Once it's close enough to capture the localizer, the assigned altitude on its strip",
               "will change to &lsquo;ILS locked&rsquo; (meaning the aircraft is capable of guiding itself down to the runway via",
               "the Instrument Landing System), and the assigned heading should now show the runway to which it has an approach clearance."
               ].join(" "),
    parse:    function(t) {
      return t.replace("{CALLSIGN}", prop.aircraft.list[0].getCallsign());
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Approach Clearances, part 3",
    text:     ["You may choose to enter one command at a time, but air traffic controllers usually do multiple. Particularly in approach clearances,",
               "they follow an acronym &ldquo;PTAC&rdquo; for the four elements of an approach clearance, the &lsquo;T&rsquo; and &lsquo;C&rsquo; of which",
               "stand for &lsquo;Turn&rsquo; and &lsquo;Clearance&rsquo;, both of which we entered separately in this tutorial. Though longer, it is both ",
               "easier and more real-world accurate to enter them together, like this: &lsquo;fh250 *28r&rsquo;."
               ].join(" "),
    parse:    function(t) {
      return t.replace("{CALLSIGN}", prop.aircraft.list[0].getCallsign());
    },
    side:     "left",
    position: tutorial_position
  });

  tutorial_step({
    title:    "Aborting landings",
    text:     ["If the aircraft is established on the ILS, it should be able to land on the runway. However, say there&rsquo;s another",
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
    text:     ["If you&rsquo;ve gone through this entire tutorial, you should do pretty well with the pressure.",
               "In the TRACON, minimum separation is 3 miles laterally or 1000 feet vertically. Keep them separated,",
               "keep them moving, and you'll be a controller in no time!"
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
