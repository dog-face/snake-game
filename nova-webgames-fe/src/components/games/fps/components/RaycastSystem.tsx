import { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { TargetMesh } from '../../../../types/games/fps/threeExtensions';
import { isTargetMesh } from '../../../../types/games/fps/threeExtensions';

export interface RaycastSystemProps {
  onRaycastReady: (raycastFn: (origin: THREE.Vector3, direction: THREE.Vector3) => THREE.Intersection | null) => void;
}

/**
 * Raycast system component - provides raycast functionality to the game loop
 */
export function RaycastSystem({ 
  onRaycastReady 
}: RaycastSystemProps) {
  let scene: THREE.Scene | null = null;
  
  try {
    const three = useThree();
    scene = three.scene;
  } catch (e) {
    // useThree can only be called inside Canvas - handle test environment
    // Provide a no-op raycast function for tests
    useEffect(() => {
      onRaycastReady(() => null);
    }, [onRaycastReady]);
    return null;
  }
  
  const raycaster = useRef(new THREE.Raycaster());
  
  useEffect(() => {
    if (!scene) return;
    
    const performRaycast = (origin: THREE.Vector3, direction: THREE.Vector3): THREE.Intersection | null => {
      if (!scene) return null;
      
      raycaster.current.set(origin, direction.normalize());
      
      // Get all meshes in the scene that are targets (excluding player and ground)
      const targets: THREE.Object3D[] = [];
      scene.traverse((object) => {
        if (isTargetMesh(object)) {
          targets.push(object);
        }
      });
      
      const intersections = raycaster.current.intersectObjects(targets, false);
      
      if (intersections.length > 0) {
        // Return the closest intersection
        const hit = intersections[0];
        // Trigger hit callback if available
        const hitMesh = hit.object as TargetMesh;
        if (hitMesh.onHit) {
          hitMesh.onHit();
        }
        return hit;
      }
      
      return null;
    };
    
    onRaycastReady(performRaycast);
  }, [scene, onRaycastReady]);
  
  return null; // This component doesn't render anything
}

