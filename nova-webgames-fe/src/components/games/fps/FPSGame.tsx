import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Physics, usePlane, useBox } from '@react-three/cannon';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useAuth } from '../../../contexts/AuthContext';
import { fpsApi } from '../../../services/games/fps/api';
import { GameLoop } from '../../../utils/games/fps/gameLoop';
import { InputManager } from '../../../utils/games/fps/inputManager';
import { CameraController } from '../../../utils/games/fps/cameraController';
import { AudioManager, SOUNDS } from '../../../utils/games/fps/audioManager';
import { GAME_CONFIG } from '../../../utils/games/fps/constants';
import { EnemyAI, EnemyState } from '../../../utils/games/fps/enemyAI';
import { EnemySpawner } from '../../../utils/games/fps/enemySpawner';
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

// Test box component - placed in front of player for visual reference
function TestBox() {
  const [ref] = useBox(() => ({
    type: 'Static',
    position: [0, 1, -5], // 5 units in front of starting position
    args: [2, 2, 2], // 2x2x2 meter box
  }));
  
  const [isHit, setIsHit] = useState(false);
  const meshRef = useRef<THREE.Mesh | null>(null);
  
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
      (meshRef.current as any).isTarget = true; // Mark as target for raycasting
      (meshRef.current as any).onHit = () => {
        setIsHit(true);
      };
    }
  }, []);
  
  // Combined ref handler - useBox ref can be callback or ref object
  const handleRef = useCallback((node: THREE.Mesh | null) => {
    // Store mesh for raycasting
    meshRef.current = node;
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

// Enemy component
function Enemy({
  enemyData,
  onHit,
  onUpdate,
  movementDirection,
}: {
  enemyData: {
    id: string;
    position: [number, number, number];
    rotation: [number, number, number];
    health: number;
  };
  onHit: () => void;
  onUpdate: (pos: [number, number, number]) => void;
  movementDirection: [number, number, number];
}) {
  const [ref, api] = useBox(() => ({
    mass: 1,
    position: enemyData.position,
    args: GAME_CONFIG.ENEMY_SIZE,
    type: 'Dynamic',
    material: {
      friction: 0.1,
      restitution: 0,
    },
  }));

  const [isHit, setIsHit] = useState(false);
  const meshRef = useRef<THREE.Mesh | null>(null);

  // Handle hit flash effect
  useEffect(() => {
    if (isHit) {
      const timer = setTimeout(() => {
        setIsHit(false);
      }, 250); // Flash for 250ms
      return () => clearTimeout(timer);
    }
  }, [isHit]);

  // Update position from physics
  useEffect(() => {
    const unsubscribe = api.position.subscribe((pos) => {
      onUpdate([pos[0], pos[1], pos[2]]);
    });
    return unsubscribe;
  }, [api, onUpdate]);

  // Apply movement based on AI direction
  useEffect(() => {
    const speed = GAME_CONFIG.ENEMY_SPEED;
    const velocity = [
      movementDirection[0] * speed,
      0, // Keep Y at 0 for ground movement
      movementDirection[2] * speed,
    ];
    api.velocity.set(velocity[0], velocity[1], velocity[2]);
  }, [movementDirection, api]);

  // Mark mesh as target and set up hit handler
  useEffect(() => {
    if (meshRef.current) {
      (meshRef.current as any).isTarget = true; // Mark as target for raycasting
      (meshRef.current as any).enemyId = enemyData.id; // Store enemy ID
      (meshRef.current as any).onHit = () => {
        setIsHit(true);
        onHit();
      };
    }
  }, [enemyData.id, onHit]);

  // Combined ref handler
  const handleRef = useCallback((node: THREE.Mesh | null) => {
    meshRef.current = node;
    if (node && ref) {
      const boxRef = ref as React.RefObject<THREE.Mesh>;
      if (boxRef && 'current' in boxRef) {
        (boxRef as React.MutableRefObject<THREE.Mesh>).current = node;
      } else if (typeof ref === 'function') {
        (ref as (node: THREE.Mesh | null) => void)(node);
      }
    }
  }, [ref]);

  const healthPercent = Math.max(0, enemyData.health / GAME_CONFIG.ENEMY_HEALTH);
  const isDead = enemyData.health <= 0;
  const [opacity, setOpacity] = useState(1);

  // Handle death animation
  useEffect(() => {
    if (isDead) {
      // Fade out animation
      const fadeOut = setInterval(() => {
        setOpacity(prev => {
          const newOpacity = prev - 0.05;
          if (newOpacity <= 0) {
            clearInterval(fadeOut);
            return 0;
          }
          return newOpacity;
        });
      }, 50);
      return () => clearInterval(fadeOut);
    }
  }, [isDead]);

  // Don't render if fully faded out
  if (isDead && opacity <= 0) {
    return null;
  }

  // Color based on health and hit state
  let color: string = GAME_CONFIG.ENEMY_COLOR;
  if (isHit) {
    color = '#ffffff';
  } else if (healthPercent < 0.3) {
    color = '#dc2626'; // Darker red when low health
  } else if (healthPercent < 0.6) {
    color = '#f59e0b'; // Orange when medium health
  }

  const healthBarHeight = 0.15;
  const healthBarWidth = GAME_CONFIG.ENEMY_SIZE[0] * 1.2;
  const healthBarY = GAME_CONFIG.ENEMY_SIZE[1] / 2 + 0.2;

  return (
    <group>
      <mesh 
        ref={handleRef}
        castShadow 
        receiveShadow
        visible={!isDead || opacity > 0}
      >
        <boxGeometry args={GAME_CONFIG.ENEMY_SIZE} />
        <meshStandardMaterial 
          color={color}
          emissive={isHit ? '#ffffff' : '#000000'}
          emissiveIntensity={isHit ? 0.5 : 0}
          transparent={isDead}
          opacity={opacity}
        />
      </mesh>
      {/* Health bar - simple 3D bar above enemy */}
      {!isDead && (
        <group position={[0, healthBarY, 0]}>
          {/* Background bar */}
          <mesh>
            <planeGeometry args={[healthBarWidth, healthBarHeight]} />
            <meshBasicMaterial color="#000000" transparent opacity={0.7} />
          </mesh>
          {/* Health fill bar */}
          <mesh position={[-(healthBarWidth * (1 - healthPercent)) / 2, 0, 0.01]}>
            <planeGeometry args={[healthBarWidth * healthPercent, healthBarHeight]} />
            <meshBasicMaterial 
              color={healthPercent > 0.5 ? '#22c55e' : healthPercent > 0.25 ? '#f59e0b' : '#ef4444'} 
              transparent 
              opacity={0.9} 
            />
          </mesh>
        </group>
      )}
    </group>
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

// Raycast system component - provides raycast functionality to the game loop
function RaycastSystem({ 
  onRaycastReady 
}: { 
  onRaycastReady: (raycastFn: (origin: THREE.Vector3, direction: THREE.Vector3) => THREE.Intersection | null) => void;
}) {
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
        if (object instanceof THREE.Mesh && (object as any).isTarget) {
          targets.push(object);
        }
      });
      
      const intersections = raycaster.current.intersectObjects(targets, false);
      
      if (intersections.length > 0) {
        // Return the closest intersection
        const hit = intersections[0];
        // Trigger hit callback if available
        if ((hit.object as any).onHit) {
          (hit.object as any).onHit();
        }
        return hit;
      }
      
      return null;
    };
    
    onRaycastReady(performRaycast);
  }, [scene, onRaycastReady]);
  
  return null; // This component doesn't render anything
}

