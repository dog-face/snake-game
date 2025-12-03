from pydantic import BaseModel, field_validator
from datetime import date
from typing import Optional, List

class LeaderboardEntry(BaseModel):
    id: str
    username: str
    score: int
    kills: int
    deaths: int
    game_mode: str
    date: date
    created_at: Optional[str] = None

    class Config:
        from_attributes = True

class LeaderboardCreate(BaseModel):
    score: int
    kills: int = 0
    deaths: int = 0
    game_mode: str
    
    @field_validator('score')
    @classmethod
    def validate_score(cls, v: int) -> int:
        if v < 0:
            raise ValueError('Score must be non-negative')
        return v
    
    @field_validator('kills', 'deaths')
    @classmethod
    def validate_kills_deaths(cls, v: int) -> int:
        if v < 0:
            raise ValueError('Kills and deaths must be non-negative')
        return v

class LeaderboardResponse(BaseModel):
    entries: List[LeaderboardEntry]
    total: int
    offset: int
    limit: int

