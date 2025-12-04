import React from 'react';
import { usePlane } from '@react-three/cannon';
import * as THREE from 'three';

/**
 * Ground plane component for the FPS game
 */
export function Ground() {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0],
  }));
  
  return (
    <mesh ref={ref as React.RefObject<THREE.Mesh>} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#4a5568" />
    </mesh>
  );
}

