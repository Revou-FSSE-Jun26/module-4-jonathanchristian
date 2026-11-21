"""Persistence helpers and data factories shared by the database tests (loaded by conftest)."""
import uuid
from datetime import datetime, timezone

import pytest
from flask_jwt_extended import create_access_token, create_refresh_token
from sqlalchemy import func, select
from werkzeug.security import generate_password_hash

DEFAULT_PASSWORD = "password123"
# Fast hashing keeps factories cheap; production uses the werkzeug default.
_HASHES = {}


def _fast_hash(password):
    if password not in _HASHES:
        _HASHES[password] = generate_password_hash(password, method="pbkdf2:sha256:1000")
    return _HASHES[password]


# --- persistence helpers ----------------------------------------------------------------------


@pytest.fixture
def persist(app):
    """Insert an object, then return it detached with every column loaded."""
    from app.extensions import db

    def _persist(obj):
        with app.app_context():
            db.session.add(obj)
            db.session.commit()
            db.session.refresh(obj)
            db.session.expunge(obj)
        return obj

    return _persist


@pytest.fixture
def fetch(app):
    """`fetch(Model, pk)` returns the row (soft-deleted rows included) or None, detached."""
    from app.extensions import db

    def _fetch(model, pk):
        with app.app_context():
            obj = db.session.get(model, pk)
            if obj is not None:
                db.session.expunge(obj)
            return obj

    return _fetch


@pytest.fixture
def count_rows(app):
    """`count_rows(Model, *conditions)` counts rows including soft-deleted ones."""
    from app.extensions import db

    def _count(model, *conditions):
        with app.app_context():
            return db.session.execute(
                select(func.count()).select_from(model).where(*conditions)
            ).scalar_one()

    return _count


# --- factories ----------------------------------------------------------------------------------


@pytest.fixture
def make_user(persist):
    from app.blueprints.users.schema import User

    def factory(name=None, email=None, password=DEFAULT_PASSWORD):
        suffix = uuid.uuid4().hex[:10]
        user = User(
            name=name or f"User {suffix}",
            email=(email or f"user-{suffix}@example.com").lower(),
            password_hash=_fast_hash(password),
        )
        persist(user)
        user.password = password
        return user

    return factory


@pytest.fixture
def make_deleted_user(persist):
    """Insert a soft-deleted User directly (no endpoint deletes users)."""
    from app.blueprints.users.schema import User

    def factory(email=None, password=DEFAULT_PASSWORD, name="Deleted User"):
        user = User(
            name=name,
            email=(email or f"gone-{uuid.uuid4().hex[:10]}@example.com").lower(),
            password_hash=_fast_hash(password),
            is_deleted=True,
            deleted_at=datetime.now(timezone.utc),
        )
        persist(user)
        user.password = password
        return user

    return factory


@pytest.fixture
def make_board(persist, make_user):
    """Create a Board and the creator's admin membership; `board.owner` is the admin User."""
    from app.blueprints.boards.schema import Board, BoardMembership

    def factory(owner=None, name=None):
        owner = owner or make_user()
        board = persist(Board(name=name or f"Board {uuid.uuid4().hex[:6]}", created_by=owner.user_id))
        persist(BoardMembership(board_id=board.board_id, user_id=owner.user_id, role="admin"))
        board.owner = owner
        return board

    return factory


@pytest.fixture
def make_member(persist, make_user):
    """Add a membership; returns the membership with `.member` set to the User."""
    from app.blueprints.boards.schema import BoardMembership

    def factory(board, user=None, role="member"):
        user = user or make_user()
        membership = persist(
            BoardMembership(board_id=board.board_id, user_id=user.user_id, role=role)
        )
        membership.member = user
        return membership

    return factory


@pytest.fixture
def make_column(persist, count_rows, app):
    from app.blueprints.columns.schema import Column
    from app.extensions import db

    def factory(board, name=None, order=None):
        if order is None:
            with app.app_context():
                current = db.session.execute(
                    select(func.max(Column.order)).where(
                        Column.board_id == board.board_id, Column.is_deleted.is_(False)
                    )
                ).scalar_one()
            order = 1.0 if current is None else current + 1.0
        return persist(
            Column(board_id=board.board_id, name=name or f"Column {uuid.uuid4().hex[:6]}", order=order)
        )

    return factory


@pytest.fixture
def make_card(persist, app):
    from app.blueprints.cards.schema import Card
    from app.extensions import db

    def factory(column, title=None, assignee=None, order=None, **fields):
        if order is None:
            with app.app_context():
                current = db.session.execute(
                    select(func.max(Card.order)).where(
                        Card.column_id == column.column_id, Card.is_deleted.is_(False)
                    )
                ).scalar_one()
            order = 1.0 if current is None else current + 1.0
        return persist(
            Card(
                board_id=column.board_id,
                column_id=column.column_id,
                title=title or f"Card {uuid.uuid4().hex[:6]}",
                assignee_id=assignee.user_id if assignee else None,
                order=order,
                **fields,
            )
        )

    return factory


@pytest.fixture
def make_comment(persist):
    from app.blueprints.comments.schema import Comment

    def factory(card, author, content="A comment"):
        return persist(Comment(card_id=card.card_id, author_id=author.user_id, content=content))

    return factory


@pytest.fixture
def make_notification(persist):
    from app.blueprints.notifications.schema import Notification

    def factory(recipient, card, type="assignment", message=None, is_read=False, created_at=None):
        extra = {"created_at": created_at} if created_at else {}
        return persist(
            Notification(
                recipient_id=recipient.user_id,
                card_id=card.card_id,
                board_id=card.board_id,
                type=type,
                message=message or f'Assigned to you: "{card.title}"',
                is_read=is_read,
                **extra,
            )
        )

    return factory


@pytest.fixture
def auth_header(app):
    def factory(user):
        with app.app_context():
            token = create_access_token(identity=str(user.user_id))
        return {"Authorization": f"Bearer {token}"}

    return factory


@pytest.fixture
def refresh_header(app):
    def factory(user):
        with app.app_context():
            token = create_refresh_token(identity=str(user.user_id))
        return {"Authorization": f"Bearer {token}"}

    return factory


@pytest.fixture
def fast_hash(monkeypatch):
    """Property tests run many password changes; hash them cheaply (the rule is unchanged)."""
    from app.blueprints.users import service as users_service
    from data_fixtures import _fast_hash

    monkeypatch.setattr(users_service, "hash_password", _fast_hash)
