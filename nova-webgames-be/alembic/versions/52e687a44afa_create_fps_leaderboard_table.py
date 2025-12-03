"""create_fps_leaderboard_table

Revision ID: 52e687a44afa
Revises: 0c916cc864ed
Create Date: 2025-01-XX XX:XX:XX.XXXXXX

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '52e687a44afa'
down_revision: Union[str, None] = '0c916cc864ed'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create fps_leaderboard table
    op.create_table('fps_leaderboard',
    sa.Column('id', sa.String(), nullable=False),
    sa.Column('user_id', sa.String(), nullable=False),
    sa.Column('username', sa.String(), nullable=False),
    sa.Column('score', sa.Integer(), nullable=False),
    sa.Column('kills', sa.Integer(), nullable=False, server_default='0'),
    sa.Column('deaths', sa.Integer(), nullable=False, server_default='0'),
    sa.Column('game_mode', sa.String(), nullable=False),
    sa.Column('date', sa.Date(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    # Drop fps_leaderboard table
    op.drop_table('fps_leaderboard')

