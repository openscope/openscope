/**
 * @property TIME_SECONDS_OFFSET
 * @type {number}
 * @final
 */
const TIME_SECONDS_OFFSET = 0.001;

// TODO: rename function
/**
 * @function time
 * @return {number} current time in seconds
 */
export const time = () => {
    return new Date().getTime() * TIME_SECONDS_OFFSET;
};
