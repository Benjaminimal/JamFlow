from enum import StrEnum

import pytest
from pytest_mock import MockerFixture

from jamflow.models.enums import str_enum_to_sa_column


@pytest.fixture
def str_enum_class():
    class TestEnum(StrEnum):
        VALUE_ONE = "VALUEONE"
        VALUE_TWO = "ValueTwo"
        VALUE_THREE = "valuethree"

    return TestEnum


def test_str_enum_column_values_are_actual_values(str_enum_class):
    column = str_enum_to_sa_column(str_enum_class)
    assert column.type.enums == ["VALUEONE", "ValueTwo", "valuethree"]
    assert column.type.name == "testenum"
    assert column.type.__class__.__name__ == "Enum"


def test_str_enum_column_passes_kwargs(
    mocker: MockerFixture,
    str_enum_class,
):
    mock_column = mocker.patch("jamflow.models.enums.Column")

    str_enum_to_sa_column(str_enum_class, nullable=True, default="VALUE_ONE")
    mock_column.assert_called_once_with(mocker.ANY, nullable=True, default="VALUE_ONE")
