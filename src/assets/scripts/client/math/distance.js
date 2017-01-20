/**
 * Calculate distance in a 2d plane between two points
 *
 * @function distance2d
 * @param a {array}
 * @param b {array}
 * return {number}
 */
export const distance2d = (a, b) => {
    const x = a[0] - b[0];
    const y = a[1] - b[1];

    return Math.sqrt((x * x) + (y * y));
};
