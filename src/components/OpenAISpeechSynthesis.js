export const speakWithOpenAITTS = async (text, language) => {
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  
    const languageVoiceMap = {
      'fr-FR': 'fr_fr',  // Example voice for French
      'en-US': 'en_us',  // Example voice for American English
      'es-ES': 'es_es',  // Example voice for Spanish
      'de-DE': 'de_de',  // Example voice for German
      // Add more languages as needed
    };
  
    const voice = languageVoiceMap[language] || 'en_us'; // Default to 'en_us' if language not in the map
  
    try {
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: text,
          model: 'tts-1', // Check the available model
          voice: 'onyx',  // Use the mapped voice for the selected language
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP Error: ${response.status} - ${errorText}`);
      }
  
      // Create an audio element and play the audio
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      console.error('Error with OpenAI TTS:', error);
    }
  };
  