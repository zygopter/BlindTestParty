import './App.css';

import React, { useState, useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { startGame, chooseTheme, startSong, submitAnswer, completeAnswer, logMessageHistory } from './api/game';
import MenuDropdown from './components/common/MenuDropDown';
import InputComponent from './components/InputComponent';
import ResponsesComponent from './components/ResponsesComponent';
import SpeechRecognitionComponent from './components/SpeechRecognitionComponent';
import NeonAnimation from './components/NeonAnimation';
import useSpeechSynthesis from './components/SpeechSynthesisComponent';
import GameSteps from './utils/GameSteps';
import InputModes from './utils/InputModes';


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
  const [inputMode, setInputMode] = useState(InputModes.TEXT);
  const { speak } = useSpeechSynthesis(language);

  const languageOptions = [
    { value: 'fr-FR', label: 'Français' },
    { value: 'en-US', label: 'English' },
    { value: 'es-ES', label: 'Español' },
    { value: 'de-DE', label: 'Deutsch' },
  ];

  const modeOptions = [
    { value: InputModes.TEXT, label: 'Texte' },
    { value: InputModes.VOCAL, label: 'Vocal' },
    { value: InputModes.MIXED, label: 'Mixte' },
  ];
  
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
        setExcerptCount((prevCount) => prevCount + 1);
        setGameStep('startSong');
      } else if (tentativeCount > 0) {
        setTentativeCount(0);
        setExcerptCount((prevCount) => prevCount + 1);
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

  const handleSpeechReco = async (userAnswer) => {
    try {
      switch (gameStep) {
        case GameSteps.CHOOSE_THEME:
          handleChooseTheme(userAnswer);
          break;
        case GameSteps.START_SONG:
          handleStartSong();
          break;
        case GameSteps.GUESS_TITLE:
          handleSubmitAnswer(userAnswer);
          break;

        default:
          break;
      }
    } catch (error) {
      console.error('Error handling speech recognition result:', error);
    }
  };

  const handleStopSong = () => {
    if (currentSound.current) {
      currentSound.current.stop();
    }
    setGameStep('guessTitle');
  };

  const handleLanguageChange = (language) => {
    console.log('Language selected:', language);
    setLanguage(language);
  };

  const handleModeChange = (mode) => {
    setInputMode(mode);
  };

  const handleExcerptsChange = (e) => {
    setMaxExcerpts(Number(e.target.value));
  };

  useEffect(() => {
    if (excerptCount >= maxExcerpts) {
      speak('Félicitations ! Vous avez deviné ${maxExcerpts} extraits. Le jeu est terminé.');
      setGameStep('end');
    }
  }, [excerptCount, maxExcerpts]);

  const handleLogMessageHistory = async () => {
    try {
      const data = await logMessageHistory(gameId);
      console.log(data);
    } catch (error) {
      console.error('Error starting song:', error);
    }
  }

  return (
    <div className="App">
      <NeonAnimation gameState={gameStep} />
      <div className="menu-container">
        <MenuDropdown
          label="Mode de saisie"
          options={modeOptions}
          onItemChange={handleModeChange}
          selectedItem={inputMode}
        />
        <MenuDropdown
          label="Language"
          options={languageOptions}
          onItemChange={handleLanguageChange}
          selectedItem={language}
        />
      </div>

      {/* START GAME */}
      {gameStep === 'intro' && (
        <div className="button-container">
          <label>
            Nombre d'extraits :
            <input type="number" value={maxExcerpts} onChange={handleExcerptsChange} min="1" />
          </label>
          <button onClick={handleStartGame}>Démarrer le jeu</button>
        </div>
      )}
      {/* CHOOSE THEME */}
      {inputMode === InputModes.TEXT && gameStep === 'chooseTheme' && (
        <div className="button-container">
          <InputComponent onSubmit={handleChooseTheme} placeholder="Choisir le thème..." />
        </div>
      )}
      {inputMode === InputModes.VOCAL && gameStep === 'chooseTheme' && (
        <SpeechRecognitionComponent onResult={handleSpeechReco} language={language} />
      )}
      {inputMode === InputModes.MIXED && gameStep === 'chooseTheme' && (
        <>
          <div className="button-container">
            <InputComponent onSubmit={handleChooseTheme} placeholder="Choisir le thème..." />
          </div>
          <SpeechRecognitionComponent onResult={handleSpeechReco} language={language} />
        </>
      )}
      {/* START SONG */}
      {gameStep === 'startSong' && (
        <div className="button-container">
          <button onClick={handleStartSong}>Lancer l'extrait</button>
        </div>
      )}
      {/* PLAY SONG */}
      {gameStep === 'playClip' && (
        <div className="button-container">
          <button onClick={handleStopSong}>Arrêter l'extrait et deviner le titre</button>
        </div>
      )}
      {/* GUESS SONG */}
      {inputMode === InputModes.TEXT && gameStep === 'guessTitle' && (
        <div className="button-container">
          <InputComponent onSubmit={handleSubmitAnswer} placeholder="Entrer la réponse..." />
        </div>
      )}
      {inputMode === InputModes.VOCAL && gameStep === 'guessTitle' && (
        <SpeechRecognitionComponent onResult={handleSubmitAnswer} language={language} />
      )}
      {inputMode === InputModes.MIXED && gameStep === 'guessTitle' && (
        <>
          <div className="button-container">
            <InputComponent onSubmit={handleSubmitAnswer} placeholder="Entrer la réponse..." />
          </div>
          <SpeechRecognitionComponent onResult={handleSubmitAnswer} language={language} />
        </>
      )}
      {/* END */}
      {gameStep === 'end' && (
        <div className="button-container">
          <div>Le jeu est terminé. Votre score : {points} points.</div>
        </div>
      )}

      <div className="score-info">
        <div>Points: {points}</div>
        <div>Extraits devinés : {excerptCount}/{maxExcerpts}</div>
      </div>

      <ResponsesComponent responses={responses} />
      <button onClick={handleLogMessageHistory}>Log message history</button>
    </div>
  );
}

export default App;
