"""Soft delete mixin and helpers (G-DB-04, G-DB-05, G-DB-06)."""
from datetime import datetime, timedelta, timezone

from sqlalchemy import update

from app.extensions import db


def utcnow():
    """Current time as a timezone-aware UTC datetime."""
    return datetime.now(timezone.utc)


class SoftDeleteMixin:
    """Audit and delete columns shared by every model."""

    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at = db.Column(
        db.DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )
    deleted_at = db.Column(db.DateTime(timezone=True), nullable=True)
    is_deleted = db.Column(
        db.Boolean, nullable=False, default=False, server_default=db.false()
    )


def active(model):
    """Condition that keeps only rows that are not soft deleted."""
    return model.is_deleted.is_(False)


def soft_delete_where(session, model, *conditions, deleted_at):
    """Soft delete every active row of `model` matching `conditions`.

    The caller captures `deleted_at` once and passes the same value to every call of one
    cascade. The caller owns the transaction and commits once at the end.
    Returns the number of rows changed.
    """
    statement = (
        update(model)
        .where(*conditions, active(model))
        .values(is_deleted=True, deleted_at=deleted_at, updated_at=deleted_at)
        .execution_options(synchronize_session=False)
    )
    return session.execute(statement).rowcount


def start_of_week_utc(now):
    """Monday 00:00:00 UTC of the week that contains `now` (a pure function)."""
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)
    now = now.astimezone(timezone.utc)
    monday = now - timedelta(days=now.weekday())
    return monday.replace(hour=0, minute=0, second=0, microsecond=0)
