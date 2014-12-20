
var speech = window.speechSynthesis;

function sayText (textToSay) {
  if (speech != null) {
    textToSay = textToSay.replace(/[0-9]/g,"$& "); //Split numbers into individual digits e.g. Speedbird 666 -> Speedbird 6 6 6
    speech.speak(new SpeechSynthesisUtterance(textToSay));
  }
}
