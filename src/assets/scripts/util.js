/* eslint-disable camelcase, no-underscore-dangle, no-mixed-operators, func-names, object-shorthand, no-unused-vars, no-undef, no-param-reassign */
import $ from 'jquery';
import _clamp from 'lodash/clamp';
import _has from 'lodash/has';
import _map from 'lodash/map';
import { km, radiansToDegrees, degreesToRadians } from './utilities/unitConverters';
import { radio_names, radio_cardinalDir_names } from './utilities/radioUtilities';
import { abs, sin, cos, tab, round } from './math/core';
import { distance2d } from './math/distance';
import { tau } from './math/circle';
import { vlen, vradial, vsub } from './math/vector';

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
function clone(obj) {
    if (null == obj || 'object' != typeof obj) {
        return obj;
    }

    let copy = obj.constructor();
    for (var attr in obj) {
        if (_has(obj, attr)) {
            copy[attr] = obj[attr];
        }
    }

    return copy;
};

// String repetition copied from http://stackoverflow.com/a/5450113
if (!String.prototype.hasOwnProperty("repeat")) {
  String.prototype.repeat = function(count) {
    if (count < 1) return '';
    var result = '', pattern = this.valueOf();
    while (count > 1) {
        if (count & 1) result += pattern;
        count >>= 1, pattern += pattern;
    }
    return result + pattern;
  };
}
/*eslint-enable*/
const CONSTANTS = {
    // radius of Earth, nm
    EARTH_RADIUS_NM: 3440
};

// TODO: is this being used?
const radio_runway_names = clone(radio_names);
radio_runway_names.l = 'left';
radio_runway_names.c = 'center';
radio_runway_names.r = 'right';

// ************************ GENERAL FUNCTIONS ************************
function trange(il, i, ih, ol, oh) {
    return ol + (oh - ol) * (i - il) / (ih - il);
    // i=(i/(ih-il))-il;       // purpose unknown
    // return (i*(oh-ol))+ol;  // purpose unknown
}

function crange(il, i, ih, ol, oh) {
    return _clamp(ol, trange(il, i, ih, ol, oh), oh);
}

function srange(il, i, ih) {
  //    return cos(();
}

// TODO: rename distanceEuclid
// FIXME: unused
function distEuclid(gps1, gps2) {
    // FIXME: enumerate the magic number
    const R = 6371; // nm
    const lat1 = degreesToRadians(lat1);
    const lat2 = degreesToRadians(lat2);
    const dlat = degreesToRadians(lat2 - lat1);
    const dlon = degreesToRadians(lon2 - lon1);
    // TODO: this should probably be abstracted
    const a = sin(dlat / 2) * sin(dlat / 2) + cos(lat1) * cos(lat2) * sin(dlon / 2) * sin(dlon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;

    return d; // distance, in kilometers
}

function choose(l) {
    return l[Math.floor(Math.random() * l.length)];
}

// TODO: rename
function choose_weight(l) {
    if (l.length === 0) {
        return;
    }

    // FIXME: this is not checking if l is an array. assuming `l[0]` is and array,
    // `typeof l[0]` will return 'object'
    // `typeof []` will always return 'object'
    // if this was ment to check if `l[0]` is an array, `Array.isArray(l[0])` is one way to do it.
    // or lodash _isArray(l[0]) would work too.
    if (typeof l[0] != typeof []) return choose(l);

    // l = [[item, weight], [item, weight] ... ];
    let weight = 0;
    for (let i = 0; i < l.length; i++) {
        weight += l[i][1];
    }

    const randomWeight = Math.random() * weight;
    weight = 0;

    for (let i = 0; i < l.length; i++) {
        weight += l[i][1];

        if (weight > randomWeight) {
            return l[i][0];
        }
    }

    console.log('OHSHIT');
    return null;
}

function mod(a, b) {
    return ((a % b) + b) % b;
}

// TODO: rename leftPad
/**
 * Prepends zeros to front of str/num to make it the desired width
 */
function lpad(n, width) {
    if (n.toString().length >= width) {
        return n.toString();
    }

    const x = `0000000000000${n}`;

    return x.substr(x.length - width, width);
}

// /**
//  * Returns the bearing from `startPosition` to `endPosition`
//  *
//  * @param startPosition {array}     positional array, start point
//  * @param endPosition {array}       positional array, end point
//  */
// function bearing(startPosition, endPosition) {
//     return vradial(vsub(endPosition, start));
// }

// /**
//  * Returns an offset array showing how far [fwd/bwd, left/right] 'aircraft' is of 'target'
//  *
//  * @param {Aircraft} aircraft - the aircraft in question
//  * @param {array} target - positional array of the targeted position [x,y]
//  * @param {number} headingThruTarget - (optional) The heading the aircraft should
//  *                                     be established on when passing the target.
//  *                                     Default value is the aircraft's heading.
//  * @returns {array} with two elements: retval[0] is the lateral offset, in km
//  *                                     retval[1] is the longitudinal offset, in km
//  *                                     retval[2] is the hypotenuse (straight-line distance), in km
//  */
// function getOffset(aircraft, target, headingThruTarget = null) {
//     if (!headingThruTarget) {
//         headingThruTarget = aircraft.heading;
//     }
//
//     const offset = [0, 0, 0];
//     const vector = vsub(target, aircraft.position); // vector from aircraft pointing to target
//     const bearingToTarget = vradial(vector);
//
//     offset[2] = vlen(vector);
//     offset[0] = offset[2] * sin(headingThruTarget - bearingToTarget);
//     offset[1] = offset[2] * cos(headingThruTarget - bearingToTarget);
//
//     return offset;
// }

function heading_to_string(heading) {
    heading = round(mod(radiansToDegrees(heading), 360)).toString();

    if (heading === '0') {
        heading = '360';
    }

    if (heading.length === 1) {
        heading = `00${heading}`;
    }

    if (heading.length === 2) {
        heading = `0${heading}`;
    }

    return heading;
}

function getCardinalDirection(angle) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];

    return directions[round(angle / tau() * 8)];
}

