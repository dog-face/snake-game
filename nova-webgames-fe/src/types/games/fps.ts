export interface FPSGameState {
  // Game state structure
  player: {
    position: [number, number, number];
    rotation: [number, number, number];
    health: number;
    armor: number;
  };
  enemies: Array<{
    id: string;
    position: [number, number, number];
    rotation: [number, number, number];
    health: number;
  }>;
  projectiles: Array<{
    id: string;
    position: [number, number, number];
    velocity: [number, number, number];
  }>;
  score: number;
  kills: number;
  deaths: number;
}

export interface FPSLeaderboardEntry {
  id: string;
  username: string;
  score: number;
  kills: number;
  deaths: number;
  game_mode: string;
  date: string;
  created_at?: string;
}

export interface FPSLeaderboardResponse {
  entries: FPSLeaderboardEntry[];
  total: number;
  offset: number;
  limit: number;
}

