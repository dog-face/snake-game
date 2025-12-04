// TypeScript types for Three.js mesh extensions used in FPS game

import * as THREE from 'three';

/**
 * Extended Three.js Mesh with game-specific properties
 */
export interface TargetMesh extends THREE.Mesh {
  /**
   * Indicates this mesh is a valid target for raycasting
   */
  isTarget?: boolean;
  
  /**
   * Enemy ID if this mesh represents an enemy
   */
  enemyId?: string;
  
  /**
   * Callback function called when this mesh is hit by a raycast
   */
  onHit?: () => void;
}

/**
 * Type guard to check if an object is a TargetMesh
 */
export function isTargetMesh(object: THREE.Object3D): object is TargetMesh {
  return object instanceof THREE.Mesh && 'isTarget' in object;
}

/**
 * Type guard to check if a TargetMesh has an enemy ID
 */
export function isEnemyMesh(mesh: TargetMesh): mesh is TargetMesh & { enemyId: string } {
  return mesh.isTarget === true && typeof mesh.enemyId === 'string';
}

