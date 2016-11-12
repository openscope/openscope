import $ from 'jquery';

/**
 * Simple container for a given piece of content
 *
 * @class LoadableContentModel
 */
export default class LoadableContentModel {
    constructor(options) {
        this.url = options.url;
        this.immediate = (options.immediate ? true : false);
        this.type = 'json';
        this.deferred = $.Deferred();
    }
}
