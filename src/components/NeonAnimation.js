import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import animationDataSpeaking from './../ressources/animations/speaking.json';
import animationDataIdle from './../ressources/animations/idle.json';

import './NeonAnimation.css';

function NeonAnimation({ gameState }) {
    const [animationData, setAnimationData] = useState(animationDataSpeaking);

    useEffect(() => {
        // Update the animation based on the game state
        if (gameState === 'intro' || gameState === 'startSong') {
            setAnimationData(animationDataIdle); // Change to alternate animation
        } else {
            setAnimationData(animationDataSpeaking); // Default animation for other states
        }
    }, [gameState]);

    return (
        <div className="lottie-animation">
            <Lottie
                animationData={animationData}
                loop={true}
                style={{ width: '70%', height: '70%' }}
            />
        </div>
    );
}

export default NeonAnimation;
