// src/components/Loader.js
import React from 'react';
import Lottie from 'lottie-react';
import spinnerAnimation from '../ressources/animations/catloader.json';
import './Loader.css';

const Loader = () => {
  return (
    <div className="loader">
      <Lottie animationData={spinnerAnimation} loop={true} />
      <h1>CATGPT</h1>
    </div>
  );
};

export default Loader;
