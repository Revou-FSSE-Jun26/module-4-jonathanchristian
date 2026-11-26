"""cards schema package: keeps `from app.blueprints.cards.schema import X` working (G-BE-18).

Importing the three model modules here registers all cards models (Card, ChecklistItem,
CardLink) before `Migrate.init_app`, so `flask db migrate` detects all 9 tables (G-DB-12).
"""
from app.blueprints.cards.schema.card_model import CARD_STATUSES, Card
from app.blueprints.cards.schema.card_schemas import (
    CardBaseSchema,
    CardCreateSchema,
    CardDetailSchema,
    CardPositionSchema,
    CardQuerySchema,
    CardSchema,
    CardSearchResultSchema,
    CardUpdateSchema,
)
from app.blueprints.cards.schema.checklist_model import ChecklistItem
from app.blueprints.cards.schema.checklist_schemas import (
    ChecklistCreateSchema,
    ChecklistItemSchema,
    ChecklistUpdateSchema,
)
from app.blueprints.cards.schema.link_model import CardLink
from app.blueprints.cards.schema.link_schemas import (
    CardLinkCreateSchema,
    CardLinkSchema,
    CardLinkUpdateSchema,
)
from app.blueprints.cards.schema.url_rules import default_label, validate_link_url

__all__ = [
    "CARD_STATUSES",
    "Card",
    "CardBaseSchema",
    "CardCreateSchema",
    "CardDetailSchema",
    "CardLink",
    "CardLinkCreateSchema",
    "CardLinkSchema",
    "CardLinkUpdateSchema",
    "CardPositionSchema",
    "CardQuerySchema",
    "CardSchema",
    "CardSearchResultSchema",
    "CardUpdateSchema",
    "ChecklistCreateSchema",
    "ChecklistItem",
    "ChecklistItemSchema",
    "ChecklistUpdateSchema",
    "default_label",
    "validate_link_url",
]
