var zlsa = {atc: {}};

//////////////////////////////////////////////////////////////////////////////////////////

// all modules, prefix with "-" to signify library; <name>_init etc. won't be called
var MODULES=[
  "-util",
  "-animation",

  "speech",

  "get",

  "tutorial",

  "base",

  "game",

  "input",

  "airline",

  "aircraft",
  "airport",

  "canvas",

  "ui",

  "load"
];

// saved as prop.version and prop.version_string
var VERSION=[2, 1, 8];

// are you using a main loop? (you must call update() afterward disable/reenable)
var UPDATE=true;

// the framerate is updated this often (seconds)
var FRAME_DELAY=1;

// is this a release build?
var RELEASE=false;

// Usage of async() etc:

// async("image") // call async() once for every async_loaded() you'll call
// $.get(...,function() {async_loaded("image");}) // call async_loaded once for each
//                                                // image once it's loaded
// if async_loaded() is NOT called the same number of times as async() the page will
// NEVER load!

// === CALLBACKS (all optional and do not need to be defined) ===

// INIT:
// module_init_pre()
// module_init()
// module_init_post()

// module_done()
// -- wait until all async has finished (could take a long time) --
// module_ready()
// -- wait until first frame is ready (only triggered if UPDATE == true) --
// module_complete()

// UPDATE:
// module_update_pre()
// module_update()
// module_update_post()

// RESIZE (called at least once during init and whenever page changes size)
// module_resize()

//////////////////////////////////////////////////////////////////////////////////////////

var async_modules={};
var async_done_callback=null;

var LOG_DEBUG=0;
var LOG_INFO=1;
var LOG_WARNING=2;
var LOG_ERROR=3;
var LOG_FATAL=4;

var log_strings={
  0:"DEBUG",
  1:"INFO",
  2:"WARN",
  3:"ERROR",
  4:"FATAL",
};

// PROP

function prop_init() {
  prop={};
  prop.complete=false;
  prop.temp="nothing here";
  prop.version=VERSION;
  prop.version_string="v"+VERSION.join(".");
  prop.time={};
  prop.time.start=time();
  prop.time.frames=0;
  prop.time.frame={};
  prop.time.frame.start=time();
  prop.time.frame.delay=FRAME_DELAY;
  prop.time.frame.count=0;
  prop.time.frame.last=time();
  prop.time.frame.delta=0;
  prop.time.fps=0;
  prop.log=LOG_DEBUG;
  prop.loaded=false;
  if(RELEASE)
    prop.log=LOG_WARNING;
}

// MISC

function log(message,level) {
  if(level == undefined)
    level=LOG_INFO;
  if(prop.log <= level) {
    var text="[ "+log_strings[level]+" ]";
    if(level >= LOG_WARNING)
      console.warn(text,message);
    else
      console.log(text,message);
  }
}

// ASYNC (AJAX etc.)

function async(name) {
  if(name in async_modules)
    async_modules[name]+=1;
  else
    async_modules[name]=1;
}

function async_loaded(name) {
  async_modules[name]-=1;
  async_check();
}

function async_wait(callback) {
  async_done_callback=callback;
  async_check();
}

function async_check() {
  for(var i in async_modules) {
    if(async_modules[i] != 0)
      return;
  }
  if(async_done_callback)
    async_done_callback();
}

// UTIL

function time() {
  return new Date().getTime()*0.001;
}

function s(number,single,multiple) {
  if(!single) single="";
  if(!multiple) multiple="s";
  if(single == 1) return single;
  return multiple;
}

// MODULES

function load_module(name) {
  var filename;
  if(name[0] == "-") {
    modules[name].library=true;
    filename="assets/scripts/"+name.substr(1)+".js";
  } else {
    filename="assets/scripts/"+name+".js";
  }
  var el=document.createElement("script");
  el.src=filename;
  document.head.appendChild(el);
  el.onload=function() {
    modules[name].script=true;
    //    if(modules[name].library)
    //      log("Loaded library "+name.substr(1));
    //    else
    //      log("Loaded module "+name);
    for(var i in modules) {
      var m=modules[i];
      if(!m.script)
        return;
    }
    call_module("*","init_pre");
    call_module("*","init");
    call_module("*","init_post");
    done();
  };
}

function load_modules() {
  // inserts each module's <script> into <head>
  for(var i in modules) {
    load_module(i);
  }
}

function call_module(name,func,args) {
  if(!args) args=[];
  if(name == "*") {
    for(var i=0;i<MODULES.length;i++)
      call_module(MODULES[i],func,args);
    return null;
  }
  if(name+"_"+func in window && name[0] != "-") {
    return window[name+"_"+func].apply(window,args);
  }
  return null;
}

$(document).ready(function() {
  modules={};
  for(var i=0;i<MODULES.length;i++) {
    modules[MODULES[i]]={
      library:false,
      script:false,
    };
  }
  prop_init();
  log("Version "+prop.version_string);
  load_modules();
});

function done() {
  var e=time()-prop.time.start;
  e=e.toPrecision(2);
  log("Finished loading "+MODULES.length+" module"+s(MODULES.length)+" in "+e+"s");
  $(window).resize(resize);
  resize();
  call_module("*","done");
  async_wait(function() {
    prop.loaded=true;
    call_module("*","ready");
    if(UPDATE)
      requestAnimationFrame(update);
  });
}

function resize() {
  call_module("*","resize");
}

function update() {
  if(!prop.complete) {
    call_module("*","complete");
    prop.complete=true;
  }
//  call_module("*","update_pre");
//  call_module("*","update");
//  call_module("*","update_post");

  game_update_pre();
  aircraft_update();

  canvas_update_post();

  if(UPDATE)
    requestAnimationFrame(update);
  prop.time.frames+=1;
  prop.time.frame.count+=1;
  var elapsed=time()-prop.time.frame.start;
  if(elapsed > prop.time.frame.delay) {
    prop.time.fps=prop.time.frame.count/elapsed;
    prop.time.frame.count=0;
    prop.time.frame.start=time();
  }
  prop.time.frame.delta=Math.min(time()-prop.time.frame.last,1/20);
  prop.time.frame.last=time();
}

function delta() {
  return prop.time.frame.delta;
}
