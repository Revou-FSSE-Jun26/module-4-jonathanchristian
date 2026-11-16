"""Card model and cards Marshmallow schemas."""
import uuid

from sqlalchemy.dialects import postgresql

from app.extensions import db
from app.soft_delete import SoftDeleteMixin


class Card(SoftDeleteMixin, db.Model):
    __tablename__ = "cards"

    card_id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    # board_id is denormalized from the Column; a Card never changes Board (design D11).
    board_id = db.Column(
        db.Uuid, db.ForeignKey("boards.board_id", name="fk_cards_boards"), nullable=False
    )
    column_id = db.Column(
        db.Uuid, db.ForeignKey("columns.column_id", name="fk_cards_columns"), nullable=False
    )
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    due_date = db.Column(db.Date, nullable=True)
    labels = db.Column(
        postgresql.ARRAY(db.String(30)), nullable=False, default=list, server_default="{}"
    )
    assignee_id = db.Column(
        db.Uuid, db.ForeignKey("users.user_id", name="fk_cards_users"), nullable=True
    )
    order = db.Column(db.Float, nullable=False)

    assignee = db.relationship("User", foreign_keys="Card.assignee_id", lazy="raise")

    __table_args__ = (
        db.CheckConstraint("char_length(description) <= 5000", name="ck_cards_description_len"),
        db.CheckConstraint('"order" > 0', name="ck_cards_order_positive"),
        db.Index("ix_cards_column_id_order", "column_id", "order"),
        db.Index("ix_cards_board_id", "board_id"),
        db.Index("ix_cards_assignee_id", "assignee_id"),
    )
