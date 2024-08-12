// src/components/SpeechSynthesisComponent.js
import React, { useEffect, useState } from 'react';

function SpeechSynthesisComponent({ text, language }) {
  const [selectedVoice, setSelectedVoice] = useState(null);

  useEffect(() => {
    const synth = window.speechSynthesis;
    const loadVoices = () => {
      const availableVoices = synth.getVoices();

      // Map of preferred voices for each language
      const preferredVoices = {
        'fr-FR': 'Google français',
        'en-US': 'Google US English',
        'es-ES': 'Google español',
        'de-DE': 'Google Deutsch',
        // Add more languages and voices as needed
      };

      const preferredVoice = availableVoices.find(voice => voice.name === preferredVoices[language]);
      console.log('Verifying value of preferredVoice:', preferredVoice)
      setSelectedVoice(preferredVoice || availableVoices[0]);
    };

    loadVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }
  }, [language]);

  useEffect(() => {
    if (text && selectedVoice) {
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(text);
      //utterance.voice = selectedVoice;
      utterance.lang = language;
      console.log('Speaking with voice:', utterance.voice);
      synth.speak(utterance);
    }
  }, [text, selectedVoice, language]);

  return null;
}

export default SpeechSynthesisComponent;
