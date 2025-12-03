# Nova WebGames Backend API

FastAPI backend for the Nova WebGames multi-game platform. Features authentication, game-specific leaderboards, and real-time game state tracking.

## Quick Start

### 1. Activate Virtual Environment
```bash
source venv/bin/activate
```

### 2. Bootstrap the Database
```bash
# Using Makefile (recommended)
make bootstrap-db

# Or directly
python bootstrap_db.py
```

This will create the database (if using PostgreSQL) and run all migrations.

### 3. Start the Server
```bash
uvicorn app.main:app --reload
```

The server will start at `http://localhost:8000`

### 3. Access API Documentation
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## Docker Development

The easiest way to run the backend is using Docker Compose from the project root:

### Quick Start with Docker

1. **From project root, start all services:**
   ```bash
   make docker-up
   ```

2. **Bootstrap the database:**
   ```bash
   make docker-bootstrap
   ```

   Or directly:
   ```bash
   docker-compose exec backend python bootstrap_db.py
   ```

3. **View logs:**
   ```bash
   make docker-logs
   ```

### Containerized Database Bootstrap

The bootstrap script works in Docker containers. The database connection is automatically configured to use the `postgres` service:

- Database URL: `postgresql://postgres:postgres@postgres:5432/snake_game`
- Service name `postgres` resolves via Docker's internal DNS

### Hot Reload in Docker

The backend runs with `--reload` flag, so code changes are automatically detected and the server restarts. Source code is mounted as a volume for live updates.

## Development

### Running with Auto-reload
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Running Tests
```bash
# Activate venv first
source venv/bin/activate

# Run all tests
pytest

# Or use the helper script
./run_tests.sh
```

### Database Bootstrap

Bootstrap the database (creates database if using PostgreSQL, then runs migrations):

```bash
# Using Makefile (recommended)
make bootstrap-db

# Or directly
python bootstrap_db.py
```

This will:
- **For PostgreSQL**: Check if the database exists, create it if it doesn't, then run migrations
- **For SQLite**: Run migrations (database file will be created automatically)

### Database Migrations
```bash
# Create a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Or using Makefile
make migrate
```

## Environment Variables

Create a `.env` file in the project root:

```env
# PostgreSQL (recommended for production)
DATABASE_URL=postgresql://user:password@localhost:5432/snake_game

# Or SQLite (for development/testing)
# DATABASE_URL=sqlite:///./nova_webgames.db

SECRET_KEY=your-secret-key-here-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=1440
SESSION_TIMEOUT=300
```

### PostgreSQL Setup

1. **Install PostgreSQL** (if not already installed):
   ```bash
   # macOS
   brew install postgresql@14
   brew services start postgresql@14
   
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql
   ```

2. **Verify PostgreSQL is running**:
   ```bash
   pg_isready -h localhost -p 5432
   ```
   Should output: `localhost:5432 - accepting connections`

3. **Update your `.env` file** with the connection string:
   ```env
   # macOS with Homebrew: use your macOS username (not 'postgres')
   DATABASE_URL=postgresql://your_username@localhost:5432/nova_webgames
   
   # Linux: typically uses 'postgres' user
   DATABASE_URL=postgresql://postgres@localhost:5432/nova_webgames
   
   # Or with a custom user and password
   DATABASE_URL=postgresql://nova_user:your_password@localhost:5432/nova_webgames
   ```
   
   **Note**: 
   - The bootstrap script will automatically create the database if it doesn't exist
   - On macOS, Homebrew PostgreSQL uses your macOS username as the default superuser
   - To find your PostgreSQL user: `psql -l` (will show the owner of databases)

4. **Bootstrap the database** (creates database and runs migrations):
   ```bash
   make bootstrap-db
   ```
   
   This will:
   - Check if the database exists
   - Create it if it doesn't exist
   - Run all migrations
   
   Or manually:
   ```bash
   # Create database manually (optional - bootstrap script does this)
   createdb nova_webgames
   
   # Run migrations
   alembic upgrade head
   ```

### Troubleshooting

**PostgreSQL Connection Refused:**
- Make sure PostgreSQL is running:
  ```bash
  # macOS
  brew services start postgresql@14
  
  # Linux
  sudo systemctl start postgresql
  
  # Check status
  pg_isready -h localhost -p 5432
  ```

**Permission Denied:**
- Ensure the user in `DATABASE_URL` has permission to create databases
- For development, you can use the default `postgres` superuser
- Or create a user with proper permissions:
  ```sql
  CREATE USER nova_user WITH PASSWORD 'your_password';
  ALTER USER nova_user CREATEDB;
  ```

## API Endpoints

### Authentication
- `POST /api/v1/auth/signup` - Create new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/me` - Get current user

### Leaderboard (Snake Game)
- `GET /api/v1/leaderboard` - Get snake leaderboard entries (backward compatibility)
- `POST /api/v1/leaderboard` - Submit snake score (backward compatibility)
- `GET /api/v1/games/snake/leaderboard` - Get snake leaderboard entries (game-specific route)
- `POST /api/v1/games/snake/leaderboard` - Submit snake score (game-specific route)

**Note:** Each game has its own leaderboard table and endpoints. The old `/api/v1/leaderboard` routes are maintained for backward compatibility but use the snake-specific leaderboard.

### Watch (Active Players)
- `GET /api/v1/watch/active` - Get active players
- `GET /api/v1/watch/active/{playerId}` - Get specific player
- `POST /api/v1/watch/start` - Start game session
- `PUT /api/v1/watch/update/{sessionId}` - Update game state
- `POST /api/v1/watch/end/{sessionId}` - End game session

### WebSocket
- `WS /ws` - Real-time game state updates

## Project Structure

```
nova-webgames-be/
├── app/
│   ├── api/v1/          # API route handlers
│   │   ├── games/       # Game-specific routes
│   │   │   ├── snake/   # Snake game endpoints
│   │   │   └── fps/     # FPS game endpoints (placeholder)
│   │   ├── auth/        # Authentication endpoints
│   │   └── watch/       # Watch mode endpoints
│   ├── core/            # Configuration and security
│   ├── db/              # Database session and models
│   ├── models/          # SQLAlchemy models
│   │   ├── games/       # Game-specific models
│   │   │   ├── snake/   # Snake game models (leaderboard)
│   │   │   └── fps/     # FPS game models (placeholder)
│   │   ├── user.py      # User model
│   │   └── active_session.py  # Active session model
│   ├── schemas/         # Pydantic schemas
│   │   ├── games/       # Game-specific schemas
│   │   │   ├── snake/   # Snake game schemas
│   │   │   └── fps/     # FPS game schemas (placeholder)
│   │   └── user.py      # User schemas
│   └── main.py          # FastAPI application
├── tests/               # Test suite (200+ tests)
├── alembic/             # Database migrations
└── requirements.txt     # Python dependencies
```

**Multi-Game Architecture:**
- Each game has its own directory under `app/models/games/`, `app/api/v1/games/`, and `app/schemas/games/`
- Each game has its own leaderboard table (e.g., `snake_leaderboard`, `chess_leaderboard`)
- Game-specific endpoints are under `/api/v1/games/{game-id}/`
- See [GAMES.md](../GAMES.md) for instructions on adding a new game

## Technology Stack

- **FastAPI** - Web framework
- **SQLAlchemy (Async)** - ORM
- **Alembic** - Database migrations
- **Pydantic** - Data validation
- **JWT** - Authentication
- **WebSocket** - Real-time updates

## License

MIT

