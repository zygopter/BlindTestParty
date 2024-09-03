import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import InteractionStates from '../utils/InteractionState';
import animationDataSpeaking from './../ressources/animations/speaking.json';
import animationDataIdle from './../ressources/animations/idle.json';
import animationDataWaiting from './../ressources/animations/waiting.json';

import './NeonAnimation.css';

function NeonAnimation({ interactionState }) {
    const [animationData, setAnimationData] = useState(animationDataIdle);

    useEffect(() => {
        // Update the animation based on the game state
        if (interactionState === InteractionStates.IDLE) {
            setAnimationData(animationDataIdle);
        } else if (interactionState === InteractionStates.SPEAKING) {
            setAnimationData(animationDataSpeaking);
        } else if (interactionState === InteractionStates.WAITING) {
            setAnimationData(animationDataWaiting);
        } else {
            setAnimationData(animationDataIdle);
        }
    }, [interactionState]);

    return (
        <div className="lottie-animation">
            <Lottie
                animationData={animationData}
                loop={true}
                className="lottie-animation-content"
            />
        </div>
    );
}

export default NeonAnimation;
