import { useEffect, useRef } from 'react';
import { GameLoop } from '../../../utils/games/fps/gameLoop';
import { InputManager } from '../../../utils/games/fps/inputManager';
import { CameraController } from '../../../utils/games/fps/cameraController';

export interface GameLoopCallbacks {
  onUpdate: (deltaTime: number) => void;
}

/**
 * Custom hook for managing FPS game loop
 */
export function useFPSGameLoop(
  isGameStarted: boolean,
  isPaused: boolean,
  inputManager: InputManager | null,
  cameraController: CameraController | null,
  callbacks: GameLoopCallbacks
) {
  const gameLoopRef = useRef<GameLoop | null>(null);
  const inputStateRef = useRef<ReturnType<InputManager['getInputState']> | null>(null);
  const cameraRotationRef = useRef<[number, number, number]>([0, 0, 0]);
  
  useEffect(() => {
    if (!isGameStarted || isPaused || !inputManager || !cameraController) {
      if (gameLoopRef.current) {
        gameLoopRef.current.stop();
        gameLoopRef.current = null;
      }
      return;
    }

    const update = (deltaTime: number) => {
      const input = inputManager.getInputState();
      inputStateRef.current = input;
      
      // Update camera based on mouse movement
      if (input.mouseDeltaX !== 0 || input.mouseDeltaY !== 0) {
        cameraController.updateMouseLook(input.mouseDeltaX, input.mouseDeltaY);
        inputManager.resetMouseDelta();
      }
      
      // Update camera rotation ref
      cameraRotationRef.current = cameraController.getRotation();
      
      // Call the update callback
      callbacks.onUpdate(deltaTime);
    };

    const render = () => {
      // Rendering is handled by React Three Fiber
    };

    gameLoopRef.current = new GameLoop(update, render);
    gameLoopRef.current.start();

    return () => {
      if (gameLoopRef.current) {
        gameLoopRef.current.stop();
        gameLoopRef.current = null;
      }
    };
  }, [isGameStarted, isPaused, inputManager, cameraController, callbacks]);
  
  return {
    inputStateRef,
    cameraRotationRef,
  };
}

