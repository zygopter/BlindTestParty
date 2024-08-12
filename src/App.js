import logo from './logo.svg';
import './App.css';

import React, { useState, useEffect, useRef } from 'react';
import { Howl } from 'howler';
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
  const [currentSong, setCurrentSong] = useState(null);
  const [accessToken, setAccessToken] = useState('');
  const currentSound = useRef(null);

  ///////////////////////
  //  SONG MANAGEMENT  //
  ///////////////////////
  useEffect(() => {
    console.log('Getting Spotify token...');
    const getSpotifyToken = async () => {
      try {
        const response = await axios.post('https://accounts.spotify.com/api/token', 'grant_type=client_credentials', {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(`${process.env.REACT_APP_SPOTIFY_CLIENT_ID}:${process.env.REACT_APP_SPOTIFY_CLIENT_SECRET}`)
          }
        });
        setAccessToken(response.data.access_token);
        console.log('Spotify token acquired');
      } catch (error) {
        console.error('Error getting Spotify token:', error);
      }
    };
  
    getSpotifyToken();
  }, []);

  const playSong = async (artist, title) => {
    console.log(`Searching for song by ${artist} titled ${title}`);
  
    try {
      const response = await axios.get(`https://api.spotify.com/v1/search`, {
        params: {
          q: `artist:${artist} track:${title}`,
          type: 'track',
          limit: 1
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
  
      if (response.data.tracks.items.length > 0) {
        const track = response.data.tracks.items[0];
        if (track.preview_url) {
          console.log('Preview URL found, playing song...');
          if (currentSound.current) {
            console.log('Stopping previous sound...');
            currentSound.current.stop();
          }
          currentSound.current = new Howl({
            src: [track.preview_url],
            html5: true
          });
          currentSound.current.play();
        } else {
          console.error('No preview URL available');
        }
      } else {
        console.error('No tracks found');
      }
    } catch (error) {
      console.error('Error searching for song:', error);
    }
  };

  const stopSong = () => {
    if (currentSound.current) {
      console.log('Stopping the current song...');
      setGameStep('guessTitle');
      currentSound.current.stop();
    } else {
      console.log('No song is currently playing.');
    }
  };
  

  ///////////////////////
  //  GAME MANAGEMENT  //
  ///////////////////////
  const handleQuestionSubmit = async (question) => {
    console.log(`Handling question: "${question}"`);
    const newMessage = { role: "user", content: question };
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
      console.log('Received answer from API:', answer);

      // 1st check: Is the response well formatted?
      let parsedAnswer;
      try {
        parsedAnswer = JSON.parse(answer);
        console.log('JSON parsed successfully:', parsedAnswer);
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        askForWellFormattedResponse();
        return;  // On arrête ici si le JSON est mal formé
      }
      
      // Handle game steps based on the answer
      if (gameStep === 'intro') {
        console.log('Game step: intro');
        setSpeechText(parsedAnswer.texte);
        setGameStep('chooseTheme');
      } else if (gameStep === 'chooseTheme') {
        console.log('Game step: chooseTheme');
        setTheme(question); // TODO! Extract theme from response in json format
        // Is there artiste and title data?
        if (parsedAnswer.extrait && parsedAnswer.extrait.artiste && parsedAnswer.extrait.titre) {
          const { artiste, titre } = parsedAnswer.extrait;
          setCurrentSong({ artiste, titre });
          setSpeechText(parsedAnswer.texte);
          console.log(`Starting new song: ${artiste} - ${titre}`);
          playSong(artiste, titre);
          setGameStep('playClip');
        } else {
          console.error('Missing artist or title in the response.');
          askForCompleteResponse();
          return;
        }
      } else if (gameStep === 'playClip') {
        console.log('Game step: playClip');
        if (question.toLowerCase().includes(currentSong.titre.toLowerCase()) &&
            question.toLowerCase().includes(currentSong.artiste.toLowerCase())) {
          console.log('Correct title and artist guessed.');
          setSpeechText('Vous gagnez 3 points car vous avez deviné le titre et le nom de l\'artiste correctement!');
          // Check for a new song
          if (parsedAnswer.extrait && parsedAnswer.extrait.artiste && parsedAnswer.extrait.titre
            && parsedAnswer.extrait.artiste !== currentSong.artiste && parsedAnswer.extrait.titre !== currentSong.titre) {
            const { artiste, titre } = parsedAnswer.extrait;
            setCurrentSong({ artiste, titre });
            setSpeechText(parsedAnswer.texte);
            playSong(artiste, titre);
            setGameStep('playClip');
          } else {
            console.error('Missing new artist or title in the response.');
            askForNewExtract();
            return;
          }
        } else if (question.toLowerCase().includes(currentSong.titre.toLowerCase())) {
          console.log('Correct title guessed.');
          setSpeechText('Vous gagnez 1 point car vous avez deviné le titre correctement!');
          // Check for a new song
          if (parsedAnswer.extrait && parsedAnswer.extrait.artiste && parsedAnswer.extrait.titre
            && parsedAnswer.extrait.artiste !== currentSong.artiste && parsedAnswer.extrait.titre !== currentSong.titre) {
            const { artiste, titre } = parsedAnswer.extrait;
            setCurrentSong({ artiste, titre });
            setSpeechText(parsedAnswer.texte);
            playSong(artiste, titre);
            setGameStep('playClip');
          } else {
            console.error('Missing new artist or title in the response.');
            askForNewExtract();
            return;
          }
        } else if (question.toLowerCase().includes(currentSong.artiste.toLowerCase())) {
          console.log('Correct artist guessed.');
          setSpeechText('Vous gagnez 1 point car vous avez deviné l\'artiste correctement!');
          // Check for a new song
          if (parsedAnswer.extrait && parsedAnswer.extrait.artiste && parsedAnswer.extrait.titre
            && parsedAnswer.extrait.artiste !== currentSong.artiste && parsedAnswer.extrait.titre !== currentSong.titre) {
            const { artiste, titre } = parsedAnswer.extrait;
            setCurrentSong({ artiste, titre });
            setSpeechText(parsedAnswer.texte);
            playSong(artiste, titre);
            setGameStep('playClip');
          } else {
            console.error('Missing new artist or title in the response.');
            askForNewExtract();
            return;
          }
        } else {
          console.log('Wrong guess, replaying the clip...');
          setSpeechText(parsedAnswer.texte);
          // Relancer l'extrait au même endroit si possible
          if (currentSound.current) {
            currentSound.current.play(); // Rejouer à partir de l'endroit où on s'est arrêté
          }
        }
      } else if (gameStep === 'playNextSong') {
        console.log('Game step: playNextSong');
        // Check for a new song
        if (parsedAnswer.extrait && parsedAnswer.extrait.artiste && parsedAnswer.extrait.titre
          && parsedAnswer.extrait.artiste !== currentSong.artiste && parsedAnswer.extrait.titre !== currentSong.titre) {
          const { artiste, titre } = parsedAnswer.extrait;
          setCurrentSong({ artiste, titre });
          setSpeechText(parsedAnswer.texte);
          playSong(artiste, titre);
          setGameStep('playClip');
        } else {
          console.error('Missing new artist or title in the response.');
          askForNewExtract();
          return;
        }
      } else if (gameStep === 'guessTitle') {
        console.log('Game step: guessTitle');
        if (question.toLowerCase().includes(currentSong.titre.toLowerCase()) &&
            question.toLowerCase().includes(currentSong.artiste.toLowerCase())) {
          console.log('Correct title and artist guessed.');
          setSpeechText('Vous gagnez 3 points car vous avez deviné le titre et le nom de l\'artiste correctement!');
          // Check for a new song
          if (parsedAnswer.extrait && parsedAnswer.extrait.artiste && parsedAnswer.extrait.titre
            && parsedAnswer.extrait.artiste !== currentSong.artiste && parsedAnswer.extrait.titre !== currentSong.titre) {
            const { artiste, titre } = parsedAnswer.extrait;
            setCurrentSong({ artiste, titre });
            setSpeechText(parsedAnswer.texte);
            playSong(artiste, titre);
            setGameStep('playNextSong');
          } else {
            console.error('Missing new artist or title in the response.');
            askForNewExtract();
            return;
          }
        } else if (question.toLowerCase().includes(currentSong.titre.toLowerCase())) {
          console.log('Correct title guessed.');
          setSpeechText('Vous gagnez 1 point car vous avez deviné le titre correctement!');
          // Check for a new song
          if (parsedAnswer.extrait && parsedAnswer.extrait.artiste && parsedAnswer.extrait.titre
            && parsedAnswer.extrait.artiste !== currentSong.artiste && parsedAnswer.extrait.titre !== currentSong.titre) {
            const { artiste, titre } = parsedAnswer.extrait;
            setCurrentSong({ artiste, titre });
            setSpeechText(parsedAnswer.texte);
            playSong(artiste, titre);
            setGameStep('playNextSong');
          } else {
            console.error('Missing new artist or title in the response.');
            askForNewExtract();
            return;
          }
        } else if (question.toLowerCase().includes(currentSong.artiste.toLowerCase())) {
          console.log('Correct artist guessed.');
          setSpeechText('Vous gagnez 1 point car vous avez deviné l\'artiste correctement!');
          // Check for a new song
          if (parsedAnswer.extrait && parsedAnswer.extrait.artiste && parsedAnswer.extrait.titre
            && parsedAnswer.extrait.artiste !== currentSong.artiste && parsedAnswer.extrait.titre !== currentSong.titre) {
            const { artiste, titre } = parsedAnswer.extrait;
            setCurrentSong({ artiste, titre });
            setSpeechText(parsedAnswer.texte);
            playSong(artiste, titre);
            setGameStep('playNextSong');
          } else {
            console.error('Missing new artist or title in the response.');
            askForNewExtract();
            return;
          }
        }
      }

      setMessageHistory(messageHistory => [...updatedHistory, { role: "assistant", content: answer }]);
      console.log('Updated message history:', messageHistory);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSpeechResult = (transcript) => {
    console.log('Speech recognition result:', transcript);
    handleQuestionSubmit(transcript);
  };

  const askForWellFormattedResponse = () => {
    console.log('Requesting well-formatted JSON...');
    const retryMessage = `La réponse n'était pas correctement formatée en JSON. Peux-tu reformuler la réponse en suivant le format JSON indiqué ?`;
    handleQuestionSubmit(retryMessage);
  };

  const askForCompleteResponse = () => {
    console.log('Requesting complete response with artist and title...');
    const retryMessage = `La réponse ne contient pas toutes les informations nécessaires (artiste et titre). Peux-tu reformuler la réponse avec les informations manquantes ?`;
    handleQuestionSubmit(retryMessage);
  };

  const askForNewExtract = () => {
    console.log('Requesting a new extract...');
    const retryMessage = `Propose un nouveau morceau à deviner dans le thème choisi!`;
    handleQuestionSubmit(retryMessage);
  };

  const startGame = () => {
    console.log('Starting new game...');
    setResponses([]);
    setMessageHistory([]);
    setGameStep('intro');

    const systemMessageGiveExtract = {
      role: "system",
      content: `Tu es un présentateur de jeu de blind test.
        Tu proposes des extraits musicaux et demande aux participants de deviner le titre de la chanson ou le nom de l'artiste.
        Avant de démarrer le jeu, tu détermines un thème avec l'utilisateur, puis tu commences le jeu.
        Féliciter les bonnes réponses et encourager les participants en cas de réponse incorrecte.
        Tu ne peux pas proposer deux fois le même extrait dans la même soirée.
        Si une règle du jeu est floue ou si un participant ne comprend pas, fournir des explications simples et rapides. Parler de manière
        conviviale et enjouée, comme un animateur de télévision.
        
        Chaque réponse doit être formatée en JSON de manière concise et précise.
        Le format de la réponse doit être :

        {
          "texte": "Texte que le présentateur doit dire.",
          "extrait": {
            "artiste": "Nom de l'artiste",
            "titre": "Titre de la chanson"
          }
        }

        Par exemple, une réponse pourrait ressembler à ceci :

        {
          "texte": "Voici le premier extrait, soyez prêts !",
          "extrait": {
            "artiste": "Kenny Loggins",
            "titre": "Footloose"
          }
        }

        Assurez-vous que chaque réponse suit ce format strict.
        Attention, tu es un assistant oral alors soit conçis et ne dépasse pas 250 tokens par réponses.`
    };

    setMessageHistory(messageHistory => [...messageHistory, systemMessageGiveExtract]);
    console.log('Initial message history:', systemMessageGiveExtract);
    console.log('Verifying state of messageHistory:', messageHistory);
  };

  useEffect(() => {
    if (messageHistory.length === 1 && messageHistory[0].role === "system") {
      console.log('Triggering first question after game start...');
      handleQuestionSubmit('un joueur vient de lancer la partie pour jouer au blindtest');
    }
  }, [messageHistory]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleInputSubmit = (e) => {
    e.preventDefault();
    console.log('Input submitted:', inputText);
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
      {gameStep === 'chooseTheme' && <InputComponent onSubmit={handleQuestionSubmit} placeholder="Choisir le thème..."/>}
      {(gameStep === 'playClip' || gameStep === 'playNextSong') && <button onClick={() => {
        console.log('Stopping song and moving to guessTitle step...');
        stopSong();
      }}>Arrêter l'extrait et deviner le titre</button>}
      {gameStep === 'guessTitle' && <InputComponent onSubmit={handleQuestionSubmit} placeholder="Entrer la réponse..."/>}

      <ResponsesComponent responses={responses} />
    </div>
  );
}

export default App;
