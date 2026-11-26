"""Board and BoardMembership models."""
import uuid

from app.extensions import db
from app.soft_delete import SoftDeleteMixin


class Board(SoftDeleteMixin, db.Model):
    __tablename__ = "boards"

    board_id = db.Column(db.Uuid, primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(100), nullable=False)
    created_by = db.Column(
        db.Uuid, db.ForeignKey("users.user_id", name="fk_boards_users"), nullable=False
    )
    # V6 Invite_Tokens: nullable (Boards that predate V6 get theirs lazily); a unique constraint
    # allows many NULLs, so no partial index is needed (design A14).
    member_invite_token = db.Column(db.String(128), nullable=True)
    guest_invite_token = db.Column(db.String(128), nullable=True)

    __table_args__ = (
        db.UniqueConstraint("member_invite_token", name="uq_boards_member_invite_token"),
        db.UniqueConstraint("guest_invite_token", name="uq_boards_guest_invite_token"),
        db.Index("ix_boards_created_by", "created_by"),
    )


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
        db.CheckConstraint(
            "role IN ('admin', 'manager', 'member', 'guest')", name="ck_board_memberships_role"
        ),
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
