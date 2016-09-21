import $ from 'jquery';
import _get from 'lodash/get';
import _has from 'lodash/has';
import { STORAGE_KEY } from './constants/storageKeys';
import { SELECTORS } from './constants/selectors';

/**
 *
 * @function speech_init
 */
export const speech_init = () => {
    prop.speech = {};
    prop.speech.synthesis = window.speechSynthesis;
    prop.speech.enabled = false;

    if (_has(localStorage, STORAGE_KEY.ATC_SPEECH_ENABLED) && _get(localStorage, STORAGE_KEY.ATC_SPEECH_ENABLED, false)) {
        prop.speech.enabled = true;
        $(SELECTORS.DOM_SELECTORS.SPEECH_TOGGLE).addClass(SELECTORS.CLASSNAMES.ACTIVE);
    }
};

/**
 *
 * @function speech_say
 * @param sentence
 */
export const speech_say = (sentence) => {
    if (prop.speech.synthesis != null && prop.speech.enabled) {
        let textToSay = '';

        for (let i = 0; i < sentence.length; i++) {
            let singleSentence = singleSentence;

            switch(singleSentence.type) {
                case 'callsign':
                    textToSay += ` ${singleSentence.content.getRadioCallsign()} `;
                    break;
                case 'altitude':
                    textToSay += ` ${radio_altitude(singleSentence.content)} `;
                    break;
                case 'speed': case 'heading':
                    textToSay += ` ${radio_heading(singleSentence.content)} `;
                    break;
                case 'text':
                    textToSay += ` ${singleSentence.content} `;
                    break;
                default:
                    break;
            }
        }

        let utterance = new SpeechSynthesisUtterance(textToSay); // make the object
        utterance.lang = 'en-US'; // set the language
        utterance.voice = prop.speech.synthesis.getVoices().filter((voice) => {
            return voice.name == 'Google US English';
        })[0];   //set the voice
        utterance.rate = 1.125; // speed up just a touch

        // say the words
        prop.speech.synthesis.speak(utterance);
    }
};

/**
 *
 * @function speech_toggle
 */
export const speech_toggle = () => {
    $speechToggle= $(SELECTORS.DOM_SELECTORS.SPEECH_TOGGLE);
    prop.speech.enabled = !prop.speech.enabled;

    if (prop.speech.enabled) {
        $speechToggle.addClass(SELECTORS.CLASSNAMES.ACTIVE);
    } else {
    $speechToggle.removeClass(SELECTORS.CLASSNAMES.ACTIVE);
        prop.speech.synthesis.cancel();
    }

    localStorage[STORAGE_KEY.ATC_SPEECH_ENABLED] = prop.speech.enabled;
};
