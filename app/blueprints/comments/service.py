"""Business logic and queries for the comments feature."""
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.blueprints.boards.schema import BoardMembership
from app.blueprints.comments.schema import Comment, CommentSchema
from app.blueprints.notifications import service as notifications
from app.errors import Forbidden
from app.extensions import db
from app.permissions import ADMIN, get_card_for_member, get_comment_for_member
from app.soft_delete import active, soft_delete_where, utcnow

comment_schema = CommentSchema()


def _dump(comment_id):
    """Reload with the author joined (relationships are `lazy="raise"`) and dump."""
    comment = db.session.execute(
        select(Comment)
        .options(joinedload(Comment.author))
        .where(Comment.comment_id == comment_id)
        .execution_options(populate_existing=True)
    ).scalar_one()
    return comment_schema.dump(comment)


def _board_admin_id(board_id):
    return db.session.execute(
        select(BoardMembership.user_id)
        .where(
            BoardMembership.board_id == board_id,
            BoardMembership.role == ADMIN,
            active(BoardMembership),
        )
        .order_by(BoardMembership.created_at, BoardMembership.board_membership_id)
        .limit(1)
    ).scalar_one_or_none()


def create_comment(user, card_id, load_data):
    """Add the Comment and its notifications in one transaction."""
    card, board, _membership = get_card_for_member(card_id, user.user_id)
    data = load_data()
    comment = Comment(card_id=card_id, author_id=user.user_id, content=data["content"])
    db.session.add(comment)
    db.session.flush()
    message = notifications.comment_message(user.name, card.title)
    admin_id = _board_admin_id(board.board_id)
    for recipient_id in notifications.comment_recipients(user.user_id, card.assignee_id, admin_id):
        notifications.create_notification(recipient_id, notifications.COMMENT, card, message)
    db.session.commit()
    return _dump(comment.comment_id)


def list_comments(user, card_id):
    get_card_for_member(card_id, user.user_id)
    comments = db.session.execute(
        select(Comment)
        .options(joinedload(Comment.author))
        .where(Comment.card_id == card_id, active(Comment))
        .order_by(Comment.created_at, Comment.comment_id)
    ).scalars().all()
    return [comment_schema.dump(comment) for comment in comments]


def _owned_comment(user, comment_id):
    """404 and 403 for non-members come first; then only the author may continue (even admins)."""
    comment, _card, _membership = get_comment_for_member(comment_id, user.user_id)
    if comment.author_id != user.user_id:
        raise Forbidden()
    return comment


def update_comment(user, comment_id, load_data):
    comment = _owned_comment(user, comment_id)
    data = load_data()
    comment.content = data["content"]
    comment.updated_at = utcnow()
    db.session.commit()
    return _dump(comment_id)


def delete_comment(user, comment_id):
    _owned_comment(user, comment_id)
    soft_delete_where(db.session, Comment, Comment.comment_id == comment_id, deleted_at=utcnow())
    db.session.commit()
    return {"comment_id": str(comment_id)}
