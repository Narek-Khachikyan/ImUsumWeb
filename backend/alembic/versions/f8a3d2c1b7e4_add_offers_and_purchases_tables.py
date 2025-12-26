"""add offers and purchases tables

Revision ID: f8a3d2c1b7e4
Revises: None
Create Date: 2025-03-08 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "f8a3d2c1b7e4"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "offers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("price", sa.Integer(), nullable=False),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        sa.Column("brand_name", sa.String(length=255), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("stock_quantity", sa.Integer(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "purchases",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "student_id",
            sa.Integer(),
            sa.ForeignKey("student_profiles.id"),
            nullable=False,
        ),
        sa.Column(
            "offer_id", sa.Integer(), sa.ForeignKey("offers.id"), nullable=False
        ),
        sa.Column("points_spent", sa.Integer(), nullable=False),
        sa.Column("qr_code", sa.String(length=255), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("redeemed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("qr_code"),
    )
    op.create_index(
        "ix_purchases_student_id", "purchases", ["student_id"], unique=False
    )
    op.create_index(
        "ix_purchases_offer_id", "purchases", ["offer_id"], unique=False
    )
    op.create_index(
        "ix_purchases_qr_code", "purchases", ["qr_code"], unique=False
    )


def downgrade() -> None:
    op.drop_index("ix_purchases_qr_code", table_name="purchases")
    op.drop_index("ix_purchases_offer_id", table_name="purchases")
    op.drop_index("ix_purchases_student_id", table_name="purchases")
    op.drop_table("purchases")
    op.drop_table("offers")
