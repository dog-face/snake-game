# Nova WebGames

A multi-game browser platform starting with Snake game. Features authentication, leaderboards, and real-time multiplayer.

## Project Structure

This repository contains both the frontend and backend:

- **`nova-webgames-be/`** - FastAPI backend (Python)
- **`nova-webgames-fe/`** - React frontend (TypeScript)

### Multi-Game Architecture

The platform uses a modular structure to support multiple games:

**Backend Structure:**
```
nova-webgames-be/
├── app/
│   ├── models/games/        # Game-specific models
│   │   ├── snake/           # Snake game models
│   │   └── fps/             # FPS game models (placeholder)
│   ├── api/v1/games/        # Game-specific API routes
│   │   ├── snake/           # Snake game endpoints
│   │   └── fps/             # FPS game endpoints (placeholder)
│   └── schemas/games/       # Game-specific schemas
│       ├── snake/           # Snake game schemas
│       └── fps/             # FPS game schemas (placeholder)
```

**Frontend Structure:**
```
nova-webgames-fe/
├── src/
│   ├── components/games/     # Game-specific components
│   │   ├── snake/           # Snake game components
│   │   └── fps/             # FPS game components (placeholder)
│   ├── services/games/      # Game-specific API services
│   │   ├── snake/           # Snake game API calls
│   │   └── fps/             # FPS game API calls (placeholder)
│   ├── types/games/         # Game-specific TypeScript types
│   │   ├── snake.ts         # Snake game types
│   │   └── fps.ts           # FPS game types (placeholder)
│   └── data/games.ts        # Game metadata registry
```

Each game has its own:
- Database models and leaderboard table
- API endpoints (under `/api/v1/games/{game-id}/`)
- Frontend components
- Type definitions
- API service layer

See [GAMES.md](GAMES.md) for detailed instructions on adding a new game.

## Quick Start

### Backend Setup

1. Navigate to the backend directory:
```bash
cd nova-webgames-be
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
Create a `.env` file in `nova-webgames-be/`:

**For PostgreSQL (recommended):**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/nova_webgames
SECRET_KEY=your-secret-key-here-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=1440
SESSION_TIMEOUT=300
```

**For SQLite (development/testing):**
```env
DATABASE_URL=sqlite:///./nova_webgames.db
SECRET_KEY=your-secret-key-here-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=1440
SESSION_TIMEOUT=300
```

**PostgreSQL Setup:**
- Install PostgreSQL: `brew install postgresql` (macOS) or `sudo apt-get install postgresql` (Linux)
- Create database: `createdb nova_webgames` or via `psql`: `CREATE DATABASE nova_webgames;`
- Update `DATABASE_URL` in `.env` with your PostgreSQL credentials

5. Bootstrap the database (creates database if using PostgreSQL, then runs migrations):
```bash
make bootstrap-db
```

This will automatically:
- Create the PostgreSQL database if it doesn't exist (for PostgreSQL)
- Run all database migrations

6. Start the backend server:
```bash
uvicorn app.main:app --reload
```

The backend will be available at `http://localhost:8000`
- API docs: http://localhost:8000/docs

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd nova-webgames-fe
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Configure API URL:
Create a `.env` file in `nova-webgames-fe/`:
```env
VITE_API_URL=http://localhost:8000/api/v1
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Docker Setup (Recommended)

The easiest way to run the entire application stack is using Docker Compose. This includes PostgreSQL, the backend, and frontend with hot-reload support.

### Prerequisites

- Docker and Docker Compose installed
- No need to install PostgreSQL, Python, or Node.js locally

### Quick Start with Docker

1. **Build and start all services:**
   ```bash
   make docker-build
   make docker-up
   ```

   Or using docker-compose directly:
   ```bash
   docker-compose build
   docker-compose up -d
   ```

2. **Bootstrap the database:**
   ```bash
   make docker-bootstrap
   ```

   Or directly:
   ```bash
   docker-compose exec backend python bootstrap_db.py
   ```

3. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Docker Commands

- `make docker-build` - Build all Docker images
- `make docker-up` - Start all services
- `make docker-down` - Stop all services
- `make docker-logs` - View logs from all services
- `make docker-bootstrap` - Bootstrap database in container
- `make docker-restart` - Restart all services
- `make docker-clean` - Remove containers, volumes, and images

### Hot Reload

Both frontend and backend support hot-reload when running in Docker:
- **Backend**: Changes to Python files automatically restart the server
- **Frontend**: Changes to React/TypeScript files trigger Vite HMR (Hot Module Replacement)

### Environment Variables

Create a `.env` file in the project root (optional, defaults are provided):

```env
# PostgreSQL Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=nova_webgames

# Backend Configuration
SECRET_KEY=your-secret-key-here-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=1440
SESSION_TIMEOUT=300

# Frontend Configuration
VITE_API_URL=http://localhost:8000/api/v1
```

### Database Persistence

The PostgreSQL data is stored in a Docker volume (`postgres_data`), so your data persists even when containers are stopped. To completely reset the database:

```bash
make docker-clean
```

This will remove all containers, volumes, and images.

## Features

- 🎮 **Multi-Game Platform**: Modular architecture supporting multiple games
  - **Snake Game**: Classic snake game with two modes (Pass-through and Walls)
  - **FPS Arena**: Coming soon! (placeholder structure ready)
- 👤 **Authentication**: User signup, login, and session management
- 🏆 **Game-Specific Leaderboards**: Separate leaderboard tables per game
- 👀 **Watch Mode**: Real-time viewing of active players
- 🔌 **WebSocket Support**: Real-time game state updates
- ✅ **Fully Tested**: Comprehensive test coverage (200+ backend tests, 50+ frontend tests, 31 E2E tests)

## Adding a New Game

Nova WebGames is designed as a multi-game platform. To add a new game:

1. **See [GAMES.md](GAMES.md)** for detailed instructions
2. **Quick overview:**
   - Create game directories in backend (`app/models/games/{game-id}/`, `app/api/v1/games/{game-id}/`, `app/schemas/games/{game-id}/`)
   - Create game directories in frontend (`src/components/games/{game-id}/`, `src/services/games/{game-id}/`, `src/types/games/{game-id}.ts`)
   - Add game to `src/data/games.ts`
   - Create game-specific leaderboard table (if needed)
   - Add route in `App.tsx`

For complete instructions, see [GAMES.md](GAMES.md).

## Development

### Backend

Run tests:
```bash
cd nova-webgames-be
source venv/bin/activate
pytest
```

### Frontend

Run unit tests:
```bash
cd nova-webgames-fe
npm test
```

Run E2E tests (requires both backend and frontend):
```bash
cd nova-webgames-fe
npm run test:e2e
```

For more E2E testing options, see [nova-webgames-fe/e2e/README.md](nova-webgames-fe/e2e/README.md).

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
- Vitest - Unit testing
- React Testing Library - Component testing
- Playwright - E2E testing

## Deployment

### Render (Recommended)

This project is configured for easy deployment to Render. See [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) for detailed instructions.

**Quick Start:**
1. Push this repository to GitHub
2. Go to https://dashboard.render.com
3. Click "New +" → "Blueprint"
4. Connect your repository
5. Render will auto-detect `render.yaml` and create all services
6. Configure environment variables (see deployment guide)
7. Bootstrap the database

For detailed step-by-step instructions, see [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md).

## License

MIT

# Test connection
