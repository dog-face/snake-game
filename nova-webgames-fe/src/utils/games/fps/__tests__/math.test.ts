import { describe, it, expect } from 'vitest';
import { vec3, clamp, lerp, degToRad, radToDeg } from '../math';

describe('Vector Math Utilities', () => {
  describe('vec3', () => {
    it('should create a vector', () => {
      const v = vec3.create(1, 2, 3);
      expect(v).toEqual([1, 2, 3]);
    });

    it('should add two vectors', () => {
      const a = vec3.create(1, 2, 3);
      const b = vec3.create(4, 5, 6);
      const result = vec3.add(a, b);
      expect(result).toEqual([5, 7, 9]);
    });

    it('should subtract two vectors', () => {
      const a = vec3.create(5, 5, 5);
      const b = vec3.create(2, 3, 4);
      const result = vec3.subtract(a, b);
      expect(result).toEqual([3, 2, 1]);
    });

    it('should multiply vector by scalar', () => {
      const v = vec3.create(1, 2, 3);
      const result = vec3.multiply(v, 2);
      expect(result).toEqual([2, 4, 6]);
    });

    it('should calculate vector length', () => {
      const v = vec3.create(3, 4, 0);
      expect(vec3.length(v)).toBe(5);
    });

    it('should normalize a vector', () => {
      const v = vec3.create(3, 4, 0);
      const normalized = vec3.normalize(v);
      expect(vec3.length(normalized)).toBeCloseTo(1);
    });

    it('should calculate distance between vectors', () => {
      const a = vec3.create(0, 0, 0);
      const b = vec3.create(3, 4, 0);
      expect(vec3.distance(a, b)).toBe(5);
    });

    it('should calculate dot product', () => {
      const a = vec3.create(1, 2, 3);
      const b = vec3.create(4, 5, 6);
      expect(vec3.dot(a, b)).toBe(32); // 1*4 + 2*5 + 3*6 = 4 + 10 + 18 = 32
    });
  });

  describe('clamp', () => {
    it('should clamp value to range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('lerp', () => {
    it('should interpolate between values', () => {
      expect(lerp(0, 10, 0.5)).toBe(5);
      expect(lerp(0, 10, 0)).toBe(0);
      expect(lerp(0, 10, 1)).toBe(10);
    });
  });

  describe('degToRad and radToDeg', () => {
    it('should convert degrees to radians', () => {
      expect(degToRad(0)).toBe(0);
      expect(degToRad(90)).toBeCloseTo(Math.PI / 2);
      expect(degToRad(180)).toBeCloseTo(Math.PI);
    });

    it('should convert radians to degrees', () => {
      expect(radToDeg(0)).toBe(0);
      expect(radToDeg(Math.PI / 2)).toBeCloseTo(90);
      expect(radToDeg(Math.PI)).toBeCloseTo(180);
    });
  });
});

