import $ from 'jquery';
import { time } from './utilities/timeHelpers';
import { SELECTORS } from './constants/selectors';

/**
 * Loading indicator elements for HTML interface
 */
(function($, zlsa, Fiber, mediator, version_string) {
    $(SELECTORS.DOM_SELECTORS.LOADING).append(`<div class="version">${version_string}</div>`);

    const minimumDisplayTime = 2; // seconds
    const state = {
        loading: false,
        callback: null,
        start: null
    };

    zlsa.atc.LoadUI = {
        complete: function() {
            $(SELECTORS.DOM_SELECTORS.LOADING).fadeOut(1000);
            $(SELECTORS.DOM_SELECTORS.LOADING).css('pointerEvents', 'none');
        },

        startLoad: function(url) {
            let msg = url;

            if (url.length > 15) {
                msg = `...${url.substr(-12)}`;
            }

            $(`${SELECTORS.DOM_SELECTORS.LOADING} ${SELECTORS.DOM_SELECTORS.MESSAGE}`).text(msg);

            if (!state.loading) {
                $(SELECTORS.DOM_SELECTORS.LOADING_INDICATOR).show();
                state.start = time();
            }

            if (state.callback !== null) {
                clearTimeout(state.callback);
                state.callback = null;
            }
        },

        stopLoad: function() {
            const now = time();

            if ((now - state.start) > minimumDisplayTime) {
                $(SELECTORS.DOM_SELECTORS.LOADING_INDICATOR).hide();

                state.start = null;
                state.loading = false;
            } else {
                if (state.callback !== null) {
                    return;
                }

                state.callback = setTimeout(() => {
                    $(SELECTORS.DOM_SELECTORS.LOADING_INDICATOR).hide();

                    state.start = null;
                    state.loading = false;
                    state.callback = null;
                }, (minimumDisplayTime - (now - state.start)) * 1000);
            }
        }
    };
})($, zlsa, Fiber, zlsa.atc.mediator, prop.version_string);
