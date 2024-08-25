import logo from './logo.svg';
import './App.css';

import React, { useState, useEffect, useRef } from 'react';
import { Howl } from 'howler';
import axios from 'axios';
import { startGame, chooseTheme, startSong, submitAnswer, completeAnswer } from './api/game';
import InputComponent from './components/InputComponent';
import ResponsesComponent from './components/ResponsesComponent';
import SpeechRecognitionComponent from './components/SpeechRecognitionComponent';
import LanguageSelector from './components/LanguageSelector';
import useSpeechSynthesis from './components/SpeechSynthesisComponent';

function App() {
  const [gameId, setGameId] = useState(null);
  const [responses, setResponses] = useState([]);
  const [speechText, setSpeechText] = useState('');
  const [language, setLanguage] = useState('fr-FR');
  const [gameStep, setGameStep] = useState('intro');
  const [theme, setTheme] = useState('');
  const currentSound = useRef(null);
  const [points, setPoints] = useState(0);
  const [excerptCount, setExcerptCount] = useState(0);
  const [maxExcerpts, setMaxExcerpts] = useState(5);
  const [tentativeCount, setTentativeCount] = useState(0);
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
    if (excerptCount >= 5) {
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

  const handleSubmitAnswer = async (userAnswer) => {
    try {
      let data;
      if (tentativeCount === 0) {
        data = await submitAnswer(gameId, userAnswer);
      } else {
        data = await completeAnswer(gameId, userAnswer);
      }
      setResponses([...responses, data.parsedAnswer.texte]);
      setPoints(data.points);

      await speak(data.parsedAnswer.texte);
      if (data.success) {
        // Passer à l'extrait suivant ou terminer le jeu
        setTentativeCount(0);
        const newExtraitCount = excerptCount + 1;
        setExcerptCount(newExtraitCount);
        setGameStep('startSong');
      } else if (tentativeCount > 0) {
        setTentativeCount(0);
        const newExtraitCount = excerptCount + 1;
        setExcerptCount(newExtraitCount);
        setGameStep('startSong');
      } else {
        setTentativeCount(1);
        if (currentSound.current) {
          currentSound.current.play();
        }
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

  const handleExcerptsChange = (e) => {
    setMaxExcerpts(Number(e.target.value));
  };

  useEffect(() => {
    if (excerptCount >= maxExcerpts) {
      speak('Félicitations ! Vous avez deviné ${maxExcerpts} extraits. Le jeu est terminé.');
      setGameStep('end');
    }
  }, [excerptCount]);

  return (
    <div className="App">
      <LanguageSelector selectedLanguage={language} onLanguageChange={setLanguage} />
      <SpeechRecognitionComponent onResult={handleSubmitAnswer} language={language} />

      {gameStep === 'intro' && (
        <div>
          <label>
            Nombre d'extraits :
            <input type="number" value={maxExcerpts} onChange={handleExcerptsChange} min="1" />
          </label>
          <button onClick={handleStartGame}>Démarrer le jeu</button>
        </div>
      )}
      {gameStep === 'chooseTheme' && <InputComponent onSubmit={handleChooseTheme} placeholder="Choisir le thème..." />}
      {gameStep === 'startSong' && <button onClick={handleStartSong}>Lancer l'extrait</button>}
      {gameStep === 'playClip' && <button onClick={handleStopSong}>Arrêter l'extrait et deviner le titre</button>}
      {gameStep === 'guessTitle' && <InputComponent onSubmit={handleSubmitAnswer} placeholder="Entrer la réponse..." />}
      {gameStep === 'end' && <div>Le jeu est terminé. Votre score : {points} points.</div>}

      <ResponsesComponent responses={responses} />
      <div>Points: {points}</div>
      <div>Extraits devinés : {excerptCount}/{maxExcerpts}</div>
    </div>
  );
}

export default App;
