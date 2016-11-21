import $ from 'jquery';
import _get from 'lodash/get';

/**
 * Simple container for a given piece of content
 *
 * @class LoadableContentModel
 */
export default class LoadableContentModel {
    constructor(options) {
        this.url = options.url;
        this.immediate = _get(options, 'immediate', false);
        this.type = 'json';
        this.deferred = $.Deferred();
    }
}
