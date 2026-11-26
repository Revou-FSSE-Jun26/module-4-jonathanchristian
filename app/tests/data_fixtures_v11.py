"""V11 data factories: checklist items, card links, and managers (loaded by conftest)."""
import uuid

import pytest
from sqlalchemy import func, select


@pytest.fixture
def make_checklist_item(persist, app):
    from app.blueprints.cards.schema import ChecklistItem
    from app.extensions import db

    def factory(card, text=None, is_done=False, order=None, **fields):
        if order is None:
            with app.app_context():
                current = db.session.execute(
                    select(func.max(ChecklistItem.order)).where(
                        ChecklistItem.card_id == card.card_id, ChecklistItem.is_deleted.is_(False)
                    )
                ).scalar_one()
            order = 1.0 if current is None else current + 1.0
        return persist(
            ChecklistItem(
                card_id=card.card_id,
                text=text or f"Item {uuid.uuid4().hex[:6]}",
                is_done=is_done,
                order=order,
                **fields,
            )
        )

    return factory


@pytest.fixture
def make_card_link(persist):
    from app.blueprints.cards.schema import CardLink

    def factory(card, created_by, url=None, label=None, **fields):
        return persist(
            CardLink(
                card_id=card.card_id,
                created_by=created_by.user_id,
                url=url or f"https://example.com/{uuid.uuid4().hex[:6]}",
                label=label or "example.com",
                **fields,
            )
        )

    return factory


@pytest.fixture
def make_manager(make_member):
    """Add a membership with the role `manager`."""

    def factory(board, user=None):
        return make_member(board, user, role="manager")

    return factory
