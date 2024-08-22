import logo from './logo.svg';
import './App.css';

import React, { useState, useEffect, useRef } from 'react';
import { Howl } from 'howler';
import axios from 'axios';
import { startGame, chooseTheme, startSong, submitAnswer } from './api/game';
import InputComponent from './components/InputComponent';
import ResponsesComponent from './components/ResponsesComponent';
import SpeechRecognitionComponent from './components/SpeechRecognitionComponent';
import LanguageSelector from './components/LanguageSelector';
import useSpeechSynthesis from './components/SpeechSynthesisComponent';
import GameSteps from './utils/GameSteps';
import sendMessageToGPT from './api/sendMessageToGPT';

function App() {
  const [gameId, setGameId] = useState(null);
  const [responses, setResponses] = useState([]);
  const [speechText, setSpeechText] = useState('');
  const [language, setLanguage] = useState('fr-FR');
  const [gameStep, setGameStep] = useState('intro');
  const [theme, setTheme] = useState('');
  const currentSound = useRef(null);
  const [points, setPoints] = useState(0);
  const [extraitCount, setExtraitCount] = useState(0);
  const { speak } = useSpeechSynthesis(language);

  const handleStartGame = async () => {
    try {
      const data = await startGame();
      setGameId(data.gameId);
      setResponses([data.gptAnswer]);
      await speak(data.gptAnswer);
      setGameStep('chooseTheme');
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const handleChooseTheme = async (theme) => {
    try {
      const data = await chooseTheme(gameId, theme);
      setTheme(data.gameState.theme);
      setResponses([...responses, data.gptAnswer]);
      await speak(data.gptAnswer);
      setGameStep('startSong');
    } catch (error) {
      console.error('Error choosing theme:', error);
    }
  };

  const handleStartSong = async () => {
    if (extraitCount >= 5) {
      await speak('Le jeu est terminé ! Vous avez joué tous les extraits.');
      setGameStep('end'); // Marquer la fin du jeu
      return;
    }
    try {
      const data = await startSong(gameId);
      setGameStep('playClip');
      setResponses([...responses, data.parsedAnswer.texte]);
      if (currentSound.current) {
        currentSound.current.stop();
      }
      await speak(data.parsedAnswer.texte);

      currentSound.current = new Howl({
        src: [data.trackUrl],
        html5: true, // Utiliser HTML5 pour charger de longues pistes
      });

      if (currentSound.current) {
        currentSound.current.play();
      }
    } catch (error) {
      console.error('Error starting song:', error);
    }
  };

  const playSong = () => {
    if (currentSound.current && gameStep === 'playClip') {
      currentSound.current.play();
    }
  };

  const handleSubmitAnswer = async (userAnswer) => {
    try {
      const data = await submitAnswer(gameId, userAnswer);
      setResponses([...responses, data.parsedAnswer.texte]);
      setPoints(data.points);

      await speak(data.parsedAnswer.texte);
      if (data.success) {
        // Passer à l'extrait suivant ou terminer le jeu
        const newExtraitCount = extraitCount + 1;
        setExtraitCount(newExtraitCount);
        setGameStep('startSong');
      } else {
        // The extract will relaunch by itself after the end of speech with the onSpeechEnd callback
        setGameStep('playClip');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const handleStopSong = () => {
    if (currentSound.current) {
      currentSound.current.stop();
    }
    setGameStep('guessTitle');
  };

  useEffect(() => {
    if (extraitCount >= 5) {
      speak('Félicitations ! Vous avez deviné 5 extraits. Le jeu est terminé.');
      setGameStep('end');
    }
  }, [extraitCount]);

  return (
    <div className="App">
      <LanguageSelector selectedLanguage={language} onLanguageChange={setLanguage} />
      <SpeechRecognitionComponent onResult={handleSubmitAnswer} language={language} />

      {gameStep === 'intro' && <button onClick={handleStartGame}>Démarrer le jeu</button>}
      {gameStep === 'chooseTheme' && <InputComponent onSubmit={handleChooseTheme} placeholder="Choisir le thème..." />}
      {gameStep === 'startSong' && <button onClick={handleStartSong}>Lancer l'extrait</button>}
      {gameStep === 'playClip' && <button onClick={handleStopSong}>Arrêter l'extrait et deviner le titre</button>}
      {gameStep === 'guessTitle' && <InputComponent onSubmit={handleSubmitAnswer} placeholder="Entrer la réponse..." />}
      {gameStep === 'end' && <div>Le jeu est terminé. Votre score : {points} points.</div>}

      <ResponsesComponent responses={responses} />
      <div>Points: {points}</div>
      <div>Extraits devinés : {extraitCount}/5</div>
    </div>
  );
}

export default App;
