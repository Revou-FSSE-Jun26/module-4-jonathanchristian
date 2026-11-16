# Backend Task Progress

`.kiro/specs/kano/tasks.md` is read-only for the agent, so completed backend tasks are tracked here.
Tick the matching boxes in `tasks.md` yourself when you review.

- [x] 1.1 `.gitignore` and `.vercelignore`
- [x] 1.2 to 1.4 guidelines (already ticked in tasks.md)
- [x] 1.5 placeholder docs (`docs/violation-report.md`, `docs/guideline-comparison.md`)
- [x] 2.1 dependencies, `requirements.txt`, `.env.example`, `pytest.ini`
- [x] 2.2 `config.py`, `extensions.py`
- [x] 2.3 `soft_delete.py`, `ordering.py`
- [x] 2.4 `errors.py`
- [x] 2.5 eight Blueprint_Package skeletons, `health.py`, `create_app`
- [x] 2.6 `wsgi.py`, CORS, log filter
- [x] 2.7 config tests
- [x] 2.8 helper, envelope, health, CORS tests
- [x] 3.1 User, Board, BoardMembership models
- [x] 3.2 Column, Card, Comment, Notification models
- [x] 3.3 `permissions.py`
- [x] 3.4 model imports and `migrate.init_app` in `create_app`
- [x] 3.5 model metadata tests
- [x] 4.1 to 4.3 [MANUAL] databases and migrations (done by the user)
- [x] 5.1 test infrastructure (`conftest.py`, `helpers.py`)
- [x] 6.1 users package
- [x] 6.2 users tests
- [x] 7.1 auth package
- [x] 7.2 register and login tests
- [x] 7.3 token and refresh tests
- [x] 8.1 boards (create, list, detail, update, delete)
- [x] 8.2 board members
- [x] 8.3 boards tests
- [x] 8.4 members and roles tests
- [x] 9.1 columns package
- [x] 9.2 columns tests
- [x] 10.1 notifications package
- [x] 10.2 notifications tests
- [x] 11.1 card create, update, delete, position (`cards/service/` package)
- [x] 11.2 card search and My Tasks (`GET /api/cards`)
- [x] 11.3 card CRUD and position tests
- [x] 11.4 search, My Tasks, and SQL metacharacter tests
- [x] 11.5 assignment notification tests
- [x] 12.1 comments package
- [x] 12.2 comments tests
- [x] 12.3 comment notification tests (in `tests/test_comments.py`)
- [x] 13.1 analytics package
- [x] 13.2 analytics tests
- [x] 14.1 role and membership matrix (`tests/test_enforcement_matrix.py`)
- [x] 14.2 soft-delete and cascade tests (`tests/test_soft_delete.py`)
- [x] 14.3 envelope and status tests (`tests/test_envelope_status.py`)
- [x] 14.4 database failure and hygiene tests (`tests/test_hygiene.py`)
- [x] 14.5 performance and query-count tests (`tests/test_performance.py`, marker `perf`)
- [x] 15.1 300-line check (`scripts/check_file_size.py`, `app/tests/test_file_size.py`)
- [ ] 15.2 [MANUAL] run the API locally (yours)
- [ ] 16 backend checkpoint (waits for 15.2)

Full run after 15.1: `694 passed, 3 skipped` (the skips are the public-endpoint cases of the 401 test).
