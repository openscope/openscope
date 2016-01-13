
function speech_init() {
  prop.speech = {};
  prop.speech.synthesis = window.speechSynthesis;
  prop.speech.enabled = false;

  if('atc-speech-enabled' in localStorage && localStorage['atc-speech-enabled'] == 'true') {
    prop.speech.enabled = true;
    $(".speech-toggle").addClass("active");
  }
}

function speech_say(sentence) {
  if(prop.speech.synthesis != null && prop.speech.enabled) {
    var textToSay = "";
    for(var i=0; i<sentence.length; i++) {
      switch(sentence[i].type) {
        case "callsign":
          textToSay += " " + sentence[i].content.getRadioCallsign() + " "; break;
        case "altitude":
          textToSay += " " + radio_altitude(sentence[i].content) + " "; break;
        case "speed": case "heading":
          textToSay += " " + radio_heading(sentence[i].content) + " "; break;
        case "text":
          textToSay += " " + sentence[i].content + " "; break;
        default:
          break;
      }
    }

    var utterance = new SpeechSynthesisUtterance(textToSay); // make the object
    utterance.lang = "en-US"; // set the language
    utterance.voice = prop.speech.synthesis.getVoices().filter(function(voice) {
      return voice.name == 'Google US English'; })[0];   //set the voice
    utterance.rate = 1.125; // speed up just a touch
    prop.speech.synthesis.speak(utterance);  // say the words
  }
}

function speech_toggle() {
  prop.speech.enabled = !prop.speech.enabled;

  if(prop.speech.enabled) {
    $(".speech-toggle").addClass("active");
  } else {
    $(".speech-toggle").removeClass("active");
    prop.speech.synthesis.cancel();
  }

  localStorage['atc-speech-enabled'] = prop.speech.enabled;

}
