"""Member role change (design A20): the rank and owner rules decide, the service writes."""
from sqlalchemy import select, update

from app.blueprints.boards.service.member_service import (
    load_target_membership,
    raise_for,
    serialize_member,
)
from app.blueprints.cards.schema import Card
from app.blueprints.users.schema import User
from app.errors import BadRequest
from app.extensions import db
from app.permissions import (
    ASSIGNABLE_ROLES,
    decide_role_change,
    require_board_manager,
)
from app.soft_delete import active, utcnow


def change_role(user, board_id, target_user_id, new_role):
    """Set the target's role. The caller has validated the body (400 first); no Notification."""
    if new_role not in ASSIGNABLE_ROLES:
        raise BadRequest("role must be one of: guest, member, manager")
    board, caller = require_board_manager(board_id, user.user_id)  # 404, then 403
    target = load_target_membership(board_id, target_user_id)
    decision = decide_role_change(
        caller.role, target.role, new_role, board.created_by == target.user_id
    )
    raise_for(decision)
    if target.role != new_role:
        target.role = new_role
        if new_role == "guest":  # a guest cannot be an assignee (Requirement 43.10)
            db.session.execute(
                update(Card)
                .where(
                    Card.board_id == board_id,
                    Card.assignee_id == target_user_id,
                    active(Card),
                )
                .values(assignee_id=None, updated_at=utcnow())
                .execution_options(synchronize_session=False)
            )
        db.session.commit()
    member = db.session.execute(select(User).where(User.user_id == target_user_id)).scalar_one()
    return serialize_member(member, new_role)
