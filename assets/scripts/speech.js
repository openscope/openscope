
var speech = window.speechSynthesis;
var speech_enabled = false;

function speech_init() {
  if('atc-speech-enabled' in localStorage && localStorage['atc-speech-enabled'] == 'true')
    speech_enabled = true;
}

function sayText(textToSay) {
  if(speech != null && speech_enabled) {
    // Split numbers into individual digits e.g. Speedbird 666 -> Speedbird 6 6 6
    textToSay = textToSay.replace(/[0-9]/g,"$& ").replace(/0/g, "zero");
    speech.speak(new SpeechSynthesisUtterance(textToSay));
  }
}

function speech_toggle() {
  speech_enabled = !speech_enabled;

  if(speech_enabled) {
    $(".speech-toggle").addClass("active");
  } else {
    $(".speech-toggle").removeClass("active");
    speech.cancel();
  }

  localStorage['atc-speech-enabled'] = speech_enabled;

}
