# AGENTS.md

This file provides context and instructions for AI agents working in this repository.

## Project Structure

This is a monorepo containing:
- **`nova-webgames-be/`** - FastAPI backend (Python 3.7+)
- **`nova-webgames-fe/`** - React frontend (TypeScript, Vite)

The project uses a Makefile for common operations. Always check `make help` for available commands.

## Development Environment

This project uses **Docker-first development**. All services run in containers.

### Initial Setup
- Use `make docker-up` to start all services (PostgreSQL, backend, frontend)
- Use `make docker-bootstrap` to set up the database in containers
- Backend runs on port 8000: http://localhost:8000
- Frontend runs on port 5173: http://localhost:5173
- API docs available at: http://localhost:8000/docs

### Running Services
- Start all services: `make docker-up`
- View logs: `make docker-logs`
- Stop all services: `make docker-down`
- Restart services: `make docker-restart`
- Hot reload works in Docker - code changes are automatically reflected

### Database Setup
- Database runs in Docker (PostgreSQL)
- Use `make docker-bootstrap` to set up the database and run migrations
- Use `make docker-migrate` to apply database migrations
- Database migrations are managed with Alembic in `nova-webgames-be/alembic/`
- Environment variables are configured in `.env` files (see README.md for details)

### Navigating the Codebase

**Backend:**
- API routes: `nova-webgames-be/app/api/v1/`
  - Game-specific routes: `nova-webgames-be/app/api/v1/games/{game-id}/`
  - Shared routes: `nova-webgames-be/app/api/v1/auth/`, `nova-webgames-be/app/api/v1/watch/`
- Models: `nova-webgames-be/app/models/`
  - Game-specific models: `nova-webgames-be/app/models/games/{game-id}/`
  - Shared models: `nova-webgames-be/app/models/user.py`, `nova-webgames-be/app/models/active_session.py`
- Schemas: `nova-webgames-be/app/schemas/`
  - Game-specific schemas: `nova-webgames-be/app/schemas/games/{game-id}/`
- Tests: `nova-webgames-be/tests/`

**Frontend:**
- Components: `nova-webgames-fe/src/components/`
  - Game-specific: `nova-webgames-fe/src/components/games/{game-id}/`
  - Shared: `nova-webgames-fe/src/components/shared/`
- Services: `nova-webgames-fe/src/services/`
  - Game-specific: `nova-webgames-fe/src/services/games/{game-id}/`
  - Shared: `nova-webgames-fe/src/services/api.ts`
- Types: `nova-webgames-fe/src/types/`
  - Game-specific: `nova-webgames-fe/src/types/games/{game-id}.ts`
- Game registry: `nova-webgames-fe/src/data/games.ts`
- Tests: `nova-webgames-fe/src/**/__tests__/` and `nova-webgames-fe/e2e/`

## Testing Instructions

### Backend Tests
- Run backend tests: `make test-be`
- Tests are located in `nova-webgames-be/tests/`
- All tests should pass before committing

### Frontend Unit Tests
- Run frontend unit tests: `make test-fe`
- Tests use Vitest and React Testing Library

### E2E Tests
- Run E2E tests: `make test-e2e` (automatically starts servers)
- E2E tests use Playwright and are in `nova-webgames-fe/e2e/`
- Run in UI mode: `make test-e2e-ui`
- Run with visible browser: `make test-e2e-headed`
- Debug E2E tests: `make test-e2e-debug`
- Install Playwright browsers: `make install-playwright`

### Test All
- Run all tests (unit + E2E): `make test-all`
- Always run tests before creating a PR

## Code Quality

### Backend
- Use type hints in Python code
- Follow FastAPI best practices
- Run `make test-be` to ensure all tests pass
- Check for linting errors (if configured)

### Frontend
- Use TypeScript strictly (no `any` types unless necessary)
- Follow React best practices and hooks patterns
- Run `make test-fe` to ensure all tests pass
- Run `make build` to check for TypeScript errors

## Database Migrations

### Applying Migrations
- Use `make docker-migrate` to apply all pending migrations in Docker

## Pull Request Instructions

### PR Title Format
- Use descriptive titles that explain what the PR does
- Examples:
  - "Add user authentication endpoint"
  - "Fix leaderboard sorting bug"
  - "Update frontend to use new API endpoint"

