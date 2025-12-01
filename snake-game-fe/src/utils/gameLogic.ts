import { GameState, Position, Direction, GameMode } from '../types/game';

const GRID_SIZE = 20;

export const createInitialGameState = (): GameState => {
  const snake: Position[] = [
    { x: 10, y: 10 },
    { x: 9, y: 10 },
    { x: 8, y: 10 },
  ];
  
  return {
    snake,
    food: generateFood(snake),
    direction: 'right',
    score: 0,
    gameOver: false,
  };
};

export const generateFood = (snake: Position[]): Position => {
  let food: Position;
  do {
    food = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
  
  return food;
};

export const moveSnake = (
  gameState: GameState,
  newDirection: Direction | null,
  gameMode: GameMode
): GameState => {
  if (gameState.gameOver) {
    return gameState;
  }

  let direction = newDirection || gameState.direction;
  
  // Prevent reversing into itself
  const oppositeDirections: Record<Direction, Direction> = {
    up: 'down',
    down: 'up',
    left: 'right',
    right: 'left',
  };
  
  if (oppositeDirections[direction] === gameState.direction) {
    // Keep moving in current direction if trying to reverse
    direction = gameState.direction;
  }

  const head = { ...gameState.snake[0] };
  
  // Move head based on direction
  switch (direction) {
    case 'up':
      head.y -= 1;
      break;
    case 'down':
      head.y += 1;
      break;
    case 'left':
      head.x -= 1;
      break;
    case 'right':
      head.x += 1;
      break;
  }

  // Handle boundaries based on game mode
  if (gameMode === 'walls') {
    if (
      head.x < 0 ||
      head.x >= GRID_SIZE ||
      head.y < 0 ||
      head.y >= GRID_SIZE
    ) {
      return { ...gameState, gameOver: true };
    }
  } else {
    // Pass-through mode: wrap around
    if (head.x < 0) head.x = GRID_SIZE - 1;
    if (head.x >= GRID_SIZE) head.x = 0;
    if (head.y < 0) head.y = GRID_SIZE - 1;
    if (head.y >= GRID_SIZE) head.y = 0;
  }

  const newSnake = [head, ...gameState.snake];
  
  // Check collision with self (check against the body, not including the new head)
  if (newSnake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)) {
    return { ...gameState, gameOver: true };
  }
  
  // Check if food is eaten
  let newFood = gameState.food;
  let newScore = gameState.score;
  
  if (head.x === gameState.food.x && head.y === gameState.food.y) {
    newScore += 10;
    newFood = generateFood(newSnake);
  } else {
    newSnake.pop(); // Remove tail if no food eaten
  }

  return {
    snake: newSnake,
    food: newFood,
    direction,
    score: newScore,
    gameOver: false,
  };
};

export const getNextDirection = (key: string): Direction | null => {
  const keyMap: Record<string, Direction> = {
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    w: 'up',
    s: 'down',
    a: 'left',
    d: 'right',
  };
  
  return keyMap[key] || null;
};

