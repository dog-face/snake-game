# CI Backend Tests Fix Tracking

## Problem
Backend tests pass locally but fail in GitHub Actions CI.

## Attempts and Changes

### Attempt 1: Initial Fix (Commit b53696b)
**Change:** Changed from multi-line `source venv/bin/activate` + `pytest` to `venv/bin/python -m pytest`
**Reason:** Thought venv activation wasn't persisting across lines
**Result:** ❌ Failed - Process completed with exit code 1

### Attempt 2: Bash -c Fix (Commit 796e10d)
**Change:** Changed to `bash -c "source venv/bin/activate && pytest"`
**Reason:** Ensure venv activation and pytest run in same shell session
**Result:** ❌ Failed - Process completed with exit code 1

### Attempt 3: Direct venv python with debug (Commit a63d732)
**Change:** Using `venv/bin/python -m pytest -v` with debug output to check venv state
**Reason:** Debug what's happening with venv and get more verbose test output
**Result:** ❌ Failed - Process completed with exit code 1

### Attempt 4: Combine install and test steps (Commit 4e2bb04)
**Change:** Combined install and test into single step so venv activation persists
**Reason:** Ensure venv is active when running pytest by keeping everything in one step
**Result:** ❌ Failed - Process completed with exit code 1

### Attempt 5: Separate steps with debug info (Commit e6684d9)
**Change:** Separated steps again but added debug output (python version, which python, which pytest, pytest version) and verbose test output
**Reason:** Get more information about what's actually failing - is it pytest execution or test failures?
**Result:** ❌ Failed - Found actual error: `TypeError: AsyncClient.__init__() got an unexpected keyword argument 'app'`

### Attempt 6: Fix AsyncClient usage (Current)
**Change:** Updated `tests/conftest.py` to use `ASGITransport` with `AsyncClient` instead of passing `app` directly
**Reason:** Newer versions of httpx require using `ASGITransport` for ASGI apps like FastAPI
**Result:** ⏳ Testing...

## Next Steps
- Monitor workflow run
- If fails, analyze error logs
- Try alternative approaches:
  - Use absolute path to venv python
  - Check if pytest is installed correctly
  - Verify working directory
  - Check Python version compatibility
  - Look for missing dependencies

