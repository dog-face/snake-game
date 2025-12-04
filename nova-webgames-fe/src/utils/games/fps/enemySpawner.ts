// Enemy spawning system
import { EnemyAI } from './enemyAI';
import { vec3, type Vector3 } from './math';

export interface SpawnPoint {
  position: Vector3;
  radius?: number; // Optional spawn radius around point
}

export interface SpawnConfig {
  maxEnemies: number;
  spawnPoints?: SpawnPoint[];
  spawnRadius?: number; // Default spawn radius if no spawn points
  minDistanceFromPlayer?: number; // Minimum distance from player to spawn
}

export class EnemySpawner {
  private maxEnemies: number;
  private spawnPoints: SpawnPoint[];
  private spawnRadius: number;
  private minDistanceFromPlayer: number;
  private enemyCounter: number = 0;

  constructor(config: SpawnConfig) {
    this.maxEnemies = config.maxEnemies;
    this.spawnRadius = config.spawnRadius ?? 10;
    this.minDistanceFromPlayer = config.minDistanceFromPlayer ?? 5;
    
    // Use provided spawn points or generate default ones
    if (config.spawnPoints && config.spawnPoints.length > 0) {
      this.spawnPoints = config.spawnPoints;
    } else {
      // Generate default spawn points in a circle around origin
      this.spawnPoints = this.generateDefaultSpawnPoints(8);
    }
  }

  /**
   * Generate default spawn points in a circle
   */
  private generateDefaultSpawnPoints(count: number): SpawnPoint[] {
    const points: SpawnPoint[] = [];
    const radius = 15;
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      points.push({
        position: [
          Math.cos(angle) * radius,
          1, // Ground level
          Math.sin(angle) * radius,
        ] as Vector3,
      });
    }
    
    return points;
  }

  /**
   * Spawn enemies at game start
   */
  spawnInitialEnemies(playerPosition: Vector3): EnemyAI[] {
    const enemies: EnemyAI[] = [];
    const spawnCount = Math.min(3, this.maxEnemies); // Spawn 3 initially
    
    for (let i = 0; i < spawnCount; i++) {
      const spawnPos = this.getSpawnPosition(playerPosition);
      if (spawnPos) {
        const enemy = this.createEnemy(spawnPos);
        enemies.push(enemy);
      }
    }
    
    return enemies;
  }

  /**
   * Spawn a single enemy if under max count
   */
  spawnEnemy(
    playerPosition: Vector3,
    existingEnemies: EnemyAI[]
  ): EnemyAI | null {
    if (existingEnemies.length >= this.maxEnemies) {
      return null;
    }

    const spawnPos = this.getSpawnPosition(playerPosition);
    if (!spawnPos) {
      return null;
    }

    return this.createEnemy(spawnPos);
  }

  /**
   * Get a valid spawn position
   */
  private getSpawnPosition(playerPosition: Vector3): Vector3 | null {
    // Try spawn points first
    for (const spawnPoint of this.spawnPoints) {
      const distance = vec3.distance(spawnPoint.position, playerPosition);
      if (distance >= this.minDistanceFromPlayer) {
        // Add some random variation if radius is specified
        if (spawnPoint.radius && spawnPoint.radius > 0) {
          const angle = Math.random() * Math.PI * 2;
          const offset = Math.random() * spawnPoint.radius;
          return [
            spawnPoint.position[0] + Math.cos(angle) * offset,
            spawnPoint.position[1],
            spawnPoint.position[2] + Math.sin(angle) * offset,
          ] as Vector3;
        }
        return spawnPoint.position;
      }
    }

    // If no spawn point is valid, try random position
    return this.getRandomSpawnPosition(playerPosition);
  }

  /**
   * Get a random spawn position away from player
   */
  private getRandomSpawnPosition(playerPosition: Vector3): Vector3 | null {
    const maxAttempts = 10;
    
    for (let i = 0; i < maxAttempts; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = this.minDistanceFromPlayer + Math.random() * this.spawnRadius;
      const position: Vector3 = [
        playerPosition[0] + Math.cos(angle) * distance,
        1, // Ground level
        playerPosition[2] + Math.sin(angle) * distance,
      ];

      // Check if position is valid (far enough from player)
      if (vec3.distance(position, playerPosition) >= this.minDistanceFromPlayer) {
        return position;
      }
    }

    // Fallback: spawn at a fixed distance
    const angle = Math.random() * Math.PI * 2;
    return [
      playerPosition[0] + Math.cos(angle) * this.minDistanceFromPlayer,
      1,
      playerPosition[2] + Math.sin(angle) * this.minDistanceFromPlayer,
    ] as Vector3;
  }

  /**
   * Create a new enemy instance
   */
  private createEnemy(position: Vector3): EnemyAI {
    const id = `enemy-${this.enemyCounter++}-${Date.now()}`;
    return new EnemyAI(id, position);
  }

  /**
   * Update spawner configuration
   */
  updateConfig(config: Partial<SpawnConfig>): void {
    if (config.maxEnemies !== undefined) {
      this.maxEnemies = config.maxEnemies;
    }
    if (config.spawnRadius !== undefined) {
      this.spawnRadius = config.spawnRadius;
    }
    if (config.minDistanceFromPlayer !== undefined) {
      this.minDistanceFromPlayer = config.minDistanceFromPlayer;
    }
    if (config.spawnPoints !== undefined) {
      this.spawnPoints = config.spawnPoints;
    }
  }

  /**
   * Get current max enemies
   */
  getMaxEnemies(): number {
    return this.maxEnemies;
  }

  /**
   * Get spawn points
   */
  getSpawnPoints(): SpawnPoint[] {
    return [...this.spawnPoints];
  }
}

