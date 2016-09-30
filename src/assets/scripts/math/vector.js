import $ from 'jquery';
import _map from 'lodash/map';
import { sin, cos } from './core';


/**
 * Computes length of 2D vector
 *
 * @function vlen
 */
export const vlen = (v) => {
    try {
        return Math.sqrt((v[0] * v[0]) + (v[1] * v[1]));
    } catch (err) {
        console.error(`call to vlen() failed. v:${v} | Err:${err}`);
    }
};

/**
 * Compute angle of 2D vector, in radians
 *
 * @function vradial
 * @param v {}
 * @return {number}
 */
export const vradial = (v) => {
    return Math.atan2(v[0], v[1]);
};

/**
 * Subtracts Vectors (all dimensions)
 *
 * @fuction vsub
 * @param v1 {number}
 * @param v2 {number}
 * @return {number}
 */
export const vsub = (v1, v2) => {
    try {
        const v = [];
        const limit = Math.min(v1.length, v2.length);

        // TODO: this is easie rwith _map()
        for (let i = 0; i < limit; i++) {
            v.push(v1[i] - v2[i]);
        }

        return v;
    } catch (err) {
        console.error(`call to vsub() failed. v1: ${v1} | v2:${v2} | Err: ${err}`);
    }
};

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
        const v = [];
        const limit = Math.min(v1.length, v2.length);

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
        const v = [];
        const limit = Math.min(v1.length, v2.length);

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
        const v = [];
        const lim = Math.min(v1.length, v2.length);

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
        return [
            vdet([v1[1], v1[2]], [v2[1], v2[2]]),
            -vdet([v1[0], v1[2]], [v2[0], v2[2]]),
            vdet([v1[0], v1[1]], [v2[0], v2[1]])
        ];
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

    if (abs(vcp(r, s)) < abs(vcp([0, 1], vectorize_2d(degreesToRadians(deg_allowance))))) {
        // parallel (within allowance)
        if (vcp(vsub(vnorm(q), vnorm(p)), r) === 0) {
            // collinear
            return true;
        }

        // parallel, non-intersecting
        return false;
    } else if ((t_norm >= 0 && t_norm <= 1) && (u_norm >= 0 && u_norm <= 1)) {
        // rays intersect here
        return vadd(p, vscale(r, t));
    }

    // diverging, non-intersecting
    return false;
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
    const dists = _map(poly, (vertex1, i) => {
        const prev = (i === 0 ? poly.length : i) - 1;
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

        if (y2 !== 0) {
            j = (x3 - x1 - x2 * y3 / y2 + x2 * y1 / y2) / (x2 * y4 / y2 - x4);
            i = (y3 + j * y4 - y1) / y2;
        } else if (x2 !== 0) { // normal can't be zero unless the edge has 0 length
            j = (y3 - y1 - y2 * x3 / x2 + y2 * x1 / x2) / (y2 * x4 / x2 - y4);
            i = (x3 + j * x4 - x1) / x2;
        }

        if (j < 0 || j > 1 || j == null) {
            return Math.min(
                vlen(vsub(point, vertex1)),
                vlen(vsub(point, vertex2))
            );
        }

        return vlen(vscale(norm, i));
    });

    return Math.min.apply(null, dists);
}


function point_to_mpoly(point, mpoly) {
    // returns: boolean inside/outside & distance to the polygon
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
                };
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
        const xi = vs[i][0];
        const yi = vs[i][1];
        const xj = vs[j][0];
        const yj = vs[j][1];
        const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

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
    // TODO: this should be _map()
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

    if (alt[1] === 'Infinity') {
        return Infinity;
    }

    return parseFloat(alt[2]) / (alt[4] === 'm' ? 0.3048 : 1);
}

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
// window.area_to_poly = area_to_poly;
window.point_in_area = point_in_area;
window.endsWith = endsWith;
window.parseElevation = parseElevation;
