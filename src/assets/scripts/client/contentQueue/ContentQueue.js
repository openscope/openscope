import $ from 'jquery';
import LoadableContentModel from './LoadableContentModel';

/**
 * Asynchronous JSON asset loading framework.
 *
 * Allows queueing assets to be loaded, assets may queued at a higher
 * priority by specifying the `immediate` option.  All assets with the
 * `immediate` option will be loaded before other assets.
 *
 * Events:
 *   startLoading - When an asset start being loaded, asset url as data
 *   stopLoading - When the last asset in the queue is downloaded
 *
 * Example:
 *  var promise = zlsa.atc.loadAsset({url: 'assets/aircraft/b747.json'});
 *
 * @module zlsa.atc.loadAsset
 */
/**
* Implementation of the queueing
*/
export default class ContentQueueClass {
    constructor(loadingView) {
        this.loadingView = loadingView;
        this.isLoading = false;
        this.lowPriorityQueue = [];
        this.highPriorityQueue = [];
        this.queuedContent = {};
    }

    /**
     * Adds or updates a piece of content
     *
     * Supports a url becoming an `immediate` load
     *
     * @for ContentQueue
     * @method add
     * @param options {object}
     * @return {Promise}
     */
    add(options) {
        let c = new LoadableContentModel(options);

        if (c.url in this.queuedContent) {
            c = this.queuedContent[c.url];

            if (c.immediate && (!this.queuedContent[c.url].immediate)) {
                const idx = $.inArray(c.url, this.lowPriorityQueue);

                if (idx > -1) {
                    this.highPriorityQueue.push(this.lowPriorityQueue.splice(idx, 1));
                }
            }
        } else {
            this.queuedContent[c.url] = c;

            if (c.immediate) {
                this.highPriorityQueue.push(c.url);
            } else {
                this.lowPriorityQueue.push(c.url);
            }
        }

        if (!this.isLoading) {
            this.startLoad();
        }

        return c.deferred.promise();
    }

    /**
     * @for ContentQueue
     * @method startLoad
     * @return {boolean}
     */
    startLoad() {
        if (this.highPriorityQueue.length) {
            this.load(this.highPriorityQueue.shift());

            return true;
        } else if (this.lowPriorityQueue.length) {
            this.load(this.lowPriorityQueue.shift());

            return true;
        }

        return false;
    }

    /**
     * @for contentQueue
     * @method load
     * @param url {string}
     * @return {Promise}
     */
    load(url) {
        const c = this.queuedContent[url];

        $.getJSON(c.url)
            .done((data, textStatus, jqXHR) => {
                c.deferred.resolve(data, textStatus, jqXHR);
            })
            .fail((jqXHR, textStatus, errorThrown) => {
                c.deferred.reject(jqXHR, textStatus, errorThrown);
            })
            .always(() => {
                delete this.queuedContent[c.url];
            });
    }
}
