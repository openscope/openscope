/**
 * A no-op function used for command definitions that do not need a parser
 *
 * This function will immediately return any arguments passed to it and is
 * used in place of an actual parser. this way `command.parse` can still
 * be called even with commands that don't need to be parsed.
 *
 * @function noop
 * @param args {*}
 * @return {*}
 */
export const noop = (args) => args;