### Pre-PR Checklist
1. **Run all tests**: `make test-all`
2. **Check TypeScript compilation**: `make build`
3. **Ensure database migrations are up to date**: `make docker-migrate`
4. **Verify code works in Docker**: `make docker-up && make docker-bootstrap`
5. **Review your changes** - ensure no debug code, console.logs, or commented code remains

### PR Description
- Describe what the PR does and why
- Mention any breaking changes
- Include testing instructions if applicable
- Reference related issues if any

### Commit Messages
- Use clear, descriptive commit messages
- Follow conventional commit format when possible (feat:, fix:, docs:, etc.)

## Common Tasks

### Adding a New Game
See [GAMES.md](GAMES.md) for complete instructions. Quick overview:
1. Create game directories in backend (`app/models/games/{game-id}/`, `app/api/v1/games/{game-id}/`, `app/schemas/games/{game-id}/`)
2. Create game directories in frontend (`src/components/games/{game-id}/`, `src/services/games/{game-id}/`, `src/types/games/{game-id}.ts`)
3. Add game to `src/data/games.ts`
4. Create game-specific leaderboard table (if needed)
5. Add route in `App.tsx`

### Adding a New API Endpoint
**For game-specific endpoints:**
1. Add route handler in `nova-webgames-be/app/api/v1/games/{game-id}/`
2. Add Pydantic schema in `nova-webgames-be/app/schemas/games/{game-id}/`
3. Add database model if needed in `nova-webgames-be/app/models/games/{game-id}/`
4. Register route in `app/main.py` with prefix `/api/v1/games/{game-id}/`
5. Create migration if model changed (run in Docker container)
6. Add tests in `nova-webgames-be/tests/`
7. Update OpenAPI spec (auto-generated, but verify)

**For shared endpoints:**
1. Add route handler in `nova-webgames-be/app/api/v1/`
2. Add Pydantic schema in `nova-webgames-be/app/schemas/`
3. Add database model if needed in `nova-webgames-be/app/models/`
4. Create migration if model changed (run in Docker container)
5. Add tests in `nova-webgames-be/tests/`
6. Update OpenAPI spec (auto-generated, but verify)

### Adding a New Frontend Component
**For game-specific components:**
1. Create component in `nova-webgames-fe/src/components/games/{game-id}/`
2. Add CSS file if needed (same directory)
3. Add tests in `__tests__/` subdirectory
4. Update routing in `nova-webgames-fe/src/App.tsx` if needed

**For shared components:**
1. Create component in `nova-webgames-fe/src/components/shared/`
2. Add CSS file if needed (same directory)
3. Add tests in `__tests__/` subdirectory
4. Update routing in `nova-webgames-fe/src/App.tsx` if needed

### Updating Dependencies
- Backend: Edit `nova-webgames-be/requirements.txt`, then rebuild Docker containers: `make docker-build`
- Frontend: Edit `nova-webgames-fe/package.json`, then rebuild Docker containers: `make docker-build`

## Environment Variables

### Backend (`.env` in `nova-webgames-be/`)
- `DATABASE_URL` - Database connection string
- `SECRET_KEY` - JWT secret key
- `ACCESS_TOKEN_EXPIRE_MINUTES` - Token expiration time
- `SESSION_TIMEOUT` - Session timeout in seconds

### Frontend (`.env` in `nova-webgames-fe/`)
- `VITE_API_URL` - Backend API URL (default: http://localhost:8000/api/v1)

## Important Notes

- **Docker-first development** - All services run in Docker containers
- **Never commit sensitive data** (API keys, passwords, etc.)
- **Always run tests** before committing: `make test-all`
- **Database migrations** should be reviewed before applying
- **TypeScript errors** must be fixed before committing frontend changes
- **Hot reload** works in Docker - code changes are automatically reflected
- **The Makefile** is the source of truth for common commands - use it instead of remembering exact commands

## Getting Help

- Check `make help` for available commands
- Review `README.md` for project overview
- Check `nova-webgames-be/README.md` for backend-specific details
- Review test files for examples of how to use the codebase

## Scratch files

- if you need to use a scratch document for thinking or documentation, place it in the `/scratch` directory. 

## Documentation

- When making changes that affect the setup or tools available in this repository, document those changes in appropriate documentation files. 