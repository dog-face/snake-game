// Enemy AI system with state machine
import { GAME_CONFIG } from './constants';
import { vec3, type Vector3 } from './math';

export enum EnemyState {
  IDLE = 'IDLE',
  PATROL = 'PATROL',
  CHASE = 'CHASE',
  ATTACK = 'ATTACK',
  DEAD = 'DEAD',
}

export interface EnemyData {
  id: string;
  position: Vector3;
  rotation: Vector3;
  health: number;
  state: EnemyState;
}

export interface EnemyUpdateContext {
  playerPosition: Vector3;
  deltaTime: number;
  raycast?: (origin: Vector3, direction: Vector3) => { distance: number } | null;
}

export class EnemyAI {
  public id: string;
  public position: Vector3;
  public rotation: Vector3;
  public health: number;
  public state: EnemyState;
  private maxHealth: number;
  private attackCooldown: number = 0;
  private patrolTarget: Vector3 | null = null;
  private lastKnownPlayerPosition: Vector3 | null = null;

  constructor(
    id: string,
    position: Vector3,
    maxHealth: number = GAME_CONFIG.ENEMY_HEALTH
  ) {
    this.id = id;
    this.position = [...position] as Vector3;
    this.rotation = [0, 0, 0] as Vector3;
    this.health = maxHealth;
    this.maxHealth = maxHealth;
    this.state = EnemyState.IDLE;
    this.patrolTarget = null;
  }

  /**
   * Update enemy AI state and behavior
   */
  update(context: EnemyUpdateContext): void {
    if (this.state === EnemyState.DEAD) {
      return;
    }

    // Update attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown = Math.max(0, this.attackCooldown - context.deltaTime * 1000);
    }

    // Check if enemy is dead
    if (this.health <= 0) {
      this.state = EnemyState.DEAD;
      return;
    }

    // Calculate distance to player
    const distanceToPlayer = vec3.distance(this.position, context.playerPosition);

