import { LOG } from './constants/logLevel';

/**
 *
 * The functions contained in this file should be migrated over to the `math/`
 * files as soon as possible.
 *
 * These functions are all attached to the `window` and are global to the
 * entire app. This is a problem because it polutes the global namespace,
 * and files that don't need it have access to it. These functions should be imported
 * only as needed.
 *
 * These functions should also have corresponding tests.
 *
 */

window.AudioContext = window.AudioContext || window.webkitAudioContext;

/*eslint-disable*/

// String repetition copied from http://stackoverflow.com/a/5450113
if (!String.prototype.hasOwnProperty('repeat')) {
    String.prototype.repeat = function(count) {
        if (count < 1) {
            return '';
        }

        let result = '';
        let pattern = this.valueOf();

        while (count > 1) {
            if (count & 1) result += pattern;
            count >>= 1, pattern += pattern;
        }

        return result + pattern;
    };
}

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

const log = (message, level = LOG.INFO) => {
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
window.log = log;
