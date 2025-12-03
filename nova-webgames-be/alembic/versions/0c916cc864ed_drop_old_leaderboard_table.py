"""drop_old_leaderboard_table

Revision ID: 0c916cc864ed
Revises: bfb54eb0694f
Create Date: 2025-12-03 13:57:55.739727

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0c916cc864ed'
down_revision: Union[str, None] = 'bfb54eb0694f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop the old leaderboard table
    # Data has already been migrated to snake_leaderboard in previous migration
    # This table is no longer needed
    op.drop_table('leaderboard')


def downgrade() -> None:
    # Recreate the old leaderboard table if we need to rollback
    op.create_table('leaderboard',
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
    
    # Optionally migrate data back from snake_leaderboard
    # Note: This would only work if snake_leaderboard still has the data
    # In practice, you'd need to restore from backup for a full rollback