    // State machine logic
    switch (this.state) {
      case EnemyState.IDLE:
        this.updateIdle(context, distanceToPlayer);
        break;
      case EnemyState.PATROL:
        this.updatePatrol(context, distanceToPlayer);
        break;
      case EnemyState.CHASE:
        this.updateChase(context, distanceToPlayer);
        break;
      case EnemyState.ATTACK:
        this.updateAttack(context, distanceToPlayer);
        break;
    }
  }

  /**
   * Apply damage to enemy
   */
  takeDamage(amount: number): void {
    if (this.state === EnemyState.DEAD) {
      return;
    }
    this.health = Math.max(0, this.health - amount);
  }

  /**
   * Get current enemy data for game state
   */
  getData(): EnemyData {
    return {
      id: this.id,
      position: this.position,
      rotation: this.rotation,
      health: this.health,
      state: this.state,
    };
  }

  /**
   * Check if player is detected (within detection range)
   */
  private isPlayerDetected(distance: number): boolean {
    return distance <= GAME_CONFIG.ENEMY_DETECTION_RANGE;
  }

  /**
   * Check if player is in attack range
   */
  private isPlayerInAttackRange(distance: number): boolean {
    return distance <= GAME_CONFIG.ENEMY_ATTACK_RANGE;
  }

  /**
   * Check line of sight to player (optional, for Phase 2)
   */
  private hasLineOfSight(
    context: EnemyUpdateContext,
    playerPosition: Vector3
  ): boolean {
    if (!context.raycast) {
      // If no raycast function provided, assume line of sight
      return true;
    }

    const direction = vec3.normalize(
      vec3.subtract(playerPosition, this.position)
    );
    const result = context.raycast(this.position, direction);
    
    if (!result) {
      return false;
    }

    const distanceToPlayer = vec3.distance(this.position, playerPosition);
    return result.distance >= distanceToPlayer - 0.5; // Allow small margin
  }

  /**
   * Update IDLE state
   */
  private updateIdle(context: EnemyUpdateContext, distance: number): void {
    if (this.isPlayerDetected(distance)) {
      if (this.hasLineOfSight(context, context.playerPosition)) {
        this.state = EnemyState.CHASE;
        this.lastKnownPlayerPosition = [...context.playerPosition] as Vector3;
      }
    } else {
      // Transition to patrol after a short idle period
      this.state = EnemyState.PATROL;
      this.generatePatrolTarget();
    }
  }

  /**
   * Update PATROL state
   */
  private updatePatrol(context: EnemyUpdateContext, distance: number): void {
    // Check for player detection
    if (this.isPlayerDetected(distance)) {
      if (this.hasLineOfSight(context, context.playerPosition)) {
        this.state = EnemyState.CHASE;
        this.lastKnownPlayerPosition = [...context.playerPosition] as Vector3;
        return;
      }
    }

    // Move toward patrol target (will be implemented in Phase 2)
    // For now, just stay in patrol state
    if (this.patrolTarget) {
      const distanceToTarget = vec3.distance(this.position, this.patrolTarget);
      if (distanceToTarget < 0.5) {
        // Reached patrol target, generate new one
        this.generatePatrolTarget();
      }
    } else {
      this.generatePatrolTarget();
    }
  }

  /**
   * Update CHASE state
   */
  private updateChase(context: EnemyUpdateContext, distance: number): void {
    // Check if player is in attack range
    if (this.isPlayerInAttackRange(distance)) {
      this.state = EnemyState.ATTACK;
      return;
    }

    // Check if player is still detected
    if (!this.isPlayerDetected(distance)) {
      // Lost player, go back to patrol
      this.state = EnemyState.PATROL;
      this.lastKnownPlayerPosition = null;
      this.generatePatrolTarget();
      return;
    }

    // Update last known position
    this.lastKnownPlayerPosition = [...context.playerPosition] as Vector3;

    // Move toward player (movement will be handled by physics in Phase 2)
  }

  /**
   * Update ATTACK state
   */
  private updateAttack(context: EnemyUpdateContext, distance: number): void {
    // Check if player moved out of range
    if (!this.isPlayerInAttackRange(distance)) {
      this.state = EnemyState.CHASE;
      return;
    }

    // Check if player is still detected
    if (!this.isPlayerDetected(distance)) {
      this.state = EnemyState.PATROL;
      this.lastKnownPlayerPosition = null;
      this.generatePatrolTarget();
      return;
    }

    // Attack if cooldown is ready
    if (this.attackCooldown <= 0) {
      // Attack will be handled by game loop in Phase 2
      this.attackCooldown = GAME_CONFIG.ENEMY_ATTACK_COOLDOWN;
    }
  }

  /**
   * Generate a random patrol target near current position
   */
  private generatePatrolTarget(): void {
    const patrolRadius = 5;
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * patrolRadius;
    
    this.patrolTarget = [
      this.position[0] + Math.cos(angle) * distance,
      this.position[1],
      this.position[2] + Math.sin(angle) * distance,
    ] as Vector3;
  }

  /**
   * Get the direction the enemy should move (for physics)
   */
  getMovementDirection(context: EnemyUpdateContext): Vector3 {
    if (this.state === EnemyState.DEAD) {
      return [0, 0, 0];
    }

    switch (this.state) {
      case EnemyState.CHASE:
        if (this.lastKnownPlayerPosition) {
          const direction = vec3.normalize(
            vec3.subtract(this.lastKnownPlayerPosition, this.position)
          );
          return [direction[0], 0, direction[2]]; // Keep Y at 0 for ground movement
        }
        return [0, 0, 0];

      case EnemyState.PATROL:
        if (this.patrolTarget) {
          const direction = vec3.normalize(
            vec3.subtract(this.patrolTarget, this.position)
          );
          return [direction[0], 0, direction[2]];
        }
        return [0, 0, 0];

      default:
        return [0, 0, 0];
    }
  }

  /**
   * Check if enemy can attack (cooldown ready)
   */
  canAttack(): boolean {
    return this.state === EnemyState.ATTACK && this.attackCooldown <= 0;
  }

  /**
   * Get attack damage
   */
  getAttackDamage(): number {
    return GAME_CONFIG.ENEMY_DAMAGE;
  }
}

