import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock fetch globally
const mockFetch = vi.fn();
(globalThis as any).fetch = mockFetch;

const TestComponent: React.FC = () => {
  const { user, login, signup, logout } = useAuth();
  
  return (
    <div>
      {user ? (
        <div>
          <div data-testid="username">{user.username}</div>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <div>
          <button
            onClick={() => login('player1', 'password1')}
            data-testid="login-btn"
          >
            Login
          </button>
          <button
            onClick={() => signup('newuser', 'new@example.com', 'pass')}
            data-testid="signup-btn"
          >
            Signup
          </button>
        </div>
      )}
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    localStorage.clear();
  });

  afterEach(() => {
    mockFetch.mockReset();
    localStorage.clear();
  });

  it('should provide auth context', async () => {
    // No token in localStorage, so getCurrentUser will return null without making a fetch call
    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('login-btn')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should login user', async () => {
    const mockUser = { id: '1', username: 'player1', email: 'player1@example.com' };
    
    // No token in localStorage, so getCurrentUser will return null without making a fetch call
    // Mock login (this will be called when button is clicked)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: 'mock-token', user: mockUser }),
    });

    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );
    
    // Wait for initial load to complete (getCurrentUser returns null immediately if no token)
    await waitFor(() => {
      expect(screen.getByTestId('login-btn')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    await user.click(screen.getByTestId('login-btn'));
    
    await waitFor(() => {
      expect(screen.getByTestId('username')).toHaveTextContent('player1');
    }, { timeout: 3000 });
  });

  it('should logout user', async () => {
    const mockUser = { id: '1', username: 'player1', email: 'player1@example.com' };
    
    // Set token in localStorage so getCurrentUser will make a fetch call
    localStorage.setItem('token', 'mock-token');
    
    // Mock getCurrentUser (called on mount) - user is logged in
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUser,
    });
    
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('username')).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Mock logout
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    
    await user.click(screen.getByText('Logout'));
    
    await waitFor(() => {
      expect(screen.getByTestId('login-btn')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});

