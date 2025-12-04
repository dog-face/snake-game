import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics, usePlane, useBox } from '@react-three/cannon';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useAuth } from '../../../contexts/AuthContext';
import { fpsApi } from '../../../services/games/fps/api';
import { GameLoop } from '../../../utils/games/fps/gameLoop';
import { InputManager } from '../../../utils/games/fps/inputManager';
import { CameraController } from '../../../utils/games/fps/cameraController';
import { GAME_CONFIG } from '../../../utils/games/fps/constants';
import type { FPSGameState } from '../../../types/games/fps';
import './FPSGame.css';

// Ground plane component
function Ground() {
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

// Player capsule component
function Player({ 
  position, 
  onUpdate,
  inputState,
  cameraRotation
}: { 
  position: [number, number, number]; 
  onUpdate: (pos: [number, number, number]) => void;
  inputState: ReturnType<InputManager['getInputState']> | null;
  cameraRotation: [number, number, number];
}) {
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

    const speed = inputState.sprint ? GAME_CONFIG.PLAYER_SPEED * GAME_CONFIG.PLAYER_SPRINT_MULTIPLIER : GAME_CONFIG.PLAYER_SPEED;
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
  }, [inputState, cameraRotation, api]);

  return (
    <mesh ref={ref as React.RefObject<THREE.Mesh>} castShadow>
      <capsuleGeometry args={[0.3, 1.6]} />
      <meshStandardMaterial color="#3b82f6" />
    </mesh>
  );
}

