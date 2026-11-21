"""Card_Status constants and the pure transition rule (design A13, D14).

The rule itself touches no database, so it is unit and property testable.
"""

from app.blueprints.cards.schema import CARD_STATUSES  # exact and case-sensitive

NOT_STARTED, IN_PROGRESS, DONE = CARD_STATUSES


def apply_status_change(old_status, old_completed_at, new_status, now):
    """Return `(status, completed_at)` after a PATCH that supplied `new_status` (or None).

    * not supplied, or unchanged (including DONE to DONE): nothing changes
    * any other value to DONE: `completed_at` becomes `now`
    * DONE to any other value: `completed_at` becomes None
    * NOT_STARTED <-> IN_PROGRESS: `completed_at` stays (it is None for both)
    """
    if new_status is None or new_status == old_status:
        return old_status, old_completed_at
    if new_status == DONE:
        return DONE, now
    if old_status == DONE:
        return new_status, None
    return new_status, old_completed_at
