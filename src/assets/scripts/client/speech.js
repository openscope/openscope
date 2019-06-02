/* eslint-disable no-underscore-dangle, no-unused-vars, no-undef, global-require */
import $ from 'jquery';
import _get from 'lodash/get';
import _has from 'lodash/has';
import EventTracker from './EventTracker';
import { radio_heading, radio_altitude } from './utilities/radioUtilities';
import { STORAGE_KEY } from './constants/storageKeys';
import { SELECTORS } from './constants/selectors';
import {
    VOICES,
    LOWER_PITCH,
    HIGHER_PITCH,
    NORMAL_SPEED,
    FASTER_SPEED
} from './constants/speechConstants';
import { TRACKABLE_EVENT } from './constants/trackableEvents';

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
        $(SELECTORS.DOM_SELECTORS.TOGGLE_SPEECH).addClass(SELECTORS.CLASSNAMES.ACTIVE);
    }
};

/**
 *
 * @function randomizePilotVoice
 */
export const randomizePilotVoice = () => {
    const voice = VOICES[Math.floor(Math.random() * VOICES.length)];
    const pitch = (Math.random() * (LOWER_PITCH - HIGHER_PITCH) + HIGHER_PITCH).toFixed(1);
    const rate = (Math.random() * (NORMAL_SPEED - FASTER_SPEED) + FASTER_SPEED).toFixed(3);

    return {
        voice,
        pitch,
        rate
    };
};

/**
 *
 * @function speech_say
 * @param sentence
 */
export const speech_say = (sentence, pilotVoice) => {
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
            return voice.name === pilotVoice.voice;
        })[0];
        utterance.rate = pilotVoice.rate;
        utterance.pitch = pilotVoice.pitch;

        // say the words
        prop.speech.synthesis.speak(utterance);
    }
};

/**
 *
 * @function speech_toggle
 */
export const speech_toggle = () => {
    const $speechToggleElement = $(SELECTORS.DOM_SELECTORS.TOGGLE_SPEECH);
    prop.speech.enabled = !prop.speech.enabled;

    if (!prop.speech.enabled) {
        prop.speech.synthesis.cancel();
    }

    $speechToggleElement.toggleClass(SELECTORS.CLASSNAMES.ACTIVE);

    localStorage[STORAGE_KEY.ATC_SPEECH_ENABLED] = prop.speech.enabled;
    const hasClass = $speechToggleElement.hasClass(SELECTORS.CLASSNAMES.ACTIVE);

    EventTracker.recordEvent(TRACKABLE_EVENT.OPTIONS, 'speech', `${hasClass}`);
};
