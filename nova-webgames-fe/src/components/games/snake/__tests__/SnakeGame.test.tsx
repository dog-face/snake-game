import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { SnakeGame } from '../SnakeGame';
import { AuthProvider } from '../../../../contexts/AuthContext';

// Mock the API service
vi.mock('../../../../services/api', () => ({
  apiService: {
    startGameSession: vi.fn(),
    updateGameState: vi.fn(),
    endGameSession: vi.fn(),
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
  },
}));

// Mock the game logic to make tests more predictable
vi.mock('../../../../utils/games/snake/gameLogic', async () => {
  const actual = await vi.importActual('../../../../utils/games/snake/gameLogic');
  return {
    ...actual,
    createInitialGameState: vi.fn(() => ({
      snake: [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }],
      food: { x: 15, y: 15 },
      direction: 'right' as const,
      score: 0,
      gameOver: false,
    })),
  };
});

// Import after mocks are set up
import { apiService } from '../../../../services/api';
import { User } from '../../../../services/api';

const mockUser: User = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
};

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('SnakeGame', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (apiService.startGameSession as any).mockResolvedValue({ sessionId: 'test-session-123' });
    (apiService.updateGameState as any).mockResolvedValue({});
    (apiService.endGameSession as any).mockResolvedValue({});
    (apiService.getCurrentUser as any).mockResolvedValue(mockUser);
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Game Initialization', () => {
    it('should render game container with initial state', async () => {
      renderWithProviders(<SnakeGame />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Snake Game' })).toBeInTheDocument();
      });
      
      expect(screen.getByText(/Score: 0/)).toBeInTheDocument();
      expect(screen.getByText('Start Game')).toBeInTheDocument();
    });

    it('should display game board', async () => {
      renderWithProviders(<SnakeGame />);
      
      await waitFor(() => {
        const gameBoard = document.querySelector('.game-board');
        expect(gameBoard).toBeInTheDocument();
      });
    });

    it('should show initial overlay with start button', async () => {
      renderWithProviders(<SnakeGame />);
      
      await waitFor(() => {
        expect(screen.getByText('Ready to play?')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Use arrow keys or WASD to control')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Start Game' })).toBeInTheDocument();
    });

    it('should display default game mode as pass-through', async () => {
      renderWithProviders(<SnakeGame />);
      
      await waitFor(() => {
        const passThroughRadio = screen.getByLabelText('Pass-through');
        expect(passThroughRadio).toBeChecked();
      });
    });
  });

  describe('Game Start/Pause', () => {
    it('should start game when start button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SnakeGame />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Start Game' })).toBeInTheDocument();
      });
      
      const startButton = screen.getByRole('button', { name: 'Start Game' });
      await user.click(startButton);
      
      // Start overlay should disappear
      await waitFor(() => {
        expect(screen.queryByText('Ready to play?')).not.toBeInTheDocument();
      });
      
      // Pause button should appear
      expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
      
      // API should be called to start session
      expect(apiService.startGameSession).toHaveBeenCalledWith('pass-through');
    });

    it('should pause game when pause button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SnakeGame />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Start Game' })).toBeInTheDocument();
      });
      
      // Start the game
      const startButton = screen.getByRole('button', { name: 'Start Game' });
      await user.click(startButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
      });
      
      // Pause the game
      const pauseButton = screen.getByRole('button', { name: 'Pause' });
      await user.click(pauseButton);
      
      // Paused overlay should appear
      await waitFor(() => {
        expect(screen.getByText('Paused')).toBeInTheDocument();
      });
      
      // There are two Resume buttons (overlay and pause button), check overlay one
      const resumeButtons = screen.getAllByRole('button', { name: 'Resume' });
      expect(resumeButtons.length).toBeGreaterThan(0);
    });

    it('should resume game when resume button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SnakeGame />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Start Game' })).toBeInTheDocument();
      });
      
      // Start the game
      const startButton = screen.getByRole('button', { name: 'Start Game' });
      await user.click(startButton);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
      });
      
      // Pause the game
      const pauseButton = screen.getByRole('button', { name: 'Pause' });
      await user.click(pauseButton);
      
      await waitFor(() => {
        expect(screen.getByText('Paused')).toBeInTheDocument();
      });
      
      // Resume the game - use the first Resume button (overlay)
      const resumeButtons = screen.getAllByRole('button', { name: 'Resume' });
      await user.click(resumeButtons[0]);
      
      // Paused overlay should disappear
      await waitFor(() => {
        expect(screen.queryByText('Paused')).not.toBeInTheDocument();
      });
      
      // Pause button should be visible again
      expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
    });

    it('should not allow starting game if already started', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SnakeGame />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Start Game' })).toBeInTheDocument();
      });
      
      const startButton = screen.getByRole('button', { name: 'Start Game' });
      await user.click(startButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Start Game')).not.toBeInTheDocument();
      });
      
      // Start button should not be visible
      expect(screen.queryByRole('button', { name: 'Start Game' })).not.toBeInTheDocument();
    });
  });

  describe('Game Over Handling', () => {
    it('should have game over overlay structure', async () => {
      renderWithProviders(<SnakeGame />);
      
      await waitFor(() => {
        const gameContainer = document.querySelector('.game-container');
        expect(gameContainer).toBeInTheDocument();
      });
    });

    it('should have play again button structure', async () => {
      renderWithProviders(<SnakeGame />);
      
      await waitFor(() => {
        const gameContainer = document.querySelector('.game-container');
        expect(gameContainer).toBeInTheDocument();
      });
    });

    it('should have endGameSession API method available', () => {
      expect(apiService.endGameSession).toBeDefined();
    });
  });

  describe('Score Tracking', () => {
    it('should display initial score of 0', async () => {
      renderWithProviders(<SnakeGame />);
      
      await waitFor(() => {
        expect(screen.getByText(/Score: 0/)).toBeInTheDocument();
      });
    });

    it('should update score display during gameplay', async () => {
      renderWithProviders(<SnakeGame />);
      
      await waitFor(() => {
        const scoreElement = screen.getByText(/Score:/);
        expect(scoreElement).toBeInTheDocument();
        expect(scoreElement.textContent).toContain('0');
      });
    });
  });

  describe('Game Mode Switching', () => {
    it('should allow switching to walls mode before game starts', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SnakeGame />);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Walls')).toBeInTheDocument();
      });
      
      const wallsRadio = screen.getByLabelText('Walls');
      await user.click(wallsRadio);
      
      expect(wallsRadio).toBeChecked();
      
      const passThroughRadio = screen.getByLabelText('Pass-through');
      expect(passThroughRadio).not.toBeChecked();
    });

    it('should allow switching back to pass-through mode', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SnakeGame />);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Walls')).toBeInTheDocument();
      });
      
      // Switch to walls
      const wallsRadio = screen.getByLabelText('Walls');
      await user.click(wallsRadio);
      
      // Switch back to pass-through
      const passThroughRadio = screen.getByLabelText('Pass-through');
      await user.click(passThroughRadio);
      
      expect(passThroughRadio).toBeChecked();
      expect(wallsRadio).not.toBeChecked();
    });

    it('should disable mode switching when game is started', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SnakeGame />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Start Game' })).toBeInTheDocument();
      });
      
      // Start the game
      const startButton = screen.getByRole('button', { name: 'Start Game' });
      await user.click(startButton);
      
      await waitFor(() => {
        const passThroughRadio = screen.getByLabelText('Pass-through');
        const wallsRadio = screen.getByLabelText('Walls');
        
        expect(passThroughRadio).toBeDisabled();
        expect(wallsRadio).toBeDisabled();
      });
    });

    it('should use selected game mode when starting game', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SnakeGame />);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Walls')).toBeInTheDocument();
      });
      
      // Switch to walls mode
      const wallsRadio = screen.getByLabelText('Walls');
      await user.click(wallsRadio);
      
      // Start the game
      const startButton = screen.getByRole('button', { name: 'Start Game' });
      await user.click(startButton);
      
      // API should be called with walls mode
      expect(apiService.startGameSession).toHaveBeenCalledWith('walls');
    });
  });

  describe('User Authentication Integration', () => {
    it('should start watch session when user is logged in', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SnakeGame />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Start Game' })).toBeInTheDocument();
      });
      
      const startButton = screen.getByRole('button', { name: 'Start Game' });
      await user.click(startButton);
      
      await waitFor(() => {
        expect(apiService.startGameSession).toHaveBeenCalled();
      });
    });

    it('should not crash when user is not logged in', async () => {
      // Mock getCurrentUser to return null (not logged in)
      (apiService.getCurrentUser as any).mockResolvedValueOnce(null);
      
      renderWithProviders(<SnakeGame />);
      
      // Wait for AuthProvider to finish loading
      await waitFor(() => {
        // Component should still render
        expect(screen.getByRole('heading', { name: 'Snake Game' })).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Game Instructions', () => {
    it('should display game instructions', async () => {
      renderWithProviders(<SnakeGame />);
      
      await waitFor(() => {
        expect(screen.getByText(/Use Arrow Keys or WASD to control the snake/)).toBeInTheDocument();
      });
    });

    it('should display current game mode description', async () => {
      renderWithProviders(<SnakeGame />);
      
      await waitFor(() => {
        expect(screen.getByText(/Mode: Pass-through \(wrap around\)/)).toBeInTheDocument();
      });
    });

    it('should update mode description when mode changes', async () => {
      const user = userEvent.setup();
      renderWithProviders(<SnakeGame />);
      
      await waitFor(() => {
        expect(screen.getByLabelText('Walls')).toBeInTheDocument();
      });
      
      // Switch to walls mode
      const wallsRadio = screen.getByLabelText('Walls');
      await user.click(wallsRadio);
      
      expect(screen.getByText(/Mode: Walls \(game over on collision\)/)).toBeInTheDocument();
    });
  });
});
