from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class FPSLeaderboard(Base):
    __tablename__ = "fps_leaderboard"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    username = Column(String, nullable=False)  # Denormalized
    score = Column(Integer, nullable=False)  # Total score (kills, objectives, etc.)
    kills = Column(Integer, default=0, nullable=False)
    deaths = Column(Integer, default=0, nullable=False)
    game_mode = Column(String, nullable=False)  # e.g., "single-player", "deathmatch", "team-deathmatch"
    date = Column(Date, default=func.current_date(), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")

