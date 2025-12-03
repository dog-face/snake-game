import { describe, it, expect, beforeEach } from 'vitest';
import { CameraController } from '../cameraController';
import { degToRad } from '../math';

describe('CameraController', () => {
  let camera: CameraController;

  beforeEach(() => {
    camera = new CameraController();
  });

  it('should initialize with zero rotation', () => {
    const rotation = camera.getRotation();
    expect(rotation[0]).toBe(0); // pitch
    expect(rotation[1]).toBe(0); // yaw
    expect(rotation[2]).toBe(0); // roll
  });

  it('should update rotation based on mouse movement', () => {
    camera.updateMouseLook(100, 50);
    const rotation = camera.getRotation();
    expect(rotation[1]).not.toBe(0); // yaw should change
    expect(rotation[0]).not.toBe(0); // pitch should change
  });

  it('should clamp pitch to prevent camera flipping', () => {
    // Try to rotate pitch beyond 90 degrees
    camera.updateMouseLook(0, 10000);
    const rotation = camera.getRotation();
    const pitch = rotation[0];
    expect(Math.abs(pitch)).toBeLessThanOrEqual(degToRad(89));
  });

  it('should return forward direction vector', () => {
    const forward = camera.getForwardDirection();
    expect(forward).toHaveLength(3);
    // Initially facing forward: should be (0, 0, 1) when yaw=0, pitch=0
    expect(forward[0]).toBeCloseTo(0, 1); // X should be 0
    expect(forward[1]).toBeCloseTo(0, 1); // Y should be 0
    expect(forward[2]).toBeCloseTo(1, 1); // Z should be 1 (forward)
  });

  it('should return right direction vector', () => {
    const right = camera.getRightDirection();
    expect(right).toHaveLength(3);
    expect(right[1]).toBe(0); // Right vector should have no Y component
  });

  it('should allow sensitivity adjustment', () => {
    camera.setSensitivity(0.001);
    camera.updateMouseLook(100, 0);
    const rotation1 = camera.getRotation();
    
    camera.reset();
    camera.setSensitivity(0.01);
    camera.updateMouseLook(100, 0);
    const rotation2 = camera.getRotation();
    
    // Higher sensitivity should result in larger rotation
    expect(Math.abs(rotation2[1])).toBeGreaterThan(Math.abs(rotation1[1]));
  });

  it('should reset rotation', () => {
    camera.updateMouseLook(100, 50);
    camera.reset();
    const rotation = camera.getRotation();
    expect(rotation[0]).toBe(0);
    expect(rotation[1]).toBe(0);
  });
});

