"""pytest tests for GET /api/notifications/overdue (design A19, Requirement 31.25)."""
import time
from datetime import date, datetime, timedelta, timezone

import pytest
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st

from helpers import assert_envelope

pytestmark = pytest.mark.e2e

URL = "/api/notifications/overdue"
FIXED_TODAY = date(2030, 6, 15)


def utc_today():
    return datetime.now(timezone.utc).date()


@pytest.fixture
def setup(make_board, make_column):
    board = make_board()
    return board, make_column(board)


def overdue(client, auth_header, user):
    return assert_envelope(client.get(URL, headers=auth_header(user)), 200)


def days_ago(n):
    return utc_today() - timedelta(days=n)


def list_with(app, user, today=FIXED_TODAY):
    from app.blueprints.notifications.service import list_overdue

    with app.app_context():
        return list_overdue(user.user_id, today)


def test_a_card_due_yesterday_is_returned_with_days_overdue_1(client, setup, auth_header, make_card):
    board, column = setup
    card = make_card(column, "Late", assignee=board.owner, due_date=days_ago(1))
    data = overdue(client, auth_header, board.owner)
    assert data["total"] == 1
    assert data["items"] == [{
        "card_id": str(card.card_id), "title": "Late", "due_date": days_ago(1).isoformat(),
        "status": "NOT_STARTED", "column_name": column.name, "board_id": str(board.board_id),
        "board_name": board.name, "days_overdue": 1,
    }]


def test_due_today_done_and_future_are_not_returned_and_urgent_is(client, setup, auth_header, make_card):
    board, column = setup
    mine = board.owner
    make_card(column, "today", assignee=mine, due_date=days_ago(0))
    make_card(column, "future", assignee=mine, due_date=days_ago(-3))
    make_card(column, "done", assignee=mine, due_date=days_ago(4), status="DONE")
    make_card(column, "nodate", assignee=mine)
    urgent = make_card(column, "urgent", assignee=mine, due_date=days_ago(3), status="URGENT")
    data = overdue(client, auth_header, mine)
    assert [i["card_id"] for i in data["items"]] == [str(urgent.card_id)]
    assert data["items"][0]["days_overdue"] == 3 and data["items"][0]["status"] == "URGENT"


def test_a_card_assigned_to_someone_else_is_not_returned(client, setup, auth_header, make_card, make_member):
    board, column = setup
    other = make_member(board).member
    make_card(column, "theirs", assignee=other, due_date=days_ago(2))
    assert overdue(client, auth_header, board.owner) == {"items": [], "total": 0}
    assert overdue(client, auth_header, other)["total"] == 1


def test_an_unassigned_card_goes_to_admin_and_managers_only(
    client, setup, auth_header, make_card, make_member, make_manager
):
    board, column = setup
    card = make_card(column, "nobody", due_date=days_ago(2))
    manager = make_manager(board).member
    member = make_member(board).member
    guest = make_member(board, role="guest").member
    for user in (board.owner, manager):
        assert [i["card_id"] for i in overdue(client, auth_header, user)["items"]] == [str(card.card_id)]
    for user in (member, guest):
        assert overdue(client, auth_header, user) == {"items": [], "total": 0}


def test_a_guest_gets_nothing_even_for_a_card_assigned_to_them(client, setup, auth_header, make_card, make_member):
    board, column = setup
    guest = make_member(board, role="guest").member
    make_card(column, "legacy", assignee=guest, due_date=days_ago(2))
    assert overdue(client, auth_header, guest) == {"items": [], "total": 0}


def test_soft_deleted_cards_columns_boards_and_memberships_are_excluded(
    client, setup, auth_header, make_card, make_column, make_board, persist
):
    board, column = setup
    me = board.owner
    make_card(column, "dead card", assignee=me, due_date=days_ago(2), is_deleted=True)
    dead_column = make_column(board, "dead column")
    make_card(dead_column, "in dead column", assignee=me, due_date=days_ago(2))
    dead_column.is_deleted = True
    persist(dead_column)
    other = make_board(me)
    make_card(make_column(other), "in dead board", assignee=me, due_date=days_ago(2))
    other.is_deleted = True
    persist(other)
    assert overdue(client, auth_header, me) == {"items": [], "total": 0}


def test_ordering_is_due_date_then_created_at_and_the_list_is_capped_at_100(
    client, setup, auth_header, app, make_card
):
    board, column = setup
    from app.blueprints.cards.schema import Card
    from app.extensions import db

    with app.app_context():
        for index in range(105):
            db.session.add(Card(
                board_id=board.board_id, column_id=column.column_id, title=f"t{index}", order=float(index + 1),
                assignee_id=board.owner.user_id, due_date=days_ago(1 + index % 3),
            ))
        db.session.commit()
    data = overdue(client, auth_header, board.owner)
    assert len(data["items"]) == 100 and data["total"] == 105
    dues = [i["due_date"] for i in data["items"]]
    assert dues == sorted(dues)
    assert data["items"][0]["days_overdue"] == 3


