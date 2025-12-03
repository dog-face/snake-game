// First-person camera controller

import { clamp, degToRad } from './math';
import type { Vector3 } from './math';

export interface CameraState {
  position: Vector3;
  rotation: Vector3; // [pitch, yaw, roll] in radians
}

export class CameraController {
  private pitch: number = 0; // Vertical rotation (up/down)
  private yaw: number = 0; // Horizontal rotation (left/right)
  private sensitivity: number = 0.002;
  private maxPitch: number = degToRad(89); // Prevent camera flipping
  
  constructor(initialState?: CameraState) {
    if (initialState) {
      this.pitch = initialState.rotation[0];
      this.yaw = initialState.rotation[1];
    }
  }
  
  updateMouseLook(deltaX: number, deltaY: number): void {
    this.yaw -= deltaX * this.sensitivity;
    this.pitch -= deltaY * this.sensitivity;
    
    // Clamp pitch to prevent camera flipping
    this.pitch = clamp(this.pitch, -this.maxPitch, this.maxPitch);
  }
  
  getRotation(): Vector3 {
    return [this.pitch, this.yaw, 0];
  }
  
  getForwardDirection(): Vector3 {
    const cosPitch = Math.cos(this.pitch);
    return [
      -Math.sin(this.yaw) * cosPitch, // Negative sin for correct forward direction
      Math.sin(this.pitch),
      Math.cos(this.yaw) * cosPitch,
    ];
  }
  
  getRightDirection(): Vector3 {
    return [
      Math.cos(this.yaw - Math.PI / 2),
      0,
      Math.sin(this.yaw - Math.PI / 2),
    ];
  }
  
  setSensitivity(sensitivity: number): void {
    this.sensitivity = sensitivity;
  }
  
  reset(): void {
    this.pitch = 0;
    this.yaw = 0;
  }
}

