// src/components/SpeechRecognitionComponent.js
import React, { useState, useEffect } from 'react';

function SpeechRecognitionComponent({ onResult, language }) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = false;
    recognitionInstance.lang = language;

    recognitionInstance.onstart = () => {
      setIsListening(true);
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
    };

    recognitionInstance.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      onResult(transcript);
    };

    setRecognition(recognitionInstance);
  }, [onResult, language]);

  const startListening = () => {
    if (recognition) {
      recognition.start();
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
    }
  };

  return (
    <div>
      <button onClick={startListening} disabled={isListening}>
        Commencer à parler
      </button>
      <button onClick={stopListening} disabled={!isListening}>
        Arrêter de parler
      </button>
    </div>
  );
}

export default SpeechRecognitionComponent;
