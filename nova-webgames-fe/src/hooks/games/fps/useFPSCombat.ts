import { useState, useRef } from 'react';
import * as THREE from 'three';
import { GAME_CONFIG } from '../../../utils/games/fps/constants';
import { SOUNDS } from '../../../utils/games/fps/audioManager';
import type { AudioManager } from '../../../utils/games/fps/audioManager';
import type { EnemyAI } from '../../../utils/games/fps/enemyAI';
import type { FPSGameState } from '../../../types/games/fps';
import type { TargetMesh } from '../../../types/games/fps/threeExtensions';
import { isEnemyMesh as checkIsEnemyMesh } from '../../../types/games/fps/threeExtensions';

export interface CombatState {
  ammo: number;
  maxAmmo: number;
  reloadTime: number;
}

/**
 * Custom hook for managing FPS combat/shooting logic
 */
export function useFPSCombat(
  audioManager: AudioManager | null,
  enemiesRef: React.MutableRefObject<Map<string, EnemyAI>>,
  setGameState: React.Dispatch<React.SetStateAction<FPSGameState>>,
  getRaycastFn: () => ((origin: THREE.Vector3, direction: THREE.Vector3) => THREE.Intersection | null) | null,
  getPlayerPosition: () => [number, number, number],
  getForwardDirection: () => [number, number, number]
) {
  const [ammo, setAmmo] = useState(30);
  const [maxAmmo] = useState(30);
  const [reloadTime, setReloadTime] = useState(0);
  const lastShotTimeRef = useRef<number>(0);
  const ammoRef = useRef<number>(30);
  const reloadTimeRef = useRef<number>(0);
  
  const handleShoot = (
    input: { shoot: boolean },
    currentTime: number
  ) => {
    const fireRate = 1000 / GAME_CONFIG.WEAPON_FIRE_RATE; // ms between shots
    
    if (input.shoot && ammoRef.current > 0 && 
        currentTime - lastShotTimeRef.current >= fireRate && 
        reloadTimeRef.current === 0) {
      // Perform raycast (hitscan)
      const forward = getForwardDirection();
      const playerPos = getPlayerPosition();
      const origin = new THREE.Vector3(
        playerPos[0],
        playerPos[1] + GAME_CONFIG.CAMERA_HEIGHT,
        playerPos[2]
      );
      const direction = new THREE.Vector3(forward[0], forward[1], forward[2]);
      
      // Perform raycast if function is available
      const raycastFn = getRaycastFn();
      let hit = false;
      let hitEnemyId: string | null = null;
      if (raycastFn) {
        const intersection = raycastFn(origin, direction);
        if (intersection && intersection.distance <= GAME_CONFIG.WEAPON_RANGE) {
          hit = true;
          // Check if we hit an enemy
          const hitMesh = intersection.object as TargetMesh;
          if (checkIsEnemyMesh(hitMesh)) {
            hitEnemyId = hitMesh.enemyId;
            // Apply damage to enemy
            const enemy = enemiesRef.current.get(hitMesh.enemyId);
            if (enemy) {
              enemy.takeDamage(GAME_CONFIG.WEAPON_DAMAGE);
              // Check if enemy died
              if (enemy.health <= 0) {
                setGameState((prev) => ({
                  ...prev,
                  kills: prev.kills + 1,
                  score: prev.score + GAME_CONFIG.ENEMY_KILL_SCORE,
                }));
                // Play enemy death sound
                audioManager?.playSound(SOUNDS.ENEMY_DEATH);
              }
            }
          }
        }
      }
      
      // Play shooting sound
      audioManager?.playSound(SOUNDS.SHOOT);
      
      // Decrement ammo
      setAmmo(prev => {
        const newAmmo = prev - 1;
        ammoRef.current = newAmmo;
        return newAmmo;
      });
      lastShotTimeRef.current = currentTime;
      
      // Only add score if we actually hit something (but not an enemy, that's handled above)
      if (hit && !hitEnemyId) {
        // Play hit sound
        audioManager?.playSound(SOUNDS.HIT);
        setGameState((prev) => ({
          ...prev,
          score: prev.score + 10,
        }));
      } else if (hitEnemyId) {
        // Play hit sound for enemy hit
        audioManager?.playSound(SOUNDS.HIT);
      }
    } else if (input.shoot && ammoRef.current === 0 && 
               currentTime - lastShotTimeRef.current >= fireRate) {
      // Play empty clip sound when trying to shoot with no ammo
      audioManager?.playSound(SOUNDS.EMPTY);
      lastShotTimeRef.current = currentTime;
    }
  };
  
  const handleReload = (input: { reload: boolean }) => {
    if (input.reload && ammoRef.current < maxAmmo && reloadTimeRef.current === 0) {
      setReloadTime(2000); // 2 second reload
      reloadTimeRef.current = 2000;
      // Play reload sound
      audioManager?.playSound(SOUNDS.RELOAD);
    }
  };
  
  const updateReloadTimer = (deltaTime: number) => {
    if (reloadTimeRef.current > 0) {
      const newReloadTime = Math.max(0, reloadTimeRef.current - deltaTime * 1000);
      setReloadTime(newReloadTime);
      reloadTimeRef.current = newReloadTime;
      if (reloadTimeRef.current <= deltaTime * 1000) {
        setAmmo(maxAmmo);
        ammoRef.current = maxAmmo;
      }
    }
  };
  
  const resetCombat = () => {
    setAmmo(maxAmmo);
    setReloadTime(0);
    ammoRef.current = maxAmmo;
    reloadTimeRef.current = 0;
    lastShotTimeRef.current = 0;
  };
  
  return {
    ammo,
    maxAmmo,
    reloadTime,
    handleShoot,
    handleReload,
    updateReloadTimer,
    resetCombat,
  };
}