def test_the_service_takes_today_as_a_parameter(app, setup, make_card):
    board, column = setup
    make_card(column, "c", assignee=board.owner, due_date=date(2030, 6, 14))
    assert list_with(app, board.owner, date(2030, 6, 15))["items"][0]["days_overdue"] == 1
    assert list_with(app, board.owner, date(2030, 6, 14))["total"] == 0
    assert list_with(app, board.owner, date(2030, 6, 20))["items"][0]["days_overdue"] == 6


def test_days_overdue_is_a_plain_difference():
    from app.blueprints.notifications.service import days_overdue

    assert days_overdue(date(2030, 1, 1), date(2030, 1, 2)) == 1
    assert days_overdue(date(2029, 12, 31), date(2030, 1, 1)) == 1
    assert days_overdue(date(2030, 1, 1), date(2030, 3, 1)) == 59


def test_no_notification_is_created_and_the_unread_count_is_unchanged(
    client, setup, auth_header, make_card, make_notification, count_rows
):
    from app.blueprints.notifications.schema import Notification

    board, column = setup
    card = make_card(column, "late", assignee=board.owner, due_date=days_ago(2))
    make_notification(board.owner, card)
    before = assert_envelope(client.get("/api/notifications", headers=auth_header(board.owner)), 200)
    overdue(client, auth_header, board.owner)
    after = assert_envelope(client.get("/api/notifications", headers=auth_header(board.owner)), 200)
    assert after["unread_count"] == before["unread_count"] == 1 and after["total"] == before["total"]
    assert count_rows(Notification) == 1


def test_401_without_a_token_and_with_a_refresh_token(client, refresh_header, make_user):
    assert_envelope(client.get(URL), 401)
    assert_envelope(client.get(URL, headers=refresh_header(make_user())), 401)


def test_the_overdue_route_does_not_clash_with_mark_read(client, setup, auth_header):
    board, _column = setup
    assert_envelope(client.get("/api/notifications/not-a-uuid/read", headers=auth_header(board.owner)), 404)
    assert_envelope(client.patch("/api/notifications/overdue", headers=auth_header(board.owner)), 405)


@pytest.mark.perf
def test_overdue_p95_with_20_boards_and_2000_cards(client, app, make_user, auth_header):
    from app.blueprints.boards.schema import Board, BoardMembership
    from app.blueprints.cards.schema import Card
    from app.blueprints.columns.schema import Column
    from app.extensions import db

    user = make_user()
    with app.app_context():
        for index in range(20):
            board = Board(name=f"B{index}", created_by=user.user_id)
            db.session.add(board)
            db.session.flush()
            db.session.add(BoardMembership(board_id=board.board_id, user_id=user.user_id, role="admin"))
            column = Column(board_id=board.board_id, name="c", order=1.0)
            db.session.add(column)
            db.session.flush()
            for number in range(100):
                db.session.add(Card(
                    board_id=board.board_id, column_id=column.column_id, title="t", order=float(number + 1),
                    due_date=days_ago(number % 7), assignee_id=user.user_id if number % 2 else None,
                ))
        db.session.commit()
    headers, samples = auth_header(user), []
    for _ in range(100):
        started = time.perf_counter()
        assert client.get(URL, headers=headers).status_code == 200
        samples.append((time.perf_counter() - started) * 1000)
    samples.sort()
    assert samples[94] < 500, samples[94]


# Feature: kano, Property 64: Overdue selection equals a naive model
_card = st.tuples(
    st.integers(-3, 4),  # due date offset: days before FIXED_TODAY; None below
    st.booleans(),  # has a due date
    st.sampled_from(["NOT_STARTED", "IN_PROGRESS", "URGENT", "DONE"]),
    st.sampled_from(["none", "me", "other"]),
    st.booleans(),  # soft deleted
)


@settings(max_examples=25, deadline=None, suppress_health_check=[HealthCheck.function_scoped_fixture])
@given(role=st.sampled_from(["admin", "manager", "member", "guest"]), cards=st.lists(_card, max_size=8))
def test_property_overdue_selection_equals_a_naive_model(
    app, reset_database, make_user, make_board, make_member, make_column, make_card, role, cards
):
    reset_database()
    owner, me, other = make_user(), make_user(), make_user()
    board = make_board(owner)
    make_member(board, other)
    if role == "admin":
        board = make_board(me)  # `me` created this Board, so `me` is its admin
        make_member(board, other)
    else:
        make_member(board, me, role=role)
    column = make_column(board)
    expected = set()
    for offset, has_due, status, who, deleted in cards:
        due = FIXED_TODAY - timedelta(days=offset) if has_due else None
        assignee = {"none": None, "me": me, "other": other}[who]
        card = make_card(column, assignee=assignee, due_date=due, status=status, is_deleted=deleted)
        overdue_now = has_due and due < FIXED_TODAY and status != "DONE" and not deleted
        mine = who == "me" and role in ("admin", "manager", "member")
        unassigned = who == "none" and role in ("admin", "manager")
        if overdue_now and (mine or unassigned):
            expected.add(str(card.card_id))
    result = list_with(app, me)
    assert {item["card_id"] for item in result["items"]} == expected
    assert result["total"] == len(expected)
