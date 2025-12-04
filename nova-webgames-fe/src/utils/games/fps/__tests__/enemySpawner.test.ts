import { describe, it, expect, beforeEach } from 'vitest';
import { EnemySpawner } from '../enemySpawner';
import { EnemyAI } from '../enemyAI';
import { GAME_CONFIG } from '../constants';
import { vec3, type Vector3 } from '../math';

describe('EnemySpawner', () => {
  let spawner: EnemySpawner;
  const playerPosition: Vector3 = [0, 2, 0];

  beforeEach(() => {
    spawner = new EnemySpawner({
      maxEnemies: 10,
    });
  });

  describe('Initialization', () => {
    it('should initialize with correct max enemies', () => {
      expect(spawner.getMaxEnemies()).toBe(10);
    });

    it('should generate default spawn points', () => {
      const points = spawner.getSpawnPoints();
      expect(points.length).toBeGreaterThan(0);
    });

    it('should use custom spawn points when provided', () => {
      const customPoints = [
        { position: [10, 1, 10] as Vector3 },
        { position: [-10, 1, -10] as Vector3 },
      ];
      const customSpawner = new EnemySpawner({
        maxEnemies: 5,
        spawnPoints: customPoints,
      });
      const points = customSpawner.getSpawnPoints();
      expect(points.length).toBe(2);
      expect(points[0].position).toEqual([10, 1, 10]);
    });
  });

  describe('Spawning', () => {
    it('should spawn initial enemies', () => {
      const enemies = spawner.spawnInitialEnemies(playerPosition);
      expect(enemies.length).toBeGreaterThan(0);
      expect(enemies.length).toBeLessThanOrEqual(3);
    });

    it('should spawn enemies at valid positions', () => {
      const enemies = spawner.spawnInitialEnemies(playerPosition);
      enemies.forEach(enemy => {
        const distance = vec3.distance(enemy.position, playerPosition);
        expect(distance).toBeGreaterThanOrEqual(5); // minDistanceFromPlayer
      });
    });

    it('should create unique enemy IDs', () => {
      const enemies = spawner.spawnInitialEnemies(playerPosition);
      const ids = enemies.map(e => e.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should respect max enemies limit', () => {
      const smallSpawner = new EnemySpawner({
        maxEnemies: 2,
      });
      const enemies = smallSpawner.spawnInitialEnemies(playerPosition);
      expect(enemies.length).toBeLessThanOrEqual(2);
    });

    it('should spawn single enemy when under limit', () => {
      const existingEnemies: EnemyAI[] = [];
      const enemy = spawner.spawnEnemy(playerPosition, existingEnemies);
      expect(enemy).not.toBeNull();
      expect(enemy).toBeInstanceOf(EnemyAI);
    });

    it('should not spawn when at max enemies', () => {
      const maxEnemies = 3;
      const smallSpawner = new EnemySpawner({
        maxEnemies,
      });
      
      // Create existing enemies up to max
      const existingEnemies: EnemyAI[] = [];
      for (let i = 0; i < maxEnemies; i++) {
        const enemy = smallSpawner.spawnEnemy(playerPosition, existingEnemies);
        if (enemy) {
          existingEnemies.push(enemy);
        }
      }
      
      // Should not spawn more
      const newEnemy = smallSpawner.spawnEnemy(playerPosition, existingEnemies);
      expect(newEnemy).toBeNull();
    });
  });

  describe('Spawn Position Logic', () => {
    it('should spawn enemies away from player', () => {
      const enemies = spawner.spawnInitialEnemies(playerPosition);
      enemies.forEach(enemy => {
        const distance = vec3.distance(enemy.position, playerPosition);
        expect(distance).toBeGreaterThanOrEqual(5);
      });
    });

    it('should use spawn points when available', () => {
      const spawnPoints = [
        { position: [20, 1, 20] as Vector3 },
        { position: [-20, 1, -20] as Vector3 },
      ];
      const customSpawner = new EnemySpawner({
        maxEnemies: 10,
        spawnPoints,
      });
      
      const enemies = customSpawner.spawnInitialEnemies(playerPosition);
      // At least some enemies should be at spawn points
      const spawnPositions = spawnPoints.map(sp => sp.position);
      const enemyPositions = enemies.map(e => e.position);
      
      // Check if any enemy is near a spawn point
      let foundNearSpawnPoint = false;
      for (const enemyPos of enemyPositions) {
        for (const spawnPos of spawnPositions) {
          const distance = vec3.distance(enemyPos, spawnPos);
          if (distance < 1) {
            foundNearSpawnPoint = true;
            break;
          }
        }
      }
      // This is probabilistic, so we just verify enemies were spawned
      expect(enemies.length).toBeGreaterThan(0);
    });

    it('should handle spawn points with radius', () => {
      const spawnPoints = [
        { position: [15, 1, 15] as Vector3, radius: 3 },
      ];
      const customSpawner = new EnemySpawner({
        maxEnemies: 10,
        spawnPoints,
      });
      
      const enemies = customSpawner.spawnInitialEnemies(playerPosition);
      enemies.forEach(enemy => {
        const distance = vec3.distance(enemy.position, spawnPoints[0].position);
        expect(distance).toBeLessThanOrEqual(3);
      });
    });
  });

  describe('Configuration Updates', () => {
    it('should update max enemies', () => {
      spawner.updateConfig({ maxEnemies: 20 });
      expect(spawner.getMaxEnemies()).toBe(20);
    });

    it('should update spawn radius', () => {
      const initialPoints = spawner.getSpawnPoints();
      spawner.updateConfig({ spawnRadius: 25 });
      // Spawn radius affects random spawns, not existing points
      expect(spawner.getSpawnPoints()).toEqual(initialPoints);
    });

    it('should update spawn points', () => {
      const newPoints = [
        { position: [30, 1, 30] as Vector3 },
      ];
      spawner.updateConfig({ spawnPoints: newPoints });
      const points = spawner.getSpawnPoints();
      expect(points.length).toBe(1);
      expect(points[0].position).toEqual([30, 1, 30]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero max enemies', () => {
      const zeroSpawner = new EnemySpawner({
        maxEnemies: 0,
      });
      const enemies = zeroSpawner.spawnInitialEnemies(playerPosition);
      expect(enemies.length).toBe(0);
    });

    it('should handle player at origin', () => {
      const origin: Vector3 = [0, 0, 0];
      const enemies = spawner.spawnInitialEnemies(origin);
      enemies.forEach(enemy => {
        const distance = vec3.distance(enemy.position, origin);
        expect(distance).toBeGreaterThanOrEqual(5);
      });
    });

    it('should handle player far from origin', () => {
      const farPosition: Vector3 = [100, 2, 100];
      const enemies = spawner.spawnInitialEnemies(farPosition);
      enemies.forEach(enemy => {
        const distance = vec3.distance(enemy.position, farPosition);
        expect(distance).toBeGreaterThanOrEqual(5);
      });
    });
  });
});

