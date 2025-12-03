import React from 'react';
import './FPSGame.css';

export const FPSGame: React.FC = () => {
  return (
    <div className="fps-game-container">
      <div className="coming-soon-message">
        <h1>🎮 FPS Arena</h1>
        <p>Coming Soon!</p>
        <p className="description">
          A 3D first-person shooter arena game is in development.
          Check back soon for updates!
        </p>
        <div className="features-preview">
          <h3>Planned Features:</h3>
          <ul>
            <li>3D first-person perspective</li>
            <li>Multiplayer arena combat</li>
            <li>Weapon selection and customization</li>
            <li>Leaderboards and statistics</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

