import { describe, it, expect } from 'vitest';
import {
  createInitialGameState,
  generateFood,
  moveSnake,
  getNextDirection,
} from '../gameLogic';
import { GameState } from '../../types/game';

describe('gameLogic', () => {
  describe('createInitialGameState', () => {
    it('should create initial game state with snake, food, and default values', () => {
      const state = createInitialGameState();
      
      expect(state.snake).toHaveLength(3);
      expect(state.snake[0]).toEqual({ x: 10, y: 10 });
      expect(state.food).toBeDefined();
      expect(state.direction).toBe('right');
      expect(state.score).toBe(0);
      expect(state.gameOver).toBe(false);
    });
  });

  describe('generateFood', () => {
    it('should generate food not on snake', () => {
      const snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }];
      const food = generateFood(snake);
      
      expect(snake.every(segment => segment.x !== food.x || segment.y !== food.y)).toBe(true);
    });
  });

  describe('moveSnake', () => {
    it('should move snake in current direction when no new direction provided', () => {
      const state: GameState = {
        snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }],
        food: { x: 15, y: 15 },
        direction: 'right',
        score: 0,
        gameOver: false,
      };
      
      const newState = moveSnake(state, null, 'walls');
      
      expect(newState.snake[0].x).toBe(11);
      expect(newState.snake[0].y).toBe(10);
    });

    it('should move snake in new direction when provided', () => {
      const state: GameState = {
        snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }],
        food: { x: 15, y: 15 },
        direction: 'right',
        score: 0,
        gameOver: false,
      };
      
      const newState = moveSnake(state, 'down', 'walls');
      
      expect(newState.snake[0].x).toBe(10);
      expect(newState.snake[0].y).toBe(11);
      expect(newState.direction).toBe('down');
    });

    it('should not reverse direction into itself', () => {
      const state: GameState = {
        snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }],
        food: { x: 15, y: 15 },
        direction: 'right',
        score: 0,
        gameOver: false,
      };
      
      const newState = moveSnake(state, 'left', 'walls');
      
      // Should keep moving right, not reverse
      expect(newState.snake[0].x).toBe(11);
      expect(newState.direction).toBe('right');
    });

    it('should increase score and snake length when food is eaten', () => {
      const state: GameState = {
        snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }],
        food: { x: 11, y: 10 },
        direction: 'right',
        score: 0,
        gameOver: false,
      };
      
      const newState = moveSnake(state, null, 'walls');
      
      expect(newState.score).toBe(10);
      expect(newState.snake.length).toBe(3);
      // Food should not be on any snake segment
      expect(newState.snake.every(segment => 
        segment.x !== newState.food.x || segment.y !== newState.food.y
      )).toBe(true);
    });

    it('should end game on wall collision in walls mode', () => {
      const state: GameState = {
        snake: [{ x: 0, y: 10 }, { x: 1, y: 10 }],
        food: { x: 15, y: 15 },
        direction: 'left',
        score: 0,
        gameOver: false,
      };
      
      const newState = moveSnake(state, null, 'walls');
      
      expect(newState.gameOver).toBe(true);
    });

    it('should wrap around in pass-through mode', () => {
      const state: GameState = {
        snake: [{ x: 0, y: 10 }, { x: 1, y: 10 }],
        food: { x: 15, y: 15 },
        direction: 'left',
        score: 0,
        gameOver: false,
      };
      
      const newState = moveSnake(state, null, 'pass-through');
      
      expect(newState.gameOver).toBe(false);
      expect(newState.snake[0].x).toBe(19); // Wrapped around
    });

    it('should end game on self collision', () => {
      // Snake forms a square: head at (10,10), body at (10,9), (11,9), (11,10)
      // Moving left from (10,10) would go to (9,10), which doesn't collide
      // Instead, let's create a case where moving right causes collision
      // Moving right from (10,10) would go to (11,10), but the body is at (10,11)
      // Actually, let's make it simpler - snake moving into its own body
      const state: GameState = {
        snake: [{ x: 10, y: 10 }, { x: 11, y: 10 }, { x: 11, y: 9 }, { x: 10, y: 9 }],
        food: { x: 15, y: 15 },
        direction: 'up',
        score: 0,
        gameOver: false,
      };
      
      // Moving up from (10,10) would go to (10,9), which is in the body
      const newState = moveSnake(state, null, 'walls');
      
      expect(newState.gameOver).toBe(true);
    });

    it('should not move if game is over', () => {
      const state: GameState = {
        snake: [{ x: 10, y: 10 }],
        food: { x: 15, y: 15 },
        direction: 'right',
        score: 0,
        gameOver: true,
      };
      
      const newState = moveSnake(state, 'up', 'walls');
      
      expect(newState).toEqual(state);
    });
  });

  describe('getNextDirection', () => {
    it('should return correct direction for arrow keys', () => {
      expect(getNextDirection('ArrowUp')).toBe('up');
      expect(getNextDirection('ArrowDown')).toBe('down');
      expect(getNextDirection('ArrowLeft')).toBe('left');
      expect(getNextDirection('ArrowRight')).toBe('right');
    });

    it('should return correct direction for WASD keys', () => {
      expect(getNextDirection('w')).toBe('up');
      expect(getNextDirection('s')).toBe('down');
      expect(getNextDirection('a')).toBe('left');
      expect(getNextDirection('d')).toBe('right');
    });

    it('should return null for invalid keys', () => {
      expect(getNextDirection('q')).toBeNull();
      expect(getNextDirection('Enter')).toBeNull();
      expect(getNextDirection('Space')).toBeNull();
    });
  });
});