// Camera component that follows player
function FirstPersonCamera({ 
  playerPosition, 
  cameraController 
}: { 
  playerPosition: [number, number, number];
  cameraController: CameraController;
}) {
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

export const FPSGame: React.FC = () => {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<GameLoop | null>(null);
  const inputManagerRef = useRef<InputManager | null>(null);
  const cameraControllerRef = useRef<CameraController | null>(null);
  
  const [gameState, setGameState] = useState<FPSGameState>({
    player: {
      position: [0, 2, 0],
      rotation: [0, 0, 0],
      health: GAME_CONFIG.MAX_HEALTH,
      armor: 0,
    },
    enemies: [],
    projectiles: [],
    score: 0,
    kills: 0,
    deaths: 0,
  });
  
  const [ammo, setAmmo] = useState(30);
  const [maxAmmo] = useState(30);
  const [reloadTime, setReloadTime] = useState(0);
  const lastShotTimeRef = useRef<number>(0);
  
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const playerPositionRef = useRef<[number, number, number]>([0, 2, 0]);
  const inputStateRef = useRef<ReturnType<InputManager['getInputState']> | null>(null);
  const cameraRotationRef = useRef<[number, number, number]>([0, 0, 0]);

  // Initialize game systems
  useEffect(() => {
    inputManagerRef.current = new InputManager();
    cameraControllerRef.current = new CameraController();
    
    return () => {
      inputManagerRef.current?.cleanup();
    };
  }, []);

  // Game loop
  useEffect(() => {
    if (!isGameStarted || isPaused || !inputManagerRef.current || !cameraControllerRef.current) {
      if (gameLoopRef.current) {
        gameLoopRef.current.stop();
        gameLoopRef.current = null;
      }
      return;
    }

    const update = (deltaTime: number) => {
      const input = inputManagerRef.current!.getInputState();
      inputStateRef.current = input;
      
      // Update camera based on mouse movement
      if (input.mouseDeltaX !== 0 || input.mouseDeltaY !== 0) {
        cameraControllerRef.current!.updateMouseLook(input.mouseDeltaX, input.mouseDeltaY);
        inputManagerRef.current!.resetMouseDelta();
      }
      
      // Update camera rotation ref
      cameraRotationRef.current = cameraControllerRef.current!.getRotation();
      
      // Handle shooting
      const currentTime = performance.now();
      const fireRate = 1000 / GAME_CONFIG.WEAPON_FIRE_RATE; // ms between shots
      
      if (input.shoot && ammo > 0 && currentTime - lastShotTimeRef.current >= fireRate && reloadTime === 0) {
        // Perform raycast (hitscan)
        // TODO: Implement actual raycast collision detection
        // const forward = cameraControllerRef.current!.getForwardDirection();
        // const origin = [
        //   playerPositionRef.current[0],
        //   playerPositionRef.current[1] + GAME_CONFIG.CAMERA_HEIGHT,
        //   playerPositionRef.current[2],
        // ] as [number, number, number];
        
        // Simple shooting - in a real game, this would check for collisions
        // For now, just decrement ammo and add score
        setAmmo(prev => prev - 1);
        lastShotTimeRef.current = currentTime;
        
        // Add score for "hitting" something (placeholder)
        setGameState(prev => ({
          ...prev,
          score: prev.score + 10,
        }));
      }
      
      // Handle reload
      if (input.reload && ammo < maxAmmo && reloadTime === 0) {
        setReloadTime(2000); // 2 second reload
      }
      
      // Update reload timer
      if (reloadTime > 0) {
        setReloadTime(prev => Math.max(0, prev - deltaTime * 1000));
        if (reloadTime <= deltaTime * 1000) {
          setAmmo(maxAmmo);
        }
      }
      
      // Update game state based on input
      setGameState(prev => ({
        ...prev,
        player: {
          ...prev.player,
          position: playerPositionRef.current,
          rotation: cameraRotationRef.current,
        },
      }));
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
  }, [isGameStarted, isPaused]);

  // Handle pointer lock for mouse capture
  const handleCanvasClick = useCallback(() => {
    if (canvasRef.current && inputManagerRef.current) {
      inputManagerRef.current.requestPointerLock(canvasRef.current);
    }
  }, []);

  // Prevent context menu on right-click
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (isGameStarted && !isPaused) {
        e.preventDefault();
      }
    };
    window.addEventListener('contextmenu', handleContextMenu);
    return () => window.removeEventListener('contextmenu', handleContextMenu);
  }, [isGameStarted, isPaused]);

  // Handle ESC key for pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isGameStarted) {
        setIsPaused(prev => {
          const newPaused = !prev;
          if (newPaused) {
            inputManagerRef.current?.exitPointerLock();
          } else if (canvasRef.current && inputManagerRef.current) {
            inputManagerRef.current.requestPointerLock(canvasRef.current);
          }
          return newPaused;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isGameStarted]);

  const startGame = () => {
    setIsGameStarted(true);
    setIsPaused(false);
    setGameState({
      player: {
        position: [0, 2, 0],
        rotation: [0, 0, 0],
        health: GAME_CONFIG.MAX_HEALTH,
        armor: 0,
      },
      enemies: [],
      projectiles: [],
      score: 0,
      kills: 0,
      deaths: 0,
    });
    setAmmo(maxAmmo);
    setReloadTime(0);
    playerPositionRef.current = [0, 2, 0];
    lastShotTimeRef.current = 0;
    if (cameraControllerRef.current) {
      cameraControllerRef.current.reset();
    }
  };

  const pauseGame = () => {
    setIsPaused(!isPaused);
    if (isPaused && inputManagerRef.current && canvasRef.current) {
      inputManagerRef.current.requestPointerLock(canvasRef.current);
    } else if (!isPaused) {
      inputManagerRef.current?.exitPointerLock();
    }
  };

  const handleGameOver = async () => {
    if (user && gameState.score > 0) {
      try {
        await fpsApi.submitScore(
          gameState.score,
          gameState.kills,
          gameState.deaths,
          'single-player'
        );
      } catch (error) {
        console.error('Failed to submit score:', error);
      }
    }
    setIsGameStarted(false);
    inputManagerRef.current?.exitPointerLock();
  };

  const updatePlayerPosition = useCallback((pos: [number, number, number]) => {
    playerPositionRef.current = pos;
  }, []);

  return (
    <div className="fps-game-container">
      {!isGameStarted ? (
        <div className="fps-game-menu">
          <h1>🎮 FPS Arena</h1>
          <p>3D First-Person Shooter</p>
          <button onClick={startGame} className="fps-start-button">
            Start Game
          </button>
          <div className="fps-instructions">
            <h3>Controls:</h3>
            <ul>
              <li><strong>WASD</strong> - Move</li>
              <li><strong>Mouse</strong> - Look around</li>
              <li><strong>Space</strong> - Jump</li>
              <li><strong>Shift</strong> - Sprint</li>
              <li><strong>ESC</strong> - Pause/Unpause</li>
            </ul>
          </div>
        </div>
      ) : (
        <>
          <div 
            ref={canvasRef}
            className="fps-canvas-container"
            onClick={handleCanvasClick}
          >
            <Canvas shadows>
              <ambientLight intensity={0.5} />
              <directionalLight
                position={[10, 10, 5]}
                intensity={1}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
              />
              
              <Physics gravity={[0, GAME_CONFIG.GRAVITY, 0]}>
                <Ground />
                <Player 
                  position={playerPositionRef.current}
                  onUpdate={updatePlayerPosition}
                  inputState={inputStateRef.current}
                  cameraRotation={cameraRotationRef.current}
                />
                {cameraControllerRef.current && (
                  <FirstPersonCamera
                    playerPosition={playerPositionRef.current}
                    cameraController={cameraControllerRef.current}
                  />
                )}
              </Physics>
            </Canvas>
          </div>
          
          <div className="fps-hud">
            <div className="fps-hud-top">
              <div className="fps-health">
                <span>Health: {gameState.player.health}</span>
              </div>
              <div className="fps-score">
                <span>Score: {gameState.score}</span>
              </div>
            </div>
            <div className="fps-hud-bottom">
              <div className="fps-ammo">
                <span>{ammo} / {maxAmmo}</span>
                {reloadTime > 0 && (
                  <span className="fps-reload">Reloading...</span>
                )}
              </div>
            </div>
            {!isPaused && <div className="fps-crosshair" />}
            {isPaused && (
              <div className="fps-pause-overlay">
                <h2>PAUSED</h2>
                <button onClick={pauseGame}>Resume</button>
                <button onClick={handleGameOver}>Quit</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
