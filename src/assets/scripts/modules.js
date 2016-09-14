import $ from 'jquery';
import Fiber from 'fiber';
import peg from 'pegjs';

import { time } from './utilities/timeHelpers';
import { LOG } from './constants/logLevel';

window.$ = $;
window.Fiber = Fiber;
window.peg = peg;
window.zlsa = {};
window.zlsa.atc = {};
const prop = {};

/*eslint-disable*/
// FIXME: shame! this is declared here but not set until $(document).ready();
let load;

const util = require('./util');
const animation = require('./animation');
const parser = require('./parser');
const speech = require('./speech');
const get = require('./get');
const tutorial = require('./tutorial');
const base = require('./base');
const game = require('./game/game');
const input = require('./input');
const airline = require('./airline/airline');
const aircraft = require('./aircraft/aircraft');
const airport = require('./airport/airport');
const canvas = require('./canvas');
const ui = require('./ui');

const Mediator = Fiber.extend((base) => ({
    init: (options) => {},

    trigger: (event, data) => {
        if (event === 'startLoading') {
            window.zlsa.atc.LoadUI.startLoad(data);
        } else if (event === 'stopLoading') {
            window.zlsa.atc.LoadUI.stopLoad();
        }
    }
}));

/*eslint-enable*/
window.zlsa.atc.mediator = new Mediator();

// ////////////////////////////////////////////////////////////////////////////////////////

// @deprectaed
// all modules, prefix with "-" to signify library; <name>_init etc. won't be called
const MODULES = [];

// saved as prop.version and prop.version_string
const VERSION = [2, 1, 8];

// are you using a main loop? (you must call update() afterward disable/reenable)
let UPDATE = true;

// the framerate is updated this often (seconds)
const FRAME_DELAY = 1;

// is this a release build?
const RELEASE = false;

// Usage of async() etc:

// async("image") // call async() once for every asyncLoaded() you'll call
// $.get(...,function() {asyncLoaded("image");}) // call asyncLoaded once for each
//                                                // image once it's loaded
// if asyncLoaded() is NOT called the same number of times as async() the page will
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

// ////////////////////////////////////////////////////////////////////////////////////////

/*eslint-disable*/
/** ******* Various fixes for browser issues *********/
/** Necessary for Internet Explorer 11 (IE11) to not die while using String.fromCodePoint()
 * This function is not natively available in IE11, as noted on this MSDN page:
 * https://msdn.microsoft.com/en-us/library/dn890630(v=vs.94).aspx
 * Apparently, it is fine with pre-Win8.1 MS Edge 11, but never okay in IE.
 * Here, the function is added to the String prototype to make later code usable.
 * Solution from: http://xahlee.info/js/js_unicode_code_point.html
*/
if (!String.fromCodePoint) {
    // ES6 Unicode Shims 0.1 , © 2012 Steven Levithan , MIT License
    String.fromCodePoint = function fromCodePoint() {
        const chars = [];
        let point;
        let offset;
        let units;

        for (let i = 0; i < arguments.length; i++) {
            point = arguments[i];
            offset = point - 0x10000;
            units = point > 0xFFFF ? [0xD800 + (offset >> 10), 0xDC00 + (offset & 0x3FF)] : [point];
            chars.push(String.fromCharCode.apply(null, units));
        }

        return chars.join('');
    };
}
/*eslint-enable*/
/** ***************** Module Setup *******************/
// PROP
window.propInit = function propInit() {
    window.prop = prop;
    prop.complete = false;
    prop.temp = 'nothing here';
    prop.version = VERSION;
    prop.version_string = `v${VERSION.join('.')}`;
    prop.time = {};
    prop.time.start = time();
    prop.time.frames = 0;
    prop.time.frame = {};
    prop.time.frame.start = time();
    prop.time.frame.delay = FRAME_DELAY;
    prop.time.frame.count = 0;
    prop.time.frame.last = time();
    prop.time.frame.delta = 0;
    prop.time.fps = 0;
    prop.log = LOG.DEBUG;
    prop.loaded = false;

    if (RELEASE) {
        prop.log = LOG.WARNING;
    }
};

// MISC
window.log = function log(message, level = LOG.INFO) {
    const logStrings = {
        0: 'DEBUG',
        1: 'INFO',
        2: 'WARN',
        3: 'ERROR',
        4: 'FATAL'
    };

    if (prop.log <= level) {
        const text = `[ ${logStrings[level]} ]`;

        if (level >= LOG.WARNING) {
            console.warn(text, message);
        } else {
            console.log(text, message);
        }
    }
};

// ASYNC (AJAX etc.)
// function async(name) {
//     if (name in asyncModules) {
//         asyncModules[name] += 1;
//     } else {
//         asyncModules[name] = 1;
//     }
// }

// function asyncLoaded(name) {
//     asyncModules[name] -= 1;
//     asyncCheck();
// }

