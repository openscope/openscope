/**
 * @class RegexGroup
 */
export default class RegexGroup {
    /**
     * @constructor
     * @param regexStrs {Array<string>}
     * @param flags {string}
     */
    constructor(regexStrs, flags) {
        this.regexes = [];
        regexStrs.forEach((regexStr) => {
            this.regexes.push(new RegExp(regexStr, flags));
        });
    }

    /**
     * Test if satisfies any regex in the group
     *
     * @for RegexGroup
     * @method test
     * @param str {string}
     */
    test(str) {
        return this.regexes.some((regex) => regex.test(str));
    }
}
