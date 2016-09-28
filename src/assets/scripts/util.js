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

/**
 * Constrains an angle to within 0 --> Math.PI*2
 */
function fix_angle(radians) {
    while (radians > tau()) {
        radians -= tau();
    }

    while (radians < 0) {
        radians += tau();
    }

    return radians;
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

    const random = Math.random() * weight;
    weight = 0;

    for (let i = 0; i < l.length; i++) {
        weight += l[i][1];

        if (weight > random) {
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

/**
 * Returns the angle difference between two headings
 *
 * @param {number} a - heading, in radians
 * @param {number} b - heading, in radians
 */
function angle_offset(a, b) {
    a = radiansToDegrees(a);
    b = radiansToDegrees(b);
    let invert = false;

    if (b > a) {
        invert = true;
        const temp = a;

        a = b;
        b = temp;
    }

    let offset = mod(a - b, 360);
    if (offset > 180) {
        offset -= 360;
    }

    if (invert) {
        offset *= -1;
    }

    offset = degreesToRadians(offset);

    return offset;
}

/**
 * Returns the bearing from position 'a' to position 'b'
 *
 * @param {array} a - positional array, start point
 * @param {array} a - positional array, end point
 */
function bearing(a, b) {
    return vradial(vsub(b, a));
}

/**
 * Returns an offset array showing how far [fwd/bwd, left/right] 'aircraft' is of 'target'
 *
 * @param {Aircraft} aircraft - the aircraft in question
 * @param {array} target - positional array of the targeted position [x,y]
 * @param {number} headingThruTarget - (optional) The heading the aircraft should
 *                                     be established on when passing the target.
 *                                     Default value is the aircraft's heading.
 * @returns {array} with two elements: retval[0] is the lateral offset, in km
 *                                     retval[1] is the longitudinal offset, in km
 *                                     retval[2] is the hypotenuse (straight-line distance), in km
 */
function getOffset(aircraft, target, headingThruTarget = null) {
    if (!headingThruTarget) {
        headingThruTarget = aircraft.heading;
    }

    const offset = [0, 0, 0];
    const vector = vsub(target, aircraft.position); // vector from aircraft pointing to target
    const bearingToTarget = vradial(vector);

    offset[2] = vlen(vector);
    offset[0] = offset[2] * sin(headingThruTarget - bearingToTarget);
    offset[1] = offset[2] * cos(headingThruTarget - bearingToTarget);

    return offset;
}

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

// TODO: replace with lodash _random()
/**
 * Return a random number within the given interval
 *  With one argument return a number between 0 and argument
 *  With no arguments return a number between 0 and 1
 */
function random(low, high) {
    if (low === high) {
        return low;
    }

    if (low == null) {
        return Math.random();
    }

    if (high == null) {
        return Math.random() * low;
    }

    return low + (Math.random() * (high - low));
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

// ************************ VECTOR FUNCTIONS ************************
// For more info, see http://threejs.org/docs/#Reference/Math/Vector3
// Remember: [x,y] convention is used, and doesn't match [lat,lon]

/**
 * Normalize a 2D vector
 * eg scaling elements such that net length is 1
 * Turns vector 'v' into a 'unit vector'
 */
function vnorm(v, length) {
    const x = v[0];
    const y = v[1];
    const angle = Math.atan2(x, y);

    if (!length) {
        length = 1;
    }

    return [
        sin(angle) * length,
        cos(angle) * length
    ];
}

/**
 * Create a 2D vector
 * Pass a heading (rad) and this will return the corresponding unit vector
 */
function vectorize_2d(direction) {
    return [
        sin(direction),
        cos(direction)
    ];
}

/**
 * Adds Vectors (all dimensions)
 */
function vadd(v1, v2) {
    // TODO: why try/catch?
    try {
        let v = [];
        let limit = Math.min(v1.length, v2.length);

        // TODO: this can be done with a _map()
        for (let i = 0; i < limit; i++) {
            v.push(v1[i] + v2[i]);
        }

        return v;
    } catch (err) {
        console.error(`call to vadd() failed. v1:${v1} | v2:${v2} | Err:${err}`);
    }
}

/**
 * Multiplies Vectors (all dimensions)
 */
function vmul(v1, v2) {
    // TODO: why try/catch?
    try {
        let v = [];
        let limit = Math.min(v1.length, v2.length);

        // TODO: this can be done with a _map()
        for (let i = 0; i < limit; i++) {
            v.push(v1[i] * v2[i]);
        }

        return v;
    } catch (err) {
        console.error(`call to vmul() failed. v1:${v1} | v2:${v2} | Err:${err}`);
    }
}

/**
 * Divides Vectors (all dimensions)
 */
function vdiv(v1, v2) {
    // TODO: why try/catch?
    try {
        let v = [];
        let lim = Math.min(v1.length, v2.length);

        // TODO: this can be done with a _map()
        for (let i = 0; i < lim; i++) {
            v.push(v1[i] / v2[i]);
        }

        return v;
    } catch (err) {
        console.error(`call to vdiv() failed. v1:${v1} | v2:${v2} | Err:${err}`);
    }
}

/**
 * Scales vectors in magnitude (all dimensions)
 */
function vscale(vectors, factor) {
    return _map(vectors, (v) => v * factor);
}

/**
 * Vector dot product (all dimensions)
 */
function vdp(v1, v2) {
    let n = 0;
    const lim = Math.min(v1.length, v2.length);

    // TODO: mabye use _map() here?
    for (let i = 0; i < lim; i++) {
        n += v1[i] * v2[i];
    }

    return n;
}

/**
 * Vector cross product (3D/2D*)
 * Passing 3D vector returns 3D vector
 * Passing 2D vector (classically improper) returns z-axis SCALAR
 * *Note on 2D implementation: http://stackoverflow.com/a/243984/5774767
 */
function vcp(v1, v2) {
    if (Math.min(v1.length, v2.length) === 2) {
        // for 2D vector (returns z-axis scalar)
        return vcp([v1[0], v1[1], 0], [v2[0], v2[1], 0])[2];
    }

    if (Math.min(v1.length, v2.length) === 3) {
        // for 3D vector (returns 3D vector)
        return [vdet([v1[1], v1[2]], [v2[1], v2[2]]),
             -vdet([v1[0], v1[2]], [v2[0], v2[2]]),
              vdet([v1[0], v1[1]], [v2[0], v2[1]])];
    }
}

/**
 * Compute determinant of 2D/3D vectors
 * Remember: May return negative values (undesirable in some situations)
 */
function vdet(v1, v2, /* optional */ v3) {
    if (Math.min(v1.length, v2.length) === 2) {
        // 2x2 determinant
        return (v1[0] * v2[1]) - (v1[1] * v2[0]);
    } else if (Math.min(v1.length, v2.length, v3.length) === 3 && v3) {
        // 3x3 determinant
        return (
            v1[0] *
            vdet([v2[1], v2[2]], [v3[1], v3[2]]) - v1[1] *
            vdet([v2[0], v2[2]], [v3[0], v3[2]]) + v1[2] *
            vdet([v2[0], v2[1]], [v3[0], v3[1]])
        );
    }
}

/**
 * Returns vector rotated by "radians" radians
 */
function vturn(radians, v) {
    if (!v) {
        v = [0, 1];
    }

    const x = v[0];
    const y = v[1];
    const cs = cos(-radians);
    const sn = sin(-radians);

    return [
        x * cs - y * sn,
        x * sn + y * cs
    ];
}

/**
 * Determines if and where two runways will intersect.
 * Note: Please pass ONLY the runway identifier (eg '28r')
 */
function runwaysIntersect(rwy1_name, rwy2_name) {
    const airport = window.airportController.airport_get();

    return raysIntersect(
        airport.getRunway(rwy1_name).position,
        airport.getRunway(rwy1_name).angle,
        airport.getRunway(rwy2_name).position,
        airport.getRunway(rwy2_name).angle,
        9.9 // consider "parallel" if rwy hdgs differ by maximum of 9.9 degrees
    );
}

/**
 * Determines if and where two rays will intersect. All angles in radians.
 * Variation based on http://stackoverflow.com/a/565282/5774767
 */
function raysIntersect(pos1, dir1, pos2, dir2, deg_allowance) {
    if (!deg_allowance) {
        // degrees divergence still considered 'parallel'
        deg_allowance = 0;
    }

    const p = pos1;
    const q = pos2;
    const r = vectorize_2d(dir1);
    const s = vectorize_2d(dir2);
    const t = abs(vcp(vsub(q, p), s) / vcp(r, s));
    const t_norm = abs(vcp(vsub(vnorm(q), vnorm(p)), s) / vcp(r, s));
    const u_norm = abs(vcp(vsub(vnorm(q), vnorm(p)), r) / vcp(r, s));

    if (abs(vcp(r, s)) < abs(vcp([0, 1], vectorize_2d(degreesToRadians(deg_allowance))))) { // parallel (within allowance)
        if (vcp(vsub(vnorm(q), vnorm(p)), r) === 0) {
            // collinear
            return true;
        } else {
            // parallel, non-intersecting
            return false;
        }
    } else if ((0 <= t_norm && t_norm <= 1) && (0 <= u_norm && u_norm <= 1)) {
        // rays intersect here
        return vadd(p, vscale(r, t));
    }

    // diverging, non-intersecting
    return false;
}

/**
 * 'Flips' vector's Y component in direction
 * Helper function for culebron's poly edge vector functions
 */
function vflipY(v) {
    return [-v[1], v[0]];
}

/*
solution by @culebron
turn poly edge into a vector.
the edge vector scaled by j and its normal vector scaled by i meet
if the edge vector points between the vertices,
then normal is the shortest distance.
--------
x1 + x2 * i == x3 + x4 * j
y1 + y2 * i == y3 + y4 * j
0 < j < 1
--------

i == (y3 + j y4 - y1) / y2
x1 + x2 y3 / y2 + j x2 y4 / y2 - x2 y1 / y2 == x3 + j x4
j x2 y4 / y2 - j x4 == x3 - x1 - x2 y3 / y2 + x2 y1 / y2
j = (x3 - x1 - x2 y3 / y2 + x2 y1 / y2) / (x2 y4 / y2 - x4)
i = (y3 + j y4 - y1) / y2

i == (x3 + j x4 - x1) / x2
y1 + y2 x3 / x2 + j y2 x4 / x2 - y2 x1 / x2 == y3 + j y4
j y2 x4 / x2 - j y4 == y3 - y1 - y2 x3 / x2 + y2 x1 / x2
j = (y3 - y1 - y2 x3 / x2 + y2 x1 / x2) / (y2 x4 / x2 - y4)
i = (x3 + j x4 - x1) / x2
*/
function distance_to_poly(point, poly) {
    const dists = $.map(poly, (vertex1, i) => {
        const prev = (i == 0 ? poly.length : i) - 1;
        const vertex2 = poly[prev];
        const edge = vsub(vertex2, vertex1);

        if (vlen(edge) === 0) {
            return vlen(vsub(point, vertex1));
        }

        // point + normal * i == vertex1 + edge * j
        const norm = vflipY(edge);
        const x1 = point[0];
        const x2 = norm[0];
        const x3 = vertex1[0];
        const x4 = edge[0];
        const y1 = point[1];
        const y2 = norm[1];
        const y3 = vertex1[1];
        const y4 = edge[1];
        var i, j;

        if (y2 != 0) {
            j = (x3 - x1 - x2 * y3 / y2 + x2 * y1 / y2) / (x2 * y4 / y2 - x4);
            i = (y3 + j * y4 - y1) / y2;
        } else if (x2 !== 0) { // normal can't be zero unless the edge has 0 length
          j = (y3 - y1 - y2 * x3 / x2 + y2 * x1 / x2) / (y2 * x4 / x2 - y4);
          i = (x3 + j * x4 - x1) / x2;
        }

        if (j < 0 || j > 1 || j == null)
            return Math.min(
                vlen(vsub(point, vertex1)),
                vlen(vsub(point, vertex2))
            );

            return vlen(vscale(norm, i));
    });

    return Math.min.apply(null, dists);
}


function point_to_mpoly(point, mpoly) {
  // returns: boolean inside/outside & distance to the polygon
    let k;
    let ring;
    let inside = false;

    for (const k in mpoly) {
        ring = mpoly[k];

        if (point_in_poly(point, ring)) {
            if (k === 0) {
                // if inside outer ring, remember that and wait till the end
                inside = true;
            } else {
                // if by change in one of inner rings, it's out of poly, return distance to the inner ring
                return {
                    inside: false,
                    distance: distance_to_poly(point, ring)
                }
            }
        }
    }

    // if not matched to inner circles, return the match to outer and distance to it
    return {
        inside: inside,
        distance: distance_to_poly(point, mpoly[0])
    };
}

// source: https://github.com/substack/point-in-polygon/
function point_in_poly(point, vs) {
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
    const x = point[0];
    const y = point[1];
    let i;
    let j = vs.length - 1;
    let inside = false;

    for (i in vs) {
        const xi = vs[i][0], yi = vs[i][1];
        const xj = vs[j][0], yj = vs[j][1];
        const intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

        if (intersect) {
            inside = !inside;
        }

        j = i;
    }

    return inside;
}

/**
 * Converts an 'area' to a 'poly'
 */
function area_to_poly(area) {
    return $.map(area.poly, (v) => [v.position]);
}

/**
 * Checks to see if a point is in an area
 */
function point_in_area(point, area) {
    return point_in_poly(point, area_to_poly(area));
}

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function parseElevation(ele) {
    const alt = /^(Infinity|(\d+(\.\d+)?)(m|ft))$/.exec(ele);

    if (alt == null) {
        log(`Unable to parse elevation ${ele}`);
        return;
    }

    if (alt[1] == 'Infinity') {
        return Infinity;
    }

    return parseFloat(alt[2]) / (alt[4] == 'm' ? 0.3048 : 1);
}

window.clone = clone;
window.trange = trange;
window.crange = crange;
window.srange = srange;
window.distEuclid = distEuclid;
window.fix_angle = fix_angle;
window.choose = choose;
window.choose_weight = choose_weight;
window.mod = mod;
window.lpad = lpad;

window.angle_offset = angle_offset;
window.bearing = bearing;
window.getOffset = getOffset;
window.heading_to_string = heading_to_string;

// window.radio_spellOut = radio_spellOut;
// window.radio_altitude = radio_altitude;
// window.radio_trend = radio_trend;

window.getCardinalDirection = getCardinalDirection;
window.to_canvas_pos = to_canvas_pos;
window.positive_intersection_with_rect = positive_intersection_with_rect;
window.random = random;
window.fixRadialDist = fixRadialDist;
window.array_clean = array_clean;
window.array_sum = array_sum;
window.inAirspace = inAirspace;
window.dist_to_boundary = dist_to_boundary;

window.vnorm = vnorm;
window.vectorize_2d = vectorize_2d;
window.vadd = vadd;
window.vsub = vsub;
window.vmul = vmul;
window.vdiv = vdiv;
window.vscale = vscale;
window.vdp = vdp;
window.vcp = vcp;
window.vdet = vdet;
window.vturn = vturn;
window.runwaysIntersect = runwaysIntersect;
window.raysIntersect = raysIntersect;
window.vflipY = vflipY;
window.distance_to_poly = distance_to_poly;
window.point_to_mpoly = point_to_mpoly;
window.point_in_poly = point_in_poly;
window.area_to_poly = area_to_poly;
window.point_in_area = point_in_area;
window.endsWith = endsWith;
window.parseElevation = parseElevation;
