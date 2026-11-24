# Guideline Comparison: Before and After

Compares the number of guideline violations in AI-generated output produced **without** the guidelines against the same output produced **with** them (Requirement 30.4). The "after" count must be lower.

## How the samples were produced

1. Feature: the comments Blueprint_Package (Requirement 12, criteria 1 to 11). It is small, self-contained, and touches routes, services, schemas, a model, permissions, and soft delete.
2. "Before": a fresh Kiro sub-agent session received only the Requirement 12 text and a one-paragraph stack description. It had no access to `guidelines/` or any other repository file. Output saved unchanged in [`samples/comments-without-guidelines.md`](samples/comments-without-guidelines.md).
3. "After": a second fresh session received the same prompt plus `guidelines/backend.md` and `guidelines/database.md`, and the instruction to follow every applicable entry. Output saved unchanged in [`samples/comments-with-guidelines.md`](samples/comments-with-guidelines.md).
4. Both samples were checked entry by entry against [`../guidelines/backend.md`](../guidelines/backend.md) and [`../guidelines/database.md`](../guidelines/database.md). A guideline entry counts once per sample, however many lines break it. Entries that do not apply to a comments feature (G-BE-10 token issuing, G-BE-11 configuration, G-BE-13 dependency install, G-BE-14 tests, G-DB-06 cascades, G-DB-07 unique indexes, G-DB-08 ordering, G-DB-12 migrations) are not counted for either sample.

Date of the run: 2026-11-24.

## Results

| Sample | Feature | Violations (before, without guidelines) | Violations (after, with guidelines) | Guideline ids violated before |
|---|---|---|---|---|
| Comments Blueprint_Package | Requirement 12 | 14 | 1 | G-BE-01, G-BE-02, G-BE-03, G-BE-04, G-BE-05, G-BE-06, G-BE-07, G-BE-08, G-BE-09, G-DB-01, G-DB-03, G-DB-04, G-DB-05, G-DB-10 |

The "after" sample violates only G-BE-09. The count fell from 14 to 1.

## Violations in the "before" sample

| Guideline id | Where in the sample | What breaks the rule |
|---|---|---|
| G-BE-01 | all files | The package is `app/comments/` instead of `app/blueprints/comments/`, and it uses `models.py`, `schemas.py`, `services.py`, and an extra `errors.py` instead of exactly `routes.py`, `service.py`, `schema.py`. |
| G-BE-02 | `services.py` | `from app.models import BoardMembership, Card` imports models from an `app/models` module instead of the owning package's `schema.py`. |
| G-BE-03 | `routes.py` | Each write route calls two service functions (`authorize_create` then `create_comment`), and no route returns `ok(...)`. |
| G-BE-04 | `errors.py`, `models.py`, `services.py` | Error handling and JWT loaders live inside the feature, and `db` is imported from `app` instead of `app.extensions`. |
| G-BE-05 | `routes.py`, `errors.py` | Success bodies are bare lists or objects with no `data` key, and error bodies add a `details` key. |
| G-BE-06 | `routes.py` | DELETE returns `{"message": "Comment deleted"}` instead of a `data` object. |
| G-BE-07 | `errors.py` | A feature-local `ApiError(status, ...)` takes arbitrary status codes instead of the `ApiError` subclasses in `app/errors.py`. |
| G-BE-08 | `schemas.py`, `routes.py` | The input schema does not declare `unknown = RAISE`, and the body is read with `request.get_json` instead of `load_json(schema)`. |
| G-BE-09 | `services.py` | Membership and role checks are hand-written `BoardMembership.query` calls in the service, not helpers from `app/permissions.py`. |
| G-DB-01 | `models.py` | The primary key is an integer `id`, not a `comment_id` UUID generated with `uuid.uuid4`. |
| G-DB-03 | `models.py` | Both foreign keys have no constraint name (`fk_comments_cards`, `fk_comments_users`). |
| G-DB-04 | `models.py` | No `SoftDeleteMixin`, no `is_deleted` column, and `updated_at` is not set on insert. |
| G-DB-05 | `services.py` | Delete sets only `deleted_at`, the membership lookup has no active-only filter, so a soft-deleted membership still grants access, and the card check relies on `getattr(card, "deleted_at", None)`. |
| G-DB-10 | `models.py` | Relationships use `lazy="joined"` instead of `lazy="raise"` with explicit `joinedload`. |

## Violation in the "after" sample

| Guideline id | Where in the sample | What breaks the rule |
|---|---|---|
| G-BE-09 | `service.py` `_require_writer` | The guest check (`membership.role == GUEST_ROLE`) is written in the feature service instead of calling a role helper from `app/permissions.py`. The real implementation uses the shared reader/writer/admin level helpers for this. |

One point is borderline and not counted. In the "after" routes, `load_json(...)` runs before the service's 404 and 403 checks, so an invalid body on a card the caller cannot access gets 400 instead of 404 or 403. G-BE-09 orders 404 before 403 but does not say where validation goes. The project's agreed order (401, 404, 403, then 400) is documented in `app/README.md`. Adding it to G-BE-09 would let the guideline catch this case.
