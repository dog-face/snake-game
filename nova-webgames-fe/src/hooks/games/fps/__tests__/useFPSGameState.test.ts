import { renderHook, act } from '@testing-library/react';
import { useFPSGameState } from '../useFPSGameState';
import { GAME_CONFIG } from '../../../../utils/games/fps/constants';

describe('useFPSGameState', () => {
  it('should initialize with default game state', () => {
    const { result } = renderHook(() => useFPSGameState());
    
    expect(result.current.gameState).toEqual({
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
  });
  
  it('should reset game state', () => {
    const { result } = renderHook(() => useFPSGameState());
    
    // Modify state
    act(() => {
      result.current.setGameState(prev => ({
        ...prev,
        score: 100,
        kills: 5,
      }));
    });
    
    expect(result.current.gameState.score).toBe(100);
    expect(result.current.gameState.kills).toBe(5);
    
    // Reset state
    act(() => {
      result.current.resetGameState([10, 5, 10]);
    });
    
    expect(result.current.gameState).toEqual({
      player: {
        position: [10, 5, 10],
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
  });
  
  it('should update game state', () => {
    const { result } = renderHook(() => useFPSGameState());
    
    act(() => {
      result.current.setGameState(prev => ({
        ...prev,
        score: 50,
        player: {
          ...prev.player,
          health: 75,
        },
      }));
    });
    
    expect(result.current.gameState.score).toBe(50);
    expect(result.current.gameState.player.health).toBe(75);
  });
});

