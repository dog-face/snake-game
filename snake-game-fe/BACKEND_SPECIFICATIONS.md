# Backend API Specifications for Snake Game

## Overview

This document specifies the backend API requirements for the Snake Game frontend. The backend should provide RESTful endpoints for authentication, leaderboard management, and real-time game state for the watch feature.

## Base URL

All API endpoints should be prefixed with a base URL (e.g., `https://api.snakegame.com/api/v1` or `http://localhost:8000/api/v1`).

## Authentication

The backend should implement JWT (JSON Web Token) based authentication. All protected endpoints require a valid JWT token in the Authorization header.

**Format:** `Authorization: Bearer <token>`

### Token Requirements
- Tokens should expire after a reasonable time (e.g., 24 hours)
- Tokens should include user ID and username in the payload
- Refresh token mechanism is optional but recommended

## Data Models

### User
```typescript
interface User {
  id: string;           // UUID or unique identifier
  username: string;     // Unique, 3-20 characters, alphanumeric + underscore
  email: string;         // Valid email format, unique
  createdAt: string;     // ISO 8601 date string
  updatedAt: string;    // ISO 8601 date string
}
```

### Leaderboard Entry
```typescript
interface LeaderboardEntry {
  id: string;                    // UUID or unique identifier
  userId: string;                // Reference to User.id
  username: string;               // Denormalized for quick access
  score: number;                  // Integer, >= 0
  gameMode: 'pass-through' | 'walls';
  date: string;                   // ISO 8601 date string (YYYY-MM-DD)
  createdAt: string;              // ISO 8601 timestamp
}
```

### Game State
```typescript
interface Position {
  x: number;  // Integer, 0-19 (grid is 20x20)
  y: number;  // Integer, 0-19
}

interface GameState {
  snake: Position[];              // Array of positions, first is head
  food: Position;                 // Current food position
  direction: 'up' | 'down' | 'left' | 'right';
  score: number;                  // Integer, >= 0
  gameOver: boolean;              // Boolean
}
```

### Active Player (for Watch feature)
```typescript
interface ActivePlayer {
  id: string;                     // Session/game ID
  userId: string;                 // Reference to User.id
  username: string;               // Denormalized username
  score: number;                  // Current score
  gameMode: 'pass-through' | 'walls';
  gameState: GameState;           // Current game state
  startedAt: string;              // ISO 8601 timestamp
  lastUpdatedAt: string;          // ISO 8601 timestamp
}
```

## API Endpoints

### Authentication Endpoints

#### 1. POST `/auth/signup`
Create a new user account.

**Request Body:**
```json
{
  "username": "player1",
  "email": "player1@example.com",
  "password": "securePassword123"
}
```

**Validation:**
- Username: 3-20 characters, alphanumeric and underscore only, unique
- Email: Valid email format, unique
- Password: Minimum 8 characters (recommended: include complexity requirements)

**Response (201 Created):**
```json
{
  "user": {
    "id": "uuid",
    "username": "player1",
    "email": "player1@example.com",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  },
  "token": "jwt_token_here"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input data
- `409 Conflict`: Username or email already exists

#### 2. POST `/auth/login`
Authenticate user and return JWT token.

**Request Body:**
```json
{
  "username": "player1",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "uuid",
    "username": "player1",
    "email": "player1@example.com",
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  },
  "token": "jwt_token_here"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid username or password

#### 3. POST `/auth/logout`
Logout user (optional - mainly for token blacklisting if implemented).

**Headers:**
- `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "message": "Logged out successfully"
}
```

#### 4. GET `/auth/me`
Get current authenticated user.

**Headers:**
- `Authorization: Bearer <token>`

**Response (200 OK):**
```json
{
  "id": "uuid",
  "username": "player1",
  "email": "player1@example.com",
  "createdAt": "2024-01-15T10:00:00Z",
  "updatedAt": "2024-01-15T10:00:00Z"
}
```

**Error Responses:**
- `401 Unauthorized`: Invalid or missing token

### Leaderboard Endpoints

#### 5. GET `/leaderboard`
Get leaderboard entries, sorted by score (descending).

**Query Parameters:**
- `limit` (optional, default: 10): Number of entries to return (max: 100)
- `gameMode` (optional): Filter by game mode ('pass-through' or 'walls')
- `offset` (optional, default: 0): Pagination offset

**Response (200 OK):**
```json
{
  "entries": [
    {
      "id": "uuid",
      "username": "champion",
      "score": 200,
      "gameMode": "pass-through",
      "date": "2024-01-13"
    },
    {
      "id": "uuid",
      "username": "player1",
      "score": 150,
      "gameMode": "pass-through",
      "date": "2024-01-15"
    }
  ],
  "total": 150,
  "limit": 10,
  "offset": 0
}
```

