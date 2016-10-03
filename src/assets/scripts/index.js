/* eslint-disable */
require('raf').polyfill();
import 'babel-polyfill';
import $ from 'jquery';
import App from './App';

/**
 * Entry point for the application.
 *
 * Provides a way to grab the `body` element of the document and pass it to the app.
 */
export default (() => {
    const $body = $('body');
    const app = new App($body);
})();
