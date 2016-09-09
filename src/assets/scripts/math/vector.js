
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
}
