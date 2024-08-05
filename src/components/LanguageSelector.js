// src/components/LanguageSelector.js
import React from 'react';

function LanguageSelector({ selectedLanguage, onLanguageChange }) {
  return (
    <div>
      <label htmlFor="language">Choisissez la langue: </label>
      <select id="language" value={selectedLanguage} onChange={(e) => onLanguageChange(e.target.value)}>
        <option value="fr-FR">Français</option>
        <option value="en-US">Anglais</option>
        <option value="es-ES">Espagnol</option>
        <option value="de-DE">Allemand</option>
      </select>
    </div>
  );
}

export default LanguageSelector;
