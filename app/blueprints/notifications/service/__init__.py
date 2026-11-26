"""Notifications service package: keeps `service.<name>` importable (G-BE-18)."""
from app.blueprints.notifications.service.notification_service import (
    ASSIGNMENT,
    COMMENT,
    MAX_MESSAGE,
    assignment_message,
    comment_message,
    comment_recipients,
    create_notification,
    list_notifications,
    mark_read,
    shorten,
)
from app.blueprints.notifications.service.overdue_service import days_overdue, list_overdue

__all__ = [
    "ASSIGNMENT",
    "COMMENT",
    "MAX_MESSAGE",
    "assignment_message",
    "comment_message",
    "comment_recipients",
    "create_notification",
    "days_overdue",
    "list_notifications",
    "list_overdue",
    "mark_read",
    "shorten",
]
