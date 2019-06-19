import _forEach from 'lodash/forEach';
import _map from 'lodash/map';
import {
    sin,
    cos,
    abs,
    clamp
} from './core';
import { degreesToRadians } from '../utilities/unitConverters';

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
export const vnorm = (v, length) => {
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
};

/**
 * Create a 2D vector
 * Pass a heading (rad) and this will return the corresponding unit vector
 */
export const vectorize_2d = (direction) => {
    return [
        sin(direction),
        cos(direction)
    ];
};

/**
 * Adds Vectors (all dimensions)
 */
export const vadd = (v1, v2) => {
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
};

/**
 * Multiplies Vectors (all dimensions)
 */
// const vmul = (v1, v2) => {
//     // TODO: why try/catch?
//     try {
//         const v = [];
//         const limit = Math.min(v1.length, v2.length);
//
//         // TODO: this can be done with a _map()
//         for (let i = 0; i < limit; i++) {
//             v.push(v1[i] * v2[i]);
//         }
//
//         return v;
//     } catch (err) {
//         console.error(`call to vmul() failed. v1:${v1} | v2:${v2} | Err:${err}`);
//     }
// };

/**
 * Divides Vectors (all dimensions)
 */
// const vdiv = (v1, v2) => {
//     // TODO: why try/catch?
//     try {
//         const v = [];
//         const lim = Math.min(v1.length, v2.length);
//
//         // TODO: this can be done with a _map()
//         for (let i = 0; i < lim; i++) {
//             v.push(v1[i] / v2[i]);
//         }
//
//         return v;
//     } catch (err) {
//         console.error(`call to vdiv() failed. v1:${v1} | v2:${v2} | Err:${err}`);
//     }
// };

/**
 * Scales vectors in magnitude (all dimensions)
 */
export const vscale = (vectors, factor) => {
    return _map(vectors, (v) => v * factor);
};

/**
 * Vector dot product (all dimensions)
 */
// const vdp = (v1, v2) => {
//     let n = 0;
//     const lim = Math.min(v1.length, v2.length);
//
//     // TODO: mabye use _map() here?
//     for (let i = 0; i < lim; i++) {
//         n += v1[i] * v2[i];
//     }
//
//     return n;
// };

/**
 * Compute determinant of 2D/3D vectors
 * Remember: May return negative values (undesirable in some situations)
 */
const vdet = (v1, v2, /* optional */ v3) => {
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
};

/**
 * Vector cross product (3D/2D*)
 * Passing 3D vector returns 3D vector
 * Passing 2D vector (classically improper) returns z-axis SCALAR
 * *Note on 2D implementation: http://stackoverflow.com/a/243984/5774767
 */
const vcp = (v1, v2) => {
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
};

/**
 * Returns vector rotated by "radians" radians
 */
export const vturn = (radians, v) => {
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
};

/**
 * Determines if and where two rays will intersect. All angles in radians.
 * Variation based on http://stackoverflow.com/a/565282/5774767
 */
export const raysIntersect = (pos1, dir1, pos2, dir2, deg_allowance) => {
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
        const crossProduct = vcp(
            vsub(vnorm(q), vnorm(p)),
            r
        );

        if (crossProduct === 0) {
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
};

/**
 * 'Flips' vector's Y component in direction
 * Helper function for culebron's poly edge vector functions
 */
const vflipY = (v) => {
    return [-v[1], v[0]];
};

/**
 *
 *
 * solution by @culebron
 * turn poly edge into a vector.
 * the edge vector scaled by j and its normal vector scaled by i meet
 * if the edge vector points between the vertices,
 * then normal is the shortest distance.
 * --------
 * x1 + x2 * i == x3 + x4 * j
 * y1 + y2 * i == y3 + y4 * j
 * 0 < j < 1
 * --------
 *
 * i == (y3 + j y4 - y1) / y2
 * x1 + x2 y3 / y2 + j x2 y4 / y2 - x2 y1 / y2 == x3 + j x4
 * j x2 y4 / y2 - j x4 == x3 - x1 - x2 y3 / y2 + x2 y1 / y2
 * j = (x3 - x1 - x2 y3 / y2 + x2 y1 / y2) / (x2 y4 / y2 - x4)
 * i = (y3 + j y4 - y1) / y2
 *
 * i == (x3 + j x4 - x1) / x2
 * y1 + y2 x3 / x2 + j y2 x4 / x2 - y2 x1 / x2 == y3 + j y4
 * j y2 x4 / x2 - j y4 == y3 - y1 - y2 x3 / x2 + y2 x1 / x2
 * j = (y3 - y1 - y2 x3 / x2 + y2 x1 / x2) / (y2 x4 / x2 - y4)
 * i = (x3 + j x4 - x1) / x2
 *
 * @fnuction distance_to_poly
 * @param point {array}
 * @param poly {array}
 * @return number
 */
export const distance_to_poly = (point, poly) => {
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
        let k;
        let j;

        if (y2 !== 0) {
            j = (x3 - x1 - x2 * y3 / y2 + x2 * y1 / y2) / (x2 * y4 / y2 - x4);
            k = (y3 + j * y4 - y1) / y2;
        } else if (x2 !== 0) { // normal can't be zero unless the edge has 0 length
            j = (y3 - y1 - y2 * x3 / x2 + y2 * x1 / x2) / (y2 * x4 / x2 - y4);
            k = (x3 + j * x4 - x1) / x2;
        }

        if (j < 0 || j > 1 || !j) {
            return Math.min(
                vlen(vsub(point, vertex1)),
                vlen(vsub(point, vertex2))
            );
        }

        return vlen(vscale(norm, k));
    });

    return Math.min(...dists);
};

