"""Board and BoardMembership models and boards Marshmallow schemas."""
import uuid

from marshmallow import RAISE, Schema, fields, pre_load, validate

from app.blueprints.cards.schema import CardSchema
from app.blueprints.columns.schema import ColumnSchema
from app.blueprints.users.schema import EMAIL_VALIDATORS, clean_text_fields
from app.errors import UtcDateTime, UuidField
from app.extensions import db
from app.soft_delete import SoftDeleteMixin


class Board(SoftDeleteMixin, db.Model):
    __tablename__ = "boards"

    board_id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(100), nullable=False)
    created_by = db.Column(
        db.Uuid, db.ForeignKey("users.user_id", name="fk_boards_users"), nullable=False
    )

    __table_args__ = (db.Index("ix_boards_created_by", "created_by"),)


class BoardMembership(SoftDeleteMixin, db.Model):
    __tablename__ = "board_memberships"

    board_membership_id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    board_id = db.Column(
        db.Uuid,
        db.ForeignKey("boards.board_id", name="fk_board_memberships_boards"),
        nullable=False,
    )
    user_id = db.Column(
        db.Uuid,
        db.ForeignKey("users.user_id", name="fk_board_memberships_users"),
        nullable=False,
    )
    role = db.Column(db.String(10), nullable=False)

    user = db.relationship("User", lazy="raise")

    __table_args__ = (
        db.CheckConstraint("role IN ('admin', 'member')", name="ck_board_memberships_role"),
        db.Index(
            "uq_board_memberships_board_user_active",
            "board_id",
            "user_id",
            unique=True,
            postgresql_where=db.text("is_deleted = false"),
        ),
        db.Index("ix_board_memberships_user_id", "user_id"),
        db.Index("ix_board_memberships_board_id", "board_id"),
    )


# --- Marshmallow schemas ---------------------------------------------------------------------


class BoardCreateSchema(Schema):
    class Meta:
        unknown = RAISE

    name = fields.String(required=True, validate=validate.Length(min=1, max=100))

    @pre_load
    def _clean(self, data, **kwargs):
        return clean_text_fields(data, "name")


class BoardUpdateSchema(BoardCreateSchema):
    pass


class BoardSchema(Schema):
    """A Board with the caller's role (`my_role`, set by the service before dumping)."""

    board_id = UuidField()
    name = fields.String()
    my_role = fields.String()
    created_at = UtcDateTime()
    updated_at = UtcDateTime()


class ColumnDetailSchema(ColumnSchema):
    cards = fields.List(fields.Nested(CardSchema))


class BoardDetailSchema(BoardSchema):
    columns = fields.List(fields.Nested(ColumnDetailSchema))


class MemberAddSchema(Schema):
    class Meta:
        unknown = RAISE

    email = fields.String(required=True, validate=EMAIL_VALIDATORS)

    @pre_load
    def _clean(self, data, **kwargs):
        return clean_text_fields(data, "email")


class MemberSchema(Schema):
    """A member row: user fields plus the role (set on the object by the service)."""

    user_id = UuidField()
    name = fields.String()
    email = fields.String()
    role = fields.String()
