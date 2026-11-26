"""pytest tests for column reorder and the column property tests."""
import uuid

import pytest
from hypothesis import HealthCheck, given, settings
from hypothesis import strategies as st

from helpers import assert_envelope

pytestmark = pytest.mark.e2e

DB_SETTINGS = settings(
    max_examples=100,
    deadline=None,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
)


def board_columns_url(board):
    return f"/api/boards/{board.board_id}/columns"


def reorder_url(board):
    return f"/api/boards/{board.board_id}/columns/reorder"


def column_url(column):
    return f"/api/columns/{column.column_id}"


# --- reorder -----------------------------------------------------------------------------------------


def test_reorder_stores_the_supplied_order(client, make_board, make_manager, make_column, auth_header, fetch):
    from app.blueprints.columns.schema import Column

    board = make_board()
    first, second = make_column(board), make_column(board)
    member = make_manager(board).member
    body = {"column_id": str(second.column_id), "order": 0.5}
    data = assert_envelope(client.patch(reorder_url(board), json=body, headers=auth_header(member)), 200)
    assert data["order"] == 0.5 and data["column_id"] == str(second.column_id)
    assert fetch(Column, second.column_id).order == 0.5
    assert fetch(Column, first.column_id).order == 1.0
    detail = assert_envelope(client.get(f"/api/boards/{board.board_id}", headers=auth_header(member)), 200)
    assert [c["column_id"] for c in detail["columns"]] == [str(second.column_id), str(first.column_id)]


def test_reorder_column_of_another_board_is_400_and_unchanged(client, make_board, make_column, auth_header, fetch):
    from app.blueprints.columns.schema import Column

    board = make_board()
    foreign = make_column(make_board(board.owner))
    body = {"column_id": str(foreign.column_id), "order": 7.0}
    assert_envelope(client.patch(reorder_url(board), json=body, headers=auth_header(board.owner)), 400)
    assert fetch(Column, foreign.column_id).order == 1.0


def test_reorder_soft_deleted_or_unknown_column_is_400(client, make_board, make_column, auth_header):
    board = make_board()
    headers = auth_header(board.owner)
    column = make_column(board)
    assert_envelope(client.delete(column_url(column), headers=headers), 200)
    for column_id in (column.column_id, uuid.uuid4()):
        body = {"column_id": str(column_id), "order": 3.0}
        assert_envelope(client.patch(reorder_url(board), json=body, headers=headers), 400)


@pytest.mark.parametrize(
    "order",
    [0, -1, -0.5, "2", "abc", None, True, [1], {"a": 1}, float("inf"), float("nan"), 1e999],
)
def test_reorder_invalid_order_is_400_and_unchanged(client, make_board, make_column, auth_header, fetch, order):
    from app.blueprints.columns.schema import Column

    board = make_board()
    column = make_column(board)
    body = {"column_id": str(column.column_id), "order": order}
    response = client.patch(
        reorder_url(board),
        data=_dump(body),
        headers={**auth_header(board.owner), "Content-Type": "application/json"},
    )
    assert_envelope(response, 400)
    assert fetch(Column, column.column_id).order == 1.0


def _dump(body):
    """JSON text that keeps NaN and Infinity tokens (Python's json allows them)."""
    import json

    return json.dumps(body)


@pytest.mark.parametrize(
    "body",
    [{}, {"order": 2.0}, {"column_id": "not-a-uuid", "order": 2.0}, {"column_id": 5, "order": 2.0}, {"column_id": None, "order": 2.0}],
)
def test_reorder_invalid_column_id_is_400(client, make_board, auth_header, body):
    board = make_board()
    assert_envelope(client.patch(reorder_url(board), json=body, headers=auth_header(board.owner)), 400)


def test_reorder_non_member_is_403_and_unchanged(client, make_board, make_column, make_user, auth_header, fetch):
    from app.blueprints.columns.schema import Column

    board = make_board()
    column = make_column(board)
    body = {"column_id": str(column.column_id), "order": 5.0}
    assert_envelope(client.patch(reorder_url(board), json=body, headers=auth_header(make_user())), 403)
    assert fetch(Column, column.column_id).order == 1.0


def test_reorder_missing_board_is_404(client, make_user, auth_header):
    body = {"column_id": str(uuid.uuid4()), "order": 5.0}
    url = f"/api/boards/{uuid.uuid4()}/columns/reorder"
    assert_envelope(client.patch(url, json=body, headers=auth_header(make_user())), 404)


# --- property tests ------------------------------------------------------------------------------------


# Feature: kano, Property 15: Server order allocation (columns)
@DB_SETTINGS
@given(names=st.lists(st.text(alphabet="abc XYZ", min_size=1, max_size=20).filter(str.strip), min_size=1, max_size=6))
def test_property_new_columns_always_get_a_greater_order(client, make_board, auth_header, reset_database, names):
    reset_database()
    board = make_board()
    headers = auth_header(board.owner)
    previous = None
    for name in names:
        data = assert_envelope(client.post(board_columns_url(board), json={"name": name}, headers=headers), 201)
        assert data["order"] == (1.0 if previous is None else previous + 1.0)
        previous = data["order"]


# Feature: kano, Property 16: Position and reorder persistence (reorder)
@DB_SETTINGS
@given(order=st.floats(min_value=1e-6, max_value=1e9, allow_nan=False, allow_infinity=False))
def test_property_reorder_persists_exactly_and_orders_the_detail(
    client, make_board, make_column, auth_header, reset_database, order
):
    reset_database()
    board = make_board()
    headers = auth_header(board.owner)
    first, second = make_column(board, order=1.0), make_column(board, order=2.0)
    body = {"column_id": str(first.column_id), "order": order}
    assert assert_envelope(client.patch(reorder_url(board), json=body, headers=headers), 200)["order"] == order
    detail = assert_envelope(client.get(f"/api/boards/{board.board_id}", headers=headers), 200)
    expected = sorted([(order, 0, first), (2.0, 1, second)], key=lambda item: item[:2])
    assert [c["column_id"] for c in detail["columns"]] == [str(item[2].column_id) for item in expected]


# Feature: kano, Property 12: Server input validation (column name boundaries)
@DB_SETTINGS
@given(name=st.text(alphabet=st.characters(blacklist_categories=("Cs",), blacklist_characters="\x00"), max_size=150))
def test_property_column_name_validation_matches_the_rule(client, make_board, auth_header, reset_database, name):
    reset_database()
    board = make_board()
    response = client.post(board_columns_url(board), json={"name": name}, headers=auth_header(board.owner))
    if 1 <= len(name.strip()) <= 100:
        assert_envelope(response, 201)
    else:
        assert_envelope(response, 400)
