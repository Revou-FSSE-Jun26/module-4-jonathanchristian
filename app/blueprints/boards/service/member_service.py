"""Board members: add by email, list, and remove."""
from sqlalchemy import select, update

from app.blueprints.boards.schema import BoardMembership, MemberSchema
from app.blueprints.cards.schema import Card
from app.blueprints.users.schema import User
from app.errors import BadRequest, Conflict, NotFound
from app.extensions import db
from app.permissions import MEMBER, require_board_admin, require_board_reader
from app.soft_delete import active, soft_delete_where, utcnow

member_schema = MemberSchema()


def serialize_member(member_user, role):
    member_user.role = role
    return member_schema.dump(member_user)


def add_member(user, board_id, load_data):
    require_board_admin(board_id, user.user_id)
    data = load_data()  # validated after the 404/403 checks
    target = db.session.execute(
        select(User).where(User.email == data["email"], active(User))
    ).scalar_one_or_none()
    if target is None:
        raise NotFound("No user with that email")
    already = db.session.execute(
        select(BoardMembership.board_membership_id).where(
            BoardMembership.board_id == board_id,
            BoardMembership.user_id == target.user_id,
            active(BoardMembership),
        )
    ).first()
    if already is not None:
        raise Conflict("User is already a member of this board")
    db.session.add(BoardMembership(board_id=board_id, user_id=target.user_id, role=MEMBER))
    db.session.commit()
    return serialize_member(target, MEMBER)


def list_members(user, board_id):
    require_board_reader(board_id, user.user_id)
    rows = db.session.execute(
        select(User, BoardMembership.role)
        .join(BoardMembership, BoardMembership.user_id == User.user_id)
        .where(BoardMembership.board_id == board_id, active(BoardMembership), active(User))
        .order_by(BoardMembership.created_at, BoardMembership.board_membership_id)
    ).all()
    return [serialize_member(member, role) for member, role in rows]


def remove_member(user, board_id, target_user_id):
    """Soft delete a membership and clear the member's card assignments in one transaction."""
    require_board_admin(board_id, user.user_id)
    if target_user_id == user.user_id:
        raise BadRequest("You cannot remove yourself from the board")
    ts = utcnow()
    changed = soft_delete_where(
        db.session,
        BoardMembership,
        BoardMembership.board_id == board_id,
        BoardMembership.user_id == target_user_id,
        deleted_at=ts,
    )
    if changed == 0:
        raise NotFound("Member not found")
    db.session.execute(
        update(Card)
        .where(Card.board_id == board_id, Card.assignee_id == target_user_id, active(Card))
        .values(assignee_id=None, updated_at=ts)
        .execution_options(synchronize_session=False)
    )
    db.session.commit()
    return {"user_id": str(target_user_id)}
