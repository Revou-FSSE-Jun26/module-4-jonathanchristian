"""Column model and columns Marshmallow schemas."""
import uuid

from marshmallow import Schema, fields

from app.errors import UuidField
from app.extensions import db
from app.soft_delete import SoftDeleteMixin


class Column(SoftDeleteMixin, db.Model):
    __tablename__ = "columns"

    column_id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    board_id = db.Column(
        db.Uuid, db.ForeignKey("boards.board_id", name="fk_columns_boards"), nullable=False
    )
    name = db.Column(db.String(100), nullable=False)
    order = db.Column(db.Float, nullable=False)

    __table_args__ = (
        db.CheckConstraint('"order" > 0', name="ck_columns_order_positive"),
        db.Index("ix_columns_board_id_order", "board_id", "order"),
    )


class ColumnSchema(Schema):
    """Output schema for a Column."""

    column_id = UuidField()
    board_id = UuidField()
    name = fields.String()
    order = fields.Float()
