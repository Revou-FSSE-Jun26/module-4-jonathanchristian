"""FLOAT order value formulas (G-DB-08). Pure functions, no database access."""


def next_last_order(current_max):
    """Order for a new last item: max + 1.0, or 1.0 when the parent has no items."""
    if current_max is None:
        return 1.0
    return float(current_max) + 1.0


def midpoint_order(prev, nxt):
    """Order between two neighbours."""
    return (float(prev) + float(nxt)) / 2.0


def before_first_order(first):
    """Order before the first item: half of the first order."""
    return float(first) / 2.0
