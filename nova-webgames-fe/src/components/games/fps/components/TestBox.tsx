import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useBox } from '@react-three/cannon';
import * as THREE from 'three';
import type { TargetMesh } from '../../../../types/games/fps/threeExtensions';

/**
 * Test box component - placed in front of player for visual reference
 */
export function TestBox() {
  const [ref] = useBox(() => ({
    type: 'Static',
    position: [0, 1, -5], // 5 units in front of starting position
    args: [2, 2, 2], // 2x2x2 meter box
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
  
  // Mark mesh as target and set up hit handler
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.isTarget = true; // Mark as target for raycasting
      meshRef.current.onHit = () => {
        setIsHit(true);
      };
    }
  }, []);
  
  // Combined ref handler - useBox ref can be callback or ref object
  const handleRef = useCallback((node: THREE.Mesh | null) => {
    // Store mesh for raycasting
    meshRef.current = node as TargetMesh | null;
    // Pass to useBox ref (cast like Ground component does)
    if (node && ref) {
      const boxRef = ref as React.RefObject<THREE.Mesh>;
      if (boxRef && 'current' in boxRef) {
        (boxRef as React.MutableRefObject<THREE.Mesh>).current = node;
      } else if (typeof ref === 'function') {
        (ref as (node: THREE.Mesh | null) => void)(node);
      }
    }
  }, [ref]);
  
  return (
    <mesh 
      ref={handleRef}
      castShadow 
      receiveShadow
    >
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial 
        color={isHit ? '#ffffff' : '#ef4444'} 
        emissive={isHit ? '#ffffff' : '#000000'}
        emissiveIntensity={isHit ? 0.5 : 0}
      />
    </mesh>
  );
}

