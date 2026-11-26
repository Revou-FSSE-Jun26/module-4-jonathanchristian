"""Notification creation, listing, and mark-read (design A7)."""
from sqlalchemy import func, select

from app.blueprints.notifications.schema import (
    Notification,
    NotificationPageSchema,
    NotificationSchema,
)
from app.errors import Forbidden, NotFound
from app.extensions import db
from app.soft_delete import active

MAX_MESSAGE = 255
ASSIGNMENT = "assignment"
COMMENT = "comment"

notification_schema = NotificationSchema()
page_schema = NotificationPageSchema()


def shorten(text, limit):
    """Cut `text` to at most `limit` characters, ending with `...` when it was cut."""
    if limit <= 0:
        return ""
    if len(text) <= limit:
        return text
    if limit <= 3:
        return text[:limit]
    return text[: limit - 3] + "..."


def assignment_message(card_title):
    prefix, suffix = 'Assigned to you: "', '"'
    return prefix + shorten(card_title, MAX_MESSAGE - len(prefix) - len(suffix)) + suffix


def comment_message(author_name, card_title):
    head = f"{author_name} commented on "
    if len(head) > MAX_MESSAGE - 5:
        head = shorten(head, MAX_MESSAGE - 5)
    room = MAX_MESSAGE - len(head) - 2
    return head + '"' + shorten(card_title, room) + '"'


def comment_recipients(author_id, assignee_id, admin_id):
    """De-duplicated recipients of a comment: assignee and admin, never the author or None."""
    recipients = []
    for candidate in (assignee_id, admin_id):
        if candidate is None or candidate == author_id or candidate in recipients:
            continue
        recipients.append(candidate)
    return recipients


def create_notification(recipient_id, type, card, message):
    """Add one Notification to the session. The caller commits in its own transaction."""
    notification = Notification(
        recipient_id=recipient_id,
        card_id=card.card_id,
        board_id=card.board_id,
        type=type,
        message=shorten(message, MAX_MESSAGE),
    )
    db.session.add(notification)
    return notification


def list_notifications(user, query):
    page, per_page = query["page"], query["per_page"]
    mine = (Notification.recipient_id == user.user_id, active(Notification))
    items = db.session.execute(
        select(Notification)
        .where(*mine)
        .order_by(Notification.created_at.desc(), Notification.notification_id.desc())
        .limit(per_page)
        .offset((page - 1) * per_page)
    ).scalars().all()
    total = db.session.execute(
        select(func.count()).select_from(Notification).where(*mine)
    ).scalar_one()
    unread = db.session.execute(
        select(func.count()).select_from(Notification).where(*mine, Notification.is_read.is_(False))
    ).scalar_one()
    return page_schema.dump(
        {"items": items, "page": page, "per_page": per_page, "total": total, "unread_count": unread}
    )


def mark_read(user, notification_id):
    notification = db.session.execute(
        select(Notification).where(
            Notification.notification_id == notification_id, active(Notification)
        )
    ).scalar_one_or_none()
    if notification is None:
        raise NotFound("Notification not found")
    if notification.recipient_id != user.user_id:
        raise Forbidden()
    if not notification.is_read:
        notification.is_read = True
        db.session.commit()
    return notification_schema.dump(notification)
