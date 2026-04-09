from enum import StrEnum

from pytest_mock import MockerFixture

from jamflow.infra.database.models import str_enum_to_sa_column


class SomeEnum(StrEnum):
    VALUE_ONE = "VALUEONE"
    VALUE_TWO = "ValueTwo"
    VALUE_THREE = "valuethree"


def test_str_enum_column_values_are_actual_values():
    column = str_enum_to_sa_column(SomeEnum)
    assert column.type.enums == ["VALUEONE", "ValueTwo", "valuethree"]
    assert column.type.name == "someenum"
    assert column.type.__class__.__name__ == "Enum"


def test_str_enum_column_passes_kwargs(
    mocker: MockerFixture,
):
    mock_column = mocker.patch("jamflow.infra.database.models.enums.Column")

    str_enum_to_sa_column(SomeEnum, nullable=True, default="VALUE_ONE")
    mock_column.assert_called_once_with(mocker.ANY, nullable=True, default="VALUE_ONE")