// function asyncWait(callback) {
//     asyncDoneCallback = callback;
//     asyncCheck();
// }

// function asyncCheck() {
//     for (const i in asyncModules) {
//         if (asyncModules[i] !== 0) {
//             return;
//         }
//     }
//
//     if (asyncDoneCallback) {
//         asyncDoneCallback();
//     }
// }

// UTIL
// window.time = function time() {
//   return new Date().getTime() * 0.001;
// }

// function s(number, single, multiple) {
//     if (!single) {
//         single = '';
//     }
//
//     if (!multiple) {
//         multiple = 's';
//     }
//
//     return (single === 1)
//         ? single
//         : multiple;
// }

// MODULES
// function load_module(name) {
//   var filename;
//   if (name[0] == "-") {
//     modules[name].library = true;
//     filename = "assets/scripts/"+name.substr(1)+".js";
//   } else {
//     filename = "assets/scripts/"+name+".js";
//   }
//   var el = document.createElement("script");
//   el.src = filename;
//   document.head.appendChild(el);
//   el.onload = function() {
//     modules[name].script = true;
//     //    if(modules[name].library)
//     //      log("Loaded library "+name.substr(1));
//     //    else
//     //      log("Loaded module "+name);
//     for(var i in modules) {
//       var m = modules[i];
//       if (!m.script)
//         return;
//     }
//
//     callModule("*","init_pre");
//     callModule("*","init");
//     callModule("*","init_post");
//     done();
//   };
// }
//
// function load_modules() {
//   // inserts each module's <script> into <head>
//   for (var i in modules) {
//     load_module(i);
//   }
// }

/*eslint-disable*/
// FIXME: is this needed anymore?
function callModule(name, func, args) {
    // TODO: remove before merging back to `zsla/gh-pages`, for development only
    console.warn('-- callModule :: func:', func);

    if (!args) {
        args = [];
    }

    if (name === '*') {
        for (let i = 0; i < MODULES.length; i++) {
            callModule(MODULES[i], func, args);
        }

        return null;
    }

    if (name + '_' + func in window && name[0] != '-') {
        return window[name + '_' + func].apply(window, args);
    }

    return null;
}
/*eslint-enable*/

// TODO: enumerate the magic numbers
/**
 * @function calculateDeltaTime
 * @param  {number} lastFrame
 * @return {number}
 */
const calculateDeltaTime = (lastFrame) => Math.min(time() - prop.time.frame.last, 1 / 20);

$(document).ready(() => {
    window.modules = {};

    // TODO: remove. this function is no longer needed.
    for (let i = 0; i < MODULES.length; i++) {
        modules[MODULES[i]] = {
            library: false,
            script: false
        };
    }

    propInit();
    log(`Version ${prop.version_string}`);
    // load_modules();

    // TODO: temp to get browserify working. these calls should be moved to proper `class.init()` type methods
    // that are instantiated and live in `App.js`.
    tutorial_init_pre();
    game_init_pre();
    input_init_pre();
    airline_init_pre();
    aircraft_init_pre();
    airport_init_pre();
    canvas_init_pre();
    ui_init_pre();

    // FIXME: shame!
    load = require('./load');

    speech_init();
    tutorial_init();
    input_init();
    aircraft_init();
    airport_init();
    canvas_init();
    ui_init();

    done();
});

function resize() {
    callModule('*', 'resize');

    // TODO: temp fix to get browserify working
    canvas_resize();
}

function update() {
    if (!prop.complete) {
        callModule('*', 'complete');

        // TODO: temp fix to get browserify working
        game_complete();
        canvas_complete();
        ui_complete();

        window.zlsa.atc.LoadUI.complete();
        prop.complete = true;
    }

    if (UPDATE) {
        requestAnimationFrame(update);
    } else {
        return;
    }

    game_update_pre();
    aircraft_update();
    canvas_update_post();

    prop.time.frames += 1;
    prop.time.frame.count += 1;

    const elapsed = time() - prop.time.frame.start;

    if (elapsed > prop.time.frame.delay) {
        prop.time.fps = prop.time.frame.count / elapsed;
        prop.time.frame.count = 0;
        prop.time.frame.start = time();
    }

    prop.time.frame.delta = calculateDeltaTime(prop.time.frame.last);
    prop.time.frame.last = time();
}

function done() {
    $(window).resize(resize);
    resize();

    callModule('*', 'done');
    prop.loaded = true;
    callModule('*', 'ready');

    // TODO: temp fix to get browserify working
    airport_ready();

    if (UPDATE) {
        requestAnimationFrame(update);
    }
}

/**
 * Change whether updates should run
 */
window.updateRun = function updateRun(arg) {
    if (!UPDATE && arg) {
        requestAnimationFrame(update);
    }

    UPDATE = arg;
};

window.delta = function delta() {
    return prop.time.frame.delta;
};
