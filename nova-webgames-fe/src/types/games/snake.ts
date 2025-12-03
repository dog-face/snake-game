export type Direction = 'up' | 'down' | 'left' | 'right';
export type GameMode = 'pass-through' | 'walls';

export interface Position {
  x: number;
  y: number;
}

export interface GameState {
  snake: Position[];
  food: Position;
  direction: Direction;
  score: number;
  gameOver: boolean;
}

export interface GameConfig {
  gridSize: number;
  cellSize: number;
  gameMode: GameMode;
}

