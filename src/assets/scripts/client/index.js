import $ from 'jquery';
import App from './App';

require('raf').polyfill();

/**
 * Entry point for the application.
 *
 * Provides a way to grab the `body` element of the document and pass it to the app.
 */
export default (() => {
    const $body = $('body');
    // eslint-disable-next-line no-unused-vars
    const app = new App($body);
})();
