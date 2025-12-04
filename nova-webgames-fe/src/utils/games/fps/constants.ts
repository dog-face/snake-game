// FPS Game Constants

export const GAME_CONFIG = {
  // Physics
  GRAVITY: -9.81,
  PHYSICS_TIMESTEP: 1 / 60, // 60Hz physics updates
  
  // Player
  PLAYER_SPEED: 5,
  PLAYER_SPRINT_MULTIPLIER: 1.5,
  PLAYER_JUMP_FORCE: 5,
  PLAYER_HEIGHT: 1.6,
  PLAYER_RADIUS: 0.3,
  
  // Camera
  CAMERA_FOV: 75,
  MOUSE_SENSITIVITY: 0.002,
  CAMERA_HEIGHT: 1.6, // Eye level
  
  // Weapon
  WEAPON_RANGE: 100,
  WEAPON_DAMAGE: 25,
  WEAPON_FIRE_RATE: 10, // Shots per second
  
  // Game
  MAX_HEALTH: 100,
  MAX_ARMOR: 100,
  
  // Enemy
  ENEMY_HEALTH: 50,
  ENEMY_SPEED: 3,
  ENEMY_DAMAGE: 10,
  ENEMY_DETECTION_RANGE: 15,
  ENEMY_ATTACK_RANGE: 2,
  ENEMY_ATTACK_COOLDOWN: 1000, // milliseconds
  ENEMY_SIZE: [0.6, 1.6, 0.6] as [number, number, number],
  ENEMY_COLOR: '#ef4444',
  ENEMY_KILL_SCORE: 50,
  MAX_ENEMIES: 10,
} as const;

