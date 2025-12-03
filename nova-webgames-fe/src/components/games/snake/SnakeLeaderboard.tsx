import React, { useState, useEffect } from 'react';
import { apiService, LeaderboardEntry } from '../../../services/api';
import './SnakeLeaderboard.css';

export const SnakeLeaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pass-through' | 'walls'>('all');

  useEffect(() => {
    loadLeaderboard();
  }, [filter]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const gameMode = filter === 'all' ? undefined : filter;
      const data = await apiService.getLeaderboard(20, gameMode);
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeaderboard = leaderboard;

  const getRank = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  return (
    <div className="leaderboard-container">
      <h2>Leaderboard</h2>
      
      <div className="filter-buttons">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={filter === 'pass-through' ? 'active' : ''}
          onClick={() => setFilter('pass-through')}
        >
          Pass-through
        </button>
        <button
          className={filter === 'walls' ? 'active' : ''}
          onClick={() => setFilter('walls')}
        >
          Walls
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading leaderboard...</div>
      ) : (
        <div className="leaderboard-table">
          <div className="leaderboard-header">
            <div className="rank-col">Rank</div>
            <div className="username-col">Username</div>
            <div className="score-col">Score</div>
            <div className="mode-col">Mode</div>
            <div className="date-col">Date</div>
          </div>
          {filteredLeaderboard.length === 0 ? (
            <div className="no-entries">No entries found</div>
          ) : (
            filteredLeaderboard.map((entry, index) => (
              <div key={entry.id} className="leaderboard-row">
                <div className="rank-col">{getRank(index)}</div>
                <div className="username-col">{entry.username}</div>
                <div className="score-col">{entry.score}</div>
                <div className="mode-col">
                  <span className={`mode-badge ${entry.gameMode}`}>
                    {entry.gameMode}
                  </span>
                </div>
                <div className="date-col">{entry.date}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

