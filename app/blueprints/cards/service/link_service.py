"""Workspace links of a Card: add, update, delete (design A17). No outbound request is made."""
from sqlalchemy import func, select

from app.blueprints.cards.schema import CardLink, CardLinkSchema, default_label
from app.errors import BadRequest
from app.extensions import db
from app.permissions import get_card_for_writer, get_card_link_for_writer
from app.soft_delete import active, soft_delete_where, utcnow

MAX_LINKS = 10
link_schema = CardLinkSchema()


def add_link(user, card_id, load_data):
    """Add a link. The Card row is locked so two concurrent adds cannot pass the cap."""
    get_card_for_writer(card_id, user.user_id, lock=True)
    data = load_data()  # validated after the 404/403 checks
    count = db.session.execute(
        select(func.count()).where(CardLink.card_id == card_id, active(CardLink))
    ).scalar_one()
    if count >= MAX_LINKS:
        raise BadRequest("links: limit of 10 links reached")
    link = CardLink(
        card_id=card_id,
        created_by=user.user_id,
        url=data["url"],
        label=data.get("label") or default_label(data["url"]),
    )
    db.session.add(link)
    db.session.commit()
    return link_schema.dump(link)


def update_link(user, link_id, load_data):
    """Change only the supplied `url` and `label` (already validated by the schema)."""
    link, _card, _membership = get_card_link_for_writer(link_id, user.user_id)
    data = load_data()
    for key in ("url", "label"):
        if key in data:
            setattr(link, key, data[key])
    db.session.commit()
    return link_schema.dump(link)


def delete_link(user, link_id):
    get_card_link_for_writer(link_id, user.user_id)
    soft_delete_where(db.session, CardLink, CardLink.card_link_id == link_id, deleted_at=utcnow())
    db.session.commit()
    return {"card_link_id": str(link_id)}
