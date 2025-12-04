// Stub module for @react-three/fiber
import React from 'react';

export const Canvas = ({ children }: { children: React.ReactNode }) => {
  return React.createElement('div', { 'data-testid': 'canvas' }, children);
};

export const useFrame = () => {};

