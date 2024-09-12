import './App.css';

import React, { useState, useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { startGame, chooseTheme, startSong, submitAnswer, completeAnswer, submitAnswerOrRequest, logMessageHistory } from './api/game';
import MenuDropdown from './components/common/MenuDropDown';
import InputComponent from './components/InputComponent';
import ResponsesComponent from './components/ResponsesComponent';
import SpeechRecognitionComponent from './components/SpeechRecognitionComponent';
import NeonAnimation from './components/NeonAnimation';
import LightsAnimation from './components/LightsAnimation';
import useSpeechSynthesis from './components/SpeechSynthesisComponent';
import GameSteps from './utils/GameSteps';
import InputModes from './utils/InputModes';
import InteractionStates from './utils/InteractionState';
import DebugMenu from './components/DebugMenu';
import Loader from './components/Loader';

import { speakWithOpenAITTS } from './components/OpenAISpeechSynthesis';


function App() {
  const [gameId, setGameId] = useState(null);
  const [responses, setResponses] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [language, setLanguage] = useState('fr-FR');
  const [gameStep, setGameStep] = useState('intro');
  const [interactionState, setInteractionState] = useState(InteractionStates.IDLE);
  const [isPlaying, setIsPlaying] = useState(false);
  const [theme, setTheme] = useState('');
  const [points, setPoints] = useState(0);
  const [excerptCount, setExcerptCount] = useState(0);
  const [maxExcerpts, setMaxExcerpts] = useState(5);
  const [tentativeCount, setTentativeCount] = useState(0);
  const [inputMode, setInputMode] = useState(InputModes.TEXT);
  const [voice, setVoice] = useState('WEB');
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  const currentSound = useRef(null);
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

  const voiceOptions = [
    { value: 'WEB', label: 'Robot'},
    { value: 'OPENAI', label: 'Handsome'},
    { value: 'NONE', label: 'Mute'}
  ]
  
  const handleStartGame = async () => {
    try {
      setInteractionState(InteractionStates.SPEAKING);
      setLoading(true);
      const data = await startGame();
      setGameId(data.gameId);
      setResponses([data.gptAnswer]);
      setTimeout(() => {
        setLoading(false);
      }, 300);
      await speakText(data.gptAnswer, 'Welcome!');
      setGameStep('chooseTheme');
      setInteractionState(InteractionStates.WAITING);
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const handleChooseTheme = async (theme) => {
    try {
      setInteractionState(InteractionStates.SPEAKING);
      setLoading(true);
      const data = await chooseTheme(gameId, theme);
      setTheme(data.gameState.theme);
      setResponses([...responses, data.gptAnswer]);
      setTimeout(() => {
        setLoading(false);
      }, 300);
      await speakText(data.gptAnswer, 'Ready?!');
      setGameStep('startSong');
      setInteractionState(InteractionStates.IDLE);
    } catch (error) {
      console.error('Error choosing theme:', error);
    }
  };

  const handleStartSong = async () => {
    if (excerptCount >= 5) {
      setInteractionState(InteractionStates.SPEAKING);
      await speakText('Le jeu est terminé ! Vous avez joué tous les extraits.', 'Allez ciao!');
      setGameStep('end'); // Marquer la fin du jeu
      setInteractionState(InteractionStates.IDLE);
      return;
    }
    try {
      setInteractionState(InteractionStates.SPEAKING);
      setLoading(true);
      const data = await startSong(gameId);
      setGameStep('playClip');
      setResponses([...responses, data.parsedAnswer.texte]);
      if (currentSound.current) {
        currentSound.current.stop();
      }
      setTimeout(() => {
        setLoading(false);
      }, 300);
      await speakText(data.parsedAnswer.texte, 'Accroche toi à ton slip!');
      setInteractionState(InteractionStates.WAITING);
      setIsPlaying(true);

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
      setInteractionState(InteractionStates.SPEAKING);
      setLoading(true);
      let data;
      if (tentativeCount === 0) {
        data = await submitAnswer(gameId, userAnswer);
      } else {
        data = await completeAnswer(gameId, userAnswer);
      }
      setResponses([...responses, data.parsedAnswer.texte]);
      setPoints(data.points);
      setTimeout(() => {
        setLoading(false);
      }, 300);

      await speakText(data.parsedAnswer.texte, 'Voilà tes points!');
      if (data.success) {
        // Passer à l'extrait suivant ou terminer le jeu
        setTentativeCount(0);
        setExcerptCount((prevCount) => prevCount + 1);
        setGameStep('startSong');
        setInteractionState(InteractionStates.IDLE);
      } else if (tentativeCount > 0) {
        setTentativeCount(0);
        setExcerptCount((prevCount) => prevCount + 1);
        setGameStep('startSong');
        setInteractionState(InteractionStates.IDLE);
      } else {
        setTentativeCount(1);
        if (currentSound.current) {
          currentSound.current.play();
        }
        setGameStep('playClip');
        setInteractionState(InteractionStates.WAITING);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const handleGuessOrHint = async (userAnswer) => {
    try {
      setInteractionState(InteractionStates.SPEAKING);
      setLoading(true);
      const data = await submitAnswerOrRequest(gameId, userAnswer);
      setResponses([...responses, data.parsedAnswer.texte]);
      setTimeout(() => {
        setLoading(false);
      }, 300);
      await speakText(data.parsedAnswer.texte, 'OK!');

      // Stay in scope
      if (!data.isDone) {
        if (currentSound.current) {
          currentSound.current.play();
        }
        setGameStep('playClip');
        setInteractionState(InteractionStates.WAITING);
      }
      else {
        if ((data.parsedAnswer.guessedItems.artiste && data.parsedAnswer.guessedItems.titre) ||
            data.parsedAnswer.evaluated_answer === 'complete') {
          setPoints(3);
        } else if ((data.parsedAnswer.guessedItems.artiste || data.parsedAnswer.guessedItems.titre) ||
            data.parsedAnswer.evaluated_answer === 'partial') {
          setPoints(1);
        }
        setExcerptCount((prevCount) => prevCount + 1);
        setGameStep('startSong');
        setInteractionState(InteractionStates.IDLE);
      }
    } catch (error) {
      console.error('Error submitting answer or asking for hint:', error);
    }
  };

  const handleHint = async () => {
    handleGuessOrHint('Donne moi un indice stp');
  }

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
    setIsPlaying(false);
    setGameStep('guessTitle');
  };

  const handleLanguageChange = (language) => {
    console.log('Language selected:', language);
    setLanguage(language);
  };

  const handleModeChange = (mode) => {
    console.log('Mode selected:', mode);
    setInputMode(mode);
  };

  const handleVoiceChange = (voice) => {
    console.log('Voice selected:', voice);
    setVoice(voice);
  };

  const handleExcerptsChange = (e) => {
    setMaxExcerpts(Number(e.target.value));
  };

  const speakText = async (text, textDefault) => {
    switch (voice) {
      case 'WEB':
        await speak(text);
        break;
      case 'OPENAI':
        await speakWithOpenAITTS(text, language);
        break;
      default:
        await speak(textDefault)
        break;
    }
  };

  useEffect(() => {
    if (excerptCount >= maxExcerpts) {
      speakText('Félicitations ! Vous avez deviné tous les extraits. Le jeu est terminé.', 'Allez ciao!');
      setGameStep('end');
    }
    // eslint-disable-next-line
  }, [excerptCount, maxExcerpts]);

  const handleShowAnswersHistory = () => {
    setIsHistoryOpen(true);
  };

  const handleLogMessageHistory = async () => {
    try {
      const data = await logMessageHistory(gameId);
      console.log(data);
    } catch (error) {
      console.error('Error starting song:', error);
    }
  }

  useEffect(() => {
    setTimeout(() => {
      setFadeOut(true);
    }, 1000);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const resetGame = () => {
    if (currentSound.current) {
      currentSound.current.stop();
    }
    setGameId(null);
    setResponses([]);
    setInteractionState(InteractionStates.IDLE);
    setGameStep('intro');
    setIsPlaying(false);
    setTheme('');
    setPoints(0);
    setExcerptCount(0);
    setTentativeCount(0);
  };
  

  return (
    <div className="App">
      <NeonAnimation interactionState={interactionState} />
      {isPlaying && (
        <LightsAnimation />
      )}
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
        <MenuDropdown
          label="Voice"
          options={voiceOptions}
          onItemChange={handleVoiceChange}
          selectedItem={voice}
        />
      </div>

      {loading && (
        <div className="button-container">
          <Loader />
        </div>
      )}
      {/* START GAME */}
      {!loading && gameStep === 'intro' && (
        <div className="button-container">
          <label>
            Nombre d'extraits :
            <input type="number" value={maxExcerpts} onChange={handleExcerptsChange} min="1" />
          </label>
          <button onClick={handleStartGame}>Démarrer le jeu</button>
        </div>
      )}
      {/* CHOOSE THEME */}
      {!loading && inputMode === InputModes.TEXT && gameStep === 'chooseTheme' && (
        <div className="button-container">
          <InputComponent onSubmit={handleChooseTheme} placeholder="Choisir le thème..." />
        </div>
      )}
      {!loading && inputMode === InputModes.VOCAL && gameStep === 'chooseTheme' && (
        <SpeechRecognitionComponent onResult={handleSpeechReco} language={language} />
      )}
      {!loading && inputMode === InputModes.MIXED && gameStep === 'chooseTheme' && (
        <>
          <div className="button-container">
            <InputComponent onSubmit={handleChooseTheme} placeholder="Choisir le thème..." />
          </div>
          <SpeechRecognitionComponent onResult={handleSpeechReco} language={language} />
        </>
      )}
      {/* START SONG */}
      {!loading && gameStep === 'startSong' && (
        <div className="button-container">
          <button onClick={handleStartSong}>Lancer l'extrait</button>
        </div>
      )}
      {/* PLAY SONG */}
      {!loading && gameStep === 'playClip' && (
        <div className="button-container">
          <button onClick={handleStopSong}>Arrêter l'extrait et deviner le titre</button>
        </div>
      )}
      {/* GUESS SONG */}
      {!loading && inputMode === InputModes.TEXT && gameStep === 'guessTitle' && (
        <div className="button-container">
          <InputComponent onSubmit={handleGuessOrHint} placeholder="Entrer la réponse... (Guess or hint)" />
          <button onClick={handleHint}>Donne moi un indice</button>
        </div>
      )}
      {!loading && inputMode === InputModes.VOCAL && gameStep === 'guessTitle' && (
        <SpeechRecognitionComponent onResult={handleSubmitAnswer} language={language} />
      )}
      {!loading && inputMode === InputModes.MIXED && gameStep === 'guessTitle' && (
        <>
          <div className="button-container">
            <InputComponent onSubmit={handleSubmitAnswer} placeholder="Entrer la réponse..." />
          </div>
          <SpeechRecognitionComponent onResult={handleSubmitAnswer} language={language} />
        </>
      )}
      {/* END */}
      {!loading && gameStep === 'end' && (
        <div className="button-container">
          <div>Le jeu est terminé. Votre score : {points} points.</div>
        </div>
      )}

      <div className="score-info">
        <div>Theme: {theme}</div>
        <div>Points: {points}</div>
        <div>Extraits devinés : {excerptCount}/{maxExcerpts}</div>
        {gameStep !== 'intro' && (
          <button onClick={resetGame}>Quitter la partie</button>
        )}
      </div>

      <DebugMenu
        onShowAnswersHistory={handleShowAnswersHistory}
        onLogMessageHistory={handleLogMessageHistory}
      />
      {isHistoryOpen && (
        <ResponsesComponent history={responses} onClose={() => setIsHistoryOpen(false)} />
      )}
    </div>
  );
}

export default App;
