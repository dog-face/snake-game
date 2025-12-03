"""create_snake_leaderboard_table

Revision ID: bfb54eb0694f
Revises: 8ffca484de17
Create Date: 2025-12-03 12:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text


# revision identifiers, used by Alembic.
revision: str = 'bfb54eb0694f'
down_revision: Union[str, None] = '8ffca484de17'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create snake_leaderboard table (same structure as leaderboard)
    op.create_table('snake_leaderboard',
    sa.Column('id', sa.String(), nullable=False),
    sa.Column('user_id', sa.String(), nullable=False),
    sa.Column('username', sa.String(), nullable=False),
    sa.Column('score', sa.Integer(), nullable=False),
    sa.Column('game_mode', sa.String(), nullable=False),
    sa.Column('date', sa.Date(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )
    
    # Migrate data from leaderboard to snake_leaderboard
    # This will copy all existing leaderboard entries to the new table
    connection = op.get_bind()
    connection.execute(text("""
        INSERT INTO snake_leaderboard (id, user_id, username, score, game_mode, date, created_at)
        SELECT id, user_id, username, score, game_mode, date, created_at
        FROM leaderboard
    """))


def downgrade() -> None:
    # Drop snake_leaderboard table
    op.drop_table('snake_leaderboard')

