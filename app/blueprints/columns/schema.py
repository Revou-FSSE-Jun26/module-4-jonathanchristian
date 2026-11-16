"""Column model and columns Marshmallow schemas."""
import uuid

from marshmallow import RAISE, Schema, fields, pre_load, validate

from app.blueprints.users.schema import clean_text_fields
from app.errors import OrderField, UuidField
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


class ColumnCreateSchema(Schema):
    class Meta:
        unknown = RAISE

    name = fields.String(required=True, validate=validate.Length(min=1, max=100))

    @pre_load
    def _clean(self, data, **kwargs):
        return clean_text_fields(data, "name")


class ColumnUpdateSchema(ColumnCreateSchema):
    pass


class ColumnReorderSchema(Schema):
    class Meta:
        unknown = RAISE

    column_id = UuidField(required=True)
    order = OrderField(required=True)


class ColumnSchema(Schema):
    """Output schema for a Column."""

    column_id = UuidField()
    board_id = UuidField()
    name = fields.String()
    order = fields.Float()
