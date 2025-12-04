import React, { useEffect } from 'react';
import { useBox } from '@react-three/cannon';
import * as THREE from 'three';
import { GAME_CONFIG } from '../../../../utils/games/fps/constants';
import { InputManager } from '../../../../utils/games/fps/inputManager';

export interface PlayerProps {
  position: [number, number, number];
  onUpdate: (pos: [number, number, number]) => void;
  inputState: ReturnType<InputManager['getInputState']> | null;
  cameraRotation: [number, number, number];
}

/**
 * Player capsule component with physics and movement
 */
export function Player({ 
  position, 
  onUpdate,
  inputState,
  cameraRotation
}: PlayerProps) {
  const [ref, api] = useBox(() => ({
    mass: 1,
    position,
    args: [0.6, 1.6, 0.6], // Player capsule dimensions
    type: 'Dynamic',
    material: {
      friction: 0.1,
      restitution: 0,
    },
  }));

  useEffect(() => {
    const unsubscribe = api.position.subscribe((pos) => {
      onUpdate([pos[0], pos[1], pos[2]]);
    });
    return unsubscribe;
  }, [api, onUpdate]);

  // Apply movement forces based on input
  useEffect(() => {
    if (!inputState) return;

    const speed = inputState.sprint 
      ? GAME_CONFIG.PLAYER_SPEED * GAME_CONFIG.PLAYER_SPRINT_MULTIPLIER 
      : GAME_CONFIG.PLAYER_SPEED;
    const yaw = cameraRotation[1];
    
    // Calculate movement direction based on camera rotation
    let moveX = 0;
    let moveZ = 0;
    
    if (inputState.forward) {
      moveX -= Math.sin(yaw) * speed;
      moveZ -= Math.cos(yaw) * speed;
    }
    if (inputState.backward) {
      moveX += Math.sin(yaw) * speed;
      moveZ += Math.cos(yaw) * speed;
    }
    if (inputState.left) {
      moveX -= Math.cos(yaw) * speed;
      moveZ += Math.sin(yaw) * speed;
    }
    if (inputState.right) {
      moveX += Math.cos(yaw) * speed;
      moveZ -= Math.sin(yaw) * speed;
    }

    // Apply velocity
    api.velocity.set(moveX, 0, moveZ);

    // Handle jump - check if on ground first (simple check)
    if (inputState.jump && position[1] < 2.1) {
      api.velocity.set(moveX, GAME_CONFIG.PLAYER_JUMP_FORCE, moveZ);
    }
  }, [inputState, cameraRotation, api, position]);

  return (
    <mesh ref={ref as React.RefObject<THREE.Mesh>} castShadow>
      <capsuleGeometry args={[0.3, 1.6]} />
      <meshStandardMaterial color="#3b82f6" />
    </mesh>
  );
}

