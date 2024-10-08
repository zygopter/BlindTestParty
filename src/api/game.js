import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;


// Fonction pour démarrer un nouveau jeu
export const startGame = async () => {
  try {
    console.log('Posting to ', API_BASE_URL);
    const response = await axios.post(`${API_BASE_URL}/game/start-game`);
    return response.data;
  } catch (error) {
    console.error('Failed to start the game:', error);
    throw error;
  }
};

// Fonction pour choisir un thème
export const chooseTheme = async (gameId, theme) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/game/choose-theme`, { gameId, theme });
    return response.data;
  } catch (error) {
    console.error('Failed to choose the theme:', error);
    throw error;
  }
};

// Fonction pour démarrer un extrait
export const startSong = async (gameId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/game/start-song`, { gameId });
    return response.data;
  } catch (error) {
    console.error('Failed to start the song:', error);
    throw error;
  }
};

// Fonction pour soumettre une réponse
export const submitAnswer = async (gameId, userAnswer) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/game/guess-answer`, { gameId, userAnswer });
    return response.data;
  } catch (error) {
    console.error('Failed to submit the answer:', error);
    throw error;
  }
};

// Fonction pour compléter une réponse
export const completeAnswer = async (gameId, userAnswer) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/game/complete-answer`, { gameId, userAnswer });
    return response.data;
  } catch (error) {
    console.error('Failed to complete the answer:', error);
    throw error;
  }
};

// Fonction pour soumettre une réponse ou une requête
export const submitAnswerOrRequest = async (gameId, userAnswer) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/game/submit-answer-or-request`, { gameId, userAnswer });
    return response.data;
  } catch (error) {
    console.error('Failed to submit the answer:', error);
    throw error;
  }
};

// DEBUG: Log message history
export const logMessageHistory = async (gameId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/game/log-message-history`, { gameId });
    return response.data;
  } catch (error) {
    console.error('Failed to log the message history:', error);
    throw error;
  }
};