// source: https://github.com/substack/point-in-polygon/
export const point_in_poly = (point, vs) => {
    // ray-casting algorithm based on
    // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
    const x = point[0];
    const y = point[1];
    let j = vs.length - 1;
    let inside = false;

    // poly might not be the correct term here
    _forEach(vs, (poly, i) => {
        const xi = poly[0];
        const yi = poly[1];
        const xj = vs[j][0];
        const yj = vs[j][1];
        const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

        if (intersect) {
            inside = !inside;
        }

        j = i;
    });

    return inside;
};

/**
 *
 * @function point_to_mpoly
 * @param point {array}
 * @param mpoly {array}
 * @return {object}
 */
export const point_to_mpoly = (point, mpoly) => {
    // returns: boolean inside/outside & distance to the polygon
    let inside = false;

    _forEach(mpoly, (ring, k) => {
        // ring = mpoly[k];

        if (point_in_poly(point, ring)) {
            if (k === 0) {
                // if inside outer ring, remember that and wait till the end
                inside = true;
            }

            // if by change in one of inner rings, it's out of poly, return distance to the inner ring
            return {
                inside: false,
                distance: distance_to_poly(point, ring)
            };
        }
    });

    // if not matched to inner circles, return the match to outer and distance to it
    return {
        inside: inside,
        distance: distance_to_poly(point, mpoly[0])
    };
};

/**
 * Converts an 'area' to a 'poly'
 *
 * @param area {array<array>}  The #perimeter property of an `AirspaceModel`
 */
export const area_to_poly = (area) => {
    return _map(area.poly, (v) => v.relativePosition);
};

/**
 * Checks to see if a point is in an area
 */
export const point_in_area = (point, area) => {
    return point_in_poly(point, area_to_poly(area));
};


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
export const positive_intersection_with_rect = (pos, dir, rectPos, rectSize) => {
    const left = rectPos[0];
    const right = rectPos[0] + rectSize[0];
    const top = rectPos[1];
    const bottom = rectPos[1] + rectSize[1];
    let t;
    let x;
    let y;

    dir = vnorm(dir);

    // Check if pos is outside of rectangle.
    if (clamp(left, pos[0], right) !== pos[0] || clamp(top, pos[1], bottom) !== pos[1]) {
        return undefined;
    }

    // Check intersection with top segment.
    if (dir[1] < 0) {
        t = (top - pos[1]) / dir[1];
        x = pos[0] + dir[0] * t;

        if (clamp(left, x, right) === x) {
            return [x, top];
        }
    }

    // Check intersection with bottom segment.
    if (dir[1] > 0) {
        t = (bottom - pos[1]) / dir[1];
        x = pos[0] + dir[0] * t;

        if (clamp(left, x, right) === x) {
            return [x, bottom];
        }
    }

    // Check intersection with left segment.
    if (dir[0] < 0) {
        t = (left - pos[0]) / dir[0];
        y = pos[1] + dir[1] * t;

        if (clamp(top, y, bottom) === y) {
            return [left, y];
        }
    }

    // Check intersection with right segment.
    if (dir[0] > 0) {
        t = (right - pos[0]) / dir[0];
        y = pos[1] + dir[1] * t;

        if (clamp(top, y, bottom) === y) {
            return [right, y];
        }
    }

    // Failed to compute intersection due to numerical precision.
    return undefined;
};
