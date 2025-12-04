import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import * as THREE from 'three';
import { useAuth } from '../../../contexts/AuthContext';
import { fpsApi } from '../../../services/games/fps/api';
import { InputManager } from '../../../utils/games/fps/inputManager';
import { CameraController } from '../../../utils/games/fps/cameraController';
import { GAME_CONFIG } from '../../../utils/games/fps/constants';
import { Ground } from './components/Ground';
import { TestBox } from './components/TestBox';
import { Enemy } from './components/Enemy';
import { Player } from './components/Player';
import { FirstPersonCamera } from './components/FirstPersonCamera';
import { RaycastSystem } from './components/RaycastSystem';
import { useFPSAudio } from '../../../hooks/games/fps/useFPSAudio';
import { useFPSGameState } from '../../../hooks/games/fps/useFPSGameState';
import { useFPSCombat } from '../../../hooks/games/fps/useFPSCombat';
import { useFPSEnemySystem } from '../../../hooks/games/fps/useFPSEnemySystem';
import { useFPSGameLoop } from '../../../hooks/games/fps/useFPSGameLoop';
import './FPSGame.css';

export const FPSGame: React.FC = () => {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLDivElement>(null);
  const inputManagerRef = useRef<InputManager | null>(null);
  const cameraControllerRef = useRef<CameraController | null>(null);
  
  const { gameState, setGameState, resetGameState } = useFPSGameState();
  const {
    audioManager,
    masterVolume,
    setMasterVolume,
    sfxVolume,
    setSFXVolume,
    musicVolume,
    setMusicVolume,
    isMuted,
    setIsMuted,
  } = useFPSAudio();
  
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const playerPositionRef = useRef<[number, number, number]>([0, 2, 0]);
  const raycastFnRef = useRef<((origin: THREE.Vector3, direction: THREE.Vector3) => THREE.Intersection | null) | null>(null);
  
  const {
    enemiesRef,
    initializeSpawner,
    spawnInitialEnemies,
    clearEnemies,
    updateEnemies,
    getEnemyData,
  } = useFPSEnemySystem(audioManager);
  
  const {
    ammo,
    maxAmmo,
    reloadTime,
    handleShoot,
    handleReload,
    updateReloadTimer,
    resetCombat,
  } = useFPSCombat(
    audioManager,
    enemiesRef,
    setGameState,
    () => raycastFnRef.current,
    () => playerPositionRef.current,
    () => cameraControllerRef.current?.getForwardDirection() || [0, 0, -1]
  );
  
  // Initialize game systems
  useEffect(() => {
    inputManagerRef.current = new InputManager();
    cameraControllerRef.current = new CameraController();
    initializeSpawner();
    
    return () => {
      inputManagerRef.current?.cleanup();
    };
  }, [initializeSpawner]);
  
  // Game loop update callback - use useCallback to stabilize
  const gameLoopUpdate = useCallback((deltaTime: number) => {
    if (!inputManagerRef.current || !cameraControllerRef.current) return;
    
    const input = inputManagerRef.current.getInputState();
    
    // Handle shooting
    const currentTime = performance.now();
    handleShoot(input, currentTime);
    
    // Handle reload
    handleReload(input);
    
    // Update reload timer
    updateReloadTimer(deltaTime);
    
    // Create raycast wrapper for enemy AI
    const raycastWrapper = raycastFnRef.current
      ? (origin: [number, number, number], direction: [number, number, number]) => {
          const originVec = new THREE.Vector3(origin[0], origin[1], origin[2]);
          const directionVec = new THREE.Vector3(direction[0], direction[1], direction[2]);
          const result = raycastFnRef.current!(originVec, directionVec);
          return result ? { distance: result.distance } : null;
        }
      : undefined;
    
    // Update enemies
    updateEnemies(
      playerPositionRef.current,
      deltaTime,
      raycastWrapper,
      setGameState,
      audioManager
    );
    
    // Update game state with enemy data
    setGameState(prev => ({
      ...prev,
      player: {
        ...prev.player,
        position: playerPositionRef.current,
        rotation: cameraRotationRef.current,
      },
      enemies: getEnemyData(),
    }));
  }, [handleShoot, handleReload, updateReloadTimer, updateEnemies, getEnemyData, setGameState, audioManager]);
  
  // Game loop
  const { inputStateRef, cameraRotationRef } = useFPSGameLoop(
    isGameStarted,
    isPaused,
    inputManagerRef.current,
    cameraControllerRef.current,
    {
      onUpdate: gameLoopUpdate,
    }
  );
  
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
    
    // Clear existing enemies
    clearEnemies();
    
    // Spawn initial enemies using spawner
    const playerStartPosition: [number, number, number] = [0, 2, 0];
    spawnInitialEnemies(playerStartPosition);
    
    resetGameState(playerStartPosition);
    resetCombat();
    playerPositionRef.current = playerStartPosition;
    if (cameraControllerRef.current) {
      cameraControllerRef.current.reset();
    }
    // Start ambient music
    audioManager?.startAmbient();
  };
  
  const pauseGame = () => {
    const newPaused = !isPaused;
    setIsPaused(newPaused);
    
    // Pause/resume ambient music
    if (newPaused) {
      audioManager?.stopAmbient();
      inputManagerRef.current?.exitPointerLock();
    } else {
      audioManager?.startAmbient();
      if (inputManagerRef.current && canvasRef.current) {
        inputManagerRef.current.requestPointerLock(canvasRef.current);
      }
    }
  };
  
  const handleGameOver = async () => {
    // Stop ambient music
    audioManager?.stopAmbient();
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
  
  const handleEnemyHit = useCallback(() => {
    // Hit callback is handled in shooting logic
    // This is just for visual feedback
  }, []);
  
  const handleEnemyPositionUpdate = useCallback((enemyId: string, pos: [number, number, number]) => {
    const enemy = enemiesRef.current.get(enemyId);
    if (enemy) {
      enemy.position = pos;
    }
  }, [enemiesRef]);
  
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
          <div className="fps-audio-settings">
            <h3>Audio Settings</h3>
            <div className="fps-volume-control">
              <label>
                <span>Master Volume: {Math.round(masterVolume * 100)}%</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={masterVolume}
                  onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                />
              </label>
            </div>
            <div className="fps-volume-control">
              <label>
                <span>SFX Volume: {Math.round(sfxVolume * 100)}%</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={sfxVolume}
                  onChange={(e) => setSFXVolume(parseFloat(e.target.value))}
                />
              </label>
            </div>
            <div className="fps-volume-control">
              <label>
                <span>Music Volume: {Math.round(musicVolume * 100)}%</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={musicVolume}
                  onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                />
              </label>
            </div>
            <button
              className="fps-mute-button"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? '🔇 Unmute' : '🔊 Mute'}
            </button>
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
                <RaycastSystem 
                  onRaycastReady={(fn) => {
                    raycastFnRef.current = fn;
                  }}
                />
                <Ground />
                <TestBox />
                {gameState.enemies.map((enemy) => {
                  const enemyAI = enemiesRef.current.get(enemy.id);
                  const movementDir = enemyAI
                    ? enemyAI.getMovementDirection({
                        playerPosition: playerPositionRef.current,
                        deltaTime: 0.016, // Approximate frame time
                      })
                    : [0, 0, 0];
                  return (
                    <Enemy
                      key={enemy.id}
                      enemyData={enemy}
                      onHit={() => handleEnemyHit()}
                      onUpdate={(pos) => handleEnemyPositionUpdate(enemy.id, pos)}
                      movementDirection={movementDir as [number, number, number]}
                    />
                  );
                })}
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
                <div className="fps-pause-buttons">
                  <button onClick={pauseGame}>Resume</button>
                  <button onClick={handleGameOver}>Quit</button>
                </div>
                <div className="fps-audio-settings-pause">
                  <h3>Audio Settings</h3>
                  <div className="fps-volume-control">
                    <label>
                      <span>Master: {Math.round(masterVolume * 100)}%</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={masterVolume}
                        onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                      />
                    </label>
                  </div>
                  <div className="fps-volume-control">
                    <label>
                      <span>SFX: {Math.round(sfxVolume * 100)}%</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={sfxVolume}
                        onChange={(e) => setSFXVolume(parseFloat(e.target.value))}
                      />
                    </label>
                  </div>
                  <div className="fps-volume-control">
                    <label>
                      <span>Music: {Math.round(musicVolume * 100)}%</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={musicVolume}
                        onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                      />
                    </label>
                  </div>
                  <button
                    className="fps-mute-button"
                    onClick={() => setIsMuted(!isMuted)}
                  >
                    {isMuted ? '🔇 Unmute' : '🔊 Mute'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
