// Vector math utilities for FPS game

export type Vector3 = [number, number, number];

export const vec3 = {
  create(x = 0, y = 0, z = 0): Vector3 {
    return [x, y, z];
  },
  
  add(a: Vector3, b: Vector3): Vector3 {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  },
  
  subtract(a: Vector3, b: Vector3): Vector3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  },
  
  multiply(a: Vector3, scalar: number): Vector3 {
    return [a[0] * scalar, a[1] * scalar, a[2] * scalar];
  },
  
  length(v: Vector3): number {
    return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  },
  
  normalize(v: Vector3): Vector3 {
    const len = this.length(v);
    if (len === 0) return [0, 0, 0];
    return this.multiply(v, 1 / len);
  },
  
  distance(a: Vector3, b: Vector3): number {
    return this.length(this.subtract(a, b));
  },
  
  dot(a: Vector3, b: Vector3): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  },
  
  cross(a: Vector3, b: Vector3): Vector3 {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  },
};

// Clamp a value between min and max
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Linear interpolation
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Convert degrees to radians
export function degToRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Convert radians to degrees
export function radToDeg(radians: number): number {
  return radians * (180 / Math.PI);
}

