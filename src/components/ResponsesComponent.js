import React from 'react';

function ResponsesComponent({ responses }) {
  return (
    <ul>
      {responses.map((response, index) => (
        <li key={index}>{response}</li>
      ))}
    </ul>
  );
}

export default ResponsesComponent;
