import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SnakeLeaderboard } from '../SnakeLeaderboard';
import { LeaderboardEntry } from '../../../../services/api';

// Mock the API service
vi.mock('../../../../services/api', () => ({
  apiService: {
    getLeaderboard: vi.fn(),
  },
}));

// Import after mocks are set up
import { apiService } from '../../../../services/api';

const mockLeaderboardEntries: LeaderboardEntry[] = [
  {
    id: '1',
    username: 'player1',
    score: 1000,
    gameMode: 'pass-through',
    date: '2024-01-15',
  },
  {
    id: '2',
    username: 'player2',
    score: 850,
    gameMode: 'walls',
    date: '2024-01-14',
  },
  {
    id: '3',
    username: 'player3',
    score: 750,
    gameMode: 'pass-through',
    date: '2024-01-13',
  },
  {
    id: '4',
    username: 'player4',
    score: 600,
    gameMode: 'walls',
    date: '2024-01-12',
  },
  {
    id: '5',
    username: 'player5',
    score: 500,
    gameMode: 'pass-through',
    date: '2024-01-11',
  },
];

describe('SnakeLeaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (apiService.getLeaderboard as any).mockResolvedValue(mockLeaderboardEntries);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Leaderboard Rendering', () => {
    it('should render leaderboard container with title', async () => {
      render(<SnakeLeaderboard />);
      
      expect(screen.getByRole('heading', { name: 'Leaderboard' })).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.queryByText('Loading leaderboard...')).not.toBeInTheDocument();
      });
    });

    it('should display loading state initially', () => {
      (apiService.getLeaderboard as any).mockImplementation(() => new Promise(() => {})); // Never resolves
      
      render(<SnakeLeaderboard />);
      
      expect(screen.getByText('Loading leaderboard...')).toBeInTheDocument();
    });

    it('should render leaderboard entries after loading', async () => {
      render(<SnakeLeaderboard />);
      
      await waitFor(() => {
        expect(screen.getByText('player1')).toBeInTheDocument();
      });
      
      expect(screen.getByText('player1')).toBeInTheDocument();
      expect(screen.getByText('1000')).toBeInTheDocument();
      expect(screen.getByText('player2')).toBeInTheDocument();
      expect(screen.getByText('850')).toBeInTheDocument();
    });

    it('should display correct rank indicators for top 3', async () => {
      render(<SnakeLeaderboard />);
      
      await waitFor(() => {
        expect(screen.getByText('player1')).toBeInTheDocument();
      });
      
      // Top 3 should have emoji ranks
      const rankElements = screen.getAllByText(/🥇|🥈|🥉|#/);
      expect(rankElements.length).toBeGreaterThan(0);
    });

    it('should display rank numbers for entries beyond top 3', async () => {
      render(<SnakeLeaderboard />);
      
      await waitFor(() => {
        expect(screen.getByText('player4')).toBeInTheDocument();
      });
      
      // Entry 4 should show #4
      expect(screen.getByText('#4')).toBeInTheDocument();
      expect(screen.getByText('#5')).toBeInTheDocument();
    });

    it('should render leaderboard table headers', async () => {
      render(<SnakeLeaderboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Rank')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Rank')).toBeInTheDocument();
      expect(screen.getByText('Username')).toBeInTheDocument();
      expect(screen.getByText('Score')).toBeInTheDocument();
      expect(screen.getByText('Mode')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
    });

    it('should display game mode badges', async () => {
      render(<SnakeLeaderboard />);
      
      await waitFor(() => {
        expect(screen.getByText('player1')).toBeInTheDocument();
      });
      
      // Check for mode badges in the leaderboard rows (not filter buttons)
      const modeBadges = screen.getAllByText('pass-through');
      expect(modeBadges.length).toBeGreaterThan(0);
      
      const wallsBadges = screen.getAllByText('walls');
      expect(wallsBadges.length).toBeGreaterThan(0);
    });

    it('should display dates for entries', async () => {
      render(<SnakeLeaderboard />);
      
      await waitFor(() => {
        expect(screen.getByText('2024-01-15')).toBeInTheDocument();
      });
      
      expect(screen.getByText('2024-01-15')).toBeInTheDocument();
      expect(screen.getByText('2024-01-14')).toBeInTheDocument();
    });
  });

  describe('Filtering by Game Mode', () => {
    it('should show all entries by default', async () => {
      render(<SnakeLeaderboard />);
      
      await waitFor(() => {
        expect(screen.getByText('player1')).toBeInTheDocument();
      });
      
      // All entries should be visible
      expect(screen.getByText('player1')).toBeInTheDocument();
      expect(screen.getByText('player2')).toBeInTheDocument();
      expect(screen.getByText('player3')).toBeInTheDocument();
      expect(screen.getByText('player4')).toBeInTheDocument();
      expect(screen.getByText('player5')).toBeInTheDocument();
    });

    it('should filter to pass-through mode when clicked', async () => {
      const user = userEvent.setup();
      render(<SnakeLeaderboard />);
      
      await waitFor(() => {
        expect(screen.getByText('player1')).toBeInTheDocument();
      });
      
      const passThroughButton = screen.getByRole('button', { name: 'Pass-through' });
      await user.click(passThroughButton);
      
      // API should be called with pass-through filter
      await waitFor(() => {
        expect(apiService.getLeaderboard).toHaveBeenCalledWith(20, 'pass-through');
      });
    });

    it('should filter to walls mode when clicked', async () => {
      const user = userEvent.setup();
      render(<SnakeLeaderboard />);
      
      await waitFor(() => {
        expect(screen.getByText('player1')).toBeInTheDocument();
      });
      
      const wallsButton = screen.getByRole('button', { name: 'Walls' });
      await user.click(wallsButton);
      
      // API should be called with walls filter
      await waitFor(() => {
        expect(apiService.getLeaderboard).toHaveBeenCalledWith(20, 'walls');
      });
    });

    it('should reset to all when All button is clicked', async () => {
      const user = userEvent.setup();
      render(<SnakeLeaderboard />);
      
      await waitFor(() => {
        expect(screen.getByText('player1')).toBeInTheDocument();
      });
      
      // First filter to pass-through
      const passThroughButton = screen.getByRole('button', { name: 'Pass-through' });
      await user.click(passThroughButton);
      
      await waitFor(() => {
        expect(apiService.getLeaderboard).toHaveBeenCalledWith(20, 'pass-through');
      });
      
      // Then reset to all
      const allButton = screen.getByRole('button', { name: 'All' });
      await user.click(allButton);
      
      // API should be called with undefined (all)
      await waitFor(() => {
        expect(apiService.getLeaderboard).toHaveBeenCalledWith(20, undefined);
      });
    });

    it('should highlight active filter button', async () => {
      const user = userEvent.setup();
      render(<SnakeLeaderboard />);
      
      await waitFor(() => {
        expect(screen.getByText('player1')).toBeInTheDocument();
      });
      
      const allButton = screen.getByRole('button', { name: 'All' });
      const passThroughButton = screen.getByRole('button', { name: 'Pass-through' });
      
      // All should be active initially
      expect(allButton).toHaveClass('active');
      expect(passThroughButton).not.toHaveClass('active');
      
      // Click pass-through
      await user.click(passThroughButton);
      
      await waitFor(() => {
        expect(passThroughButton).toHaveClass('active');
        expect(allButton).not.toHaveClass('active');
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no entries', async () => {
      (apiService.getLeaderboard as any).mockResolvedValue([]);
      
      render(<SnakeLeaderboard />);
      
      await waitFor(() => {
        expect(screen.getByText('No entries found')).toBeInTheDocument();
      });
      
      expect(screen.getByText('No entries found')).toBeInTheDocument();
    });

    it('should not show table when empty', async () => {
      (apiService.getLeaderboard as any).mockResolvedValue([]);
      
      render(<SnakeLeaderboard />);
      
      await waitFor(() => {
        expect(screen.getByText('No entries found')).toBeInTheDocument();
      });
      
      // Should not show any entry rows
      expect(screen.queryByText('player1')).not.toBeInTheDocument();
    });

    it('should show empty state after filtering with no results', async () => {
      const user = userEvent.setup();
      (apiService.getLeaderboard as any).mockResolvedValueOnce(mockLeaderboardEntries);
      
      render(<SnakeLeaderboard />);
      
      await waitFor(() => {
        expect(screen.getByText('player1')).toBeInTheDocument();
      });
      
      // Filter to a mode that returns no results
      (apiService.getLeaderboard as any).mockResolvedValueOnce([]);
      const wallsButton = screen.getByRole('button', { name: 'Walls' });
      await user.click(wallsButton);
      
      await waitFor(() => {
        expect(screen.getByText('No entries found')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (apiService.getLeaderboard as any).mockRejectedValue(new Error('API Error'));
      
      render(<SnakeLeaderboard />);
      
      await waitFor(() => {
        expect(screen.queryByText('Loading leaderboard...')).not.toBeInTheDocument();
      });
      
      // Should not crash, should show empty state or handle error
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should stop showing loading state after error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      (apiService.getLeaderboard as any).mockRejectedValue(new Error('API Error'));
      
      render(<SnakeLeaderboard />);
      
      // Initially shows loading
      expect(screen.getByText('Loading leaderboard...')).toBeInTheDocument();
      
      // After error, loading should disappear
      await waitFor(() => {
        expect(screen.queryByText('Loading leaderboard...')).not.toBeInTheDocument();
      }, { timeout: 3000 });
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Data Refresh', () => {
    it('should reload data when filter changes', async () => {
      const user = userEvent.setup();
      render(<SnakeLeaderboard />);
      
      await waitFor(() => {
        expect(apiService.getLeaderboard).toHaveBeenCalledTimes(1);
      });
      
      const passThroughButton = screen.getByRole('button', { name: 'Pass-through' });
      await user.click(passThroughButton);
      
      await waitFor(() => {
        expect(apiService.getLeaderboard).toHaveBeenCalledTimes(2);
      });
    });

    it('should call API with correct limit parameter', async () => {
      render(<SnakeLeaderboard />);
      
      await waitFor(() => {
        expect(apiService.getLeaderboard).toHaveBeenCalledWith(20, undefined);
      });
    });
  });

  describe('Ranking Display', () => {
    it('should show gold medal for first place', async () => {
      render(<SnakeLeaderboard />);
      
      await waitFor(() => {
        expect(screen.getByText('🥇')).toBeInTheDocument();
      });
    });

    it('should show silver medal for second place', async () => {
      render(<SnakeLeaderboard />);
      
      await waitFor(() => {
        expect(screen.getByText('🥈')).toBeInTheDocument();
      });
    });

    it('should show bronze medal for third place', async () => {
      render(<SnakeLeaderboard />);
      
      await waitFor(() => {
        expect(screen.getByText('🥉')).toBeInTheDocument();
      });
    });

    it('should show number rank for fourth place and beyond', async () => {
      render(<SnakeLeaderboard />);
      
      await waitFor(() => {
        expect(screen.getByText('#4')).toBeInTheDocument();
        expect(screen.getByText('#5')).toBeInTheDocument();
      });
    });
  });
});

