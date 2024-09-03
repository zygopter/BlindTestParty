import React, { useState } from 'react';
import './DebugMenu.css'; // Import the CSS for styling

function DebugMenu({ onShowAnswersHistory, onLogMessagesHistory }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="debug-menu-container">
      <button className="debug-menu-button" onClick={() => setIsOpen(!isOpen)}>
        Debug Menu
      </button>
      {isOpen && (
        <div className="debug-menu-dropdown">
          <button onClick={onShowAnswersHistory}>Show Answers History</button>
          <button onClick={onLogMessagesHistory}>Log Messages History</button>
        </div>
      )}
    </div>
  );
}

export default DebugMenu;
