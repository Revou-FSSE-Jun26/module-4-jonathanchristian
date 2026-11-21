"""Card_Status constants and the pure transition rule (design A13, D14).

This module imports no database code, so the rule is unit and property testable.
"""

NOT_STARTED = "NOT_STARTED"
IN_PROGRESS = "IN_PROGRESS"
DONE = "DONE"
CARD_STATUSES = (NOT_STARTED, IN_PROGRESS, DONE)  # exact and case-sensitive


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
