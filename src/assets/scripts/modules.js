import { LOG } from './constants/logLevel';

// ////////////////////////////////////////////////////////////////////////////////////////

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
/**
 * Necessary for Internet Explorer 11 (IE11) to not die while using String.fromCodePoint()
 * This function is not natively available in IE11, as noted on this MSDN page:
 * https://msdn.microsoft.com/en-us/library/dn890630(v=vs.94).aspx
 *
 * Apparently, it is fine with pre-Win8.1 MS Edge 11, but never okay in IE.
 * Here, the function is added to the String prototype to make later code usable.
 *
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

window.delta = function delta() {
    return window.prop.time.frame.delta;
};
