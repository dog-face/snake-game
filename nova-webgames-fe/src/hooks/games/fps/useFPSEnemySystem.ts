import { useRef } from 'react';
import { EnemyAI, EnemyState } from '../../../utils/games/fps/enemyAI';
import { EnemySpawner } from '../../../utils/games/fps/enemySpawner';
import { GAME_CONFIG } from '../../../utils/games/fps/constants';
import { SOUNDS } from '../../../utils/games/fps/audioManager';
import type { AudioManager } from '../../../utils/games/fps/audioManager';
import type { Vector3 } from '../../../utils/games/fps/math';
import type { FPSGameState } from '../../../types/games/fps';

/**
 * Custom hook for managing FPS enemy system
 */
export function useFPSEnemySystem(audioManager: AudioManager | null) {
  const enemiesRef = useRef<Map<string, EnemyAI>>(new Map());
  const enemySpawnerRef = useRef<EnemySpawner | null>(null);
  
  const initializeSpawner = () => {
    enemySpawnerRef.current = new EnemySpawner({
      maxEnemies: GAME_CONFIG.MAX_ENEMIES,
    });
  };
  
  const spawnInitialEnemies = (playerStartPosition: Vector3) => {
    if (!enemySpawnerRef.current) {
      initializeSpawner();
    }
    const initialEnemies = enemySpawnerRef.current?.spawnInitialEnemies(playerStartPosition) || [];
    
    initialEnemies.forEach(enemy => {
      enemiesRef.current.set(enemy.id, enemy);
      // Play spawn sound for each enemy
      audioManager?.playSound(SOUNDS.ENEMY_SPAWN, { volume: 0.3 });
    });
    
    return initialEnemies;
  };
  
  const clearEnemies = () => {
    enemiesRef.current.clear();
  };
  
  const updateEnemies = (
    playerPosition: Vector3,
    deltaTime: number,
    raycastFn: ((origin: Vector3, direction: Vector3) => { distance: number } | null) | undefined,
    setGameState: React.Dispatch<React.SetStateAction<FPSGameState>>,
    audioManager: AudioManager | null
  ) => {
    enemiesRef.current.forEach((enemy) => {
      if (enemy.state !== EnemyState.DEAD) {
        enemy.update({
          playerPosition,
          deltaTime,
          raycast: raycastFn,
        });

        // Handle enemy attacks
        if (enemy.canAttack()) {
          const damage = enemy.getAttackDamage();
          setGameState((prev) => ({
            ...prev,
            player: {
              ...prev.player,
              health: Math.max(0, prev.player.health - damage),
            },
          }));
          // Play enemy attack sound
          audioManager?.playSound(SOUNDS.ENEMY_ATTACK);
        }
      }
    });
  };
  
  const getEnemyData = () => {
    return Array.from(enemiesRef.current.values())
      .filter(e => e.state !== EnemyState.DEAD)
      .map(e => e.getData());
  };
  
  return {
    enemiesRef,
    enemySpawnerRef,
    initializeSpawner,
    spawnInitialEnemies,
    clearEnemies,
    updateEnemies,
    getEnemyData,
  };
}

