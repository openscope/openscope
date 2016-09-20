import 'babel-polyfill';
import App from './App';

/**
 * Entry point for the application.
 *
 * Provides a way to grab the `body` element of the document and pass it to the app.
 */
export default (() => {
    const $body = document.getElementsByTagName('body')[0];
    const app = new App($body);
})();
