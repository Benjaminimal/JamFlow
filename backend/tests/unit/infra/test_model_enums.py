from enum import StrEnum

from jamflow.infra.database.models import str_enum_to_sa_enum


class SomeEnum(StrEnum):
    VALUE_ONE = "VALUEONE"
    VALUE_TWO = "ValueTwo"
    VALUE_THREE = "valuethree"


def test_str_enum_column_values_are_actual_values():
    sa_enum = str_enum_to_sa_enum(SomeEnum)
    assert sa_enum.enums == ["VALUEONE", "ValueTwo", "valuethree"]
    assert sa_enum.name == "someenum"
    assert sa_enum.__class__.__name__ == "Enum"
