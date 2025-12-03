import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Watch } from '../Watch';
import { apiService, ActivePlayer } from '../../services/api';

// Mock the API service
vi.mock('../../services/api', () => ({
  apiService: {
    getActivePlayers: vi.fn(),
  },
}));

// Mock the game logic
vi.mock('../../utils/games/snake/gameLogic', () => ({
  moveSnake: vi.fn((state) => ({
    ...state,
    score: state.score + 1,
  })),
}));

// Import after mocks are set up
import { apiService } from '../../services/api';

const mockActivePlayers: ActivePlayer[] = [
  {
    id: 'session-1',
    userId: 'user-1',
    username: 'player1',
    score: 100,
    gameMode: 'pass-through',
    gameState: {
      snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }],
      food: { x: 15, y: 15 },
      direction: 'right',
      score: 100,
      gameOver: false,
    },
    startedAt: '2024-01-15T10:00:00Z',
    lastUpdatedAt: '2024-01-15T10:05:00Z',
  },
  {
    id: 'session-2',
    userId: 'user-2',
    username: 'player2',
    score: 250,
    gameMode: 'walls',
    gameState: {
      snake: [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }],
      food: { x: 8, y: 8 },
      direction: 'up',
      score: 250,
      gameOver: false,
    },
    startedAt: '2024-01-15T10:02:00Z',
    lastUpdatedAt: '2024-01-15T10:07:00Z',
  },
];

describe('Watch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (apiService.getActivePlayers as any).mockResolvedValue(mockActivePlayers);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Active Players Display', () => {
    it('should render watch container with title', async () => {
      render(<Watch />);
      
      expect(screen.getByRole('heading', { name: 'Watch Players' })).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByText('Loading active players...')).not.toBeInTheDocument();
      });
    });

    it('should display loading state initially', () => {
      (apiService.getActivePlayers as any).mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<Watch />);
      
      expect(screen.getByText('Loading active players...')).toBeInTheDocument();
    });

    it('should display active players list after loading', async () => {
      render(<Watch />);
      
      await waitFor(() => {
        expect(screen.getByText('player1')).toBeInTheDocument();
      });
      
      expect(screen.getByText('player1')).toBeInTheDocument();
      expect(screen.getByText('player2')).toBeInTheDocument();
    });

    it('should display player scores', async () => {
      render(<Watch />);
      
      await waitFor(() => {
        expect(screen.getByText('player1')).toBeInTheDocument();
      });
      
      // Score is displayed as "Score: {score}" in player cards and game header
      const score100Elements = screen.getAllByText('Score: 100');
      expect(score100Elements.length).toBeGreaterThan(0);
      const score250Elements = screen.getAllByText('Score: 250');
      expect(score250Elements.length).toBeGreaterThan(0);
    });

    it('should display game mode badges for players', async () => {
      render(<Watch />);
      
      await waitFor(() => {
        expect(screen.getByText('player1')).toBeInTheDocument();
      });
      
      // Mode badges appear in player cards
      const passThroughBadges = screen.getAllByText('pass-through');
      expect(passThroughBadges.length).toBeGreaterThan(0);
      expect(screen.getByText('walls')).toBeInTheDocument();
    });

    it('should show empty state when no active players', async () => {
      (apiService.getActivePlayers as any).mockResolvedValue([]);
      
      render(<Watch />);
      
      await waitFor(() => {
        expect(screen.getByText('No active players at the moment')).toBeInTheDocument();
      });
    });
  });

  describe('Player Selection', () => {
    it('should display game board when player is selected', async () => {
      render(<Watch />);
      
      // Wait for auto-selection
      await waitFor(() => {
        expect(screen.getByText('Watching: player1')).toBeInTheDocument();
      }, { timeout: 10000 });
      
      const gameBoard = document.querySelector('.watch-game-board');
      expect(gameBoard).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (apiService.getActivePlayers as any).mockRejectedValue(new Error('API Error'));
      
      render(<Watch />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading active players...')).not.toBeInTheDocument();
      }, { timeout: 5000 });
      
      // Should not crash, should show empty state or handle error
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});
