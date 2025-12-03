# Nova WebGames Frontend

A modern, multi-game platform frontend built with React, TypeScript, and Vite. Currently features Snake game with two game modes, multiplayer leaderboard, and the ability to watch other players in real-time.

## Features

- 🎮 **Two Game Modes**:
  - **Pass-through**: Snake wraps around the edges
  - **Walls**: Game ends on wall collision

- 👤 **Authentication**:
  - Login and Signup functionality
  - User session management
  - Protected routes

- 🏆 **Leaderboard**:
  - View top scores
  - Filter by game mode
  - Automatic score submission

- 👀 **Watch Mode**:
  - View active players
  - Real-time game simulation
  - Multiple player selection

- ✅ **Fully Tested**:
  - Comprehensive test coverage
  - Unit tests for game logic
  - Component tests
  - API service tests

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend server running (see [nova-webgames-be](../nova-webgames-be/README.md))

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure the API URL (optional):
   - Create a `.env` file in the root directory
   - Add: `VITE_API_URL=http://localhost:8000/api/v1`
   - Or use: `REACT_APP_API_URL=http://localhost:8000/api/v1` (also supported)
   - Defaults to `http://localhost:8000/api/v1` if not set

3. Start the backend server (in a separate terminal):
```bash
# Follow instructions in the backend repository
cd ../snake-game-be
# Start the backend server
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser to `http://localhost:5173`

### Testing

Run tests:
```bash
npm test
```

Run tests with UI:
```bash
npm run test:ui
```

Run tests with coverage:
```bash
npm run test:coverage
```

### Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── components/          # React components
│   ├── shared/         # Shared components
│   │   ├── Login.tsx   # Login form
│   │   ├── Signup.tsx  # Signup form
│   │   └── Navbar.tsx  # Navigation bar
│   └── games/          # Game-specific components
│       ├── snake/      # Snake game components
│       │   ├── SnakeGame.tsx
│       │   └── SnakeLeaderboard.tsx
│       └── fps/        # FPS game components (placeholder)
│           └── FPSGame.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication context
├── services/           # API services
│   ├── api.ts          # Shared API client
│   └── games/          # Game-specific API services
│       ├── snake/      # Snake game API calls
│       └── fps/        # FPS game API calls (placeholder)
├── utils/              # Utility functions
│   └── games/          # Game-specific utilities
│       └── snake/      # Snake game logic
├── types/              # TypeScript types
│   └── games/          # Game-specific types
│       ├── snake.ts    # Snake game types
│       └── fps.ts      # FPS game types (placeholder)
├── data/               # Game metadata
│   └── games.ts        # Game registry
└── test/               # Test setup
    └── setup.ts        # Vitest configuration
```

**Multi-Game Architecture:**
- Each game has its own directory under `components/games/`, `services/games/`, and `types/games/`
- Shared components (Login, Signup, Navbar) are in `components/shared/`
- Game metadata is registered in `data/games.ts`
- See [GAMES.md](../GAMES.md) for instructions on adding a new game

## API Service

Backend calls are organized by game:
- **Shared API**: `src/services/api.ts` - Handles authentication, JWT token management, and shared operations
- **Game-Specific API**: `src/services/games/{game-id}/api.ts` - Handles game-specific endpoints (e.g., leaderboard)

The service handles:
- JWT token management (stored in localStorage)
- Authentication (login, signup, logout)
- Game-specific leaderboard operations
- Active player tracking for watch feature

### Backend Integration

The frontend is integrated with the backend API. Make sure the backend server is running at `http://localhost:8000` (or update the `VITE_API_URL` environment variable).

See the [Backend README](../nova-webgames-be/README.md) for backend setup instructions.

## Game Controls

- **Arrow Keys** or **WASD** to control the snake
- **Pause** button to pause/resume the game

## Technologies Used

- React 18
- TypeScript
- Vite
- React Router
- Vitest (testing)
- React Testing Library

## License

MIT

