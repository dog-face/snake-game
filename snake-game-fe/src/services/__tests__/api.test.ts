import { describe, it, expect, beforeEach } from 'vitest';
import { apiService } from '../api';

describe('apiService', () => {
  beforeEach(async () => {
    // Logout before each test to reset state
    await apiService.logout();
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const user = await apiService.login({ username: 'player1', password: 'password1' });
      
      expect(user).toBeDefined();
      expect(user.username).toBe('player1');
      expect(user.id).toBe('1');
    });

    it('should throw error with invalid credentials', async () => {
      await expect(
        apiService.login({ username: 'invalid', password: 'invalid' })
      ).rejects.toThrow('Invalid username or password');
    });
  });

  describe('signup', () => {
    it('should signup with new user', async () => {
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
      await expect(
        apiService.signup({
          username: 'player1',
          email: 'different@example.com',
          password: 'password',
        })
      ).rejects.toThrow('Username already exists');
    });

    it('should throw error if email already exists', async () => {
      await expect(
        apiService.signup({
          username: 'different',
          email: 'player1@example.com',
          password: 'password',
        })
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('logout', () => {
    it('should logout user', async () => {
      await apiService.login({ username: 'player1', password: 'password1' });
      expect(apiService.getCurrentUser()).not.toBeNull();
      
      await apiService.logout();
      expect(apiService.getCurrentUser()).toBeNull();
    });
  });

  describe('getLeaderboard', () => {
    it('should return leaderboard entries', async () => {
      const leaderboard = await apiService.getLeaderboard();
      
      expect(leaderboard).toBeDefined();
      expect(Array.isArray(leaderboard)).toBe(true);
      expect(leaderboard.length).toBeGreaterThan(0);
    });

    it('should return sorted leaderboard by score', async () => {
      const leaderboard = await apiService.getLeaderboard();
      
      for (let i = 1; i < leaderboard.length; i++) {
        expect(leaderboard[i - 1].score).toBeGreaterThanOrEqual(leaderboard[i].score);
      }
    });

    it('should respect limit parameter', async () => {
      const leaderboard = await apiService.getLeaderboard(3);
      
      expect(leaderboard.length).toBeLessThanOrEqual(3);
    });
  });

  describe('submitScore', () => {
    it('should submit score when logged in', async () => {
      await apiService.login({ username: 'player1', password: 'password1' });
      
      const entry = await apiService.submitScore(100, 'pass-through');
      
      expect(entry).toBeDefined();
      expect(entry.username).toBe('player1');
      expect(entry.score).toBe(100);
      expect(entry.gameMode).toBe('pass-through');
    });

    it('should throw error when not logged in', async () => {
      await apiService.logout();
      
      await expect(
        apiService.submitScore(100, 'pass-through')
      ).rejects.toThrow('Must be logged in to submit score');
    });
  });

  describe('getActivePlayers', () => {
    it('should return active players', async () => {
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

