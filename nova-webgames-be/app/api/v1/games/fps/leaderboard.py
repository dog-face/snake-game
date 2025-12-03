from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.api import deps
from app.models.games.fps.leaderboard import FPSLeaderboard
from app.models.user import User
from app.schemas.games.fps.leaderboard import (
    LeaderboardCreate,
    LeaderboardResponse,
    LeaderboardEntry
)

router = APIRouter()

@router.get("", response_model=LeaderboardResponse)
async def get_leaderboard(
    db: AsyncSession = Depends(deps.get_db),
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    game_mode: Optional[str] = Query(None, alias="gameMode"),
) -> Any:
    """
    Get FPS leaderboard entries, sorted by score (descending).
    """
    # Build query
    query = select(FPSLeaderboard)
    if game_mode:
        query = query.filter(FPSLeaderboard.game_mode == game_mode)
    
    # Get total count
    count_query = select(func.count()).select_from(FPSLeaderboard)
    if game_mode:
        count_query = count_query.filter(FPSLeaderboard.game_mode == game_mode)
    total_result = await db.execute(count_query)
    total = total_result.scalar_one()
    
    # Get entries
    entries_result = await db.execute(
        query.order_by(desc(FPSLeaderboard.score)).offset(offset).limit(limit)
    )
    entries = entries_result.scalars().all()
    
    return {
        "entries": entries,
        "total": total,
        "limit": limit,
        "offset": offset,
    }

@router.post("", response_model=LeaderboardEntry, status_code=201)
async def submit_score(
    *,
    db: AsyncSession = Depends(deps.get_db),
    score_in: LeaderboardCreate,
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Submit a new FPS game score.
    """
    entry = FPSLeaderboard(
        user_id=current_user.id,
        username=current_user.username,
        score=score_in.score,
        kills=score_in.kills,
        deaths=score_in.deaths,
        game_mode=score_in.game_mode,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry

