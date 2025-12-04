import { useState } from 'react';
import type { FPSGameState } from '../../../types/games/fps';
import { GAME_CONFIG } from '../../../utils/games/fps/constants';

/**
 * Custom hook for managing FPS game state
 */
export function useFPSGameState() {
  const [gameState, setGameState] = useState<FPSGameState>({
    player: {
      position: [0, 2, 0],
      rotation: [0, 0, 0],
      health: GAME_CONFIG.MAX_HEALTH,
      armor: 0,
    },
    enemies: [],
    projectiles: [],
    score: 0,
    kills: 0,
    deaths: 0,
  });
  
  const resetGameState = (playerStartPosition: [number, number, number] = [0, 2, 0]) => {
    setGameState({
      player: {
        position: playerStartPosition,
        rotation: [0, 0, 0],
        health: GAME_CONFIG.MAX_HEALTH,
        armor: 0,
      },
      enemies: [],
      projectiles: [],
      score: 0,
      kills: 0,
      deaths: 0,
    });
  };
  
  return {
    gameState,
    setGameState,
    resetGameState,
  };
}

