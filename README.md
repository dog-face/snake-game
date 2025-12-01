# Snake Game

A full-stack Snake game application with authentication, leaderboard, and real-time multiplayer features.

## Project Structure

This repository contains both the frontend and backend:

- **`snake-game-be/`** - FastAPI backend (Python)
- **`snake-game-fe/`** - React frontend (TypeScript)

## Quick Start

### Backend Setup

1. Navigate to the backend directory:
```bash
cd snake-game-be
```

2. Activate virtual environment:
```bash
source venv/bin/activate
```

3. Install dependencies (if needed):
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
Create a `.env` file in `snake-game-be/`:
```env
DATABASE_URL=sqlite:///./snake_game.db
SECRET_KEY=your-secret-key-here-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=1440
SESSION_TIMEOUT=300
```

5. Run database migrations:
```bash
alembic upgrade head
```

6. Start the backend server:
```bash
uvicorn app.main:app --reload
```

The backend will be available at `http://localhost:8000`
- API docs: http://localhost:8000/docs

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd snake-game-fe
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Configure API URL:
Create a `.env` file in `snake-game-fe/`:
```env
VITE_API_URL=http://localhost:8000/api/v1
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Features

- 🎮 **Two Game Modes**: Pass-through (wraps around) and Walls (ends on collision)
- 👤 **Authentication**: User signup, login, and session management
- 🏆 **Leaderboard**: View and submit top scores
- 👀 **Watch Mode**: Real-time viewing of active players
- 🔌 **WebSocket Support**: Real-time game state updates
- ✅ **Fully Tested**: Comprehensive test coverage for both frontend and backend

## Development

### Backend

Run tests:
```bash
cd snake-game-be
source venv/bin/activate
pytest
```

### Frontend

Run tests:
```bash
cd snake-game-fe
npm test
```

## Technology Stack

### Backend
- FastAPI - Web framework
- SQLAlchemy (Async) - ORM
- Alembic - Database migrations
- Pydantic - Data validation
- JWT - Authentication
- WebSocket - Real-time updates

### Frontend
- React 18
- TypeScript
- Vite
- React Router
- Vitest - Testing
- React Testing Library

## License

MIT

