import logo from './logo.svg';
import './App.css';

import React, { useState, useEffect, useRef } from 'react';
import { Howl } from 'howler';
import axios from 'axios';
import { startGame, chooseTheme, startSong, submitAnswer } from './api/game';
import InputComponent from './components/InputComponent';
import ResponsesComponent from './components/ResponsesComponent';
import SpeechRecognitionComponent from './components/SpeechRecognitionComponent';
import SpeechSynthesisComponent from './components/SpeechSynthesisComponent';
import LanguageSelector from './components/LanguageSelector';
import GameSteps from './utils/GameSteps';
import sendMessageToGPT from './api/sendMessageToGPT';

function App() {
  const [gameId, setGameId] = useState(null);
  const [responses, setResponses] = useState([]);
  const [speechText, setSpeechText] = useState('');
  const [language, setLanguage] = useState('fr-FR');
  const [gameStep, setGameStep] = useState('intro');
  const [theme, setTheme] = useState('');
  const [points, setPoints] = useState(0);

  const handleStartGame = async () => {
    try {
      const data = await startGame();
      setGameId(data.gameId);
      setResponses([data.gptAnswer]);
      setSpeechText(data.gptAnswer);
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
      setSpeechText(data.gptAnswer);
      setGameStep('startSong');
    } catch (error) {
      console.error('Error choosing theme:', error);
    }
  };

  const handleStartSong = async () => {
    try {
      const data = await startSong(gameId);
      setResponses([...responses, data.parsedAnswer.texte]);
      setSpeechText(data.parsedAnswer.texte);
      setGameStep('playClip');
    } catch (error) {
      console.error('Error starting song:', error);
    }
  };

  const handleSubmitAnswer = async (userAnswer) => {
    try {
      const data = await submitAnswer(gameId, userAnswer);
      setResponses([...responses, data.gptAnswer]);
      setPoints(data.points);

      if (data.success) {
        // Passer à l'extrait suivant ou terminer le jeu
        setGameStep('startSong');
      } else {
        // Relancer l'extrait si la réponse est incorrecte
        setGameStep('playClip');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  return (
    <div className="App">
      <LanguageSelector selectedLanguage={language} onLanguageChange={setLanguage} />
      <SpeechRecognitionComponent onResult={handleSubmitAnswer} language={language} />
      <SpeechSynthesisComponent text={speechText} language={language} />

      {gameStep === 'intro' && <button onClick={handleStartGame}>Démarrer le jeu</button>}
      {gameStep === 'chooseTheme' && <InputComponent onSubmit={handleChooseTheme} placeholder="Choisir le thème..." />}
      {gameStep === 'startSong' && <button onClick={handleStartSong}>Lancer l'extrait</button>}
      {gameStep === 'playClip' && <InputComponent onSubmit={handleSubmitAnswer} placeholder="Entrer la réponse..." />}

      <ResponsesComponent responses={responses} />
      <div>Points: {points}</div>
    </div>
  );
}

// function App() {
//   const [responses, setResponses] = useState([]);
//   const [speechText, setSpeechText] = useState('');
//   const [language, setLanguage] = useState('fr-FR');
//   const [gameStep, setGameStep] = useState(GameSteps.INTRO);
//   const [theme, setTheme] = useState('');
//   const [inputText, setInputText] = useState('');
//   const [messageHistory, setMessageHistory] = useState([]);
//   const [currentSong, setCurrentSong] = useState(null);
//   const [songHistory, setSongHistory] = useState([]);
//   const [accessToken, setAccessToken] = useState('');
//   const [points, setPoints] = useState(0);
//   const [songCount, setSongCount] = useState(0);
//   const currentSound = useRef(null);

//   ///////////////////////
//   //  SONG MANAGEMENT  //
//   ///////////////////////
//   useEffect(() => {
//     console.log('Getting Spotify token...');
//     const getSpotifyToken = async () => {
//       try {
//         const response = await axios.post('https://accounts.spotify.com/api/token', 'grant_type=client_credentials', {
//           headers: {
//             'Content-Type': 'application/x-www-form-urlencoded',
//             'Authorization': 'Basic ' + btoa(`${process.env.REACT_APP_SPOTIFY_CLIENT_ID}:${process.env.REACT_APP_SPOTIFY_CLIENT_SECRET}`)
//           }
//         });
//         setAccessToken(response.data.access_token);
//         console.log('Spotify token acquired');
//       } catch (error) {
//         console.error('Error getting Spotify token:', error);
//       }
//     };
  
//     getSpotifyToken();
//   }, []);

//   const playSong = async (artist, title) => {
//     console.log(`Searching for song by ${artist} titled ${title}`);
  
//     try {
//       const response = await axios.get(`https://api.spotify.com/v1/search`, {
//         params: {
//           q: `artist:${artist} track:${title}`,
//           type: 'track',
//           limit: 1
//         },
//         headers: {
//           'Authorization': `Bearer ${accessToken}`
//         }
//       });
  
//       if (response.data.tracks.items.length > 0) {
//         const track = response.data.tracks.items[0];
//         if (track.preview_url) {
//           console.log('Preview URL found, playing song...');
//           if (currentSound.current) {
//             console.log('Stopping previous sound...');
//             currentSound.current.stop();
//           }
//           currentSound.current = new Howl({
//             src: [track.preview_url],
//             html5: true
//           });
//           currentSound.current.play();
//         } else {
//           console.error('No preview URL available');
//           askForAvailableExtract();
//         }
//       } else {
//         console.error('No tracks found');
//         askForAvailableExtract();
//       }
//     } catch (error) {
//       console.error('Error searching for song:', error);
//       askForAvailableExtract();
//     }
//   };

//   const stopSong = () => {
//     if (currentSound.current) {
//       console.log('Stopping the current song...');
//       setGameStep(GameSteps.GUESS_TITLE);
//       currentSound.current.stop();
//     } else {
//       console.log('No song is currently playing.');
//     }
//   };
  

//   ///////////////////////
//   //  GAME MANAGEMENT  //
//   ///////////////////////
//   const handleQuestionSubmit = async (question) => {
//     console.log(`Handling question: "${question}"`);
//     const exclusionList = songHistory.map(song => `NOM_ARTISTE="${song.artiste}" TITRE="${song.titre}"`).join(", ");
//     const userMessageWithExclusions = exclusionList
//       ? `${question} Note pour le sytem:
//       - Évite d'utiliser les musiques suivantes mais ne le mentionne pas dans ta réponse: ${exclusionList}.
//       - La chanson qui est en cours de devination est ${currentSong.titre} de ${currentSong.artiste}`
//       : question;
//     console.log(`Augmented message with restrictions: "${userMessageWithExclusions}"`)
//     try {
//       const answer = await sendMessageToGPT(userMessageWithExclusions, messageHistory, 0.8);
//       setResponses([...responses, answer]);

//       // 1st check: Is the response well formatted?
//       let parsedAnswer;
//       try {
//         parsedAnswer = JSON.parse(answer);
//         console.log('JSON parsed successfully:', parsedAnswer);
//       } catch (jsonError) {
//         console.error('Error parsing JSON response:', jsonError);
//         askForWellFormattedResponse();
//         return;  // On arrête ici si le JSON est mal formé
//       }
      
//       // Handle game steps based on the answer
//       if (gameStep === GameSteps.INTRO) {
//         console.log('Game step: intro');
//         setSpeechText(parsedAnswer.texte);
//         setGameStep(GameSteps.CHOOSE_THEME);
//       }
//       else if (gameStep === GameSteps.CHOOSE_THEME) {
//         console.log('Game step: chooseTheme');
//         setTheme(question); // TODO! Extract theme from response in json format
//         // Is there artiste and title data?
//         if (!playExtractIfPresent(parsedAnswer)) return;
//       }
//       else if (gameStep === GameSteps.PLAY_CLIP || gameStep === GameSteps.GUESS_TITLE) {
//         console.log('Game step: playClip or guessTitle');
//         let earnedPoints = 0;
//         if (question.toLowerCase().includes(currentSong.titre.toLowerCase()) &&
//             question.toLowerCase().includes(currentSong.artiste.toLowerCase())) {
//           console.log('Correct title and artist guessed.');
//           earnedPoints = 3;
//           setSpeechText('Vous gagnez 3 points car vous avez deviné le titre et le nom de l\'artiste correctement!');
//         } else if (question.toLowerCase().includes(currentSong.titre.toLowerCase())) {
//           console.log('Correct title guessed.');
//           earnedPoints = 1;
//           setSpeechText('Vous gagnez 1 point car vous avez deviné le titre correctement!');
//         } else if (question.toLowerCase().includes(currentSong.artiste.toLowerCase())) {
//           console.log('Correct artist guessed.');
//           earnedPoints = 1;
//           setSpeechText('Vous gagnez 1 point car vous avez deviné l\'artiste correctement!');
//         } else {
//           console.log('Wrong guess, replaying the clip...');
//           setSpeechText(parsedAnswer.texte);

//           // Relancer l'extrait au même endroit si possible
//           if (currentSound.current) {
//             currentSound.current.play(); // Rejouer à partir de l'endroit où on s'est arrêté
//           }
//         }
//         if (earnedPoints>0) {
//           setPoints(prevPoints => prevPoints + earnedPoints);
//           setSongCount(prevCount => prevCount + 1);
//           if (songCount >= 5) {  // Si 5 extraits ont été joués, le jeu se termine
//             console.log('Game over. Final score:', points);
//             setSpeechText(`Le jeu est terminé ! Vous avez cumulé ${points} points.`);
//             setGameStep(GameSteps.END);
//           } else {
//             // Continue avec un nouveau morceau
//             if (!playExtractIfPresent(parsedAnswer)) return;
//           }
//         }
//         setGameStep(GameSteps.PLAY_CLIP);
//       } else if (gameStep === 'playNextSong') {
//         console.log('Game step: playNextSong');
//         // Check for a new song
//         if (parsedAnswer.extrait.artiste !== currentSong.artiste && parsedAnswer.extrait.titre !== currentSong.titre) {
//           if (!playExtractIfPresent(parsedAnswer)) return;
//         }
//       }

//       setMessageHistory(messageHistory => [...messageHistory, { role: "assistant", content: answer }]);
//       console.log('Updated message history:', messageHistory);
//     } catch (error) {
//       console.error('Error sending message:', error);
//     }
//   };

//   const playExtractIfPresent = (parsedAnswer) => {
//     if (parsedAnswer.extrait && parsedAnswer.extrait.artiste && parsedAnswer.extrait.titre) {
//       const { artiste, titre } = parsedAnswer.extrait;
//       setCurrentSong({ artiste, titre });
//       setSongHistory(prevSongHistory => [...prevSongHistory, {artiste, titre}]);
//       setSpeechText(parsedAnswer.texte);
//       console.log(`Starting new song: ${artiste} - ${titre}`);
//       playSong(artiste, titre);
//       setGameStep(GameSteps.PLAY_CLIP);
//       return true;
//     } else {
//       console.error('Missing artist or title in the response.');
//       askForNewExtract();
//       return false;
//     }
//   }

//   const handleSpeechResult = (transcript) => {
//     console.log('Speech recognition result:', transcript);
//     handleQuestionSubmit(transcript);
//   };

//   const askForWellFormattedResponse = () => {
//     console.log('Requesting well-formatted JSON...');
//     const retryMessage = `La réponse n'était pas correctement formatée en JSON. Peux-tu reformuler la réponse en suivant le format JSON indiqué ?`;
//     handleQuestionSubmit(retryMessage);
//   };

//   const askForNewExtract = () => {
//     console.log('Requesting a new extract...');
//     const retryMessage = `Propose un nouveau morceau à deviner dans le thème choisi!`;
//     handleQuestionSubmit(retryMessage);
//   };

//   const askForAvailableExtract = () => {
//     console.log('Requesting a new extract as the last one was unavailable...');
//     const retryMessage = `Propose un autre morceau à deviner dans le thème choisi, car le précédent n'était pas disponible.`;
//     handleQuestionSubmit(retryMessage);
//   };

//   const startGame = () => {
//     console.log('Starting new game...');
//     setResponses([]);
//     setMessageHistory([]);
//     setPoints(0);
//     setSongCount(0);
//     setSongHistory([]);
//     setGameStep(GameSteps.INTRO);

//     const systemMessageGiveExtract = {
//       role: "system",
//       content: `Tu es un présentateur de jeu de blind test.
//         Tu proposes des extraits musicaux et demande aux participants de deviner le titre de la chanson ou le nom de l'artiste.
//         Avant de démarrer le jeu, tu détermines un thème avec l'utilisateur, puis tu commences le jeu.
//         Féliciter les bonnes réponses et encourager les participants en cas de réponse incorrecte.
//         Tu ne peux pas proposer deux fois le même extrait dans la même soirée.
//         Si une règle du jeu est floue ou si un participant ne comprend pas, fournir des explications simples et rapides. Parler de manière
//         conviviale et enjouée, comme un animateur de télévision.
        
//         Chaque réponse doit être formatée en JSON de manière concise et précise.
//         Le format de la réponse doit être :

//         {
//           "texte": "Texte que le présentateur doit dire.",
//           "extrait": {
//             "artiste": "Nom de l'artiste",
//             "titre": "Titre de la chanson"
//           }
//         }

//         Par exemple, une réponse pourrait ressembler à ceci :

//         {
//           "texte": "Voici le premier extrait, soyez prêts !",
//           "extrait": {
//             "artiste": "Kenny Loggins",
//             "titre": "Footloose"
//           }
//         }

//         Assurez-vous que chaque réponse suit ce format strict.
//         Attention, tu es un assistant oral alors soit conçis et ne dépasse pas 250 tokens par réponses.`
//     };

//     setMessageHistory(messageHistory => [...messageHistory, systemMessageGiveExtract]);
//     console.log('Initial message history:', systemMessageGiveExtract);
//     console.log('Verifying state of messageHistory:', messageHistory);
//   };

//   useEffect(() => {
//     if (messageHistory.length === 1 && messageHistory[0].role === "system") {
//       console.log('Triggering first question after game start...');
//       handleQuestionSubmit('un joueur vient de lancer la partie pour jouer au blindtest');
//     }
//   }, [messageHistory]);

//   return (
//     <div className="App">
//       <LanguageSelector selectedLanguage={language} onLanguageChange={setLanguage} />
//       <SpeechRecognitionComponent onResult={handleSpeechResult} language={language} />
//       <SpeechSynthesisComponent text={speechText} language={language} />

//       {gameStep === GameSteps.INTRO && <button onClick={startGame}>Démarrer le jeu</button>}
//       {gameStep === GameSteps.CHOOSE_THEME && <InputComponent onSubmit={handleQuestionSubmit} placeholder="Choisir le thème..."/>}
//       {(gameStep === GameSteps.PLAY_CLIP || gameStep === 'playNextSong') && <button onClick={() => {
//         console.log('Stopping song and moving to guessTitle step...');
//         stopSong();
//       }}>Arrêter l'extrait et deviner le titre</button>}
//       {gameStep === GameSteps.GUESS_TITLE && <InputComponent onSubmit={handleQuestionSubmit} placeholder="Entrer la réponse..."/>}
//       {gameStep === GameSteps.END && <div>Jeu terminé. Votre score : {points} points.</div>}

//       <ResponsesComponent responses={responses} />
//     </div>
//   );
// }

export default App;
