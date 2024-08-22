import React, { useEffect } from 'react';

function useSpeechSynthesis(language) {
  const speak = (text) => {
    return new Promise((resolve) => {
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance(text);

      const voices = synth.getVoices();
      const selectedVoice = voices.find(voice => voice.lang === language) || voices[0];
      utterance.voice = selectedVoice;

      utterance.onend = () => {
        resolve();
      };

      utterance.onerror = (e) => {
        console.error('Speech synthesis error:', e);
        resolve(); // résout la promesse même en cas d'erreur pour éviter de bloquer
      };

      synth.speak(utterance);
    });
  };

  return { speak };
}

export default useSpeechSynthesis;
