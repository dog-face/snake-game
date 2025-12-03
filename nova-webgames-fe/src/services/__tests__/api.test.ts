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

    it('should return empty array when no active players', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ players: [] }),
      });

      const players = await apiService.getActivePlayers();
      
      expect(players).toBeDefined();
      expect(Array.isArray(players)).toBe(true);
      expect(players.length).toBe(0);
    });

    it('should throw error when fetch fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(apiService.getActivePlayers()).rejects.toThrow('Failed to fetch active players');
    });
  });

  describe('Watch Mode API Calls', () => {
    beforeEach(() => {
      // Mock login to set token
      const mockUser = { id: '1', username: 'player1', email: 'player1@example.com' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'mock-token', user: mockUser }),
      });
    });

    describe('startGameSession', () => {
      it('should start a game session', async () => {
        await apiService.login({ username: 'player1', password: 'password1' });
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ sessionId: 'session-123', gameMode: 'pass-through', startedAt: '2024-01-01T00:00:00Z' }),
        });

        const result = await apiService.startGameSession('pass-through');
        
        expect(result).toBeDefined();
        expect(result.sessionId).toBe('session-123');
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/watch/start'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': 'Bearer mock-token',
            }),
            body: JSON.stringify({ gameMode: 'pass-through' }),
          })
        );
      });

      it('should throw error when not authenticated', async () => {
        localStorage.clear();
        // Clear token from service
        await apiService.logout();
        
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
          json: async () => ({ detail: { error: { code: 'INVALID_TOKEN', message: 'Invalid token' } } }),
        });

        await expect(apiService.startGameSession('pass-through')).rejects.toThrow('Invalid token');
      });

      it('should throw error with invalid game mode', async () => {
        await apiService.login({ username: 'player1', password: 'password1' });
        
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 422,
          json: async () => ({ detail: { error: { code: 'INVALID_GAME_MODE', message: 'Invalid game mode' } } }),
        });

        await expect(apiService.startGameSession('invalid-mode' as any)).rejects.toThrow('Invalid game mode');
      });
    });

    describe('updateGameState', () => {
      it('should update game state for a session', async () => {
        await apiService.login({ username: 'player1', password: 'password1' });
        
        const gameState = {
          snake: [{ x: 10, y: 10 }, { x: 11, y: 10 }],
          food: { x: 15, y: 15 },
          direction: 'right' as const,
          score: 10,
          gameOver: false,
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Game state updated', lastUpdatedAt: '2024-01-01T00:00:00Z' }),
        });

        await apiService.updateGameState('session-123', gameState);
        
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/watch/update/session-123'),
          expect.objectContaining({
            method: 'PUT',
            headers: expect.objectContaining({
              'Authorization': 'Bearer mock-token',
            }),
            body: JSON.stringify({ gameState }),
          })
        );
      });

      it('should throw error when session not found', async () => {
        await apiService.login({ username: 'player1', password: 'password1' });
        
        const gameState = {
          snake: [{ x: 10, y: 10 }],
          food: { x: 15, y: 15 },
          direction: 'right' as const,
          score: 0,
          gameOver: false,
        };

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: async () => ({ detail: { error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' } } }),
        });

        await expect(apiService.updateGameState('invalid-session', gameState)).rejects.toThrow('Session not found');
      });

      it('should throw error with invalid game state', async () => {
        await apiService.login({ username: 'player1', password: 'password1' });
        
        const invalidGameState = {
          snake: [{ x: 25, y: 10 }], // Invalid: x out of bounds
          food: { x: 15, y: 15 },
          direction: 'right' as const,
          score: 0,
          gameOver: false,
        };

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 422,
          json: async () => ({ detail: { error: { code: 'VALIDATION_ERROR', message: 'Invalid game state' } } }),
        });

        await expect(apiService.updateGameState('session-123', invalidGameState)).rejects.toThrow('Invalid game state');
      });
    });

    describe('endGameSession', () => {
      it('should end a game session and return leaderboard entry', async () => {
        await apiService.login({ username: 'player1', password: 'password1' });
        
        const mockEntry = {
          id: '1',
          username: 'player1',
          score: 100,
          gameMode: 'pass-through' as const,
          date: '2024-01-01',
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ message: 'Session ended', leaderboardEntry: mockEntry }),
        });

        const entry = await apiService.endGameSession('session-123', 100, 'pass-through');
        
        expect(entry).toBeDefined();
        expect(entry.score).toBe(100);
        expect(entry.gameMode).toBe('pass-through');
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/watch/end/session-123'),
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': 'Bearer mock-token',
            }),
            body: JSON.stringify({ finalScore: 100, gameMode: 'pass-through' }),
          })
        );
      });

      it('should throw error when session not found', async () => {
        await apiService.login({ username: 'player1', password: 'password1' });
        
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: async () => ({ detail: { error: { code: 'SESSION_NOT_FOUND', message: 'Session not found' } } }),
        });

        await expect(apiService.endGameSession('invalid-session', 100, 'pass-through')).rejects.toThrow('Session not found');
      });

      it('should throw error with negative final score', async () => {
        await apiService.login({ username: 'player1', password: 'password1' });
        
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 422,
          json: async () => ({ detail: { error: { code: 'VALIDATION_ERROR', message: 'Score must be non-negative' } } }),
        });

        await expect(apiService.endGameSession('session-123', -1, 'pass-through')).rejects.toThrow('Score must be non-negative');
      });
    });
  });

  describe('Error Recovery Scenarios', () => {
    describe('Network Failures', () => {
      it('should handle network error (fetch throws)', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));
        
        await expect(apiService.getActivePlayers()).rejects.toThrow('Network error');
      });

      it('should handle timeout error', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Request timeout'));
        
        await expect(apiService.getLeaderboard()).rejects.toThrow('Request timeout');
      });

      it('should handle connection refused error', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));
        
        await expect(apiService.getActivePlayers()).rejects.toThrow('Failed to fetch');
      });
    });

    describe('Error Response Handling', () => {
      it('should handle error with detail.error.message structure', async () => {
        // Use a method that uses handleError (like login)
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ detail: { error: { code: 'BAD_REQUEST', message: 'Invalid request' } } }),
        });

        await expect(apiService.login({ username: 'test', password: 'test' })).rejects.toThrow('Invalid request');
      });

      it('should handle error with detail.message structure', async () => {
        // Use a method that uses handleError (like submitScore)
        const mockUser = { id: '1', username: 'player1', email: 'player1@example.com' };
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ token: 'mock-token', user: mockUser }),
        });
        await apiService.login({ username: 'player1', password: 'password1' });
        
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ detail: { message: 'Validation failed' } }),
        });

        await expect(apiService.submitScore(100, 'pass-through')).rejects.toThrow('Validation failed');
      });

      it('should handle error with simple detail string', async () => {
        // Use a method that uses handleError (like login)
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({ detail: 'Simple error message' }),
        });

        await expect(apiService.login({ username: 'test', password: 'test' })).rejects.toThrow('Simple error message');
      });

      it('should handle error with non-JSON response', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => { throw new Error('Not JSON'); },
          text: async () => 'Server error text',
        });

        // getActivePlayers throws generic error, not using handleError
        await expect(apiService.getActivePlayers()).rejects.toThrow('Failed to fetch active players');
      });

      it('should handle error with no response body', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => { throw new Error('Not JSON'); },
          text: async () => { throw new Error('No text'); },
        });

        // getActivePlayers throws generic error, not using handleError
        await expect(apiService.getActivePlayers()).rejects.toThrow('Failed to fetch active players');
      });
    });

    describe('Token Management on Errors', () => {
      it('should clear token when getCurrentUser returns 401', async () => {
        // Set token first
        localStorage.setItem('token', 'existing-token');
        
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 401,
        });

        const user = await apiService.getCurrentUser();
        
        expect(user).toBeNull();
        expect(localStorage.getItem('token')).toBeNull();
      });

      it('should clear token when getCurrentUser throws network error', async () => {
        // Set token first
        localStorage.setItem('token', 'existing-token');
        
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        const user = await apiService.getCurrentUser();
        
        expect(user).toBeNull();
        expect(localStorage.getItem('token')).toBeNull();
      });

      it('should preserve token on non-auth errors', async () => {
        // Set token first
        localStorage.setItem('token', 'existing-token');
        
        // Mock login to set token in service
        const mockUser = { id: '1', username: 'player1', email: 'player1@example.com' };
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ token: 'existing-token', user: mockUser }),
        });
        await apiService.login({ username: 'player1', password: 'password1' });
        
        // Mock a 500 error (not auth error) - getActivePlayers throws generic error
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: async () => ({ detail: 'Server error' }),
        });

        await expect(apiService.getActivePlayers()).rejects.toThrow('Failed to fetch active players');
        
        // Token should still be present
        expect(localStorage.getItem('token')).toBe('existing-token');
      });
    });
  });

  describe('Concurrent API Calls', () => {
    it('should handle multiple concurrent getActivePlayers calls', async () => {
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

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ players: mockPlayers }),
      });

      const promises = [
        apiService.getActivePlayers(),
        apiService.getActivePlayers(),
        apiService.getActivePlayers(),
      ];

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach(players => {
        expect(Array.isArray(players)).toBe(true);
        expect(players.length).toBeGreaterThan(0);
      });
    });

    it('should handle concurrent watch session operations', async () => {
      // Mock login
      const mockUser = { id: '1', username: 'player1', email: 'player1@example.com' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'mock-token', user: mockUser }),
      });
      await apiService.login({ username: 'player1', password: 'password1' });

      // Mock start session
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ sessionId: 'session-123', gameMode: 'pass-through', startedAt: '2024-01-01T00:00:00Z' }),
      });

      const session = await apiService.startGameSession('pass-through');
      
      // Mock multiple concurrent updates
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Updated', lastUpdatedAt: '2024-01-01T00:00:00Z' }),
      });

      const gameState = {
        snake: [{ x: 10, y: 10 }],
        food: { x: 15, y: 15 },
        direction: 'right' as const,
        score: 0,
        gameOver: false,
      };

      const updatePromises = [
        apiService.updateGameState(session.sessionId, gameState),
        apiService.updateGameState(session.sessionId, { ...gameState, score: 1 }),
        apiService.updateGameState(session.sessionId, { ...gameState, score: 2 }),
      ];

      await Promise.all(updatePromises);
      
      // All updates should have been called
      // Count: 1 login + 1 start + 3 updates = 5 total
      expect(mockFetch).toHaveBeenCalledTimes(5);
    });
  });
});

