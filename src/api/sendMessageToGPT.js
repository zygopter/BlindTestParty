import axios from 'axios';

async function sendMessageToGPT(question, messageHistory, temperature = 0.7) {
  const newMessage = { role: "user", content: question };
  const updatedHistory = [...messageHistory, newMessage];

  console.log('Sending messages to GPT:', updatedHistory);

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-4o-mini",
      max_tokens: 250,
      temperature: temperature,
      messages: updatedHistory
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const answer = response.data.choices[0].message.content;
    console.log('Received answer from GPT:', answer);

    return answer;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error; // Renvoyer l'erreur pour que l'appelant puisse la gérer
  }
}

export default sendMessageToGPT;
