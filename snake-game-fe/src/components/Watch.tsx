import React, { useState, useEffect, useRef } from 'react';
import { apiService, ActivePlayer } from '../services/api';
import { moveSnake } from '../utils/gameLogic';
import { GameMode } from '../types/game';
import './Watch.css';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const UPDATE_INTERVAL = 200; // Update every 200ms for smoother animation

export const Watch: React.FC = () => {
  const [activePlayers, setActivePlayers] = useState<ActivePlayer[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<ActivePlayer | null>(null);
  const [loading, setLoading] = useState(true);
  const gameLoopRef = useRef<number | null>(null);

  useEffect(() => {
    loadActivePlayers();
    const interval = setInterval(loadActivePlayers, 3000); // Refresh list every 3 seconds
    return () => clearInterval(interval);
  }, []);

  // Sync selectedPlayer with activePlayers when it updates
  useEffect(() => {
    if (selectedPlayer) {
      const updated = activePlayers.find(p => p.id === selectedPlayer.id);
      if (updated) {
        setSelectedPlayer(updated);
      }
    }
  }, [activePlayers]);

  useEffect(() => {
    if (!selectedPlayer) {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    // Simulate game updates for the selected player
    gameLoopRef.current = window.setInterval(() => {
      setActivePlayers(prev => {
        return prev.map(player => {
          if (player.id === selectedPlayer.id) {
            const updatedState = moveSnake(player.gameState, null, player.gameMode);
            
            // If game over, reset the game for demo purposes
            if (updatedState.gameOver) {
              return {
                ...player,
                gameState: {
                  ...updatedState,
                  gameOver: false,
                  score: 0,
                  snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }],
                  food: { x: 15, y: 15 },
                  direction: 'right',
                },
              };
            }

            // Occasionally change direction for demo (simulating player input)
            if (Math.random() < 0.1) {
              const directions: Array<'up' | 'down' | 'left' | 'right'> = ['up', 'down', 'left', 'right'];
              const newDirection = directions[Math.floor(Math.random() * directions.length)];
              return {
                ...player,
                gameState: moveSnake(updatedState, newDirection, player.gameMode),
                score: updatedState.score,
              };
            }

            return {
              ...player,
              gameState: updatedState,
              score: updatedState.score,
            };
          }
          return player;
        });
      });
    }, UPDATE_INTERVAL);

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [selectedPlayer?.id]);

  const loadActivePlayers = async () => {
    try {
      const players = await apiService.getActivePlayers();
      setActivePlayers(players);
      
      // If we have a selected player, update it
      setSelectedPlayer(prev => {
        if (prev) {
          const updated = players.find(p => p.id === prev.id);
          return updated || prev;
        }
        // Auto-select first player if none selected
        return players.length > 0 ? players[0] : null;
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to load active players:', error);
      setLoading(false);
    }
  };

  const renderCell = (x: number, y: number, gameState: ActivePlayer['gameState']) => {
    const isSnakeHead = gameState.snake[0]?.x === x && gameState.snake[0]?.y === y;
    const isSnakeBody = gameState.snake.slice(1).some(segment => segment.x === x && segment.y === y);
    const isFood = gameState.food.x === x && gameState.food.y === y;

    let className = 'cell';
    if (isSnakeHead) className += ' snake-head';
    else if (isSnakeBody) className += ' snake-body';
    else if (isFood) className += ' food';

    return <div key={`${x}-${y}`} className={className} />;
  };

  return (
    <div className="watch-container">
      <h2>Watch Players</h2>
      
      {loading ? (
        <div className="loading">Loading active players...</div>
      ) : activePlayers.length === 0 ? (
        <div className="no-players">No active players at the moment</div>
      ) : (
        <div className="watch-content">
          <div className="players-list">
            <h3>Active Players</h3>
            {activePlayers.map(player => (
              <div
                key={player.id}
                className={`player-card ${selectedPlayer?.id === player.id ? 'selected' : ''}`}
                onClick={() => setSelectedPlayer(player)}
              >
                <div className="player-username">{player.username}</div>
                <div className="player-info">
                  <span className="player-score">Score: {player.score}</span>
                  <span className={`mode-badge ${player.gameMode}`}>
                    {player.gameMode}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {selectedPlayer && (
            <div className="watch-game">
              <div className="watch-game-header">
                <h3>Watching: {selectedPlayer.username}</h3>
                <div className="watch-game-info">
                  <span>Score: {selectedPlayer.score}</span>
                  <span className={`mode-badge ${selectedPlayer.gameMode}`}>
                    {selectedPlayer.gameMode}
                  </span>
                </div>
              </div>
              <div
                className="watch-game-board"
                style={{
                  gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
                  gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
                }}
              >
                {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
                  const x = i % GRID_SIZE;
                  const y = Math.floor(i / GRID_SIZE);
                  return renderCell(x, y, selectedPlayer.gameState);
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

