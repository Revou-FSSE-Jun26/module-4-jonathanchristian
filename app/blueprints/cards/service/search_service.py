"""Card search (`q`) and My Tasks (`assignee=me`) for GET /api/cards."""
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import joinedload

from app.blueprints.boards.schema import Board, BoardMembership
from app.blueprints.cards.schema import Card, CardSearchResultSchema
from app.blueprints.columns.schema import Column
from app.extensions import db
from app.permissions import require_board_member
from app.soft_delete import active

result_schema = CardSearchResultSchema()


def escape_like(text):
    """Escape backslash, percent, and underscore so they match literally in a LIKE pattern."""
    return text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _run(user, *conditions):
    rows = db.session.execute(
        select(Card, Board.name, Column.name)
        .options(joinedload(Card.assignee))
        .join(Column, Column.column_id == Card.column_id)
        .join(Board, Board.board_id == Card.board_id)
        .join(
            BoardMembership,
            and_(
                BoardMembership.board_id == Board.board_id,
                BoardMembership.user_id == user.user_id,
                active(BoardMembership),
            ),
        )
        .where(active(Card), active(Column), active(Board), *conditions)
        .order_by(Board.name, Board.board_id, Column.order, Card.order, Card.created_at)
    ).all()
    results = []
    for card, board_name, column_name in rows:
        card.board_name, card.column_name = board_name, column_name
        results.append(result_schema.dump(card))
    return results


def search_cards(user, query):
    """Dispatch a validated `CardQuerySchema` result."""
    if query.get("assignee") == "me":
        return _run(user, Card.assignee_id == user.user_id)
    board_id = query.get("board_id")
    conditions = []
    if board_id is not None:
        require_board_member(board_id, user.user_id)  # 404 missing, 403 non-member
        conditions.append(Card.board_id == board_id)
    pattern = f"%{escape_like(query['q'])}%"
    conditions.append(
        or_(Card.title.ilike(pattern, escape="\\"), Card.description.ilike(pattern, escape="\\"))
    )
    return _run(user, *conditions)
