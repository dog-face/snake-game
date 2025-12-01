# Snake Game Frontend

A modern, interactive Snake game frontend built with React, TypeScript, and Vite. Features two game modes, multiplayer leaderboard, and the ability to watch other players in real-time.

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
- Backend server running (see [snake-game-be](https://github.com/dog-face/snake-game-be))

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
│   ├── Login.tsx       # Login form
│   ├── Signup.tsx      # Signup form
│   ├── SnakeGame.tsx   # Main game component
│   ├── Leaderboard.tsx # Leaderboard display
│   ├── Watch.tsx       # Watch other players
│   └── Navbar.tsx      # Navigation bar
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication context
├── services/           # API services
│   └── api.ts          # Centralized API (mocked)
├── utils/              # Utility functions
│   └── gameLogic.ts    # Game logic functions
├── types/              # TypeScript types
│   └── game.ts         # Game-related types
└── test/               # Test setup
    └── setup.ts        # Vitest configuration
```

## API Service

All backend calls are centralized in `src/services/api.ts` and connected to the real backend API. The service handles:
- JWT token management (stored in localStorage)
- Authentication (login, signup, logout)
- Leaderboard operations
- Active player tracking for watch feature

### Backend Integration

The frontend is integrated with the backend API. Make sure the backend server is running at `http://localhost:8000` (or update the `REACT_APP_API_URL` environment variable).

See the [Backend Repository](https://github.com/dog-face/snake-game-be) for backend setup instructions.

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

