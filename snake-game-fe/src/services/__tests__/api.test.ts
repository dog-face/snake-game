import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { apiService } from '../api';

// Mock fetch globally
const mockFetch = vi.fn();
(globalThis as any).fetch = mockFetch;

describe('apiService', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    localStorage.clear();
  });

  afterEach(() => {
    mockFetch.mockReset();
    localStorage.clear();
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const mockUser = { id: '1', username: 'player1', email: 'player1@example.com' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'mock-token', user: mockUser }),
      });

      const user = await apiService.login({ username: 'player1', password: 'password1' });
      
      expect(user).toBeDefined();
      expect(user.username).toBe('player1');
      expect(user.id).toBe('1');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'player1', password: 'password1' }),
        })
      );
    });

    it('should throw error with invalid credentials', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Invalid username or password' }),
      });

      await expect(
        apiService.login({ username: 'invalid', password: 'invalid' })
      ).rejects.toThrow('Invalid username or password');
    });
  });

  describe('signup', () => {
    it('should signup with new user', async () => {
      const mockUser = { id: '2', username: 'newuser', email: 'newuser@example.com' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'mock-token', user: mockUser }),
      });

      const user = await apiService.signup({
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
      });
      
      expect(user).toBeDefined();
      expect(user.username).toBe('newuser');
      expect(user.email).toBe('newuser@example.com');
    });

    it('should throw error if username already exists', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'The user with this email already exists in the system.' }),
      });

      await expect(
        apiService.signup({
          username: 'player1',
          email: 'different@example.com',
          password: 'password',
        })
      ).rejects.toThrow('The user with this email already exists in the system.');
    });

    it('should throw error if email already exists', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'The user with this email already exists in the system.' }),
      });

      await expect(
        apiService.signup({
          username: 'different',
          email: 'player1@example.com',
          password: 'password',
        })
      ).rejects.toThrow('The user with this email already exists in the system.');
    });
  });

  describe('logout', () => {
    it('should logout user', async () => {
      // Mock login
      const mockUser = { id: '1', username: 'player1', email: 'player1@example.com' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'mock-token', user: mockUser }),
      });
      await apiService.login({ username: 'player1', password: 'password1' });
      
      // Mock getCurrentUser before logout
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      });
      const userBefore = await apiService.getCurrentUser();
      expect(userBefore).not.toBeNull();
      
      // Mock logout
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
      await apiService.logout();
      
      // After logout, getCurrentUser should return null (no token, so no fetch call)
      const userAfter = await apiService.getCurrentUser();
      expect(userAfter).toBeNull();
    });
  });

  describe('getLeaderboard', () => {
    it('should return leaderboard entries', async () => {
      const mockEntries = [
        { id: '1', username: 'player1', score: 100, gameMode: 'pass-through', date: '2024-01-01' },
        { id: '2', username: 'player2', score: 90, gameMode: 'walls', date: '2024-01-02' },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ entries: mockEntries }),
      });

      const leaderboard = await apiService.getLeaderboard();
      
      expect(leaderboard).toBeDefined();
      expect(Array.isArray(leaderboard)).toBe(true);
      expect(leaderboard.length).toBeGreaterThan(0);
    });

    it('should return sorted leaderboard by score', async () => {
      const mockEntries = [
        { id: '1', username: 'player1', score: 100, gameMode: 'pass-through', date: '2024-01-01' },
        { id: '2', username: 'player2', score: 90, gameMode: 'walls', date: '2024-01-02' },
        { id: '3', username: 'player3', score: 80, gameMode: 'pass-through', date: '2024-01-03' },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ entries: mockEntries }),
      });

      const leaderboard = await apiService.getLeaderboard();
      
      for (let i = 1; i < leaderboard.length; i++) {
        expect(leaderboard[i - 1].score).toBeGreaterThanOrEqual(leaderboard[i].score);
      }
    });

    it('should respect limit parameter', async () => {
      const mockEntries = [
        { id: '1', username: 'player1', score: 100, gameMode: 'pass-through', date: '2024-01-01' },
        { id: '2', username: 'player2', score: 90, gameMode: 'walls', date: '2024-01-02' },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ entries: mockEntries }),
      });

      const leaderboard = await apiService.getLeaderboard(3);
      
      expect(leaderboard.length).toBeLessThanOrEqual(3);
    });
  });

  describe('submitScore', () => {
    it('should submit score when logged in', async () => {
      // Mock login
      const mockUser = { id: '1', username: 'player1', email: 'player1@example.com' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'mock-token', user: mockUser }),
      });
      await apiService.login({ username: 'player1', password: 'password1' });
      
      // Mock submitScore
      const mockEntry = { id: '1', username: 'player1', score: 100, gameMode: 'pass-through', date: '2024-01-01' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEntry,
      });
      
      const entry = await apiService.submitScore(100, 'pass-through');
      
      expect(entry).toBeDefined();
      expect(entry.username).toBe('player1');
      expect(entry.score).toBe(100);
      expect(entry.gameMode).toBe('pass-through');
    });

    it('should throw error when not logged in', async () => {
      // Mock logout
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
      await apiService.logout();
      
      // Mock submitScore failure
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Not authenticated' }),
      });
      
      await expect(
        apiService.submitScore(100, 'pass-through')
      ).rejects.toThrow('Not authenticated');
    });
  });

  describe('getActivePlayers', () => {
    it('should return active players', async () => {
      const mockPlayers = [
        {
          id: '1',
          userId: '1',
          username: 'player1',
          score: 50,
          gameMode: 'pass-through' as const,
          gameState: {
            snake: [{ x: 10, y: 10 }],
            food: { x: 20, y: 20 },
            direction: 'right' as const,
            score: 50,
            gameOver: false,
          },
        },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ players: mockPlayers }),
      });

      const players = await apiService.getActivePlayers();
      
      expect(players).toBeDefined();
      expect(Array.isArray(players)).toBe(true);
      expect(players.length).toBeGreaterThan(0);
      
      if (players.length > 0) {
        expect(players[0]).toHaveProperty('id');
        expect(players[0]).toHaveProperty('username');
        expect(players[0]).toHaveProperty('score');
        expect(players[0]).toHaveProperty('gameMode');
        expect(players[0]).toHaveProperty('gameState');
      }
    });
  });
});

