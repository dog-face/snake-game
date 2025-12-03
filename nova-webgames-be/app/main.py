from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import asyncio
from app.core.config import settings
from app.db.session import AsyncSessionLocal
from app.models.active_session import ActiveSession
from sqlalchemy import select
from datetime import datetime, timedelta
import traceback

async def cleanup_stale_sessions():
    """Background task to clean up stale sessions"""
    while True:
        try:
            async with AsyncSessionLocal() as db:
                cutoff_time = datetime.utcnow() - timedelta(seconds=settings.SESSION_TIMEOUT)
                result = await db.execute(
                    select(ActiveSession).filter(
                        ActiveSession.last_updated_at < cutoff_time
                    )
                )
                stale_sessions = result.scalars().all()
                
                for session in stale_sessions:
                    await db.delete(session)
                
                await db.commit()
                
                if stale_sessions:
                    print(f"Cleaned up {len(stale_sessions)} stale session(s)")
        except Exception as e:
            print(f"Error cleaning up sessions: {e}")
        
        # Run cleanup every minute
        await asyncio.sleep(60)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    cleanup_task = asyncio.create_task(cleanup_stale_sessions())
    yield
    # Shutdown
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title="Snake Game API",
    description="""
    RESTful API for the Snake Game application. Provides endpoints for user authentication, 
    leaderboard management, and real-time game state tracking for the watch feature.
    
    ## Authentication
    Most endpoints require JWT authentication. Include the token in the Authorization header:
    ```
    Authorization: Bearer <your-jwt-token>
    ```
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    openapi_version="3.0.3",
    contact={
        "name": "API Support",
        "email": "support@snakegame.com",
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    },
    servers=[
        {"url": "http://localhost:8000/api/v1", "description": "Local development server"},
        {"url": "https://api.snakegame.com/api/v1", "description": "Production server"},
    ],
)

# CORS origins - parse from settings or use defaults
# For development, allow common localhost origins
# In production, this should be restricted to specific domains
try:
    cors_origins_str = getattr(settings, 'CORS_ORIGINS', None)
    if cors_origins_str and cors_origins_str != "*":
        cors_origins = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]
    elif cors_origins_str == "*":
        cors_origins = ["*"]
    else:
        # Default origins for development
        cors_origins = [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:3000",
        ]
except Exception:
    # Fallback to default origins
    cors_origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

# Log CORS origins for debugging (remove in production)
print(f"CORS allowed origins: {cors_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Global exception handler to ensure CORS headers are always included
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Ensure CORS headers are included even in error responses"""
    # Get origin from request
    origin = request.headers.get("origin", "*")
    
    # Determine allowed origin
    if cors_origins == ["*"] or origin in cors_origins:
        allow_origin = origin if cors_origins != ["*"] else "*"
    else:
        allow_origin = cors_origins[0] if cors_origins else "*"
    
    error_detail = {
        "error": {
            "code": "INTERNAL_SERVER_ERROR",
            "message": "An internal server error occurred"
        }
    }
    # In development, include traceback
    insecure_defaults = [
        "your-secret-key-here",
        "your-secret-key-here-change-in-production",
    ]
    if settings.SECRET_KEY in insecure_defaults:
        error_detail["error"]["traceback"] = traceback.format_exc()
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=error_detail,
        headers={
            "Access-Control-Allow-Origin": allow_origin,
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )

from app.api.v1 import auth, leaderboard, watch, websocket
from app.api.v1.games.fps import leaderboard as fps_leaderboard, websocket as fps_websocket

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(leaderboard.router, prefix="/api/v1/leaderboard", tags=["leaderboard"])
app.include_router(watch.router, prefix="/api/v1/watch", tags=["watch"])
app.include_router(websocket.router, tags=["websocket"])

# FPS game routes
app.include_router(
    fps_leaderboard.router,
    prefix="/api/v1/games/fps/leaderboard",
    tags=["fps", "leaderboard"]
)
app.include_router(
    fps_websocket.router,
    prefix="/api/v1/games/fps",
    tags=["fps", "websocket"]
)

@app.get("/")
async def root():
    return {"message": "Welcome to Snake Game API"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
