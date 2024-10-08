import React, { useState } from 'react';

function InputComponent({ onSubmit, placeholder }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSubmit(input);
      setInput('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
      />
      <button type="submit">Envoyer</button>
    </form>
  );
}

export default InputComponent;
