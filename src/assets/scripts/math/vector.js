/**
 * Computes length of 2D vector
 *
 * @function vlen
 */
export const vlen = (v) => {
    try {
        var len = Math.sqrt((v[0] * v[0]) + (v[1] * v[1]));
        return len;
    } catch(err) {
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
        var v = [],
        limit = Math.min(v1.length, v2.length);

        for (let i = 0; i < limit; i++) {
            v.push(v1[i] - v2[i]);
        }

        return v;
    } catch(err) {
        console.error(`call to vsub() failed. v1: ${v1} | v2:${v2} | Err: ${err}`);
    }
};
