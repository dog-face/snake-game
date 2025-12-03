import React, { useState, useEffect } from 'react';
import { fpsApi } from '../../../services/games/fps/api';
import type { FPSLeaderboardEntry } from '../../../types/games/fps';
import './FPSLeaderboard.css';

export const FPSLeaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<FPSLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  useEffect(() => {
    loadLeaderboard();
  }, [filter, offset]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const gameMode = filter === 'all' ? undefined : filter;
      const response = await fpsApi.getLeaderboard(offset, limit, gameMode);
      setLeaderboard(response.entries);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRank = (index: number) => {
    const rank = offset + index;
    if (rank === 0) return '🥇';
    if (rank === 1) return '🥈';
    if (rank === 2) return '🥉';
    return `#${rank + 1}`;
  };

  const getKDRatio = (kills: number, deaths: number): string => {
    if (deaths === 0) return kills > 0 ? '∞' : '0.00';
    return (kills / deaths).toFixed(2);
  };

  return (
    <div className="fps-leaderboard-container">
      <h2>FPS Arena Leaderboard</h2>
      
      <div className="filter-buttons">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => {
            setFilter('all');
            setOffset(0);
          }}
        >
          All
        </button>
        <button
          className={filter === 'single-player' ? 'active' : ''}
          onClick={() => {
            setFilter('single-player');
            setOffset(0);
          }}
        >
          Single-Player
        </button>
        <button
          className={filter === 'deathmatch' ? 'active' : ''}
          onClick={() => {
            setFilter('deathmatch');
            setOffset(0);
          }}
        >
          Deathmatch
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading leaderboard...</div>
      ) : (
        <>
          <div className="leaderboard-table">
            <div className="leaderboard-header">
              <div className="rank-col">Rank</div>
              <div className="username-col">Username</div>
              <div className="score-col">Score</div>
              <div className="kills-col">Kills</div>
              <div className="deaths-col">Deaths</div>
              <div className="kd-col">K/D</div>
              <div className="mode-col">Mode</div>
              <div className="date-col">Date</div>
            </div>
            {leaderboard.length === 0 ? (
              <div className="no-entries">No entries found</div>
            ) : (
              leaderboard.map((entry, index) => (
                <div key={entry.id} className="leaderboard-row">
                  <div className="rank-col">{getRank(index)}</div>
                  <div className="username-col">{entry.username}</div>
                  <div className="score-col">{entry.score}</div>
                  <div className="kills-col">{entry.kills}</div>
                  <div className="deaths-col">{entry.deaths}</div>
                  <div className="kd-col">{getKDRatio(entry.kills, entry.deaths)}</div>
                  <div className="mode-col">
                    <span className={`mode-badge ${entry.game_mode}`}>
                      {entry.game_mode}
                    </span>
                  </div>
                  <div className="date-col">{entry.date}</div>
                </div>
              ))
            )}
          </div>
          
          <div className="pagination">
            <button
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - limit))}
            >
              Previous
            </button>
            <span>
              Showing {offset + 1}-{Math.min(offset + limit, total)} of {total}
            </span>
            <button
              disabled={offset + limit >= total}
              onClick={() => setOffset(offset + limit)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

