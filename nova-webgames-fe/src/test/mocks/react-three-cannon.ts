// Stub module for @react-three/cannon
import React from 'react';

export const Physics = ({ children }: { children: React.ReactNode }) => {
  return React.createElement('div', { 'data-testid': 'physics' }, children);
};

export const usePlane = () => [() => {}];

export const useBox = () => [
  () => {},
  {
    position: { subscribe: () => () => {} },
    velocity: { set: () => {} },
  },
];