function to_canvas_pos(pos) {
    return [
        prop.canvas.size.width / 2 + prop.canvas.panX + km(pos[0]),
        prop.canvas.size.height / 2 + prop.canvas.panY - km(pos[1])
    ];
}

// TODO: this might be best accomplished with a Rectangle class, with this function working as the middleman
// creating the class and asking if there is an intersection.
/**
 * Compute a point of intersection of a ray with a rectangle.
 *
 * Args:
 *   pos: array of 2 numbers, representing ray source.
 *   dir: array of 2 numbers, representing ray direction.
 *   rectPos: array of 2 numbers, representing rectangle corner position.
 *   rectSize: array of 2 positive numbers, representing size of the rectangle.
 *
 * Returns:
 * - undefined, if pos is outside of the rectangle.
 * - undefined, in case of a numerical error.
 * - array of 2 numbers on a rectangle boundary, in case of an intersection.
 */
function positive_intersection_with_rect(pos, dir, rectPos, rectSize) {
    const left = rectPos[0];
    const right = rectPos[0] + rectSize[0];
    const top = rectPos[1];
    const bottom = rectPos[1] + rectSize[1];
    let t;
    let x;
    let y;

    dir = vnorm(dir);

    // Check if pos is outside of rectangle.
    if (_clamp(left, pos[0], right) !== pos[0] || _clamp(top, pos[1], bottom) !== pos[1]) {
        return undefined;
    }

    // Check intersection with top segment.
    if (dir[1] < 0) {
        t = (top - pos[1]) / dir[1];
        x = pos[0] + dir[0] * t;

        if (_clamp(left, x, right) === x) {
            return [x, top];
        }
    }

    // Check intersection with bottom segment.
    if (dir[1] > 0) {
        t = (bottom - pos[1]) / dir[1];
        x = pos[0] + dir[0] * t;

        if (_clamp(left, x, right) === x) {
            return [x, bottom];
        }
    }

    // Check intersection with left segment.
    if (dir[0] < 0) {
        t = (left - pos[0]) / dir[0];
        y = pos[1] + dir[1] * t;

        if (_clamp(top, y, bottom) === y) {
            return [left, y];
        }
    }

    // Check intersection with right segment.
    if (dir[0] > 0) {
        t = (right - pos[0]) / dir[0];
        y = pos[1] + dir[1] * t;

        if (_clamp(top, y, bottom) === y) {
            return [right, y];
        }
    }

    // Failed to compute intersection due to numerical precision.
    return undefined;
}

/**
 * Get new position by fix-radial-distance method
 *
 * @param {array} fix       positional array of start point, in decimal-degrees [lat,lon]
 * @param {number} radial   heading to project along, in radians
 * @param {number} dist     distance to project, in nm
 * @returns {array}         location of the projected fix
 */
function fixRadialDist(fix, radial, dist) {
    // convert GPS coordinates to radians
    fix = [
        degreesToRadians(fix[0]),
        degreesToRadians(fix[1])
    ];

    const R = CONSTANTS.EARTH_RADIUS_NM;
    // TODO: abstract these two calculations to functions
    const lat2 = Math.asin(sin(fix[1]) * cos(dist / R) + cos(fix[1]) * sin(dist / R) * cos(radial));
    const lon2 = fix[0] + Math.atan2(
        sin(radial) * sin(dist / R) * cos(fix[1]),
        cos(dist / R) - sin(fix[1]) * sin(lat2)
    );

    return [
        radiansToDegrees(lon2),
        radiansToDegrees(lat2)
    ];
}

// TODO: lodash _compact()
/**
 * Splices all empty elements out of an array
 */
function array_clean(array, deleteValue) {
    for (let i = 0; i < array.length; i++) {
        if (array[i] === deleteValue) {
            array.splice(i, 1);
            i--;
        }
    }

    return array;
}

// TODO: this can be done with .reduce()
/**
 * Returns the sum of all numerical values in the array
 */
function array_sum(array) {
    let total = 0;

    for (let i = 0; i < array.length; i++) {
        total += parseFloat(array[i]);
    }

    return total;
}

// TODO: this logic should live in the `AirportController`
function inAirspace(pos) {
    const apt = window.airportController.airport_get();
    const perim = apt.perimeter;

    if (perim) {
        return point_in_area(pos, perim);
    }

    return distance2d(pos, apt.position.position) <= apt.ctr_radius;
}

// TODO: this logic should live in the `AirportController`
function dist_to_boundary(pos) {
    const apt = window.airportController.airport_get();
    const perim = apt.perimeter;

    if (perim) {
        // km
        return distance_to_poly(pos, area_to_poly(perim));
    }

    return abs(distance2d(pos, apt.position.position) - apt.ctr_radius);
}

window.clone = clone;
window.trange = trange;
window.crange = crange;
window.srange = srange;
window.distEuclid = distEuclid;
window.choose = choose;
window.choose_weight = choose_weight;
window.mod = mod;
window.lpad = lpad;

window.heading_to_string = heading_to_string;
window.getCardinalDirection = getCardinalDirection;

window.to_canvas_pos = to_canvas_pos;
window.positive_intersection_with_rect = positive_intersection_with_rect;

window.fixRadialDist = fixRadialDist;

window.array_clean = array_clean;
window.array_sum = array_sum;
window.inAirspace = inAirspace;
window.dist_to_boundary = dist_to_boundary;
