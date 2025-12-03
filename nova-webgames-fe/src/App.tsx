import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/shared/Navbar';
import { Login } from './components/shared/Login';
import { Signup } from './components/shared/Signup';
import { SnakeGame } from './components/games/snake/SnakeGame';
import { SnakeLeaderboard } from './components/games/snake/SnakeLeaderboard';
import { FPSGame } from './components/games/fps/FPSGame';
import { FPSLeaderboard } from './components/games/fps/FPSLeaderboard';
import { Watch } from './components/Watch';
import './App.css';

import { GAMES } from './data/games';
import { GameCard } from './components/shared/GameCard';

const Home: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div className="home-container">
      <h1>🎮 Welcome to Nova WebGames!</h1>
      {user ? (
        <div className="home-content">
          <p>Welcome back, {user.username}! Choose a game to play:</p>
        </div>
      ) : (
        <div className="home-content">
          <p>Please log in or sign up to start playing!</p>
          <div className="home-actions">
            <Link to="/login" className="home-button">Login</Link>
            <Link to="/signup" className="home-button">Sign Up</Link>
          </div>
        </div>
      )}
      <div className="games-grid">
        {GAMES.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route
                path="/games/snake"
                element={
                  <ProtectedRoute>
                    <SnakeGame />
                  </ProtectedRoute>
                }
              />
              {/* Keep old route for backward compatibility */}
              <Route
                path="/game"
                element={
                  <ProtectedRoute>
                    <SnakeGame />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/leaderboard"
                element={
                  <ProtectedRoute>
                    <SnakeLeaderboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/watch"
                element={
                  <ProtectedRoute>
                    <Watch />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/games/fps"
                element={
                  <ProtectedRoute>
                    <FPSGame />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/games/fps/leaderboard"
                element={
                  <ProtectedRoute>
                    <FPSLeaderboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

