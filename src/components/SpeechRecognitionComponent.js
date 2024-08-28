// src/components/SpeechRecognitionComponent.js
import React, { useState, useEffect, useCallback } from 'react';

function SpeechRecognitionComponent({ onResult, language }) {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  const startListening = useCallback(() => {
    if (recognition) {
      recognition.start();
    }
  }, [recognition]);
  
  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
    }
  }, [recognition]);

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
      stopListening();
      onResult(transcript);
    };

    setRecognition(recognitionInstance);
  }, [onResult, language, stopListening]);

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
