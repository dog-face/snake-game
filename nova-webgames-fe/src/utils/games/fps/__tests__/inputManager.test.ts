import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { InputManager } from '../inputManager';

describe('InputManager', () => {
  let inputManager: InputManager;
  let mockRequestPointerLock: ReturnType<typeof vi.fn>;
  let mockExitPointerLock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock pointer lock API
    mockRequestPointerLock = vi.fn();
    mockExitPointerLock = vi.fn();
    
    Object.defineProperty(document, 'pointerLockElement', {
      writable: true,
      value: null,
      configurable: true,
    });
    
    HTMLElement.prototype.requestPointerLock = mockRequestPointerLock;
    document.exitPointerLock = mockExitPointerLock;
    
    inputManager = new InputManager();
  });

  afterEach(() => {
    inputManager.cleanup();
    vi.clearAllMocks();
  });

  describe('Keyboard Input', () => {
    it('should track WASD keys correctly', () => {
      // Simulate keydown events
      const wKey = new KeyboardEvent('keydown', { key: 'w' });
      const aKey = new KeyboardEvent('keydown', { key: 'a' });
      const sKey = new KeyboardEvent('keydown', { key: 's' });
      const dKey = new KeyboardEvent('keydown', { key: 'd' });
      
      window.dispatchEvent(wKey);
      window.dispatchEvent(aKey);
      window.dispatchEvent(sKey);
      window.dispatchEvent(dKey);
      
      const input = inputManager.getInputState();
      expect(input.forward).toBe(true);
      expect(input.left).toBe(true);
      expect(input.backward).toBe(true);
      expect(input.right).toBe(true);
    });

    it('should track Space (jump) key', () => {
      const spaceKey = new KeyboardEvent('keydown', { key: ' ' });
      window.dispatchEvent(spaceKey);
      
      const input = inputManager.getInputState();
      expect(input.jump).toBe(true);
    });

    it('should track Shift (sprint) key', () => {
      const shiftKey = new KeyboardEvent('keydown', { key: 'Shift' });
      window.dispatchEvent(shiftKey);
      
      const input = inputManager.getInputState();
      expect(input.sprint).toBe(true);
    });

    it('should track R (reload) key', () => {
      const rKey = new KeyboardEvent('keydown', { key: 'r' });
      window.dispatchEvent(rKey);
      
      const input = inputManager.getInputState();
      expect(input.reload).toBe(true);
    });

    it('should track E (interact) key', () => {
      const eKey = new KeyboardEvent('keydown', { key: 'e' });
      window.dispatchEvent(eKey);
      
      const input = inputManager.getInputState();
      expect(input.interact).toBe(true);
    });

    it('should handle key up events', () => {
      const wKeyDown = new KeyboardEvent('keydown', { key: 'w' });
      const wKeyUp = new KeyboardEvent('keyup', { key: 'w' });
      
      window.dispatchEvent(wKeyDown);
      let input = inputManager.getInputState();
      expect(input.forward).toBe(true);
      
      window.dispatchEvent(wKeyUp);
      input = inputManager.getInputState();
      expect(input.forward).toBe(false);
    });

    it('should handle case-insensitive keys', () => {
      const wKeyUpper = new KeyboardEvent('keydown', { key: 'W' });
      window.dispatchEvent(wKeyUpper);
      
      const input = inputManager.getInputState();
      expect(input.forward).toBe(true);
    });
  });

  describe('Mouse Input', () => {
    it('should track mouse movement with pointer lock', () => {
      // Set pointer lock to active first
      Object.defineProperty(document, 'pointerLockElement', {
        writable: true,
        value: document.body,
        configurable: true,
      });
      
      // Simulate pointer lock change to update internal state
      const lockChangeEvent = new Event('pointerlockchange');
      document.dispatchEvent(lockChangeEvent);
      
      // Wait a tick for event to process
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          // Simulate mouse movement with movementX/Y
          const mouseMove = new MouseEvent('mousemove', {
            movementX: 10,
            movementY: -5,
            bubbles: true,
          });
          // Manually set movementX/Y since they might not be in test environment
          Object.defineProperty(mouseMove, 'movementX', { value: 10, writable: true });
          Object.defineProperty(mouseMove, 'movementY', { value: -5, writable: true });
          
          window.dispatchEvent(mouseMove);
          
          const input = inputManager.getInputState();
          expect(input.mouseDeltaX).toBe(10);
          expect(input.mouseDeltaY).toBe(-5);
          resolve();
        }, 0);
      });
    });

    it('should track mouse position without pointer lock', () => {
      Object.defineProperty(document, 'pointerLockElement', {
        writable: true,
        value: null,
        configurable: true,
      });
      
      const lockChangeEvent = new Event('pointerlockchange');
      document.dispatchEvent(lockChangeEvent);
      
      const mouseMove = new MouseEvent('mousemove', {
        clientX: 100,
        clientY: 200,
      });
      window.dispatchEvent(mouseMove);
      
      const input = inputManager.getInputState();
      expect(input.mouseX).toBe(100);
      expect(input.mouseY).toBe(200);
    });

    it('should track left mouse button (shoot)', () => {
      const mouseDown = new MouseEvent('mousedown', { button: 0 });
      window.dispatchEvent(mouseDown);
      
      const input = inputManager.getInputState();
      expect(input.shoot).toBe(true);
    });

    it('should track right mouse button', () => {
      const mouseDown = new MouseEvent('mousedown', { button: 2 });
      window.dispatchEvent(mouseDown);
      
      // Right button is tracked but not used for shoot
      const input = inputManager.getInputState();
      expect(input.shoot).toBe(false);
    });

    it('should handle mouse up events', () => {
      const mouseDown = new MouseEvent('mousedown', { button: 0 });
      const mouseUp = new MouseEvent('mouseup', { button: 0 });
      
      window.dispatchEvent(mouseDown);
      let input = inputManager.getInputState();
      expect(input.shoot).toBe(true);
      
      window.dispatchEvent(mouseUp);
      input = inputManager.getInputState();
      expect(input.shoot).toBe(false);
    });

    it('should reset mouse delta after reading', () => {
      return new Promise<void>((resolve) => {
        Object.defineProperty(document, 'pointerLockElement', {
          writable: true,
          value: document.body,
          configurable: true,
        });
        
        const lockChangeEvent = new Event('pointerlockchange');
        document.dispatchEvent(lockChangeEvent);
        
        setTimeout(() => {
          const mouseMove = new MouseEvent('mousemove', {
            movementX: 10,
            movementY: -5,
            bubbles: true,
          });
          Object.defineProperty(mouseMove, 'movementX', { value: 10, writable: true });
          Object.defineProperty(mouseMove, 'movementY', { value: -5, writable: true });
          
          window.dispatchEvent(mouseMove);
          
          let input = inputManager.getInputState();
          expect(input.mouseDeltaX).toBe(10);
          expect(input.mouseDeltaY).toBe(-5);
          
          inputManager.resetMouseDelta();
          
          input = inputManager.getInputState();
          expect(input.mouseDeltaX).toBe(0);
          expect(input.mouseDeltaY).toBe(0);
          resolve();
        }, 0);
      });
    });
  });

  describe('Pointer Lock', () => {
    it('should request pointer lock on element', () => {
      const element = document.createElement('div');
      inputManager.requestPointerLock(element);
      
      expect(mockRequestPointerLock).toHaveBeenCalled();
    });

    it('should exit pointer lock', () => {
      inputManager.exitPointerLock();
      
      expect(mockExitPointerLock).toHaveBeenCalled();
    });

    it('should handle pointer lock change events', () => {
      Object.defineProperty(document, 'pointerLockElement', {
        writable: true,
        value: document.body,
        configurable: true,
      });
      
      const lockChangeEvent = new Event('pointerlockchange');
      document.dispatchEvent(lockChangeEvent);
      
      // After lock change, mouse delta should be reset if lock is lost
      Object.defineProperty(document, 'pointerLockElement', {
        writable: true,
        value: null,
        configurable: true,
      });
      
      const lockChangeEvent2 = new Event('pointerlockchange');
      document.dispatchEvent(lockChangeEvent2);
      
      const input = inputManager.getInputState();
      expect(input.mouseDeltaX).toBe(0);
      expect(input.mouseDeltaY).toBe(0);
    });

    it('should reset mouse delta when lock is lost', () => {
      // Set up with lock
      Object.defineProperty(document, 'pointerLockElement', {
        writable: true,
        value: document.body,
        configurable: true,
      });
      
      const lockChangeEvent = new Event('pointerlockchange');
      document.dispatchEvent(lockChangeEvent);
      
      // Move mouse
      const mouseMove = new MouseEvent('mousemove', {
        movementX: 10,
        movementY: -5,
      });
      window.dispatchEvent(mouseMove);
      
      // Lose lock
      Object.defineProperty(document, 'pointerLockElement', {
        writable: true,
        value: null,
        configurable: true,
      });
      
      const lockChangeEvent2 = new Event('pointerlockchange');
      document.dispatchEvent(lockChangeEvent2);
      
      const input = inputManager.getInputState();
      expect(input.mouseDeltaX).toBe(0);
      expect(input.mouseDeltaY).toBe(0);
    });
  });

  describe('Input State', () => {
    it('should return correct initial state', () => {
      const input = inputManager.getInputState();
      
      expect(input.forward).toBe(false);
      expect(input.backward).toBe(false);
      expect(input.left).toBe(false);
      expect(input.right).toBe(false);
      expect(input.jump).toBe(false);
      expect(input.sprint).toBe(false);
      expect(input.shoot).toBe(false);
      expect(input.reload).toBe(false);
      expect(input.interact).toBe(false);
      expect(input.mouseDeltaX).toBe(0);
      expect(input.mouseDeltaY).toBe(0);
    });

    it('should combine multiple inputs correctly', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }));
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
      window.dispatchEvent(new MouseEvent('mousedown', { button: 0 }));
      
      const input = inputManager.getInputState();
      expect(input.forward).toBe(true);
      expect(input.sprint).toBe(true);
      expect(input.jump).toBe(true);
      expect(input.shoot).toBe(true);
    });
  });
});