export const FPSGame: React.FC = () => {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<GameLoop | null>(null);
  const inputManagerRef = useRef<InputManager | null>(null);
  const cameraControllerRef = useRef<CameraController | null>(null);
  const audioManagerRef = useRef<AudioManager | null>(null);
  
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
  const ammoRef = useRef<number>(30);
  const reloadTimeRef = useRef<number>(0);
  
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const playerPositionRef = useRef<[number, number, number]>([0, 2, 0]);
  const inputStateRef = useRef<ReturnType<InputManager['getInputState']> | null>(null);
  const cameraRotationRef = useRef<[number, number, number]>([0, 0, 0]);
  const raycastFnRef = useRef<((origin: THREE.Vector3, direction: THREE.Vector3) => THREE.Intersection | null) | null>(null);
  const enemiesRef = useRef<Map<string, EnemyAI>>(new Map());
  const enemySpawnerRef = useRef<EnemySpawner | null>(null);
  
  // Audio settings state
  const [masterVolume, setMasterVolume] = useState(() => {
    const saved = localStorage.getItem('fps-master-volume');
    return saved ? parseFloat(saved) : 1.0;
  });
  const [sfxVolume, setSFXVolume] = useState(() => {
    const saved = localStorage.getItem('fps-sfx-volume');
    return saved ? parseFloat(saved) : 1.0;
  });
  const [musicVolume, setMusicVolume] = useState(() => {
    const saved = localStorage.getItem('fps-music-volume');
    return saved ? parseFloat(saved) : 0.5;
  });
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('fps-muted');
    return saved === 'true';
  });

  // Initialize game systems
  useEffect(() => {
    inputManagerRef.current = new InputManager();
    cameraControllerRef.current = new CameraController();
    audioManagerRef.current = new AudioManager({
      masterVolume,
      sfxVolume,
      musicVolume,
      muted: isMuted,
    });
    enemySpawnerRef.current = new EnemySpawner({
      maxEnemies: GAME_CONFIG.MAX_ENEMIES,
    });
    
    return () => {
      inputManagerRef.current?.cleanup();
      audioManagerRef.current?.cleanup();
    };
  }, []);
  
  // Update audio settings when they change
  useEffect(() => {
    if (audioManagerRef.current) {
      audioManagerRef.current.setMasterVolume(masterVolume);
      localStorage.setItem('fps-master-volume', masterVolume.toString());
    }
  }, [masterVolume]);
  
  useEffect(() => {
    if (audioManagerRef.current) {
      audioManagerRef.current.setSFXVolume(sfxVolume);
      localStorage.setItem('fps-sfx-volume', sfxVolume.toString());
    }
  }, [sfxVolume]);
  
  useEffect(() => {
    if (audioManagerRef.current) {
      audioManagerRef.current.setMusicVolume(musicVolume);
      localStorage.setItem('fps-music-volume', musicVolume.toString());
    }
  }, [musicVolume]);
  
  useEffect(() => {
    if (audioManagerRef.current) {
      if (isMuted) {
        audioManagerRef.current.mute();
      } else {
        audioManagerRef.current.unmute();
      }
      localStorage.setItem('fps-muted', isMuted.toString());
    }
  }, [isMuted]);

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
      
      if (input.shoot && ammoRef.current > 0 && currentTime - lastShotTimeRef.current >= fireRate && reloadTimeRef.current === 0) {
        // Perform raycast (hitscan)
        const forward = cameraControllerRef.current!.getForwardDirection();
        const origin = new THREE.Vector3(
          playerPositionRef.current[0],
          playerPositionRef.current[1] + GAME_CONFIG.CAMERA_HEIGHT,
          playerPositionRef.current[2]
        );
        const direction = new THREE.Vector3(forward[0], forward[1], forward[2]);
        
        // Perform raycast if function is available
        let hit = false;
        let hitEnemyId: string | null = null;
        if (raycastFnRef.current) {
          const intersection = raycastFnRef.current(origin, direction);
          if (intersection && intersection.distance <= GAME_CONFIG.WEAPON_RANGE) {
            hit = true;
            // Check if we hit an enemy
            const hitObject = intersection.object as any;
            const enemyId = hitObject.enemyId;
            if (enemyId && typeof enemyId === 'string') {
              hitEnemyId = enemyId;
              // Apply damage to enemy
              const enemy = enemiesRef.current.get(enemyId);
              if (enemy) {
                enemy.takeDamage(GAME_CONFIG.WEAPON_DAMAGE);
                // Check if enemy died
                if (enemy.health <= 0) {
                  setGameState(prev => ({
                    ...prev,
                    kills: prev.kills + 1,
                    score: prev.score + GAME_CONFIG.ENEMY_KILL_SCORE,
                  }));
                  // Play enemy death sound
                  audioManagerRef.current?.playSound(SOUNDS.ENEMY_DEATH);
                }
              }
            }
          }
        }
        
        // Play shooting sound
        audioManagerRef.current?.playSound(SOUNDS.SHOOT);
        
        // Decrement ammo
        setAmmo(prev => {
          const newAmmo = prev - 1;
          ammoRef.current = newAmmo;
          return newAmmo;
        });
        lastShotTimeRef.current = currentTime;
        
        // Only add score if we actually hit something (but not an enemy, that's handled above)
        if (hit && !hitEnemyId) {
          // Play hit sound
          audioManagerRef.current?.playSound(SOUNDS.HIT);
          setGameState(prev => ({
            ...prev,
            score: prev.score + 10,
          }));
        } else if (hitEnemyId) {
          // Play hit sound for enemy hit
          audioManagerRef.current?.playSound(SOUNDS.HIT);
        }
      } else if (input.shoot && ammoRef.current === 0 && currentTime - lastShotTimeRef.current >= fireRate) {
        // Play empty clip sound when trying to shoot with no ammo
        audioManagerRef.current?.playSound(SOUNDS.EMPTY);
        lastShotTimeRef.current = currentTime;
      }
      
      // Handle reload
      if (input.reload && ammoRef.current < maxAmmo && reloadTimeRef.current === 0) {
        setReloadTime(2000); // 2 second reload
        reloadTimeRef.current = 2000;
        // Play reload sound
        audioManagerRef.current?.playSound(SOUNDS.RELOAD);
      }
      
      // Update reload timer
      if (reloadTimeRef.current > 0) {
        const newReloadTime = Math.max(0, reloadTimeRef.current - deltaTime * 1000);
        setReloadTime(newReloadTime);
        reloadTimeRef.current = newReloadTime;
        if (reloadTimeRef.current <= deltaTime * 1000) {
          setAmmo(maxAmmo);
          ammoRef.current = maxAmmo;
        }
      }
      
      // Update enemies
      const playerPos: [number, number, number] = playerPositionRef.current;
      enemiesRef.current.forEach((enemy) => {
        if (enemy.state !== EnemyState.DEAD) {
          // Create raycast wrapper for enemy AI
          const raycastWrapper = raycastFnRef.current
            ? (origin: [number, number, number], direction: [number, number, number]) => {
                const originVec = new THREE.Vector3(origin[0], origin[1], origin[2]);
                const directionVec = new THREE.Vector3(direction[0], direction[1], direction[2]);
                const result = raycastFnRef.current!(originVec, directionVec);
                return result ? { distance: result.distance } : null;
              }
            : undefined;

          enemy.update({
            playerPosition: playerPos,
            deltaTime,
            raycast: raycastWrapper,
          });

          // Handle enemy attacks
          if (enemy.canAttack()) {
            const damage = enemy.getAttackDamage();
            setGameState(prev => ({
              ...prev,
              player: {
                ...prev.player,
                health: Math.max(0, prev.player.health - damage),
              },
            }));
            // Play enemy attack sound
            audioManagerRef.current?.playSound(SOUNDS.ENEMY_ATTACK);
          }
        }
      });

      // Update game state with enemy data
      setGameState(prev => ({
        ...prev,
        player: {
          ...prev.player,
          position: playerPositionRef.current,
          rotation: cameraRotationRef.current,
        },
        enemies: Array.from(enemiesRef.current.values())
          .filter(e => e.state !== EnemyState.DEAD)
          .map(e => e.getData()),
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
    
    // Clear existing enemies
    enemiesRef.current.clear();
    
    // Spawn initial enemies using spawner
    const playerStartPosition: [number, number, number] = [0, 2, 0];
    const initialEnemies = enemySpawnerRef.current?.spawnInitialEnemies(playerStartPosition) || [];
    
    initialEnemies.forEach(enemy => {
      enemiesRef.current.set(enemy.id, enemy);
      // Play spawn sound for each enemy
      audioManagerRef.current?.playSound(SOUNDS.ENEMY_SPAWN, { volume: 0.3 });
    });
    
    setGameState({
      player: {
        position: playerStartPosition,
        rotation: [0, 0, 0],
        health: GAME_CONFIG.MAX_HEALTH,
        armor: 0,
      },
      enemies: initialEnemies.map(e => e.getData()),
      projectiles: [],
      score: 0,
      kills: 0,
      deaths: 0,
    });
    setAmmo(maxAmmo);
    setReloadTime(0);
    ammoRef.current = maxAmmo;
    reloadTimeRef.current = 0;
    playerPositionRef.current = playerStartPosition;
    lastShotTimeRef.current = 0;
    if (cameraControllerRef.current) {
      cameraControllerRef.current.reset();
    }
    // Start ambient music
    audioManagerRef.current?.startAmbient();
  };

  const pauseGame = () => {
    const newPaused = !isPaused;
    setIsPaused(newPaused);
    
    // Pause/resume ambient music
    if (newPaused) {
      audioManagerRef.current?.stopAmbient();
      inputManagerRef.current?.exitPointerLock();
    } else {
      audioManagerRef.current?.startAmbient();
      if (inputManagerRef.current && canvasRef.current) {
        inputManagerRef.current.requestPointerLock(canvasRef.current);
      }
    }
  };

  const handleGameOver = async () => {
    // Stop ambient music
    audioManagerRef.current?.stopAmbient();
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
