"""add User.last_seen

Revision ID: ef78fa0844f4
Revises: 417eece003cb
Create Date: 2024-05-03 16:08:10.602419

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "ef78fa0844f4"
down_revision = "417eece003cb"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column("last_seen", sa.DateTime(timezone=True), nullable=True)
        )

    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic - please adjust! ###
    with op.batch_alter_table("user", schema=None) as batch_op:
        batch_op.drop_column("last_seen")

    # ### end Alembic commands ###
