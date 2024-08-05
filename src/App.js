import logo from './logo.svg';
import './App.css';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import InputComponent from './components/InputComponent';
import ResponsesComponent from './components/ResponsesComponent';
import SpeechRecognitionComponent from './components/SpeechRecognitionComponent';
import SpeechSynthesisComponent from './components/SpeechSynthesisComponent';
import LanguageSelector from './components/LanguageSelector';

function App() {
  const [responses, setResponses] = useState([]);
  const [speechText, setSpeechText] = useState('');
  const [language, setLanguage] = useState('fr-FR');
  const [gameStep, setGameStep] = useState('intro');
  const [theme, setTheme] = useState('');
  const [inputText, setInputText] = useState('');
  const [messageHistory, setMessageHistory] = useState([]);

  const handleQuestionSubmit = async (question) => {
    const newMessage = { role: "user", content: question };
    console.log('Before adding user message:', messageHistory);
    const updatedHistory = [...messageHistory, newMessage];

    console.log('Sending messages to API:', updatedHistory);

    try {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: "gpt-4o-mini",
        max_tokens: 250,
        messages: updatedHistory
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      const answer = response.data.choices[0].message.content;
      setResponses([...responses, answer]);
      setSpeechText(answer);
      setMessageHistory(messageHistory => [...updatedHistory, { role: "assistant", content: answer }]);

      // Handle game steps based on the answer
      if (gameStep === 'intro') {
        setGameStep('chooseTheme');
      } else if (gameStep === 'chooseTheme') {
        setTheme(question); // Set the chosen theme
        setGameStep('playClip');
        // Here you could add logic to choose a clip based on the theme
      } else if (gameStep === 'playClip') {
        setGameStep('guessTitle');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSpeechResult = (transcript) => {
    handleQuestionSubmit(transcript);
  };

  const startGame = () => {
    setResponses([]);
    setMessageHistory([]);
    setGameStep('intro');

    const systemMessage = {
      role: "system",
      content: `Ce GPT agit en tant que présentateur de jeu de blind test. Il propose des extraits musicaux et demande aux participants
        de deviner le titre de la chanson ou le nom de l'artiste. Avant de démarrer le jeu, il détermine un thème avec l'utilisateur, puis il
        commence le jeu. Il anime le jeu avec enthousiasme et encourage les participants. Toujours rester impartial et équitable.
        Utiliser un ton joyeux et dynamique. Poser des questions claires et concises sur les extraits musicaux.
        Féliciter les bonnes réponses et encourager les participants en cas de réponse incorrecte.
        Si une règle du jeu est floue ou si un participant ne comprend pas, fournir des explications simples et rapides. Parler de manière
        conviviale et enjouée, comme un animateur de télévision. Lorsqu'il donne le nom de l'artiste et le titre de la chanson à deviner, il
        utilise le format suivant: NOM_ARTISTE="Nom de l'artiste" TITRE="Titre de la chanson"
        Exemple d'interaction:
        system: bonjour à tous les participants! J'espère que vous êtes prêts pour cette super session de blindtest! Commençons déjà par déterminer
        le thème de la première session: années 80, variété française, rap r n b, classique? à vous de me dire!
        user: musique de film
        system: parfait, c'est parti! attention soyez prêts pour le premier extrait.
        NOM_ARTISTE="Kenny Loggins" TITRE="Footloose"
        user: c'est bon j'ai! c'est footloose!
        system: excellent! passons au second extrait.
        NOM_ARTISTE="Madonna" TITRE="Don't cry for me argentina"
        
        Attention, tu es un assistant oral alors soit conçis et ne dépasse pas 250 tokens par réponses.`
    };
    setMessageHistory(messageHistory => [...messageHistory, systemMessage]);
    console.log('Initial message history:', systemMessage);
    console.log('Verifying state of messageHistory:', messageHistory);
  };

  useEffect(() => {
    if (messageHistory.length === 1 && messageHistory[0].role === "system") {
      // Only trigger the first question if the message history contains only the system message
      handleQuestionSubmit('un joueur vient de lancer la partie pour jouer au blindtest');
    }
  }, [messageHistory]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleInputSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      handleQuestionSubmit(inputText);
      setInputText('');
    }
  };

  return (
    <div className="App">
      <LanguageSelector selectedLanguage={language} onLanguageChange={setLanguage} />
      <SpeechRecognitionComponent onResult={handleSpeechResult} language={language} />
      <SpeechSynthesisComponent text={speechText} language={language} />

      {gameStep === 'intro' && <button onClick={startGame}>Démarrer le jeu</button>}
      {gameStep === 'playClip' && <button onClick={() => setGameStep('guessTitle')}>Arrêter l'extrait et deviner le titre</button>}

      <form onSubmit={handleInputSubmit}>
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder="Écrire votre question"
        />
        <button type="submit">Envoyer</button>
      </form>

      <InputComponent onSubmit={handleQuestionSubmit} />
      <ResponsesComponent responses={responses} />
    </div>
  );
}

export default App;
