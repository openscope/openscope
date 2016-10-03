/* eslint-disable camelcase, no-underscore-dangle, no-mixed-operators, func-names, object-shorthand, no-unused-vars, no-undef, no-param-reassign */
import $ from 'jquery';
import _clamp from 'lodash/clamp';
import _has from 'lodash/has';
import _map from 'lodash/map';
import { km, radiansToDegrees, degreesToRadians } from './utilities/unitConverters';
import { radio_names, radio_cardinalDir_names } from './utilities/radioUtilities';
import { abs, sin, cos, tab, round, mod } from './math/core';
import { distance2d } from './math/distance';
import { tau } from './math/circle';
import {
    vlen,
    vradial,
    vsub,
    vnorm,
    distance_to_poly,
    area_to_poly,
    point_in_area
} from './math/vector';

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
// TODO: this should be replaced with lodash _clone()
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

/*eslint-enable*/

// TODO: is this being used? and why are we cloning radio_names here?
const radio_runway_names = clone(radio_names);
radio_runway_names.l = 'left';
radio_runway_names.c = 'center';
radio_runway_names.r = 'right';

// TODO: rename distanceEuclid
// FIXME: unused
// function distEuclid(gps1, gps2) {
//     // FIXME: enumerate the magic number
//     const R = 6371; // nm
//     const lat1 = degreesToRadians(lat1);
//     const lat2 = degreesToRadians(lat2);
//     const dlat = degreesToRadians(lat2 - lat1);
//     const dlon = degreesToRadians(lon2 - lon1);
//     // TODO: this should probably be abstracted
//     const a = sin(dlat / 2) * sin(dlat / 2) + cos(lat1) * cos(lat2) * sin(dlon / 2) * sin(dlon / 2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     const d = R * c;
//
//     return d; // distance, in kilometers
// }

function choose(l) {
    return l[Math.floor(Math.random() * l.length)];
}

// TODO: rename
function choose_weight(l) {
    if (l.length === 0) {
        return;
    }

    // FIXME: this is not checking if l is an array. assuming `l[0]` is and array,
    // `typeof []` will always return 'object'
    // if this was ment to check if `l[0]` is an array, `Array.isArray(l[0])` is one way to do it.
    // or lodash _isArray(l[0]) would work too.
    if (typeof l[0] != typeof []) {
        return choose(l);
    }

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

// FIXME: unused
// function endsWith(str, suffix) {
//     return str.indexOf(suffix, str.length - suffix.length) !== -1;
// }
// window.endsWith = endsWith;

function getCardinalDirection(angle) {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];

    return directions[round(angle / tau() * 8)];
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
// window.distEuclid = distEuclid;
window.choose = choose;
window.choose_weight = choose_weight;
window.lpad = lpad;

window.getCardinalDirection = getCardinalDirection;

window.array_clean = array_clean;
window.array_sum = array_sum;
window.inAirspace = inAirspace;
window.dist_to_boundary = dist_to_boundary;
