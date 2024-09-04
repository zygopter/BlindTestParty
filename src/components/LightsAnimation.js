import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import animationDataDesktopLights from './../ressources/animations/lights.json';
import animationDataMobileLights from './../ressources/animations/discolight.json';
import animationDataMobileMusicNote from './../ressources/animations/notemusic.json';
import useIsMobile from './hooks/isMobile.js';

import './LightsAnimation.css';

function LightsAnimation() {
    const isMobile = useIsMobile();
    const animationDataLights = (isMobile ? animationDataMobileLights : animationDataDesktopLights);

    return (
        <div className="music-lights-animation">
            <Lottie
                animationData={animationDataLights}
                loop={true}
                className="music-lights-animation-content"
            />
            {isMobile && (
                <Lottie
                    animationData={animationDataMobileMusicNote}
                    loop={true}
                    className="music-lights-animation-content"
                />
            )}
        </div>
    );
}

export default LightsAnimation;
