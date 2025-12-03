# Adding a New Game to Nova WebGames

This guide explains how to add a new game to the Nova WebGames platform. The platform uses a modular architecture where each game has its own models, API endpoints, frontend components, and leaderboard table.

## Overview

Each game in Nova WebGames consists of:

1. **Backend Components:**
   - Database models (including a game-specific leaderboard table)
   - API endpoints (under `/api/v1/games/{game-id}/`)
   - Pydantic schemas for request/response validation

2. **Frontend Components:**
   - React components for the game UI
   - API service layer for backend communication
   - TypeScript type definitions
   - Game metadata in the games registry

3. **Integration:**
   - Route registration in `App.tsx`
   - Game card in the home page (via `games.ts`)

## Step-by-Step Guide

### Step 1: Choose a Game ID

Choose a unique, lowercase identifier for your game (e.g., `snake`, `fps`, `chess`, `tetris`). This ID will be used throughout the codebase.

**Example:** `chess`

### Step 2: Create Backend Structure

#### 2.1 Create Directory Structure

```bash
# Create directories
mkdir -p nova-webgames-be/app/models/games/chess
mkdir -p nova-webgames-be/app/api/v1/games/chess
mkdir -p nova-webgames-be/app/schemas/games/chess

# Create __init__.py files
touch nova-webgames-be/app/models/games/chess/__init__.py
touch nova-webgames-be/app/api/v1/games/chess/__init__.py
touch nova-webgames-be/app/schemas/games/chess/__init__.py
```

#### 2.2 Create Leaderboard Model

Create `nova-webgames-be/app/models/games/chess/leaderboard.py`:

```python
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class ChessLeaderboard(Base):
    __tablename__ = "chess_leaderboard"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    username = Column(String, nullable=False)  # Denormalized
    score = Column(Integer, nullable=False)
    game_mode = Column(String, nullable=False)  # e.g., "blitz", "classical"
    date = Column(Date, default=func.current_date(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
```

#### 2.3 Register Model

Add to `nova-webgames-be/app/db/base_all.py`:

```python
from app.models.games.chess.leaderboard import ChessLeaderboard
```

#### 2.4 Create Database Migration

```bash
cd nova-webgames-be
source venv/bin/activate
alembic revision --autogenerate -m "create_chess_leaderboard_table"
```

Review the generated migration file, then apply:

```bash
alembic upgrade head
```

#### 2.5 Create Pydantic Schemas

Create `nova-webgames-be/app/schemas/games/chess/leaderboard.py`:

```python
from pydantic import BaseModel
from datetime import date
from typing import Optional

class LeaderboardEntry(BaseModel):
    id: str
    username: str
    score: int
    game_mode: str
    date: date
    created_at: Optional[str] = None

    class Config:
        from_attributes = True

class LeaderboardCreate(BaseModel):
    score: int
    game_mode: str

class LeaderboardResponse(BaseModel):
    entries: list[LeaderboardEntry]
    total: int
    offset: int
    limit: int
```

#### 2.6 Create API Endpoints

Create `nova-webgames-be/app/api/v1/games/chess/leaderboard.py`:

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import Optional

from app.db.session import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.games.chess.leaderboard import ChessLeaderboard
from app.schemas.games.chess.leaderboard import (
    LeaderboardCreate,
    LeaderboardResponse,
    LeaderboardEntry
)

router = APIRouter()

