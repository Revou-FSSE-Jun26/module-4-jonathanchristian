"""Analytics Marshmallow output schemas (the feature has no model)."""
from marshmallow import Schema, fields

from app.errors import UuidField


class ColumnCountSchema(Schema):
    column_id = UuidField()
    name = fields.String()
    count = fields.Integer()


class MemberActivitySchema(Schema):
    user_id = UuidField()
    name = fields.String()
    assigned_cards = fields.Integer()
    comments = fields.Integer()


class AnalyticsSchema(Schema):
    cards_per_column = fields.List(fields.Nested(ColumnCountSchema))
    completed_this_week = fields.Integer()
    member_activity = fields.List(fields.Nested(MemberActivitySchema))
