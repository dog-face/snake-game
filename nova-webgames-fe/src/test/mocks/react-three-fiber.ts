// Stub module for @react-three/fiber
import React from 'react';

export const Canvas = ({ children }: { children: React.ReactNode }) => {
  return React.createElement('div', { 'data-testid': 'canvas' }, children);
};

export const useFrame = () => {};

// Export useThree for @react-three/drei compatibility
export const useThree = () => ({
  camera: {},
  gl: {},
  scene: {},
  raycaster: {},
  size: { width: 800, height: 600 },
  viewport: { width: 800, height: 600 },
  pointer: { x: 0, y: 0 },
});