@router.get("", response_model=LeaderboardResponse)
async def get_leaderboard(
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    game_mode: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """Get chess leaderboard entries."""
    query = select(ChessLeaderboard)
    
    if game_mode:
        query = query.where(ChessLeaderboard.game_mode == game_mode)
    
    # Get total count
    count_query = select(func.count()).select_from(ChessLeaderboard)
    if game_mode:
        count_query = count_query.where(ChessLeaderboard.game_mode == game_mode)
    
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Get paginated entries
    query = query.order_by(desc(ChessLeaderboard.score)).offset(offset).limit(limit)
    result = await db.execute(query)
    entries = result.scalars().all()
    
    return LeaderboardResponse(
        entries=[LeaderboardEntry.from_orm(e) for e in entries],
        total=total,
        offset=offset,
        limit=limit
    )

@router.post("", response_model=LeaderboardEntry, status_code=201)
async def submit_score(
    score_data: LeaderboardCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submit a chess game score."""
    entry = ChessLeaderboard(
        user_id=current_user.id,
        username=current_user.username,
        score=score_data.score,
        game_mode=score_data.game_mode
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    
    return LeaderboardEntry.from_orm(entry)
```

#### 2.7 Register API Routes

Add to `nova-webgames-be/app/main.py`:

```python
from app.api.v1.games.chess import leaderboard as chess_leaderboard

app.include_router(
    chess_leaderboard.router,
    prefix="/api/v1/games/chess/leaderboard",
    tags=["chess", "leaderboard"]
)
```

### Step 3: Create Frontend Structure

#### 3.1 Create Directory Structure

```bash
# Create directories
mkdir -p nova-webgames-fe/src/components/games/chess
mkdir -p nova-webgames-fe/src/services/games/chess
```

#### 3.2 Create TypeScript Types

Create `nova-webgames-fe/src/types/games/chess.ts`:

```typescript
export interface ChessGameState {
  // Define your game state structure
  board: string[][];
  currentPlayer: 'white' | 'black';
  // ... other game state fields
}

export interface ChessLeaderboardEntry {
  id: string;
  username: string;
  score: number;
  game_mode: string;
  date: string;
  created_at?: string;
}

export interface ChessLeaderboardResponse {
  entries: ChessLeaderboardEntry[];
  total: number;
  offset: number;
  limit: number;
}
```

#### 3.3 Create API Service

Create `nova-webgames-fe/src/services/games/chess/api.ts`:

```typescript
import { apiService } from '../../api';
import type { ChessLeaderboardEntry, ChessLeaderboardResponse } from '../../../types/games/chess';

export const chessApi = {
  async getLeaderboard(
    offset: number = 0,
    limit: number = 20,
    gameMode?: string
  ): Promise<ChessLeaderboardResponse> {
    const params = new URLSearchParams({
      offset: offset.toString(),
      limit: limit.toString(),
    });
    if (gameMode) {
      params.append('game_mode', gameMode);
    }
    
    const response = await apiService.get(`/games/chess/leaderboard?${params}`);
    return response.data;
  },

  async submitScore(score: number, gameMode: string): Promise<ChessLeaderboardEntry> {
    const response = await apiService.post('/games/chess/leaderboard', {
      score,
      game_mode: gameMode,
    });
    return response.data;
  },
};
```

#### 3.4 Create Game Component

Create `nova-webgames-fe/src/components/games/chess/ChessGame.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { chessApi } from '../../../services/games/chess/api';
import type { ChessGameState } from '../../../types/games/chess';
import './ChessGame.css';

export const ChessGame: React.FC = () => {
  const { user } = useAuth();
  const [gameState, setGameState] = useState<ChessGameState | null>(null);
  const [score, setScore] = useState(0);

  // Implement your game logic here

  const handleGameOver = async () => {
    if (user && score > 0) {
      try {
        await chessApi.submitScore(score, 'classical'); // or your game mode
      } catch (error) {
        console.error('Failed to submit score:', error);
      }
    }
  };

  return (
    <div className="chess-game-container">
      <h1>Chess Game</h1>
      {/* Your game UI here */}
    </div>
  );
};
```

Create `nova-webgames-fe/src/components/games/chess/ChessGame.css`:

```css
.chess-game-container {
  /* Your game styles */
}
```

#### 3.5 Create Leaderboard Component (Optional)

Create `nova-webgames-fe/src/components/games/chess/ChessLeaderboard.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { chessApi } from '../../../services/games/chess/api';
import type { ChessLeaderboardEntry } from '../../../types/games/chess';
import './ChessLeaderboard.css';

export const ChessLeaderboard: React.FC = () => {
  const [entries, setEntries] = useState<ChessLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [gameMode, setGameMode] = useState<string>('all');

  useEffect(() => {
    loadLeaderboard();
  }, [gameMode]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await chessApi.getLeaderboard(0, 20, gameMode === 'all' ? undefined : gameMode);
      setEntries(response.entries);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chess-leaderboard-container">
      <h1>Chess Leaderboard</h1>
      {/* Your leaderboard UI here */}
    </div>
  );
};
```

### Step 4: Register Game in Frontend

#### 4.1 Add to Games Registry

Update `nova-webgames-fe/src/data/games.ts`:

```typescript
export const GAMES: Game[] = [
  // ... existing games
  {
    id: 'chess',
    title: 'Chess',
    description: 'Classic chess game. Play against AI or other players!',
    route: '/games/chess',
    available: true,  // Set to false if still in development
  },
];
```

#### 4.2 Add Routes

Update `nova-webgames-fe/src/App.tsx`:

```typescript
import { ChessGame } from './components/games/chess/ChessGame';
import { ChessLeaderboard } from './components/games/chess/ChessLeaderboard';

// In the Routes section:
<Route
  path="/games/chess"
  element={
    <ProtectedRoute>
      <ChessGame />
    </ProtectedRoute>
  }
/>
<Route
  path="/games/chess/leaderboard"
  element={
    <ProtectedRoute>
      <ChessLeaderboard />
    </ProtectedRoute>
  }
/>
```

### Step 5: Add Tests

#### 5.1 Backend Tests

Create `nova-webgames-be/tests/test_chess_leaderboard.py`:

```python
import pytest
from app.models.games.chess.leaderboard import ChessLeaderboard

@pytest.mark.asyncio
async def test_submit_chess_score(client, test_user, auth_headers):
    response = await client.post(
        "/api/v1/games/chess/leaderboard",
        json={"score": 100, "game_mode": "blitz"},
        headers=auth_headers
    )
    assert response.status_code == 201
    assert response.json()["score"] == 100

@pytest.mark.asyncio
async def test_get_chess_leaderboard(client, test_user):
    # Create test entries
    # ... test implementation
    response = await client.get("/api/v1/games/chess/leaderboard")
    assert response.status_code == 200
```

#### 5.2 Frontend Tests

Create `nova-webgames-fe/src/components/games/chess/__tests__/ChessGame.test.tsx`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChessGame } from '../ChessGame';
// ... test implementation
```

### Step 6: Update Documentation

1. Update `README.md` to mention your new game
2. Update this file (`GAMES.md`) if you've discovered new patterns
3. Update `AGENTS.md` if the structure changes

## Game-Specific Considerations

### Leaderboard Tables

Each game should have its own leaderboard table:
- Table name: `{game_id}_leaderboard` (e.g., `chess_leaderboard`)
- Model class: `{GameName}Leaderboard` (e.g., `ChessLeaderboard`)
- Follow the same schema as `snake_leaderboard` for consistency

### API Endpoints

Game-specific endpoints follow this pattern:
- Leaderboard: `/api/v1/games/{game-id}/leaderboard`
- Other endpoints: `/api/v1/games/{game-id}/{endpoint-name}`

### Frontend Routes

Game routes follow this pattern:
- Game: `/games/{game-id}`
- Leaderboard: `/games/{game-id}/leaderboard` (optional, can use shared leaderboard route)

## Example: Snake Game Structure

The Snake game serves as a reference implementation. Key files:

**Backend:**
- Model: `nova-webgames-be/app/models/games/snake/leaderboard.py`
- API: `nova-webgames-be/app/api/v1/leaderboard.py` (uses game-specific model)
- Schema: `nova-webgames-be/app/schemas/leaderboard.py`

**Frontend:**
- Component: `nova-webgames-fe/src/components/games/snake/SnakeGame.tsx`
- Leaderboard: `nova-webgames-fe/src/components/games/snake/SnakeLeaderboard.tsx`
- API: `nova-webgames-fe/src/services/api.ts` (snake-specific methods)
- Types: `nova-webgames-fe/src/types/games/snake.ts`

## Testing Checklist

Before considering your game complete:

- [ ] Backend tests pass
- [ ] Frontend unit tests pass
- [ ] E2E tests pass (add tests for your game)
- [ ] Game is playable in browser
- [ ] Leaderboard displays correctly
- [ ] Score submission works
- [ ] Game appears in home page game cards
- [ ] Navigation works correctly
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Database migration applied successfully

## Need Help?

- Review the Snake game implementation as a reference
- Check `MULTI_GAME_ARCHITECTURE.md` for architectural decisions
- See `MIGRATION_PLAN.md` for migration context
- Review test files for examples

