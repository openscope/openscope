/* eslint-disable no-underscore-dangle, no-unused-vars, no-undef, global-require */
import * as $ from 'jquery';
import * as _get from 'lodash/get';
import * as _has from 'lodash/has';
import { radio_heading, radio_altitude } from './utilities/radioUtilities';
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

    if (_get(localStorage, STORAGE_KEY.ATC_SPEECH_ENABLED, false) === true) {
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
            const singleSentence = sentence[i];

            switch (singleSentence.type) {
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

        const utterance = new SpeechSynthesisUtterance(textToSay); // make the object
        utterance.lang = 'en-US'; // set the language
        utterance.voice = prop.speech.synthesis.getVoices().filter((voice) => {
            // set the voice
            return voice.name === 'Google US English';
        })[0];
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
    const $speechToggle = $(SELECTORS.DOM_SELECTORS.SPEECH_TOGGLE);
    prop.speech.enabled = !prop.speech.enabled;

    if (prop.speech.enabled) {
        $speechToggle.addClass(SELECTORS.CLASSNAMES.ACTIVE);
    } else {
        $speechToggle.removeClass(SELECTORS.CLASSNAMES.ACTIVE);
        prop.speech.synthesis.cancel();
    }

    localStorage[STORAGE_KEY.ATC_SPEECH_ENABLED] = prop.speech.enabled;
};
