// Centralized API service - all backend calls go through here
// Connected to real backend API

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

export interface User {
  id: string;
  username: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface SignupData {
  username: string;
  email: string;
  password: string;
}

export interface LeaderboardEntry {
  id: string;
  username: string;
  score: number;
  gameMode: 'pass-through' | 'walls';
  date: string;
  createdAt?: string;
}

export interface ActivePlayer {
  id: string;
  userId?: string;
  username: string;
  score: number;
  gameMode: 'pass-through' | 'walls';
  gameState: GameState;
  startedAt?: string;
  lastUpdatedAt?: string;
}

export interface GameState {
  snake: Array<{ x: number; y: number }>;
  food: { x: number; y: number };
  direction: 'up' | 'down' | 'left' | 'right';
  score: number;
  gameOver: boolean;
}

class ApiService {
  private token: string | null = null;

  // Store token after login/signup
  private setToken(token: string): void {
    this.token = token;
    localStorage.setItem('token', token);
  }

  // Get token from storage
  private getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('token');
    }
    return this.token;
  }

  // Clear token on logout
  private clearToken(): void {
    this.token = null;
    localStorage.removeItem('token');
  }

  // Helper to get auth headers
  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // Helper to handle errors
  private async handleError(response: Response): Promise<never> {
    let message = 'Request failed';
    try {
      const error = await response.json();
      message = error.detail?.error?.message || error.detail?.message || error.detail || message;
    } catch (e) {
      // If response is not JSON, try to get text
      try {
        const text = await response.text();
        message = text || message;
      } catch (textError) {
        // Fall back to status text
        message = response.statusText || message;
      }
    }
    throw new Error(message);
  }

  // Authentication
  async login(credentials: LoginCredentials): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      await this.handleError(response);
    }

    const data = await response.json();
    this.setToken(data.token);
    return data.user;
  }

  async signup(data: SignupData): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      await this.handleError(response);
    }

    const result = await response.json();
    this.setToken(result.token);
    return result.user;
  }

  async logout(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
    });

    if (response.ok) {
      this.clearToken();
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        this.clearToken();
        return null;
      }

      return await response.json();
    } catch (error) {
      this.clearToken();
      return null;
    }
  }

  // Leaderboard
  async getLeaderboard(limit: number = 10, gameMode?: 'pass-through' | 'walls'): Promise<LeaderboardEntry[]> {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });
    if (gameMode) {
      params.append('gameMode', gameMode);
    }

    const response = await fetch(`${API_BASE_URL}/leaderboard?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch leaderboard');
    }

    const data = await response.json();
    return data.entries;
  }

  async submitScore(score: number, gameMode: 'pass-through' | 'walls'): Promise<LeaderboardEntry> {
    const response = await fetch(`${API_BASE_URL}/leaderboard`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ score, game_mode: gameMode }),
    });

    if (!response.ok) {
      await this.handleError(response);
    }

    return await response.json();
  }

  // Active players (for watching)
  async getActivePlayers(): Promise<ActivePlayer[]> {
    const response = await fetch(`${API_BASE_URL}/watch/active`);
    if (!response.ok) {
      throw new Error('Failed to fetch active players');
    }

    const data = await response.json();
    return data.players;
  }

  // Game session management (for watch feature)
  async startGameSession(gameMode: 'pass-through' | 'walls'): Promise<{ sessionId: string }> {
    const response = await fetch(`${API_BASE_URL}/watch/start`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ gameMode }),
    });

    if (!response.ok) {
      await this.handleError(response);
    }

    const data = await response.json();
    return { sessionId: data.sessionId };
  }

  async updateGameState(sessionId: string, gameState: GameState): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/watch/update/${sessionId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ gameState }),
    });

    if (!response.ok) {
      await this.handleError(response);
    }
  }

  async endGameSession(
    sessionId: string,
    finalScore: number,
    gameMode: 'pass-through' | 'walls'
  ): Promise<LeaderboardEntry> {
    const response = await fetch(`${API_BASE_URL}/watch/end/${sessionId}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ finalScore, gameMode }),
    });

    if (!response.ok) {
      await this.handleError(response);
    }

    const data = await response.json();
    return data.leaderboardEntry;
  }
}

export const apiService = new ApiService();

