import { describe, it, expect } from 'vitest';
import { GAME_CONFIG } from '../constants';

describe('Game Constants', () => {
  it('should have physics configuration', () => {
    expect(GAME_CONFIG.GRAVITY).toBe(-9.81);
    expect(GAME_CONFIG.PHYSICS_TIMESTEP).toBe(1 / 60);
  });

  it('should have player configuration', () => {
    expect(GAME_CONFIG.PLAYER_SPEED).toBeGreaterThan(0);
    expect(GAME_CONFIG.PLAYER_SPRINT_MULTIPLIER).toBeGreaterThan(1);
    expect(GAME_CONFIG.PLAYER_JUMP_FORCE).toBeGreaterThan(0);
    expect(GAME_CONFIG.PLAYER_HEIGHT).toBeGreaterThan(0);
    expect(GAME_CONFIG.PLAYER_RADIUS).toBeGreaterThan(0);
  });

  it('should have camera configuration', () => {
    expect(GAME_CONFIG.CAMERA_FOV).toBeGreaterThan(0);
    expect(GAME_CONFIG.CAMERA_FOV).toBeLessThan(180);
    expect(GAME_CONFIG.MOUSE_SENSITIVITY).toBeGreaterThan(0);
    expect(GAME_CONFIG.CAMERA_HEIGHT).toBeGreaterThan(0);
  });

  it('should have weapon configuration', () => {
    expect(GAME_CONFIG.WEAPON_RANGE).toBeGreaterThan(0);
    expect(GAME_CONFIG.WEAPON_DAMAGE).toBeGreaterThan(0);
    expect(GAME_CONFIG.WEAPON_FIRE_RATE).toBeGreaterThan(0);
  });

  it('should have game configuration', () => {
    expect(GAME_CONFIG.MAX_HEALTH).toBeGreaterThan(0);
    expect(GAME_CONFIG.MAX_ARMOR).toBeGreaterThan(0);
  });
});

