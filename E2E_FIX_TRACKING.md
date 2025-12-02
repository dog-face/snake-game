# E2E Tests Fix Tracking

## Problem
E2E tests are failing in GitHub Actions CI with error: "Error: Process from config.webServer was not able to start. Exit code: 1"

## Root Cause Analysis
The Playwright config tries to start the backend server with:
```
cd ../snake-game-be && venv/bin/python bootstrap_db.py && venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Issues identified:
1. The path `../snake-game-be` may not be correct from the working directory in CI
2. The command uses `&&` which means if bootstrap_db.py fails, uvicorn won't start
3. The working directory in CI is `snake-game-fe` when Playwright runs
4. Need to check if `/health` endpoint exists

## Attempts and Changes

### Attempt 1: Fix command structure (Commit 877e12d)
**Change:** Changed `&&` to `;` in webServer command to allow uvicorn to start even if bootstrap fails
**Reason:** Thought bootstrap might be failing and preventing uvicorn from starting
**Result:** ❌ Failed - Still getting "Process from config.webServer was not able to start. Exit code: 1"

### Attempt 2: Fix DATABASE_URL format (Current)
**Change:** Changed DATABASE_URL from `sqlite+aiosqlite:///./test_snake_game.db` to `sqlite:///./test_snake_game.db`
**Reason:** The error shows SQLAlchemy is failing to parse the database URL. The `session.py` file converts `sqlite://` to `sqlite+aiosqlite://` automatically, so we should pass the base format.
**Result:** ⏳ Testing...

