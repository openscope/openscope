import $ from 'jquery';
import { SELECTORS } from './constants/selectors';


let wasInitialized = false;
const pairs = [];

/**
 * prepare the config for usage
 * @param voiceRecognitionResponse - the content of the json file
 */
function load_and_sort_config(voiceRecognitionResponse) {
    const config = voiceRecognitionResponse.voice_recognition;

    // create pairs of data for each transcription found
    config.forEach((command) => {
        for (let i = 0; i < command.transcriptions.length; i++) {
            const pair = {
                meaning: command.meaning,
                transcription: command.transcriptions[i]
            };
            pairs.push(pair);
        }
    });

    // order the pairs by the word count (space count), higher word counts at the beginning
    pairs.sort((a, b) => {
        const wordCountA = (a.transcription.split(' ').length - 1);
        const wordCountB = (b.transcription.split(' ').length - 1);

        if (wordCountA > wordCountB) {
            return -1;
        } else if (wordCountA < wordCountB) {
            return 1;
        }
        return 0;
    });

    wasInitialized = true;
}

function init() {
    // load the configuration files
    const voiceRecognitionListPromise = $.getJSON('assets/voice_recognition/voice_recognition.json');

    // This is provides a way to get async data from several sources in the app before anything else runs
    // we need to resolve data from two sources before the app can proceede. This data should always
    // exist, if it doesn't, something has gone terribly wrong.
    $.when(voiceRecognitionListPromise)
        .done((voiceRecognitionResponse) => {
            load_and_sort_config(voiceRecognitionResponse);
        });
}

/**
 * called by the UIController
 * @function record_voice_toggle
 */
export const record_voice_toggle = () => {
    if (!wasInitialized) init();

    const $speechToggleElement = $(SELECTORS.DOM_SELECTORS.TOGGLE_RECORD_SPEECH);
    $speechToggleElement.toggleClass(SELECTORS.CLASSNAMES.ACTIVE);

    const isActive = $speechToggleElement.hasClass(SELECTORS.CLASSNAMES.ACTIVE);
    if (isActive) {
        // eslint-disable-next-line no-use-before-define
        listen();
    }
};

/**
 * Take the string from the speed recognition and replace parts of it, if a command matches this part
 * @param transcript - string from speed recognition
 * @returns {*} - string to display as aircraft command
 */
function analyzeResult(transcript) {
    let result = transcript;
    pairs.forEach((pair) => {
        const transcript = pair.transcription;

        if (result.includes(transcript)) {
            result = result.replace(transcript, pair.meaning);
        }
    });

    return result;
}

/**
 * starts the speed recognition and handle the events
 */
export function listen() {
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    // eslint-disable-next-line no-undef
    const recognition = new SpeechRecognition();
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    const $input = $(SELECTORS.DOM_SELECTORS.COMMAND);
    const startValue = $input.val();

    recognition.addEventListener('result', (event) => {
        // remove all the events from the returned text and make it only a string
        const transcript = Array.from(event.results)
            .map((result) => result[0])
            .map((result) => result.transcript)
            .join('');

        const command = analyzeResult(transcript);
        // set the new value to the aircraft command
        $input.val(`${startValue}${command}`);
        // trigger a change to the input field
        $input.trigger('input');
        // focus the input field, so that if the player is happy with the transcription he only needs to press enter
        $input.focus();
    });

    recognition.addEventListener('end', (event) => {
        record_voice_toggle();
    });

    recognition.start();
}
