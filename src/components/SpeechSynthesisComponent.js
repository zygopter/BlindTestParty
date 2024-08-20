import React, { useEffect, useState } from 'react';

function SpeechSynthesisComponent({ text, language, onSpeechEnd }) {
  const [selectedVoice, setSelectedVoice] = useState(null);

  useEffect(() => {
    const synth = window.speechSynthesis;
    
    const loadVoices = () => {
      const availableVoices = synth.getVoices();

      const preferredVoices = {
        'fr-FR': 'Google français',
        'en-US': 'Google US English',
        'es-ES': 'Google español',
        'de-DE': 'Google Deutsch',
      };

      const preferredVoice = availableVoices.find(voice => voice.name === preferredVoices[language]);
      setSelectedVoice(preferredVoice || availableVoices[0]);
    };

    loadVoices();
    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }
    
    return () => {
      synth.cancel(); // Annuler tous les discours en attente ou en cours
    };
  }, [language]);

  useEffect(() => {
    const speakText = (textSegment) => {
      return new Promise((resolve) => {
        const synth = window.speechSynthesis;
        const utterance = new SpeechSynthesisUtterance(textSegment);
        utterance.voice = selectedVoice;
        utterance.lang = language;

        utterance.onend = () => {
          console.log('SpeechSynthesisUtterance has finished speaking.');
          resolve();
        };

        utterance.onerror = (e) => {
          console.error('Speech synthesis error:', e);
          resolve();
        };

        synth.speak(utterance);
      });
    };

    const splitAndSpeak = async (text) => {
      const maxLength = 120;
      const textSegments = [];

      let startIndex = 0;
      while (startIndex < text.length) {
        let endIndex = startIndex + maxLength;
        if (endIndex < text.length) {
          const lastSpace = text.lastIndexOf(' ', endIndex);
          endIndex = lastSpace > startIndex ? lastSpace : endIndex;
        }
        textSegments.push(text.substring(startIndex, endIndex).trim());
        startIndex = endIndex;
      }

      for (const segment of textSegments) {
        await speakText(segment);
      }

      if (onSpeechEnd) {
        onSpeechEnd(); // Appeler le callback lorsque le TTS est terminé
      }
    };

    if (text && selectedVoice) {
      splitAndSpeak(text);
    }
  }, [text, selectedVoice, language]);

  return null;
}

export default SpeechSynthesisComponent;
