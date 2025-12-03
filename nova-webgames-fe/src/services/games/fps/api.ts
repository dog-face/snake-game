import { apiService } from '../../api';
import type { FPSLeaderboardEntry, FPSLeaderboardResponse } from '../../../types/games/fps';

export const fpsApi = {
  async getLeaderboard(
    offset: number = 0,
    limit: number = 20,
    gameMode?: string
  ): Promise<FPSLeaderboardResponse> {
    const params = new URLSearchParams({
      offset: offset.toString(),
      limit: limit.toString(),
    });
    if (gameMode) {
      params.append('gameMode', gameMode);
    }
    
    const response = await apiService.get(`/games/fps/leaderboard?${params}`);
    return response.data;
  },

  async submitScore(
    score: number,
    kills: number,
    deaths: number,
    gameMode: string
  ): Promise<FPSLeaderboardEntry> {
    const response = await apiService.post('/games/fps/leaderboard', {
      score,
      kills,
      deaths,
      game_mode: gameMode,
    });
    return response.data;
  },
};

