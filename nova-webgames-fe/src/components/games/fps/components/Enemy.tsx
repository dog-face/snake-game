import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useBox } from '@react-three/cannon';
import * as THREE from 'three';
import { GAME_CONFIG } from '../../../../utils/games/fps/constants';
import type { TargetMesh } from '../../../../types/games/fps/threeExtensions';

export interface EnemyData {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  health: number;
}

export interface EnemyProps {
  enemyData: EnemyData;
  onHit: () => void;
  onUpdate: (pos: [number, number, number]) => void;
  movementDirection: [number, number, number];
}

/**
 * Enemy component with health bar and hit effects
 */
export function Enemy({
  enemyData,
  onHit,
  onUpdate,
  movementDirection,
}: EnemyProps) {
  const [ref, api] = useBox(() => ({
    mass: 1,
    position: enemyData.position,
    args: GAME_CONFIG.ENEMY_SIZE,
    type: 'Dynamic',
    material: {
      friction: 0.1,
      restitution: 0,
    },
  }));

  const [isHit, setIsHit] = useState(false);
  const meshRef = useRef<TargetMesh | null>(null);

  // Handle hit flash effect
  useEffect(() => {
    if (isHit) {
      const timer = setTimeout(() => {
        setIsHit(false);
      }, 250); // Flash for 250ms
      return () => clearTimeout(timer);
    }
  }, [isHit]);

  // Update position from physics
  useEffect(() => {
    const unsubscribe = api.position.subscribe((pos) => {
      onUpdate([pos[0], pos[1], pos[2]]);
    });
    return unsubscribe;
  }, [api, onUpdate]);

  // Apply movement based on AI direction
  useEffect(() => {
    const speed = GAME_CONFIG.ENEMY_SPEED;
    const velocity = [
      movementDirection[0] * speed,
      0, // Keep Y at 0 for ground movement
      movementDirection[2] * speed,
    ];
    api.velocity.set(velocity[0], velocity[1], velocity[2]);
  }, [movementDirection, api]);

  // Mark mesh as target and set up hit handler
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.isTarget = true; // Mark as target for raycasting
      meshRef.current.enemyId = enemyData.id; // Store enemy ID
      meshRef.current.onHit = () => {
        setIsHit(true);
        onHit();
      };
    }
  }, [enemyData.id, onHit]);

  // Combined ref handler
  const handleRef = useCallback((node: THREE.Mesh | null) => {
    meshRef.current = node as TargetMesh | null;
    if (node && ref) {
      const boxRef = ref as React.RefObject<THREE.Mesh>;
      if (boxRef && 'current' in boxRef) {
        (boxRef as React.MutableRefObject<THREE.Mesh>).current = node;
      } else if (typeof ref === 'function') {
        (ref as (node: THREE.Mesh | null) => void)(node);
      }
    }
  }, [ref]);

  const healthPercent = Math.max(0, enemyData.health / GAME_CONFIG.ENEMY_HEALTH);
  const isDead = enemyData.health <= 0;
  const [opacity, setOpacity] = useState(1);

  // Handle death animation
  useEffect(() => {
    if (isDead) {
      // Fade out animation
      const fadeOut = setInterval(() => {
        setOpacity(prev => {
          const newOpacity = prev - 0.05;
          if (newOpacity <= 0) {
            clearInterval(fadeOut);
            return 0;
          }
          return newOpacity;
        });
      }, 50);
      return () => clearInterval(fadeOut);
    }
  }, [isDead]);

  // Don't render if fully faded out
  if (isDead && opacity <= 0) {
    return null;
  }

  // Color based on health and hit state
  let color: string = GAME_CONFIG.ENEMY_COLOR;
  if (isHit) {
    color = '#ffffff';
  } else if (healthPercent < 0.3) {
    color = '#dc2626'; // Darker red when low health
  } else if (healthPercent < 0.6) {
    color = '#f59e0b'; // Orange when medium health
  }

  const healthBarHeight = 0.15;
  const healthBarWidth = GAME_CONFIG.ENEMY_SIZE[0] * 1.2;
  const healthBarY = GAME_CONFIG.ENEMY_SIZE[1] / 2 + 0.2;

  return (
    <group>
      <mesh 
        ref={handleRef}
        castShadow 
        receiveShadow
        visible={!isDead || opacity > 0}
      >
        <boxGeometry args={GAME_CONFIG.ENEMY_SIZE} />
        <meshStandardMaterial 
          color={color}
          emissive={isHit ? '#ffffff' : '#000000'}
          emissiveIntensity={isHit ? 0.5 : 0}
          transparent={isDead}
          opacity={opacity}
        />
      </mesh>
      {/* Health bar - simple 3D bar above enemy */}
      {!isDead && (
        <group position={[0, healthBarY, 0]}>
          {/* Background bar */}
          <mesh>
            <planeGeometry args={[healthBarWidth, healthBarHeight]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.7} />
          </mesh>
          {/* Health fill bar */}
          <mesh position={[-(healthBarWidth * (1 - healthPercent)) / 2, 0, 0.01]}>
            <planeGeometry args={[healthBarWidth * healthPercent, healthBarHeight]} />
            <meshBasicMaterial 
              color={healthPercent > 0.5 ? '#22c55e' : healthPercent > 0.25 ? '#f59e0b' : '#ef4444'} 
              transparent 
              opacity={0.9} 
            />
          </mesh>
        </group>
      )}
    </group>
  );
}

