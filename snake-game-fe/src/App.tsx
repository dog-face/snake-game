import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/Navbar';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { SnakeGame } from './components/SnakeGame';
import { Leaderboard } from './components/Leaderboard';
import { Watch } from './components/Watch';
import './App.css';

const Home: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div className="home-container">
      <h1>🐍 Welcome to Snake Game!</h1>
      {user ? (
        <div className="home-content">
          <p>Welcome back, {user.username}!</p>
          <div className="home-actions">
            <Link to="/game" className="home-button">Play Game</Link>
            <Link to="/leaderboard" className="home-button">View Leaderboard</Link>
            <Link to="/watch" className="home-button">Watch Players</Link>
          </div>
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
                    <Leaderboard />
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
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

