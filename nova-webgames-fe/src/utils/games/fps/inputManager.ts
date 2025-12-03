// Input manager for keyboard and mouse input

export interface InputState {
  // Movement
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  sprint: boolean;
  
  // Mouse
  mouseX: number;
  mouseY: number;
  mouseDeltaX: number;
  mouseDeltaY: number;
  
  // Actions
  shoot: boolean;
  reload: boolean;
  interact: boolean;
}

export class InputManager {
  private keys: Set<string> = new Set();
  private mouseX: number = 0;
  private mouseY: number = 0;
  private mouseDeltaX: number = 0;
  private mouseDeltaY: number = 0;
  private isPointerLocked: boolean = false;
  
  constructor() {
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('pointerlockchange', this.handlePointerLockChange);
  }
  
  private handleKeyDown = (e: KeyboardEvent): void => {
    this.keys.add(e.key.toLowerCase());
  };
  
  private handleKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.key.toLowerCase());
  };
  
  private handleMouseMove = (e: MouseEvent): void => {
    if (this.isPointerLocked) {
      this.mouseDeltaX = e.movementX;
      this.mouseDeltaY = e.movementY;
      this.mouseX += e.movementX;
      this.mouseY += e.movementY;
    } else {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    }
  };
  
  private handlePointerLockChange = (): void => {
    this.isPointerLocked = document.pointerLockElement !== null;
    if (!this.isPointerLocked) {
      this.mouseDeltaX = 0;
      this.mouseDeltaY = 0;
    }
  };
  
  requestPointerLock(element: HTMLElement): void {
    element.requestPointerLock();
  }
  
  exitPointerLock(): void {
    document.exitPointerLock();
  }
  
  getInputState(): InputState {
    return {
      forward: this.keys.has('w'),
      backward: this.keys.has('s'),
      left: this.keys.has('a'),
      right: this.keys.has('d'),
      jump: this.keys.has(' '),
      sprint: this.keys.has('shift'),
      mouseX: this.mouseX,
      mouseY: this.mouseY,
      mouseDeltaX: this.mouseDeltaX,
      mouseDeltaY: this.mouseDeltaY,
      shoot: this.keys.has('mouse0') || false, // Left mouse button
      reload: this.keys.has('r'),
      interact: this.keys.has('e'),
    };
  }
  
  // Reset mouse delta after reading
  resetMouseDelta(): void {
    this.mouseDeltaX = 0;
    this.mouseDeltaY = 0;
  }
  
  cleanup(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('pointerlockchange', this.handlePointerLockChange);
  }
}

