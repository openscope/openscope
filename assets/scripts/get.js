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
(function ($, zlsa, Fiber, mediator) {
  "use strict";

  /**
   * Simple container for a given piece of content
   */
  var Content = Fiber.extend(function (base) {
    return {
      init: function(options) {
        this.url = options.url;
        this.immediate = (options.immediate ? true : false);
        this.type = 'json';
        this.deferred = $.Deferred();
      },
    };
  });

  /**
   * Implementation of the queueing
   */
  var ContentQueueClass = Fiber.extend(function (base) {
    return {
      init: function(options) {
        this.loading = false;
        this.lowPriorityQueue = [];
        this.highPriorityQueue = [];
        this.queuedContent = {};
      },

      /**
       * Adds or updates a piece of content
       *
       * Supports a url becoming an `immediate` load
       */
      add: function(options) {
        var c = new Content(options);
        if (c.url in this.queuedContent) {
          c = this.queuedContent[c.url];
          if (c.immediate && (!this.queuedContent[c.url].immediate)) {
            var idx = $.inArray(c.url, this.lowPriorityQueue);
            if (idx > -1) {
              this.highPriorityQueue.push(
                this.lowPriorityQueue.splice(idx, 1)
              );
            }
          }
        }
        else {
          this.queuedContent[c.url] = c;
          if (c.immediate) {
            this.highPriorityQueue.push(c.url);
          }
          else {
            this.lowPriorityQueue.push(c.url);
          }
        }
        if (!this.loading) {
          this.startLoad();
        }

        return c.deferred.promise();
      },

      startLoad: function() {
        if (this.highPriorityQueue.length) {
          this.load(this.highPriorityQueue.shift());
          return true;
        }
        else if (this.lowPriorityQueue.length) {
          this.load(this.lowPriorityQueue.shift());
          return true;
        }
        else {
          return false;
        }
      },

      load: function(url) {
        var c = this.queuedContent[url];
        mediator.trigger('startLoading', c.url);

        $.getJSON(c.url)
          .done(function (data, textStatus, jqXHR) {
            c.deferred.resolve(data, textStatus, jqXHR);
          }.bind(this))
          .fail(function (jqXHR, textStatus, errorThrown) {
            c.deferred.reject(jqXHR, textStatus, errorThrown);
          }.bind(this))
          .always(function () {
            delete this.queuedContent[c.url];
            if (!this.startLoad()) {
              mediator.trigger('stopLoading');
            }
          }.bind(this));
      },
    };
  });

  var contentQueue = new ContentQueueClass();

  /*
    zlsa.atc.Loader.queue(
    {url: 'foo/bar',
    immediate: true,}
    );
    @return Promise
  */
  zlsa.atc.loadAsset = function(options) {
    return contentQueue.add(options);
  };
})($, zlsa, Fiber, zlsa.atc.mediator);
