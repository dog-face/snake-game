import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { apiService } from '../../../services/api';
import { createInitialGameState, moveSnake, getNextDirection } from '../../../utils/games/snake/gameLogic';
import { GameState, GameMode } from '../../../types/games/snake';
import './SnakeGame.css';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const GAME_SPEED = 150;

export const SnakeGame: React.FC = () => {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  const [gameMode, setGameMode] = useState<GameMode>('pass-through');
  const [isPaused, setIsPaused] = useState(false);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const directionRef = useRef<string | null>(null);
  const gameLoopRef = useRef<number | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const updateWatchRef = useRef<number | null>(null);
  const gameStateRef = useRef<GameState>(gameState);

  const startGame = async () => {
    setGameState(createInitialGameState());
    setIsGameStarted(true);
    setIsPaused(false);
    directionRef.current = null;
    
    // Start watch session
    if (user) {
      try {
        const { sessionId } = await apiService.startGameSession(gameMode);
        sessionIdRef.current = sessionId;
      } catch (error) {
        console.error('Failed to start watch session:', error);
      }
    }
  };

  const pauseGame = () => {
    setIsPaused(!isPaused);
  };

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (!isGameStarted || isPaused || gameState.gameOver) return;
    
    const newDirection = getNextDirection(e.key);
    if (newDirection) {
      directionRef.current = e.key;
      setGameState(prev => moveSnake(prev, newDirection, gameMode));
    }
  }, [isGameStarted, isPaused, gameState.gameOver, gameMode]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  // Keep gameStateRef in sync with gameState
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    if (!isGameStarted || isPaused || gameState.gameOver) {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      if (updateWatchRef.current) {
        clearInterval(updateWatchRef.current);
        updateWatchRef.current = null;
      }
      return;
    }

    gameLoopRef.current = window.setInterval(() => {
      setGameState(prev => {
        if (prev.gameOver) return prev;
        return moveSnake(prev, null, gameMode);
      });
    }, GAME_SPEED);

    // Update watch session periodically (every 500ms)
    if (sessionIdRef.current && user) {
      updateWatchRef.current = window.setInterval(async () => {
        if (sessionIdRef.current) {
          try {
            await apiService.updateGameState(sessionIdRef.current, gameStateRef.current);
          } catch (error) {
            console.error('Failed to update watch session:', error);
          }
        }
      }, 500);
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
      if (updateWatchRef.current) {
        clearInterval(updateWatchRef.current);
      }
    };
  }, [isGameStarted, isPaused, gameState.gameOver, gameMode, user]);

  useEffect(() => {
    if (gameState.gameOver && user) {
      // End watch session
      if (sessionIdRef.current) {
        apiService.endGameSession(sessionIdRef.current, gameState.score, gameMode)
          .catch(console.error);
        sessionIdRef.current = null;
      }
      
      // Submit to leaderboard
      if (gameState.score > 0) {
        apiService.submitScore(gameState.score, gameMode).catch(console.error);
      }
    }
  }, [gameState.gameOver, gameState.score, gameMode, user]);

  const renderCell = (x: number, y: number) => {
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
    <div className="game-container">
      <div className="game-header">
        <h2>Snake Game</h2>
        <div className="game-info">
          <div className="score">Score: {gameState.score}</div>
          <div className="game-mode-selector">
            <label>
              <input
                type="radio"
                value="pass-through"
                checked={gameMode === 'pass-through'}
                onChange={(e) => setGameMode(e.target.value as GameMode)}
                disabled={isGameStarted}
              />
              Pass-through
            </label>
            <label>
              <input
                type="radio"
                value="walls"
                checked={gameMode === 'walls'}
                onChange={(e) => setGameMode(e.target.value as GameMode)}
                disabled={isGameStarted}
              />
              Walls
            </label>
          </div>
        </div>
      </div>

      <div className="game-board-container">
        <div
          className="game-board"
          style={{
            gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
          }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => {
            const x = i % GRID_SIZE;
            const y = Math.floor(i / GRID_SIZE);
            return renderCell(x, y);
          })}
        </div>

        {!isGameStarted && (
          <div className="game-overlay">
            <div className="overlay-content">
              <h3>Ready to play?</h3>
              <p>Use arrow keys or WASD to control</p>
              <button onClick={startGame} className="game-button">
                Start Game
              </button>
            </div>
          </div>
        )}

        {gameState.gameOver && (
          <div className="game-overlay">
            <div className="overlay-content">
              <h3>Game Over!</h3>
              <p>Final Score: {gameState.score}</p>
              <button onClick={startGame} className="game-button">
                Play Again
              </button>
            </div>
          </div>
        )}

        {isPaused && (
          <div className="game-overlay">
            <div className="overlay-content">
              <h3>Paused</h3>
              <button onClick={pauseGame} className="game-button">
                Resume
              </button>
            </div>
          </div>
        )}
      </div>

      {isGameStarted && !gameState.gameOver && (
        <button onClick={pauseGame} className="pause-button">
          {isPaused ? 'Resume' : 'Pause'}
        </button>
      )}

      <div className="game-instructions">
        <p>Use Arrow Keys or WASD to control the snake</p>
        <p>Mode: {gameMode === 'pass-through' ? 'Pass-through (wrap around)' : 'Walls (game over on collision)'}</p>
      </div>
    </div>
  );
};

