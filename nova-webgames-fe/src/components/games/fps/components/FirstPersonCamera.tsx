import { useRef, useEffect } from 'react';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { GAME_CONFIG } from '../../../../utils/games/fps/constants';
import { CameraController } from '../../../../utils/games/fps/cameraController';

export interface FirstPersonCameraProps {
  playerPosition: [number, number, number];
  cameraController: CameraController;
}

/**
 * First-person camera component that follows player
 */
export function FirstPersonCamera({ 
  playerPosition, 
  cameraController 
}: FirstPersonCameraProps) {
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  
  useEffect(() => {
    if (cameraRef.current) {
      const rotation = cameraController.getRotation();
      cameraRef.current.rotation.order = 'YXZ';
      cameraRef.current.rotation.x = rotation[0]; // pitch
      cameraRef.current.rotation.y = rotation[1]; // yaw
      
      // Position camera at eye level
      cameraRef.current.position.set(
        playerPosition[0],
        playerPosition[1] + GAME_CONFIG.CAMERA_HEIGHT,
        playerPosition[2]
      );
    }
  }, [playerPosition, cameraController]);

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      fov={GAME_CONFIG.CAMERA_FOV}
      near={0.1}
      far={1000}
    />
  );
}

