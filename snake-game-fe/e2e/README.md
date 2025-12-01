# E2E Tests

End-to-end tests for the Snake Game application using Playwright.

## Prerequisites

1. **Backend dependencies**: Make sure the backend virtual environment is set up:
   ```bash
   cd ../snake-game-be
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Frontend dependencies**: Install frontend dependencies:
   ```bash
   npm install
   ```

3. **Playwright browsers**: Install Playwright browsers (done automatically on first run, or manually):
   ```bash
   npx playwright install --with-deps chromium
   ```

## Running Tests

### Run all E2E tests
```bash
npm run test:e2e
```

### Run tests in UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### Debug tests
```bash
npm run test:e2e:debug
```

### Run specific test file
```bash
npx playwright test e2e/auth.spec.ts
```

### Run tests in specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Test Structure

- `auth.spec.ts` - Authentication flow tests (signup, login, logout)
- `game.spec.ts` - Game functionality tests
- `leaderboard.spec.ts` - Leaderboard tests
- `watch.spec.ts` - Watch mode tests
- `full-flow.spec.ts` - Complete user journey tests
- `fixtures.ts` - Custom test fixtures and utilities

## How It Works

The Playwright configuration automatically:
1. Starts the backend server on port 8000 (with test database)
2. Starts the frontend dev server on port 5173
3. Runs the E2E tests against both services
4. Cleans up after tests complete

## Test Database

E2E tests use a separate SQLite database (`test_snake_game.db`) to avoid interfering with development data. The database is automatically bootstrapped before the backend starts.

## CI/CD

In CI environments, tests run in headless mode and don't reuse existing servers. Set the `CI` environment variable to enable CI mode:

```bash
CI=true npm run test:e2e
```

## Troubleshooting

### Backend not starting
- Ensure the backend virtual environment is activated and dependencies are installed
- Check that port 8000 is not already in use
- Verify the database bootstrap script works: `cd ../snake-game-be && source venv/bin/activate && python bootstrap_db.py`

### Frontend not starting
- Ensure `npm install` has been run
- Check that port 5173 is not already in use

### Tests timing out
- Increase timeout in `playwright.config.ts` if needed
- Check that both services are starting correctly
- Look at the Playwright HTML report for detailed error information

### Database issues
- The test database is automatically created and migrated
- If issues persist, delete `../snake-game-be/test_snake_game.db` and rerun tests

