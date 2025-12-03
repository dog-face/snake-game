import React from 'react';
import { Link } from 'react-router-dom';
import { Game } from '@/data/games';
import './GameCard.css';

interface GameCardProps {
  game: Game;
}

export const GameCard: React.FC<GameCardProps> = ({ game }) => {
  return (
    <div className={`game-card ${!game.available ? 'coming-soon' : ''}`}>
      {game.thumbnail ? (
        <img src={game.thumbnail} alt={game.title} className="game-thumbnail" />
      ) : (
        <div className="game-thumbnail-placeholder">
          {game.id === 'snake' ? '🐍' : '🎮'}
        </div>
      )}
      <div className="game-card-content">
        <h3 className="game-title">{game.title}</h3>
        <p className="game-description">{game.description}</p>
        {game.available ? (
          <Link to={game.route} className="game-play-button">
            Play Now
          </Link>
        ) : (
          <div className="game-coming-soon">Coming Soon</div>
        )}
      </div>
    </div>
  );
};


