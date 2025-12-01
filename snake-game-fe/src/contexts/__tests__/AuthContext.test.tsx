import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../AuthContext';
import { apiService } from '../../services/api';

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
  beforeEach(async () => {
    await apiService.logout();
  });

  it('should provide auth context', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );
    
    expect(screen.getByTestId('login-btn')).toBeInTheDocument();
  });

  it('should login user', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );
    
    await user.click(screen.getByTestId('login-btn'));
    
    await waitFor(() => {
      expect(screen.getByTestId('username')).toHaveTextContent('player1');
    });
  });

  it('should logout user', async () => {
    const user = userEvent.setup();
    await apiService.login({ username: 'player1', password: 'password1' });
    
    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );
    
    await waitFor(() => {
      expect(screen.getByTestId('username')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('Logout'));
    
    await waitFor(() => {
      expect(screen.getByTestId('login-btn')).toBeInTheDocument();
    });
  });
});