#### 6. POST `/leaderboard`
Submit a new score entry.

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "score": 150,
  "gameMode": "pass-through"
}
```

**Validation:**
- Score must be >= 0
- GameMode must be 'pass-through' or 'walls'
- User must be authenticated

**Response (201 Created):**
```json
{
  "id": "uuid",
  "username": "player1",
  "score": 150,
  "gameMode": "pass-through",
  "date": "2024-01-15"
}
```

**Error Responses:**
- `401 Unauthorized`: Not authenticated
- `400 Bad Request`: Invalid input data

**Business Logic:**
- Only store the highest score per user per game mode (optional - can be configurable)
- Or store all scores and let frontend/query handle filtering

### Active Players / Watch Endpoints

#### 7. GET `/watch/active`
Get list of currently active players (players with active game sessions).

**Response (200 OK):**
```json
{
  "players": [
    {
      "id": "session-uuid",
      "username": "player1",
      "score": 45,
      "gameMode": "pass-through",
      "gameState": {
        "snake": [
          { "x": 5, "y": 5 },
          { "x": 4, "y": 5 },
          { "x": 3, "y": 5 }
        ],
        "food": { "x": 10, "y": 10 },
        "direction": "right",
        "score": 45,
        "gameOver": false
      },
      "startedAt": "2024-01-15T10:00:00Z",
      "lastUpdatedAt": "2024-01-15T10:05:00Z"
    }
  ]
}
```

**Implementation Notes:**
- This endpoint should return players who have active game sessions
- Active sessions are those that have been updated within the last 5 minutes (configurable)
- Consider implementing WebSocket or Server-Sent Events for real-time updates (see Real-time section)

#### 8. GET `/watch/active/:playerId`
Get specific active player's game state.

**Path Parameters:**
- `playerId`: The session/game ID

**Response (200 OK):**
```json
{
  "id": "session-uuid",
  "username": "player1",
  "score": 45,
  "gameMode": "pass-through",
  "gameState": {
    "snake": [
      { "x": 5, "y": 5 },
      { "x": 4, "y": 5 },
      { "x": 3, "y": 5 }
    ],
    "food": { "x": 10, "y": 10 },
    "direction": "right",
    "score": 45,
    "gameOver": false
  },
  "startedAt": "2024-01-15T10:00:00Z",
  "lastUpdatedAt": "2024-01-15T10:05:00Z"
}
```

**Error Responses:**
- `404 Not Found`: Player session not found or not active

#### 9. POST `/watch/start`
Start a new game session (for tracking active players).

**Headers:**
- `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "gameMode": "pass-through"
}
```

**Response (201 Created):**
```json
{
  "sessionId": "session-uuid",
  "gameMode": "pass-through",
  "startedAt": "2024-01-15T10:00:00Z"
}
```

#### 10. PUT `/watch/update/:sessionId`
Update game state for an active session.

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `sessionId`: The session/game ID

**Request Body:**
```json
{
  "gameState": {
    "snake": [
      { "x": 5, "y": 5 },
      { "x": 4, "y": 5 },
      { "x": 3, "y": 5 }
    ],
    "food": { "x": 10, "y": 10 },
    "direction": "right",
    "score": 45,
    "gameOver": false
  }
}
```

**Response (200 OK):**
```json
{
  "message": "Game state updated",
  "lastUpdatedAt": "2024-01-15T10:05:00Z"
}
```

**Error Responses:**
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Session doesn't belong to authenticated user
- `404 Not Found`: Session not found

#### 11. POST `/watch/end/:sessionId`
End a game session (called when game ends).

**Headers:**
- `Authorization: Bearer <token>`

**Path Parameters:**
- `sessionId`: The session/game ID

**Request Body:**
```json
{
  "finalScore": 150,
  "gameMode": "pass-through"
}
```

**Response (200 OK):**
```json
{
  "message": "Session ended",
  "leaderboardEntry": {
    "id": "uuid",
    "username": "player1",
    "score": 150,
    "gameMode": "pass-through",
    "date": "2024-01-15"
  }
}
```

**Business Logic:**
- Automatically submit score to leaderboard
- Remove session from active players
- Clean up session data

## Real-time Updates (Optional but Recommended)

For the watch feature to work smoothly, consider implementing real-time updates using one of these approaches:

### Option 1: WebSocket (Recommended)
- **Endpoint:** `ws://api.snakegame.com/ws` or `wss://api.snakegame.com/ws`
- **Events:**
  - `player:update` - Emitted when a player's game state changes
  - `player:join` - Emitted when a new player starts a game
  - `player:leave` - Emitted when a player ends their game
- **Client Subscription:** Subscribe to updates for specific player IDs or all active players

### Option 2: Server-Sent Events (SSE)
- **Endpoint:** `GET /watch/stream`
- **Stream Format:** Server sends periodic updates of all active players
- **Update Frequency:** Every 200-500ms (configurable)

