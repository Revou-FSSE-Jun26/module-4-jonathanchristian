"""Property tests for PATCH /api/users/me and registration (V6 contract)."""
import pytest
from hypothesis import HealthCheck, assume, given, settings
from hypothesis import strategies as st

from helpers import assert_envelope

pytestmark = pytest.mark.e2e

DB_SETTINGS = settings(
    max_examples=100,
    deadline=None,
    suppress_health_check=[HealthCheck.function_scoped_fixture],
)
_names = st.text(alphabet="abcdefghijklmnopqrstuvwxyzABCDEFG0123456789", min_size=1, max_size=100)
_emails = st.from_regex(r"[a-zA-Z][a-zA-Z0-9]{0,20}@[a-z]{1,10}\.[a-z]{2,4}", fullmatch=True)
_new_passwords = st.text(alphabet="abcXYZ0123456789!-_", min_size=8, max_size=128)


def _row(fetch, user):
    from app.blueprints.users.schema import User

    return fetch(User, user.user_id)


def _patch(client, user, auth_header, body):
    return client.patch("/api/users/me", json=body, headers=auth_header(user))


def _login(client, email, password):
    return client.post("/api/auth/login", json={"email": email, "password": password})


# --- property tests --------------------------------------------------------------------------------------


# Feature: kano, Property 54: Profile update never changes the email and needs the current password
@DB_SETTINGS
@given(
    name=st.one_of(st.none(), _names),
    password=st.one_of(st.none(), _new_passwords),
    current=st.sampled_from(["correct", "wrong", None]),
    email=st.one_of(st.just("absent"), st.none(), st.text(max_size=30), _emails),
)
def test_profile_update_never_changes_email_and_needs_current_password(
    client, reset_database, make_user, auth_header, fetch, fast_hash, caplog, name, password, current, email
):
    reset_database()
    user = make_user(name="Original", email="original@example.com")
    body = {}
    if name is not None:
        body["name"] = name
    if password is not None:
        body["password"] = password
    if current is not None:
        body["current_password"] = user.password if current == "correct" else "definitely-wrong-pw"
    if email != "absent":
        body["email"] = email

    response = _patch(client, user, auth_header, body)
    row = _row(fetch, user)
    assert row.email == "original@example.com"  # the stored email never changes

    if email != "absent":
        assert "email" in assert_envelope(response, 400)
        succeeded = False
    elif password is None and name is None:
        assert_envelope(response, 400)
        succeeded = False
    elif password is None and current is not None:
        assert "password" in assert_envelope(response, 400)  # current_password without password
        succeeded = False
    elif password is not None and current != "correct":
        assert "current_password" in assert_envelope(response, 400)  # 400 and never 403
        succeeded = False
    else:
        assert_envelope(response, 200)
        succeeded = True

    if not succeeded:
        assert (row.name, row.password_hash) == ("Original", user.password_hash)
    else:
        assert row.name == (name if name is not None else "Original")
        if password is not None:
            assert _login(client, "original@example.com", password).status_code == 200
            assert _login(client, "original@example.com", user.password).status_code == 401
        else:
            assert row.password_hash == user.password_hash
    text = response.get_data(as_text=True)
    for secret in (password, "definitely-wrong-pw", user.password, row.password_hash):
        if secret and secret not in (name or ""):  # the name is echoed back legitimately
            assert secret not in text and secret not in caplog.text


# Feature: kano, Property 17: Partial update (user): only name and password are updatable
@DB_SETTINGS
@given(st.one_of(st.none(), _names), st.one_of(st.none(), _new_passwords))
def test_partial_update_changes_only_supplied_fields(
    client, reset_database, make_user, auth_header, fetch, fast_hash, name, password
):
    assume(name is not None or password is not None)
    reset_database()
    user = make_user(name="Original", email="original@example.com")
    body = {}
    if name is not None:
        body["name"] = name
    if password is not None:
        body.update(password=password, current_password=user.password)
    data = assert_envelope(_patch(client, user, auth_header, body), 200)
    row = _row(fetch, user)
    assert data["name"] == row.name == (name if name is not None else "Original")
    assert row.email == "original@example.com"
    assert (row.password_hash != user.password_hash) == (password is not None)
    assert row.updated_at >= user.updated_at


# Feature: kano, Property 9: Uniqueness ignores soft-deleted rows (registration part)
@DB_SETTINGS
@given(_emails)
def test_registration_email_uniqueness_is_case_insensitive_and_ignores_deleted(
    client, reset_database, make_deleted_user, email
):
    reset_database()
    make_deleted_user(email)  # a soft-deleted row never blocks
    body = {"name": "A", "email": email.upper(), "password": "password123"}
    assert assert_envelope(client.post("/api/auth/register", json=body), 201)["email"] == email.lower()
    body["email"] = email.lower()
    assert_envelope(client.post("/api/auth/register", json=body), 409)


# Feature: kano, Property 9: add-member matching ignores the letter case of the email
@DB_SETTINGS
@given(_emails, st.sampled_from(["upper", "lower", "title"]))
def test_add_member_matches_email_in_any_case(
    client, reset_database, make_user, make_board, auth_header, email, case
):
    reset_database()
    admin = make_user()
    target = make_user(email=email)
    board = make_board(admin)
    sent = {"upper": email.upper(), "lower": email.lower(), "title": email.title()}[case]
    response = client.post(
        f"/api/boards/{board.board_id}/members", json={"email": sent}, headers=auth_header(admin)
    )
    assert assert_envelope(response, 201)["email"] == target.email
