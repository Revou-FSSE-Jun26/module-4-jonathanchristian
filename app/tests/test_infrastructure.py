"""Smoke tests for the shared fixtures (database, factories, tokens)."""
import pytest

from helpers import assert_envelope


def test_factories_create_related_rows(
    make_board, make_member, make_column, make_card, make_comment, make_notification, count_rows
):
    from app.blueprints.boards.schema import BoardMembership
    from app.blueprints.cards.schema import Card

    board = make_board()
    member = make_member(board)
    column = make_column(board)
    card = make_card(column, assignee=member.member)
    make_comment(card, member.member)
    make_notification(member.member, card)
    assert column.order == 1.0
    assert count_rows(BoardMembership, BoardMembership.board_id == board.board_id) == 2
    assert count_rows(Card) == 1


def test_database_is_empty_at_start_of_each_test(count_rows):
    from app.blueprints.users.schema import User

    assert count_rows(User) == 0


def test_health_through_test_client(client):
    assert assert_envelope(client.get("/api/health"), 200) == {"status": "ok"}


def test_deleted_user_is_flagged(make_deleted_user):
    user = make_deleted_user("Gone@Example.com")
    assert user.is_deleted is True and user.deleted_at is not None
    assert user.email == "gone@example.com"


def test_token_headers_are_bearer(make_user, auth_header, refresh_header):
    user = make_user()
    assert auth_header(user)["Authorization"].startswith("Bearer ")
    assert refresh_header(user)["Authorization"].startswith("Bearer ")


def test_query_counter_counts_statements(app, query_counter):
    from sqlalchemy import text

    from app.extensions import db

    with query_counter() as counter:
        with app.app_context():
            db.session.execute(text("SELECT 1"))
            db.session.execute(text("SELECT 2"))
    assert counter.count == 2