### Option 3: Polling (Current Frontend Implementation)
- Frontend polls `/watch/active` every 3 seconds
- Less efficient but simpler to implement

## Database Schema Recommendations

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
```

### Leaderboard Table
```sql
CREATE TABLE leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(20) NOT NULL, -- Denormalized for performance
  score INTEGER NOT NULL CHECK (score >= 0),
  game_mode VARCHAR(20) NOT NULL CHECK (game_mode IN ('pass-through', 'walls')),
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_leaderboard_score ON leaderboard(score DESC);
CREATE INDEX idx_leaderboard_game_mode ON leaderboard(game_mode);
CREATE INDEX idx_leaderboard_date ON leaderboard(date DESC);
CREATE INDEX idx_leaderboard_user_game ON leaderboard(user_id, game_mode);
```

### Active Sessions Table (for Watch feature)
```sql
CREATE TABLE active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(20) NOT NULL, -- Denormalized
  game_mode VARCHAR(20) NOT NULL CHECK (game_mode IN ('pass-through', 'walls')),
  game_state JSONB NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMP DEFAULT NOW(),
  last_updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_active_sessions_user ON active_sessions(user_id);
CREATE INDEX idx_active_sessions_updated ON active_sessions(last_updated_at);
CREATE INDEX idx_active_sessions_game_mode ON active_sessions(game_mode);
```

**Cleanup Job:**
- Implement a background job to remove sessions that haven't been updated in the last 5 minutes
- Run every minute to keep the active sessions list current

## Error Response Format

All errors should follow this consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // Optional additional error details
  }
}
```

**Common HTTP Status Codes:**
- `200 OK`: Successful request
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required or failed
- `403 Forbidden`: Authenticated but not authorized
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate username)
- `500 Internal Server Error`: Server error

## Security Considerations

1. **Password Hashing**: Use bcrypt or Argon2 with appropriate salt rounds (minimum 10)
2. **JWT Security**: 
   - Use strong secret keys
   - Set appropriate expiration times
   - Consider refresh tokens for better security
3. **Input Validation**: 
   - Validate all input data
   - Sanitize user inputs
   - Use parameterized queries to prevent SQL injection
4. **Rate Limiting**: 
   - Implement rate limiting on authentication endpoints
   - Prevent brute force attacks
5. **CORS**: Configure CORS appropriately for the frontend domain
6. **HTTPS**: Use HTTPS in production
7. **Data Privacy**: Never return password hashes in API responses

## Performance Considerations

1. **Database Indexing**: Ensure proper indexes on frequently queried fields
2. **Caching**: Consider caching leaderboard data (Redis recommended)
3. **Pagination**: Always paginate large result sets
4. **Connection Pooling**: Use connection pooling for database connections
5. **Query Optimization**: Optimize database queries, especially for leaderboard

## Testing Requirements

The backend should include:
1. Unit tests for business logic
2. Integration tests for API endpoints
3. Authentication/authorization tests
4. Error handling tests
5. Performance tests for leaderboard queries

## Frontend Integration Notes

The frontend currently uses a mock API service located at:
- `src/services/api.ts`

**To integrate with real backend:**
1. Update the base URL in the API service
2. Add JWT token to Authorization header for authenticated requests
3. Store JWT token in localStorage or httpOnly cookie (recommended)
4. Handle token refresh if implemented
5. Update error handling to match backend error format

**Example API service update:**
```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

async login(credentials: LoginCredentials): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Login failed');
  }
  
  const data = await response.json();
  localStorage.setItem('token', data.token);
  return data.user;
}
```

## Environment Variables

The backend should support these environment variables:

```
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/snakegame
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h
NODE_ENV=production
CORS_ORIGIN=https://snakegame.com
REDIS_URL=redis://localhost:6379 (optional, for caching)
SESSION_TIMEOUT=300 (seconds, for active sessions)
```

## Additional Recommendations

1. **Logging**: Implement comprehensive logging (Winston, Pino, etc.)
2. **Monitoring**: Set up application monitoring (e.g., Sentry, DataDog)
3. **Documentation**: Use OpenAPI/Swagger for API documentation
4. **Versioning**: Consider API versioning (`/api/v1/`, `/api/v2/`)
5. **Health Check**: Implement `/health` endpoint for monitoring

## Questions for Backend Engineer

1. What technology stack will be used? (Node.js, Python, Go, etc.)
2. What database will be used? (PostgreSQL, MongoDB, etc.)
3. Will real-time features use WebSocket, SSE, or polling?
4. What authentication library/framework will be used?
5. What deployment platform? (AWS, Heroku, Railway, etc.)
6. Any specific requirements for scaling or performance?

---

**Document Version:** 1.0  
**Last Updated:** 2024-01-15  
**Frontend Repository:** https://github.com/dog-face/snake-game-fe

