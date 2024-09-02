import React, { useState } from 'react';
import './MenuDropDown.css'

function MenuDropDown({ label, options, onItemChange, selectedItem }) {
    return (
        <div className="dropdown-container">
          <button className="dropdown-button">
            {label}
          </button>
          <div className="dropdown-menu">
            {options.map((option, index) => (
              <a className={`dropdown-item ${option.value === selectedItem ? 'selected' : ''}`} href="#" key={index} onClick={() => onItemChange(option.value)}>
                {option.label}
              </a>
            ))}
          </div>
        </div>
      );
  }
  
  export default MenuDropDown;