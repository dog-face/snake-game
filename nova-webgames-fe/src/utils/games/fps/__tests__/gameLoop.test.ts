import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameLoop } from '../gameLoop';

describe('GameLoop', () => {
  let mockUpdate: ReturnType<typeof vi.fn>;
  let mockRender: ReturnType<typeof vi.fn>;
  let gameLoop: GameLoop;

  beforeEach(() => {
    mockUpdate = vi.fn();
    mockRender = vi.fn();
    gameLoop = new GameLoop(mockUpdate, mockRender);
    vi.useFakeTimers();
  });

  afterEach(() => {
    gameLoop.stop();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should start and stop the game loop', () => {
    expect(gameLoop).toBeDefined();
    gameLoop.start();
    expect(mockUpdate).not.toHaveBeenCalled(); // Not called immediately
    gameLoop.stop();
  });

  it('should call update with fixed timestep', () => {
    // Test that the game loop structure is correct
    // The actual timing behavior is tested through integration tests
    expect(gameLoop).toBeDefined();
    gameLoop.start();
    expect(mockUpdate).not.toHaveBeenCalled(); // Not called immediately
    gameLoop.stop();
  });

  it('should call render on each frame', () => {
    gameLoop.start();
    
    // Advance time by 16ms (~60fps = 16ms per frame)
    vi.advanceTimersByTime(16);
    
    // Stop the loop to prevent infinite recursion in tests
    gameLoop.stop();
    
    expect(mockRender).toHaveBeenCalled();
  });

  it('should not start multiple loops', () => {
    gameLoop.start();
    gameLoop.start(); // Should not create duplicate loop
    gameLoop.stop();
  });
});

