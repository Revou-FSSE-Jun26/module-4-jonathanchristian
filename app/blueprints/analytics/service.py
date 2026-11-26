"""Board analytics: SQLAlchemy joins and aggregates only (design A8)."""
from sqlalchemy import and_, func, select

from app.blueprints.analytics.schema import AnalyticsSchema
from app.blueprints.boards.schema import BoardMembership
from app.blueprints.cards.schema import Card
from app.blueprints.columns.schema import Column
from app.blueprints.comments.schema import Comment
from app.blueprints.users.schema import User
from app.extensions import db
from app.permissions import ADMIN, MANAGER, MEMBER, require_board_admin
from app.soft_delete import active, start_of_week_utc, utcnow

analytics_schema = AnalyticsSchema()


def _cards_per_column(board_id):
    rows = db.session.execute(
        select(Column.column_id, Column.name, func.count(Card.card_id))
        .select_from(Column)
        .outerjoin(Card, and_(Card.column_id == Column.column_id, active(Card)))
        .where(Column.board_id == board_id, active(Column))
        .group_by(Column.column_id, Column.name, Column.order, Column.created_at)
        .order_by(Column.order, Column.created_at)
    ).all()
    return [{"column_id": cid, "name": name, "count": count} for cid, name, count in rows]


def _completed_this_week(board_id, now):
    """Non-deleted DONE Cards completed from Monday 00:00 UTC to now, whatever their Column.

    No join with `columns`: the Column named "Done" has no special meaning since V6 (design A8).
    """
    return db.session.execute(
        select(func.count(Card.card_id)).where(
            Card.board_id == board_id,
            active(Card),
            Card.status == "DONE",
            Card.completed_at >= start_of_week_utc(now),
            Card.completed_at <= now,
        )
    ).scalar_one()


def _member_activity(board_id):
    assigned = (
        select(Card.assignee_id.label("user_id"), func.count(Card.card_id).label("n"))
        .where(Card.board_id == board_id, active(Card), Card.assignee_id.is_not(None))
        .group_by(Card.assignee_id)
        .subquery()
    )
    written = (
        select(Comment.author_id.label("user_id"), func.count(Comment.comment_id).label("n"))
        .join(Card, Card.card_id == Comment.card_id)
        .where(Card.board_id == board_id, active(Card), active(Comment))
        .group_by(Comment.author_id)
        .subquery()
    )
    rows = db.session.execute(
        select(
            User.user_id,
            User.name,
            func.coalesce(assigned.c.n, 0),
            func.coalesce(written.c.n, 0),
        )
        .select_from(BoardMembership)
        .join(User, and_(User.user_id == BoardMembership.user_id, active(User)))
        .outerjoin(assigned, assigned.c.user_id == User.user_id)
        .outerjoin(written, written.c.user_id == User.user_id)
        .where(
            BoardMembership.board_id == board_id,
            active(BoardMembership),
            BoardMembership.role.in_((ADMIN, MANAGER, MEMBER)),  # guests are not Board_Members
        )
        .order_by(BoardMembership.created_at, BoardMembership.board_membership_id)
    ).all()
    return [
        {"user_id": uid, "name": name, "assigned_cards": a, "comments": c}
        for uid, name, a, c in rows
    ]


def get_analytics(user, board_id):
    require_board_admin(board_id, user.user_id)
    now = utcnow()
    return analytics_schema.dump(
        {
            "cards_per_column": _cards_per_column(board_id),
            "completed_this_week": _completed_this_week(board_id, now),
            "member_activity": _member_activity(board_id),
        }
    )
